/* Ornata — motor de regras (janela de ocupação, conflitos, dados fictícios) */
const Core = (() => {
  const pad = n => String(n).padStart(2, '0');
  const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toLocal = d => `${dayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const parse = s => {
    const [a, b = '00:00'] = s.split('T');
    const [y, m, d] = a.split('-').map(Number);
    const [h, mi] = b.split(':').map(Number);
    return new Date(y, m - 1, d, h, mi);
  };
  const addMin = (d, m) => new Date(d.getTime() + m * 60000);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const HOLD = ['pre', 'confirmada'];

  const STATUS = {
    pedido: { nome: 'Pedido', segura: false },
    pre: { nome: 'Pré-reserva', segura: true },
    confirmada: { nome: 'Confirmada', segura: true },
    concluida: { nome: 'Concluída', segura: false },
    expirada: { nome: 'Expirada', segura: false },
    cancelada: { nome: 'Cancelada', segura: false },
  };

  const CATEGORIAS = { mesa: 'Mesa completa', pegue: 'Pegue e monte', painel: 'Painel e balões' };

  /* ---------- janela de ocupação ---------- */
  function festaHorario(r) {
    const ini = parse(`${r.data}T${r.inicio}`);
    let fim = parse(`${r.data}T${r.fim}`);
    if (fim <= ini) fim = addDays(fim, 1);
    return { ini, fim };
  }

  function janela(r, kit, s) {
    if (r.modalidade === 'retirada') {
      const ret = parse(r.retirada), dev = parse(r.devolucao);
      const fim = addMin(dev, s.conferencia);
      return { ini: ret, fim, partes: [
        { tipo: 'cliente', ini: ret, fim: dev },
        { tipo: 'conferencia', ini: dev, fim },
      ] };
    }
    const f = festaHorario(r);
    const ini = addMin(f.ini, -(s.deslocamento + kit.montagem));
    const posDesm = addMin(f.fim, kit.desmontagem + s.deslocamento);
    const fim = addMin(posDesm, s.conferencia);
    return { ini, fim, partes: [
      { tipo: 'montagem', ini, fim: f.ini },
      { tipo: 'festa', ini: f.ini, fim: f.fim },
      { tipo: 'desmontagem', ini: f.fim, fim: posDesm },
      { tipo: 'conferencia', ini: posDesm, fim },
    ] };
  }

  function janelaReserva(db, r) {
    const ws = r.kits.map(id => janela(r, kitById(db, id), db.regras));
    return { ini: new Date(Math.min(...ws.map(w => w.ini))), fim: new Date(Math.max(...ws.map(w => w.fim))) };
  }

  const kitById = (db, id) => db.kits.find(k => k.id === id);
  const clienteById = (db, id) => db.clientes.find(c => c.id === id);
  const overlaps = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;

  /* máximo de reservas simultâneas dentro de [ini, fim) */
  function maxSimultaneo(intervalos, ini, fim) {
    const ev = [];
    intervalos.forEach(w => {
      const a = Math.max(w.ini, ini), b = Math.min(w.fim, fim);
      if (a < b) { ev.push([a, 1]); ev.push([b, -1]); }
    });
    ev.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    let c = 0, m = 0;
    ev.forEach(e => { c += e[1]; m = Math.max(m, c); });
    return m;
  }

  function holdsDoKit(db, kitId, excludeId) {
    const kit = kitById(db, kitId);
    return db.reservas
      .filter(r => r.id !== excludeId && HOLD.includes(r.status) && r.kits.includes(kitId))
      .map(r => ({ r, w: janela(r, kit, db.regras) }));
  }

  /* checa um kit para um rascunho de reserva */
  function checarKit(db, draft, kitId, excludeId) {
    const kit = kitById(db, kitId);
    const w = janela(draft, kit, db.regras);
    if (kit.status !== 'ativo') return { kitId, ok: false, motivo: 'status', kit, w, conflitos: [], usadas: 0 };
    const hs = holdsDoKit(db, kitId, excludeId).filter(h => overlaps(h.w.ini, h.w.fim, w.ini, w.fim));
    const usadas = maxSimultaneo(hs.map(h => h.w), w.ini, w.fim);
    const ok = usadas < kit.unidades;
    let livreEm = null;
    if (!ok) {
      // primeiro horário em que uma unidade volta e fica livre até o fim da janela pedida
      const fins = hs.map(h => h.w.fim).sort((a, b) => a - b);
      livreEm = fins.find(t => maxSimultaneo(hs.map(h => h.w), t, w.fim) < kit.unidades) || fins[fins.length - 1];
    }
    // apertado: outra reserva termina/começa a menos de 2 h
    const folga = 120;
    const apertado = ok && holdsDoKit(db, kitId, excludeId).some(h =>
      (h.w.fim <= w.ini && (w.ini - h.w.fim) / 60000 < folga) ||
      (w.fim <= h.w.ini && (h.w.ini - w.fim) / 60000 < folga));
    return { kitId, kit, w, ok, usadas, conflitos: hs, livreEm, apertado, motivo: ok ? null : 'estoque' };
  }

  function sugestoes(db, draft, kitId, excludeId) {
    const kit = kitById(db, kitId);
    return db.kits
      .filter(k => k.id !== kitId && k.categoria === kit.categoria && k.status === 'ativo' && !draft.kits.includes(k.id))
      .filter(k => checarKit(db, draft, k.id, excludeId).ok)
      .slice(0, 3);
  }

  /* montagens simultâneas (só montagem no local) */
  function montagensSimultaneas(db, draft, excludeId) {
    if (draft.modalidade !== 'local') return 0;
    const prep = r => {
      const f = festaHorario(r);
      const m = Math.max(...r.kits.map(id => kitById(db, id).montagem));
      return { ini: addMin(f.ini, -(db.regras.deslocamento + m)), fim: f.ini };
    };
    const mine = prep(draft);
    const outras = db.reservas.filter(r => r.id !== excludeId && HOLD.includes(r.status) && r.modalidade === 'local').map(prep);
    return maxSimultaneo(outras, mine.ini, mine.fim) + 1;
  }

  function checarReserva(db, draft, excludeId) {
    const kits = draft.kits.map(id => checarKit(db, draft, id, excludeId));
    const bloqueada = kits.some(k => !k.ok);
    const equipe = montagensSimultaneas(db, draft, excludeId);
    const avisos = [];
    if (equipe > db.regras.equipes) avisos.push({ tipo: 'equipe', texto: `${equipe} montagens no mesmo horário para ${db.regras.equipes} equipes.` });
    kits.filter(k => k.apertado).forEach(k => avisos.push({ tipo: 'folga', texto: `${k.kit.nome}: menos de 2 h entre esta reserva e outra.` }));
    return { kits, bloqueada, avisos, equipe };
  }

  /* disponibilidade aproximada para a vitrine */
  function statusDoDia(db, kitId, key) {
    const kit = kitById(db, kitId);
    if (kit.status !== 'ativo') return 'indisponivel';
    const ini = parse(`${key}T08:00`), fim = parse(`${key}T23:00`);
    const usadas = maxSimultaneo(holdsDoKit(db, kitId).map(h => h.w), ini, fim);
    if (usadas >= kit.unidades) return 'reservado';
    if (kit.unidades > 1 && kit.unidades - usadas === 1) return 'ultima';
    return 'livre';
  }

  function disputado(db, r) {
    if (r.status !== 'pedido') return false;
    return db.reservas.some(o => o.id !== r.id && ['pedido', 'pre', 'confirmada'].includes(o.status) && o.data === r.data && o.kits.some(k => r.kits.includes(k)));
  }

  /* pré-reservas vencidas viram Expirada */
  function varrer(db, now) {
    db.reservas.forEach(r => {
      if (r.status === 'pre' && r.preDesde) {
        const exp = addMin(parse(r.preDesde), db.regras.preReservaHoras * 60);
        if (now >= exp) { r.status = 'expirada'; r.historico.push({ em: toLocal(exp), quem: 'Sistema', txt: 'Pré-reserva expirou sem sinal' }); }
      }
    });
  }
  const venceEm = (db, r) => r.status === 'pre' && r.preDesde ? addMin(parse(r.preDesde), db.regras.preReservaHoras * 60) : null;

  function valorSugerido(db, draft) {
    const soma = draft.kits.reduce((a, id) => a + kitById(db, id).preco, 0);
    return soma + (draft.modalidade === 'local' ? db.regras.taxaMontagem : 0);
  }

  /* ---------- dados fictícios ---------- */
  function seed(now = new Date()) {
    const regras = { deslocamento: 40, conferencia: 60, sinalMin: 30, preReservaHoras: 48, equipes: 2, taxaMontagem: 80 };
    const kits = [
      { id: 'safari', nome: 'Safari Baby', categoria: 'mesa', unidades: 2, preco: 690, montagem: 120, desmontagem: 60, status: 'ativo', pal: ['#E7EFDF', '#9CB380', '#D9A55B', '#6E8B5A'], itens: 'Mesa provençal, painel de 2 m, arco de balões, 6 bandejas, 2 boleiras, bichinhos de pelúcia' },
      { id: 'mar', nome: 'Fundo do Mar', categoria: 'mesa', unidades: 1, preco: 650, montagem: 120, desmontagem: 60, status: 'ativo', pal: ['#DDF0F3', '#3E9AB0', '#F2C6A0', '#1F6E86'], itens: 'Mesa branca, painel ondulado, rede com conchas, arco de balões azul, 5 bandejas' },
      { id: 'jardim', nome: 'Jardim Encantado', categoria: 'mesa', unidades: 2, preco: 720, montagem: 150, desmontagem: 60, status: 'ativo', pal: ['#F6E6EE', '#E58FB1', '#B7D49B', '#C25B86'], itens: 'Mesa provençal, painel floral, flores artificiais, borboletas, 6 bandejas, gaiola decorativa' },
      { id: 'circo', nome: 'Circo Vintage', categoria: 'mesa', unidades: 1, preco: 680, montagem: 120, desmontagem: 60, status: 'ativo', pal: ['#FBEBDD', '#D9483B', '#F2C14E', '#2F4858'], itens: 'Mesa listrada, tenda de tecido, painel de lona, pipoqueira decorativa, 5 bandejas' },
      { id: 'astro', nome: 'Astronauta', categoria: 'pegue', unidades: 3, preco: 280, montagem: 0, desmontagem: 0, status: 'ativo', pal: ['#E3E4F4', '#33357A', '#F4B942', '#8C8FD6'], itens: '2 mesinhas cilindro, painel redondo, foguete, planetas, 3 bandejas, toalha' },
      { id: 'realeza', nome: 'Realeza Rosa', categoria: 'pegue', unidades: 3, preco: 260, montagem: 0, desmontagem: 0, status: 'ativo', pal: ['#FCE7EF', '#E06C9F', '#E9C46A', '#B44A7B'], itens: '2 mesinhas cilindro, painel redondo, coroa, castelo de MDF, 3 bandejas, toalha' },
      { id: 'dino', nome: 'Dinossauros', categoria: 'pegue', unidades: 2, preco: 260, montagem: 0, desmontagem: 0, status: 'ativo', pal: ['#E8F1DC', '#5C9A4E', '#E79A3C', '#3D6B35'], itens: '2 mesinhas cilindro, painel redondo, 3 dinossauros, folhagens, 3 bandejas' },
      { id: 'boho', nome: 'Boho Neutro', categoria: 'pegue', unidades: 2, preco: 300, montagem: 0, desmontagem: 0, status: 'ativo', pal: ['#F3ECE3', '#C9A27E', '#8A6F5A', '#E4D3BF'], itens: 'Mesa de madeira, painel de macramê, pampas, 4 bandejas de palha, tapete' },
      { id: 'cha', nome: 'Chá Revelação', categoria: 'pegue', unidades: 2, preco: 270, montagem: 0, desmontagem: 0, status: 'ativo', pal: ['#EEF1F8', '#8FB4E3', '#F2A7C3', '#5B6FA8'], itens: '2 mesinhas cilindro, painel duplo, letreiro, balões surpresa, 3 bandejas' },
      { id: 'campinho', nome: 'Campinho', categoria: 'pegue', unidades: 2, preco: 250, montagem: 0, desmontagem: 0, status: 'ativo', pal: ['#E4F2E2', '#3E8E4C', '#FFFFFF', '#2B5D33'], itens: '2 mesinhas cilindro, painel gramado, traves, bolas, 3 bandejas' },
      { id: 'arco', nome: 'Arco Candy', categoria: 'painel', unidades: 2, preco: 390, montagem: 90, desmontagem: 40, status: 'ativo', pal: ['#FBEFF0', '#E9B7B9', '#9FD3C7', '#E3B04B'], itens: 'Arco desconstruído com 120 balões, painel redondo 1,5 m, cilindro' },
      { id: 'floral', nome: 'Painel Redondo Floral', categoria: 'painel', unidades: 1, preco: 340, montagem: 60, desmontagem: 30, status: 'ativo', pal: ['#F7EFE6', '#D98C6A', '#EAD2AC', '#8C5A45'], itens: 'Painel redondo 2 m, arranjo floral, 2 cilindros, tapete' },
      { id: 'tropical', nome: 'Tropical Neon', categoria: 'painel', unidades: 1, preco: 360, montagem: 60, desmontagem: 30, status: 'manutencao', pal: ['#E9F7EF', '#1FB58F', '#FF6B9A', '#FFC93C'], itens: 'Painel de folhagens, letreiro neon, arco de balões, 2 cilindros' },
    ];
    const nomes = ['Marina Costa', 'Juliana Albuquerque', 'Camila Teixeira', 'Priscila Nogueira', 'Fernanda Lins', 'Tatiane Rocha', 'Bruno Matos', 'Larissa Pimentel', 'Renata Cordeiro', 'Daniela Freitas', 'Patrícia Moura', 'Thiago Siqueira', 'Bianca Farias', 'Luana Prado', 'Gabriela Queiroz', 'Carla Menezes'];
    const bairros = ['Jardim das Flores', 'Vila Nova', 'Centro', 'Parque Verde', 'Alto da Colina', 'Lagoa Azul', 'Bela Vista', 'Recanto do Sol'];
    const clientes = nomes.map((n, i) => ({
      id: 'c' + (i + 1), nome: n, whats: `(00) 90000-${pad(10 + i * 7)}${pad(31 + i)}`.slice(0, 16),
      email: n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(' ').join('.') + '@exemplo.com',
      bairro: bairros[i % bairros.length],
    }));

    const today = startOfDay(now);
    const sat = addDays(today, ((6 - today.getDay()) + 7) % 7 || 0);
    const D = n => dayKey(addDays(sat, n));
    const at = (n, hm) => `${D(n)}T${hm}`;

    // [dia rel. ao sábado, modalidade, kits, cliente, status, inicio, fim, retirada, devolução, obs]
    const L = (d, kits, c, st, ini, fim, extra = {}) => ({ d, modalidade: 'local', kits, c, st, ini, fim, ...extra });
    const R = (d, kits, c, st, ret, dev, extra = {}) => ({ d, modalidade: 'retirada', kits, c, st, ret, dev, ...extra });
    const lista = [
      // passado
      L(-14, ['safari'], 0, 'concluida', '15:00', '19:00'),
      R(-14, ['astro'], 1, 'concluida', [-15, '17:00'], [-13, '12:00']),
      L(-13, ['jardim'], 2, 'concluida', '10:00', '14:00'),
      L(-7, ['circo'], 3, 'concluida', '16:00', '20:00'),
      R(-7, ['boho'], 4, 'concluida', [-8, '17:00'], [-6, '12:00']),
      L(-7, ['arco'], 5, 'concluida', '14:00', '18:00'),
      L(-6, ['mar'], 6, 'concluida', '11:00', '15:00'),
      R(-8, ['dino'], 7, 'cancelada', [-9, '17:00'], [-7, '12:00'], { motivo: 'Festa adiada pela família' }),
      R(-3, ['cha'], 8, 'concluida', [-4, '16:00'], [-2, '12:00']),
      // este fim de semana
      R(0, ['realeza'], 9, 'confirmada', [-1, '10:00'], [1, '12:00']),
      L(0, ['safari'], 10, 'confirmada', '10:00', '13:00', { obs: 'Aniversário de 1 ano do Theo' }),
      L(0, ['safari', 'arco'], 11, 'confirmada', '16:00', '20:00', { obs: 'Salão do condomínio, 3º andar' }),
      L(0, ['jardim', 'floral'], 12, 'confirmada', '15:00', '19:00'),
      R(0, ['astro'], 13, 'pre', [-1, '17:00'], [1, '12:00'], { preHorasAtras: 43 }),
      R(0, ['astro'], 14, 'confirmada', [0, '09:00'], [1, '12:00']),
      L(0, ['mar'], 15, 'pre', '14:00', '18:00', { preHorasAtras: 20 }),
      L(1, ['circo'], 0, 'confirmada', '10:00', '14:00'),
      R(1, ['dino'], 2, 'pre', [0, '17:00'], [2, '12:00'], { preHorasAtras: 30 }),
      // próximas semanas
      R(4, ['cha'], 3, 'confirmada', [3, '16:00'], [5, '12:00']),
      R(6, ['boho'], 5, 'confirmada', [6, '10:00'], [8, '12:00']),
      L(7, ['safari'], 6, 'pre', '15:00', '19:00', { preHorasAtras: 4 }),
      R(7, ['realeza'], 7, 'confirmada', [6, '17:00'], [8, '12:00']),
      R(7, ['campinho'], 8, 'confirmada', [7, '09:00'], [8, '12:00']),
      L(7, ['arco'], 1, 'confirmada', '15:00', '19:00'),
      L(7, ['mar'], 4, 'confirmada', '10:00', '14:00'),
      L(8, ['jardim'], 9, 'confirmada', '16:00', '20:00'),
      L(14, ['circo'], 10, 'confirmada', '15:00', '19:00'),
      R(14, ['astro', 'realeza'], 11, 'confirmada', [13, '17:00'], [15, '12:00'], { obs: 'Festa de gêmeos' }),
      L(14, ['safari'], 12, 'confirmada', '10:00', '14:00'),
      L(21, ['floral'], 13, 'pre', '16:00', '20:00', { preHorasAtras: 12 }),
      L(28, ['jardim', 'arco'], 14, 'confirmada', '15:00', '19:00'),
      // pedidos novos (vindos da vitrine)
      L(0, ['safari'], 1, 'pedido', '15:00', '19:00', { obs: 'Viu o Safari no Instagram, quer muito esse tema', criadoHorasAtras: 3 }),
      R(7, ['dino'], 3, 'pedido', [6, '17:00'], [8, '12:00'], { criadoHorasAtras: 9 }),
      R(14, ['boho'], 5, 'pedido', [13, '17:00'], [15, '12:00'], { criadoHorasAtras: 26 }),
      L(9, ['arco'], 15, 'pedido', '17:00', '21:00', { obs: 'Chá de bebê', criadoHorasAtras: 30 }),
    ];

    let num = 1040;
    const reservas = lista.map(x => {
      const cli = clientes[x.c];
      const r = {
        id: 'r' + (num + 1), codigo: ++num, clienteId: cli.id, kits: x.kits, modalidade: x.modalidade,
        data: D(x.d), status: x.st, bairro: cli.bairro, obs: x.obs || '', motivo: x.motivo || '',
        historico: [],
      };
      if (x.modalidade === 'local') { r.inicio = x.ini; r.fim = x.fim; r.endereco = `Rua das Acácias, ${120 + num % 300} — ${cli.bairro}`; }
      else { r.retirada = at(x.ret[0], x.ret[1]); r.devolucao = at(x.dev[0], x.dev[1]); r.inicio = '15:00'; r.fim = '19:00'; r.endereco = 'Retirada no ateliê'; }
      const tmp = { kits, regras };
      r.valor = r.kits.reduce((a, id) => a + kits.find(k => k.id === id).preco, 0) + (r.modalidade === 'local' ? regras.taxaMontagem : 0);
      const criado = addMin(now, -60 * (x.criadoHorasAtras || 24 * (10 + (num % 12))));
      const criadoEm = criado < parse(r.data + 'T00:00') ? criado : addDays(parse(r.data + 'T09:00'), -12);
      r.criadoEm = toLocal(criadoEm);
      r.historico.push({ em: r.criadoEm, quem: x.criadoHorasAtras ? 'Vitrine' : 'Bia (dona)', txt: 'Pedido recebido' });
      if (['pre', 'confirmada', 'concluida', 'expirada'].includes(x.st)) {
        const pd = x.preHorasAtras ? addMin(now, -60 * x.preHorasAtras) : addMin(criadoEm, 120);
        r.preDesde = toLocal(pd);
        r.historico.push({ em: r.preDesde, quem: 'Bia (dona)', txt: 'Aprovado como pré-reserva' });
      }
      r.pago = 0;
      if (x.st === 'confirmada') {
        r.pago = Math.round(r.valor * (num % 3 === 0 ? 1 : 0.5));
        r.historico.push({ em: toLocal(addMin(parse(r.preDesde), 300)), quem: 'Bia (dona)', txt: `Sinal registrado: R$ ${r.pago}` });
      }
      if (x.st === 'concluida') {
        r.pago = r.valor;
        r.historico.push({ em: toLocal(addMin(parse(r.preDesde), 300)), quem: 'Bia (dona)', txt: 'Sinal registrado' });
        r.historico.push({ em: r.data + 'T22:00', quem: 'Equipe', txt: 'Kit devolvido e conferido' });
      }
      if (x.st === 'cancelada') r.historico.push({ em: toLocal(addDays(parse(r.data + 'T10:00'), -5)), quem: 'Bia (dona)', txt: `Cancelada: ${x.motivo}` });
      return r;
    });

    return {
      versao: 1,
      empresa: { nome: 'Bendita Festa', slogan: 'Decoração de festas e pegue e monte', whats: '(00) 90000-0000', cidade: 'Sua cidade', dona: 'Bia' },
      regras, kits, clientes, reservas, seq: num,
    };
  }

  return { pad, dayKey, toLocal, parse, addMin, addDays, startOfDay, STATUS, CATEGORIAS, HOLD,
    janela, janelaReserva, festaHorario, checarKit, checarReserva, sugestoes, statusDoDia, disputado,
    varrer, venceEm, valorSugerido, kitById, clienteById, maxSimultaneo, holdsDoKit, seed };
})();
if (typeof module !== 'undefined') module.exports = Core;
