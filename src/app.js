/* Ornata — protótipo: vitrine + painel */
(() => {
const C = Core;
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DIASL = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESESL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const brl = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
const hm = d => `${C.pad(d.getHours())}:${C.pad(d.getMinutes())}`;
const fDia = d => `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
const fDiaLongo = d => `${DIASL[d.getDay()]}, ${d.getDate()} de ${MESESL[d.getMonth()]}`;
const fDH = d => `${fDia(d)}, ${hm(d)}`;
const fJanela = w => C.dayKey(w.ini) === C.dayKey(w.fim) ? `${fDia(w.ini)}, das ${hm(w.ini)} às ${hm(w.fim)}` : `de ${fDH(w.ini)} a ${fDH(w.fim)}`;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const agora = () => new Date();
const hojeKey = () => C.dayKey(agora());
const LS_DB = 'ornata.db.v1', LS_S = 'ornata.sessao.v1';
const ls = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};
const CONTAS = {
  'teste@ornata.app': { perfil: 'dona', nome: 'Bia', papel: 'Dona' },
  'equipe@ornata.app': { perfil: 'equipe', nome: 'Rafa', papel: 'Equipe' },
};
const SENHA = 'festa2026';

let DB = ls.get(LS_DB) || C.seed(agora());
C.varrer(DB, agora());
let S = ls.get(LS_S);
const persist = () => { if (!S || S.modo !== 'demo') ls.set(LS_DB, DB); };
const ehDona = () => S && S.perfil === 'dona';

const UI = {
  vDia: null, vCat: 'todos', orcOk: null, orcErro: '',
  mes: null, dia: null, todosKits: false,
  rFiltro: 'abertas', busca: '', cBusca: '',
  gaveta: null,
};

/* ---------- ilustração dos kits ---------- */
function arte(kit, alinha = 'xMidYMid') {
  const [bg, a, b, c] = kit.pal;
  const id = kit.id;
  const balao = (x, y, r, cor) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${cor}"/><circle cx="${x - r * .35}" cy="${y - r * .35}" r="${r * .28}" fill="#fff" opacity=".35"/>`;
  let s = `<svg viewBox="0 0 240 180" preserveAspectRatio="${alinha} slice" aria-hidden="true"><rect width="240" height="180" fill="${bg}"/>`;
  s += `<rect y="150" width="240" height="30" fill="${a}" opacity=".18"/>`;
  if (kit.categoria === 'mesa') {
    s += `<circle cx="120" cy="78" r="60" fill="${a}" opacity=".5"/>`;
    const pts = [[52, 46, 15, b], [68, 26, 12, a], [40, 72, 13, c], [60, 96, 10, b], [188, 44, 14, c], [174, 22, 11, b], [200, 70, 12, a], [182, 94, 9, b]];
    pts.forEach(p => s += balao(...p));
    s += `<rect x="46" y="116" width="148" height="40" rx="4" fill="#fff"/><rect x="46" y="116" width="148" height="8" fill="${c}" opacity=".7"/>`;
    s += `<rect x="54" y="156" width="6" height="16" fill="${c}"/><rect x="180" y="156" width="6" height="16" fill="${c}"/>`;
    s += `<rect x="102" y="92" width="36" height="24" rx="3" fill="${b}"/><rect x="109" y="76" width="22" height="16" rx="3" fill="#fff"/><rect x="115" y="68" width="10" height="8" rx="2" fill="${a}"/>`;
    s += `<ellipse cx="72" cy="114" rx="14" ry="4" fill="${b}"/><ellipse cx="168" cy="114" rx="14" ry="4" fill="${b}"/><circle cx="72" cy="106" r="6" fill="${a}"/><circle cx="168" cy="106" r="6" fill="${c}"/>`;
  } else if (kit.categoria === 'pegue') {
    s += `<circle cx="120" cy="80" r="56" fill="${a}"/><circle cx="120" cy="80" r="56" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="2 6" opacity=".7"/>`;
    s += balao(64, 48, 13, b) + balao(54, 74, 10, c) + balao(176, 40, 12, c) + balao(186, 64, 9, b);
    s += `<rect x="70" y="112" width="48" height="56" rx="4" fill="${b}"/><ellipse cx="94" cy="112" rx="24" ry="6" fill="#fff" opacity=".5"/>`;
    s += `<rect x="124" y="126" width="40" height="42" rx="4" fill="${c}"/><ellipse cx="144" cy="126" rx="20" ry="5" fill="#fff" opacity=".5"/>`;
    s += `<rect x="82" y="88" width="24" height="20" rx="3" fill="#fff"/><rect x="87" y="78" width="14" height="10" rx="2" fill="${a}" opacity=".8"/>`;
    s += `<circle cx="144" cy="114" r="9" fill="#fff"/><circle cx="144" cy="114" r="4" fill="${b}"/>`;
  } else {
    s += `<circle cx="120" cy="84" r="54" fill="${a}" opacity=".35"/><circle cx="120" cy="84" r="54" fill="none" stroke="${a}" stroke-width="2"/>`;
    const cores = [a, b, c];
    for (let i = 0; i < 17; i++) {
      const t = Math.PI * (1.05 + i * .055);
      const r = 66 + (i % 3) * 5;
      s += balao(+(120 + Math.cos(t) * r).toFixed(1), +(96 + Math.sin(t) * r * 1.02).toFixed(1), 9 + (i * 7 % 5), cores[i % 3]);
    }
    s += `<rect x="98" y="122" width="44" height="46" rx="4" fill="#fff"/><ellipse cx="120" cy="122" rx="22" ry="5" fill="${b}" opacity=".6"/>`;
    s += `<rect x="108" y="102" width="24" height="20" rx="3" fill="${c}"/>`;
  }
  return s + '</svg>';
}

/* ---------- ícones ---------- */
const IC = {
  casa: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  kit: '<circle cx="8" cy="8" r="4"/><circle cx="16" cy="7" r="3"/><path d="M4 21v-5h16v5M3 16h18"/>',
  pessoas: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .8 3.2 2.6 3.6 5.2"/>',
  regra: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  vitrine: '<path d="M3 9 5 4h14l2 5M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v8h14v-8"/>',
  sair: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  esq: '<path d="m15 6-6 6 6 6"/>', dir: '<path d="m9 6 6 6-6 6"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  alerta: '<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  msg: '<path d="M4 5h16v11H8l-4 4z"/>',
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const logo = (s = 30) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" aria-hidden="true"><path d="M2 6c9 6 19 6 28 0" fill="none" stroke="#3A0F1F" stroke-width="2"/><path d="M5 8.4 9.5 20l4.5-9.4z" fill="#7A1E3D"/><path d="M14.5 10.8 18 22l3.6-11.3z" fill="#E3B04B"/><path d="M22.6 9.9 25.4 18l2.6-9.6z" fill="#22594B"/></svg>`;

function toast(t) {
  document.querySelectorAll('.toast').forEach(x => x.remove());
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = t;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
async function copiar(txt, btn) {
  try { await navigator.clipboard.writeText(txt); toast('Resumo copiado'); }
  catch (e) {
    const ta = btn && btn.closest('[data-copia]') && btn.closest('[data-copia]').querySelector('.resumo-txt');
    if (ta) { const r = document.createRange(); r.selectNodeContents(ta); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    toast('Texto selecionado: use Ctrl+C para copiar');
  }
}

/* ---------- rotas ---------- */
const VIEWS_PAINEL = ['inicio', 'agenda', 'reservas', 'kits', 'clientes', 'regras'];
function rota() { return (location.hash || '').replace('#', '') || 'vitrine'; }
function ir(r) { if (location.hash !== '#' + r) location.hash = r; else render(); }
window.addEventListener('hashchange', () => { UI.gaveta = UI.proxGaveta || null; UI.proxGaveta = null; render(); window.scrollTo(0, 0); });

function render() {
  const r = rota();
  document.title = 'Bendita Festa';
  if (VIEWS_PAINEL.includes(r)) {
    if (!S) { location.hash = 'entrar'; return; }
    if (r === 'regras' && !ehDona()) { location.hash = 'inicio'; return; }
    renderPainel(r);
  } else if (r === 'entrar') renderLogin();
  else renderVitrine();
  renderGaveta();
}

/* ===================== VITRINE ===================== */
function proximosDias(n = 14) { const h = C.startOfDay(agora()); return Array.from({ length: n }, (_, i) => C.addDays(h, i)); }
function diaPadrao() { const dias = proximosDias(); const sab = dias.find(d => d.getDay() === 6); return C.dayKey(sab || dias[0]); }
function proximaLivre(kitId, key) {
  let d = C.parse(key + 'T00:00');
  for (let i = 1; i <= 60; i++) { const k = C.dayKey(C.addDays(d, i)); if (C.statusDoDia(DB, kitId, k) !== 'reservado') return C.addDays(d, i); }
  return null;
}
const DISP_TXT = { livre: 'Livre', ultima: 'Última unidade', reservado: 'Reservado', indisponivel: 'Em manutenção' };

function renderVitrine() {
  if (!UI.vDia) UI.vDia = diaPadrao();
  const e = DB.empresa;
  $('#app').innerHTML = `
  <header class="v-top"><div class="v-top-in">
    <a class="marca" href="#vitrine">${logo()}${esc(e.nome)}</a>
    <nav class="v-nav" aria-label="Seções"><a href="#" data-rolar="temas">Temas</a><a href="#" data-rolar="como">Como funciona</a><a href="#" data-rolar="duvidas">Dúvidas</a></nav>
    <div class="acoes"><a class="btn btn-g btn-sm" href="#entrar">Área da decoradora</a><button class="btn btn-p btn-sm" data-rolar="orcamento">Pedir orçamento</button></div>
  </div></header>
  <main>
    <section class="hero" aria-labelledby="h-hero">
      <div class="varal" id="varal"></div>
      <div class="hero-in">
        <div>
          <h1 id="h-hero">Seu tema, só seu, no dia da sua festa.</h1>
          <p class="lead">Escolha a data nos balões e veja na hora quais decorações estão livres. Mesa completa com montagem no local, ou pegue e monte para retirar no ateliê.</p>
          <div class="resumo-dia" id="resumo-dia" aria-live="polite"></div>
        </div>
        <div class="vitrine-arte" id="hero-arte"></div>
      </div>
    </section>

    <section class="secao" id="temas" aria-labelledby="h-temas">
      <div class="secao-cab">
        <div><h2 id="h-temas">Temas para ${esc(fDia(C.parse(UI.vDia + 'T00:00')))}</h2><p class="sub">A disponibilidade muda com a data escolhida nos balões. Quem confirma a reserva é sempre a ${esc(e.nome)}, depois do sinal.</p></div>
        <div class="filtros" role="group" aria-label="Filtrar por categoria" id="v-filtros"></div>
      </div>
      <div class="catalogo" id="catalogo"></div>
    </section>

    <section class="secao" id="como" aria-labelledby="h-como">
      <div class="secao-cab"><h2 id="h-como">Da escolha à festa em três passos</h2></div>
      <div class="passos">
        <div class="passo"><div class="num">1</div><h3>Escolha data e tema</h3><p>Veja aqui o que está livre no seu dia e mande o pedido. Respondemos pelo WhatsApp com o valor final.</p></div>
        <div class="passo"><div class="num">2</div><h3>Garanta com o sinal</h3><p>Seguramos o tema por ${DB.regras.preReservaHoras} horas. Com o sinal de ${DB.regras.sinalMin}%, a data é sua e ninguém mais reserva aquele kit.</p></div>
        <div class="passo"><div class="num">3</div><h3>Receba ou retire</h3><p>Montamos no local antes da festa, ou você retira no ateliê, monta do seu jeito e devolve no dia seguinte.</p></div>
      </div>
    </section>

    <section class="secao" aria-labelledby="h-mod" style="padding-top:0">
      <div class="secao-cab"><h2 id="h-mod">Duas formas de decorar</h2></div>
      <div class="modalidades">
        <div class="modal-card a"><h3>Montagem no local</h3><p class="preco-de">Mesa completa ou painel, a partir de ${brl(Math.min(...DB.kits.filter(k => k.categoria !== 'pegue').map(k => k.preco)) + DB.regras.taxaMontagem)}</p>
          <ul><li>Chegamos antes, montamos e deixamos tudo pronto para as fotos</li><li>Desmontamos e levamos tudo de volta no fim da festa</li><li>Taxa de montagem e frete de ${brl(DB.regras.taxaMontagem)} já no orçamento</li></ul></div>
        <div class="modal-card b"><h3>Pegue e monte</h3><p class="preco-de">Kits a partir de ${brl(Math.min(...DB.kits.filter(k => k.categoria === 'pegue').map(k => k.preco)))}</p>
          <ul><li>Retirada no ateliê na véspera, a partir das 17h</li><li>Peças embaladas por ordem de montagem, com foto de referência</li><li>Devolução até 12h do dia seguinte à festa</li></ul></div>
      </div>
    </section>

    <section class="depo-faixa" aria-labelledby="h-depo"><div class="secao">
      <div class="secao-cab"><h2 id="h-depo">Quem já fez festa com a gente</h2></div>
      <div class="depos">
        <figure class="depo" style="margin:0"><p>“Pedi o Safari numa terça e na quarta já estava tudo confirmado. A mesa chegou montada duas horas antes.”</p><figcaption class="quem">Cliente de exemplo<span>Aniversário de 1 ano</span></figcaption></figure>
        <figure class="depo" style="margin:0"><p>“O pegue e monte veio com tudo numerado. Montei em vinte minutos e ficou igual à foto.”</p><figcaption class="quem">Cliente de exemplo<span>Chá revelação</span></figcaption></figure>
        <figure class="depo" style="margin:0"><p>“Gostei de ver no site que o tema estava livre antes de mandar mensagem.”</p><figcaption class="quem">Cliente de exemplo<span>Aniversário de 6 anos</span></figcaption></figure>
      </div>
      <p class="aviso-exemplo">Depoimentos de exemplo para o protótipo. Na vitrine real entram só depoimentos de clientes.</p>
    </div></section>

    <section class="secao" id="duvidas" aria-labelledby="h-duv">
      <div class="secao-cab"><h2 id="h-duv">Dúvidas</h2></div>
      <div class="faq">
        <details><summary>O tema que aparece livre já está reservado para mim?</summary><p>Ainda não. O pedido segura nada até a ${esc(e.nome)} aprovar. Depois da aprovação o tema fica guardado por ${DB.regras.preReservaHoras} horas, e com o sinal a reserva é confirmada.</p></details>
        <details><summary>Por que um tema aparece reservado se a festa é em outro horário?</summary><p>Cada kit precisa de tempo para ir, ser montado, voltar e ser conferido. Por isso uma festa de manhã pode ocupar o kit até o meio da tarde.</p></details>
        <details><summary>Quanto é o sinal?</summary><p>${DB.regras.sinalMin}% do valor total. O restante é pago até 48 horas antes da festa, ou na retirada no pegue e monte.</p></details>
        <details><summary>Posso misturar um painel com um pegue e monte?</summary><p>Pode. Escolha mais de um tema no pedido e montamos o orçamento junto.</p></details>
        <details><summary>E se eu precisar cancelar?</summary><p>Fale com a gente o quanto antes. A política de devolução do sinal vem no contrato que enviamos junto com a confirmação.</p></details>
      </div>
    </section>

    <section class="orc-faixa" id="orcamento" aria-labelledby="h-orc"><div class="secao">
      <div><h2 id="h-orc">Peça seu orçamento</h2><p class="sub">Respondemos pelo WhatsApp ${esc(e.whats)} com o valor final e o link do sinal. Nada é cobrado agora.</p></div>
      <div id="orc-area"></div>
    </div></section>
  </main>
  <footer class="v-rodape"><div><b style="color:var(--uva)">${esc(e.nome)}</b><br>${esc(e.slogan)}<br>WhatsApp ${esc(e.whats)}</div><div>Vitrine e agenda feitas com Ornata.<br><a href="#entrar">Área da decoradora</a></div></footer>
  <div class="selo-proto" role="note"><span>Protótipo com dados fictícios</span><button class="btn" data-acao="demo">Ver o painel</button></div>`;
  renderVaral(); renderResumoDia(); renderCatalogo(); renderOrc();
}

function renderVaral() {
  const dias = proximosDias();
  const cores = ['var(--menta)', 'var(--ouro)', 'var(--rosa-2)', 'var(--lilas)', 'var(--papel)'];
  const extras = ['var(--rosa-2)', 'var(--menta)', 'var(--ouro)', 'var(--rosa-2)', 'var(--menta)'];
  $('#varal').innerHTML = `
    <div class="baloes" role="group" aria-label="Escolha a data da festa">
      ${dias.map((d, i) => {
        const k = C.dayKey(d), sel = k === UI.vDia, y = Math.round(Math.sin(i * 0.85) * 14);
        return `<button class="balao" style="--y:${y}px;--cor:${cores[i % cores.length]};--extra:${extras[i % extras.length]};--extra2:${cores[(i + 2) % cores.length]};animation-delay:${i * 50}ms" aria-pressed="${sel}" data-vdia="${k}" aria-label="${fDiaLongo(d)}${i === 0 ? ', hoje' : ''}">
          <i class="mini m1" aria-hidden="true"></i><i class="mini m2" aria-hidden="true"></i>
          <span class="bola-b"><span class="ds">${i === 0 ? 'hoje' : DIAS[d.getDay()]}</span><span class="dn">${d.getDate()}</span></span></button>`;
      }).join('')}
    </div>`;
}

function contagemDia(key) {
  const c = { livre: 0, ultima: 0, reservado: 0 };
  DB.kits.filter(k => k.status === 'ativo').forEach(k => c[C.statusDoDia(DB, k.id, key)]++);
  return c;
}
function renderResumoDia() {
  const d = C.parse(UI.vDia + 'T00:00'), c = contagemDia(UI.vDia);
  const max = C.dayKey(C.addDays(agora(), 120));
  $('#resumo-dia').innerHTML = `
    <h2>${cap(fDiaLongo(d))}</h2>
    <div class="cont"><span class="disp disp-livre">${c.livre} temas livres</span>${c.ultima ? `<span class="disp disp-ultima">${c.ultima} na última unidade</span>` : ''}${c.reservado ? `<span class="disp disp-reservado">${c.reservado} reservados</span>` : ''}</div>
    <div class="linha-acoes"><button class="btn btn-p" data-rolar="temas">Ver os temas desse dia</button>
    <label class="outra-data">Outra data <input class="inp" type="date" id="v-outra" min="${hojeKey()}" max="${max}" value="${UI.vDia}"></label></div>`;
  const livres = ['painel', 'mesa'].flatMap(cat => DB.kits.filter(k => k.categoria === cat && k.status === 'ativo' && C.statusDoDia(DB, k.id, UI.vDia) !== 'reservado'));
  const kit = livres[0] || DB.kits[0];
  const st = C.statusDoDia(DB, kit.id, UI.vDia);
  $('#hero-arte').innerHTML = `<div class="arco-moldura">${arte(kit, 'xMidYMax')}</div><div class="arte-legenda"><strong>${esc(kit.nome)}</strong>${st === 'reservado' ? 'reservado' : 'livre'} em ${fDia(d)}</div>`;
}

function renderCatalogo() {
  const cats = [['todos', 'Todos'], ...Object.entries(C.CATEGORIAS)];
  $('#v-filtros').innerHTML = cats.map(([k, n]) => `<button class="chip" aria-pressed="${UI.vCat === k}" data-vcat="${k}">${n}</button>`).join('');
  const h = $('#h-temas'); if (h) h.textContent = `Temas para ${fDia(C.parse(UI.vDia + 'T00:00'))}`;
  const ordem = { livre: 0, ultima: 1, reservado: 2, indisponivel: 3 };
  const kits = DB.kits.filter(k => k.status !== 'inativo' && (UI.vCat === 'todos' || k.categoria === UI.vCat))
    .map(k => ({ k, st: C.statusDoDia(DB, k.id, UI.vDia) })).sort((a, b) => ordem[a.st] - ordem[b.st]);
  $('#catalogo').innerHTML = kits.map(({ k, st }) => {
    const prox = st === 'reservado' ? proximaLivre(k.id, UI.vDia) : null;
    return `<article class="kit-card">
      <div class="arte">${arte(k)}<span class="disp disp-${st}">${DISP_TXT[st]}</span></div>
      <div class="corpo"><h3>${esc(k.nome)}</h3><div class="cat">${C.CATEGORIAS[k.categoria]}${k.categoria !== 'pegue' ? ', com montagem' : ''}</div>
        <p class="itens">${esc(k.itens)}</p>
        ${prox ? `<p class="proxima">Próxima data livre: ${fDia(prox)}</p>` : ''}
        <div class="rodape"><span class="preco"><small>a partir de</small><b>${brl(k.preco)}</b></span>
        ${st === 'reservado' && prox ? `<button class="btn btn-s btn-sm" data-vdia="${C.dayKey(prox)}" data-rolar-topo="1">Ver ${fDia(prox)}</button>`
          : st === 'indisponivel' ? `<span class="cat">Volta em breve</span>`
          : `<button class="btn btn-p btn-sm" data-quero="${k.id}">Quero este</button>`}</div>
      </div></article>`;
  }).join('') || '<p class="vazio">Nenhum tema nessa categoria.</p>';
}

function renderOrc() {
  const area = $('#orc-area'); if (!area) return;
  if (UI.orcOk) {
    const r = DB.reservas.find(x => x.id === UI.orcOk);
    if (r) {
      const txt = resumoPedidoCliente(r);
      area.innerHTML = `<div class="orc-ok" data-copia><h3>Pedido ${r.codigo} enviado</h3><p>A ${esc(DB.empresa.nome)} recebe o pedido no painel e responde pelo WhatsApp. Se quiser adiantar, mande este resumo:</p>
        <div class="resumo-txt">${esc(txt)}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-p" data-copiar="${r.id}" data-tipo="cliente">Copiar resumo</button><button class="btn btn-s" data-acao="ver-pedido" data-id="${r.id}">Ver como a decoradora recebe</button><button class="btn btn-g" data-acao="novo-orc">Fazer outro pedido</button></div></div>`;
      return;
    }
  }
  const f = UI.orcForm || (UI.orcForm = { nome: '', whats: '', data: UI.vDia, modalidade: 'local', inicio: '15:00', fim: '19:00', retirada: 'vespera', bairro: '', kits: [], obs: '' });
  area.innerHTML = `<form class="orc-form" id="orc-form" novalidate>
    <div class="grade2"><label class="campo"><span>Seu nome</span><input class="inp" name="nome" autocomplete="name" value="${esc(f.nome)}" required></label>
    <label class="campo"><span>WhatsApp</span><input class="inp" name="whats" inputmode="tel" autocomplete="tel" placeholder="(00) 90000-0000" value="${esc(f.whats)}" required></label></div>
    <div class="campo"><span>Como você quer a decoração?</span><div class="seg" role="group" aria-label="Modalidade">
      <button type="button" aria-pressed="${f.modalidade === 'local'}" data-orcmod="local">Montagem no local</button><button type="button" aria-pressed="${f.modalidade === 'retirada'}" data-orcmod="retirada">Pegue e monte</button></div></div>
    <div class="grade3"><label class="campo"><span>Data da festa</span><input class="inp" type="date" name="data" min="${hojeKey()}" value="${esc(f.data)}" required></label>
    ${f.modalidade === 'local'
      ? `<label class="campo"><span>Começa</span><input class="inp" type="time" name="inicio" value="${f.inicio}" step="900"></label><label class="campo"><span>Termina</span><input class="inp" type="time" name="fim" value="${f.fim}" step="900"></label>`
      : `<label class="campo" style="grid-column:span 2"><span>Retirada</span><select class="inp" name="retirada"><option value="vespera" ${f.retirada === 'vespera' ? 'selected' : ''}>Na véspera, às 17h</option><option value="dia" ${f.retirada === 'dia' ? 'selected' : ''}>No dia da festa, às 9h</option></select><small>Devolução até 12h do dia seguinte à festa</small></label>`}
    </div>
    <div class="campo"><span>Temas</span><div class="kit-escolha" id="orc-kits"></div></div>
    <div class="grade2"><label class="campo"><span>Bairro</span><input class="inp" name="bairro" value="${esc(f.bairro)}"></label>
    <label class="campo"><span>Alguma observação?</span><input class="inp" name="obs" value="${esc(f.obs)}" placeholder="Idade, nome, cores..."></label></div>
    ${UI.orcErro ? `<p class="erro" role="alert">${esc(UI.orcErro)}</p>` : ''}
    <button class="btn btn-p" type="submit" style="align-self:flex-start">Enviar pedido de orçamento</button>
  </form>`;
  renderOrcKits();
}
function renderOrcKits() {
  const f = UI.orcForm, el = $('#orc-kits'); if (!el) return;
  el.innerHTML = DB.kits.filter(k => k.status !== 'inativo' && (f.modalidade === 'local' ? true : k.categoria === 'pegue')).map(k => {
    const st = f.data ? C.statusDoDia(DB, k.id, f.data) : 'livre';
    const bloq = st === 'reservado' || st === 'indisponivel';
    return `<label class="${bloq ? 'ocupado' : ''}"><input type="checkbox" value="${k.id}" ${f.kits.includes(k.id) ? 'checked' : ''} ${st === 'indisponivel' ? 'disabled' : ''}><i class="bola" style="background:${k.pal[1]}"></i>${esc(k.nome)}${bloq ? ` (${DISP_TXT[st].toLowerCase()})` : ''}</label>`;
  }).join('');
}
function lerOrcForm() {
  const fm = $('#orc-form'); if (!fm) return;
  const f = UI.orcForm, fd = new FormData(fm);
  ['nome', 'whats', 'data', 'inicio', 'fim', 'retirada', 'bairro', 'obs'].forEach(k => { if (fd.has(k)) f[k] = fd.get(k); });
  f.kits = [...fm.querySelectorAll('#orc-kits input:checked')].map(i => i.value);
}
function enviarOrc() {
  lerOrcForm();
  const f = UI.orcForm;
  const dig = f.whats.replace(/\D/g, '');
  if (f.nome.trim().length < 2) UI.orcErro = 'Escreva seu nome.';
  else if (dig.length < 10) UI.orcErro = 'Escreva o WhatsApp com DDD.';
  else if (!f.data || f.data < hojeKey()) UI.orcErro = 'Escolha uma data a partir de hoje.';
  else if (!f.kits.length) UI.orcErro = 'Escolha pelo menos um tema.';
  else if (f.modalidade === 'local' && f.inicio === f.fim) UI.orcErro = 'O horário de término precisa ser depois do início.';
  else UI.orcErro = '';
  if (UI.orcErro) { renderOrc(); $('#orc-form .erro').focus?.(); return; }
  let cli = DB.clientes.find(c => c.whats.replace(/\D/g, '') === dig);
  if (!cli) { cli = { id: 'c' + Date.now(), nome: f.nome.trim(), whats: f.whats.trim(), email: '', bairro: f.bairro.trim() }; DB.clientes.push(cli); }
  const r = novaReservaBase({ clienteId: cli.id, kits: f.kits, modalidade: f.modalidade, data: f.data, inicio: f.inicio, fim: f.fim, bairro: f.bairro.trim() || cli.bairro, obs: f.obs.trim(), status: 'pedido' });
  if (f.modalidade === 'retirada') {
    const d = C.parse(f.data + 'T00:00');
    r.retirada = f.retirada === 'dia' ? `${f.data}T09:00` : `${C.dayKey(C.addDays(d, -1))}T17:00`;
    r.devolucao = `${C.dayKey(C.addDays(d, 1))}T12:00`;
    r.endereco = 'Retirada no ateliê';
  } else r.endereco = f.bairro.trim() ? `Endereço a confirmar, ${f.bairro.trim()}` : 'Endereço a confirmar';
  r.historico = [{ em: C.toLocal(agora()), quem: 'Vitrine', txt: 'Pedido recebido pela vitrine' }];
  DB.reservas.push(r); persist();
  UI.orcOk = r.id; UI.orcForm = null;
  renderOrc(); renderResumoDia(); renderCatalogo();
}
function novaReservaBase(p) {
  DB.seq = (DB.seq || 1100) + 1;
  const r = Object.assign({ id: 'r' + DB.seq + '-' + Date.now().toString(36), codigo: DB.seq, historico: [], pago: 0, obs: '', motivo: '', criadoEm: C.toLocal(agora()) }, p);
  r.valor = C.valorSugerido(DB, r);
  return r;
}
function resumoPedidoCliente(r) {
  const cli = C.clienteById(DB, r.clienteId);
  return `Olá! Sou ${cli.nome} e fiz o pedido ${r.codigo} pela vitrine.\nData: ${fDiaLongo(C.parse(r.data + 'T00:00'))}\n${r.modalidade === 'local' ? `Montagem no local, festa das ${r.inicio} às ${r.fim}` : `Pegue e monte, retirada ${fDH(C.parse(r.retirada))}`}\nTemas: ${r.kits.map(id => C.kitById(DB, id).nome).join(', ')}${r.obs ? `\nObservação: ${r.obs}` : ''}`;
}

/* ===================== LOGIN ===================== */
function renderLogin() {
  if (S && VIEWS_PAINEL.includes(rota())) return;
  $('#app').innerHTML = `<div class="login">
    <div class="login-arte">
      <a class="marca" href="#vitrine" style="color:#fff">${logo().replace(/#3A0F1F/g, '#fff')}Ornata</a>
      <div><h1>A agenda que não deixa um kit ir para duas festas.</h1><p>Painel da ${esc(DB.empresa.nome)}: pedidos da vitrine, reservas, kits e a checagem de conflito em cada horário.</p></div>
      <div class="mini-varal" aria-hidden="true">${['#9FD3C7', '#E3B04B', '#E9B7B9', '#EBD3D6', '#7A1E3D', '#9FD3C7', '#E3B04B'].map(c => `<span style="background:${c}"></span>`).join('')}</div>
    </div>
    <div class="login-form"><form id="login-form" novalidate>
      <h2>Entrar no painel</h2>
      <label class="campo"><span>E-mail</span><input class="inp" type="email" name="email" autocomplete="username" required></label>
      <label class="campo"><span>Senha</span><input class="inp" type="password" name="senha" autocomplete="current-password" required></label>
      <p class="erro" id="login-erro" role="alert"></p>
      <button class="btn btn-p" type="submit">Entrar</button>
      <div class="ou">ou</div>
      <button class="btn btn-s" type="button" data-acao="demo">Ver demonstração sem senha</button>
      <p style="font-size:14px;color:var(--uva-2)">Na demonstração, tudo o que você mudar some ao recarregar a página.</p>
      <a href="#vitrine" style="font-size:14px">Voltar para a vitrine</a>
    </form></div></div>`;
}
function entrar(email, senha) {
  const conta = CONTAS[email.trim().toLowerCase()];
  if (!conta || senha !== SENHA) { $('#login-erro').textContent = 'E-mail ou senha não conferem. Confira e tente de novo.'; return; }
  DB = ls.get(LS_DB) || C.seed(agora()); C.varrer(DB, agora());
  S = { modo: 'teste', ...conta, email: email.trim().toLowerCase() };
  ls.set(LS_S, S); persist();
  ir('inicio');
}
function entrarDemo(abrirId) {
  DB = JSON.parse(JSON.stringify(DB));
  S = { modo: 'demo', perfil: 'dona', nome: 'Bia', papel: 'Dona' };
  ls.del(LS_S);
  if (abrirId) UI.proxGaveta = { tipo: 'reserva', id: abrirId };
  ir('inicio');
}
function sair() { S = null; ls.del(LS_S); DB = ls.get(LS_DB) || C.seed(agora()); C.varrer(DB, agora()); ir('vitrine'); }

/* ===================== PAINEL ===================== */
const TITULOS = { inicio: 'Início', agenda: 'Agenda', reservas: 'Reservas', kits: 'Kits', clientes: 'Clientes', regras: 'Regras' };
function renderPainel(v) {
  const pedidos = DB.reservas.filter(r => r.status === 'pedido').length;
  const nav = [['inicio', 'casa'], ['agenda', 'cal'], ['reservas', 'lista'], ['kits', 'kit'], ['clientes', 'pessoas'], ...(ehDona() ? [['regras', 'regra']] : [])];
  $('#app').innerHTML = `<div class="painel">
    <nav class="lateral" aria-label="Painel">
      <a class="marca" href="#inicio">${logo(26)}Ornata</a><div class="empresa">${esc(DB.empresa.nome)}</div>
      ${nav.map(([k, i]) => `<a class="nav-item" href="#${k}" ${v === k ? 'aria-current="page"' : ''}>${ic(i)}${TITULOS[k]}${k === 'reservas' && pedidos ? `<span class="cont" aria-label="${pedidos} pedidos novos">${pedidos}</span>` : ''}</a>`).join('')}
      <div class="baixo"><a class="nav-item" href="#vitrine">${ic('vitrine')}Ver vitrine</a>
      <div class="usuario"><div class="avatar">${esc(S.nome[0])}</div><div class="q">${esc(S.nome)}<span>${esc(S.papel)}</span></div><button class="btn btn-g btn-sm" data-acao="sair" aria-label="Sair" style="margin-left:auto;padding:8px">${ic('sair', 18)}</button></div></div>
    </nav>
    <div class="principal">
      ${S.modo === 'demo'
        ? `<div class="faixa-modo" role="note"><b>Modo demonstração.</b> Dados fictícios; o que você mudar some ao recarregar a página. <button data-acao="sair">Sair da demonstração</button></div>`
        : `<div class="faixa-modo teste" role="note"><b>Ambiente de teste${S.perfil === 'equipe' ? ', perfil Equipe' : ''}.</b> As mudanças ficam salvas neste navegador. <button data-acao="restaurar">Restaurar dados</button><button data-acao="sair">Sair</button></div>`}
      <header class="topo"><div><h1>${TITULOS[v]}</h1><p class="sub" id="topo-sub"></p></div><div class="dir">${v !== 'regras' ? `<button class="btn btn-p" data-acao="nova">${ic('mais', 18)}Nova reserva</button>` : ''}</div></header>
      <main class="view" id="view"></main>
    </div></div>`;
  ({ inicio: vInicio, agenda: vAgenda, reservas: vReservas, kits: vKits, clientes: vClientes, regras: vRegras })[v]();
}
const sub = t => { const el = $('#topo-sub'); if (el) el.textContent = t; };
const pill = st => `<span class="pill st-${st}">${C.STATUS[st].nome}</span>`;
const kitsNomes = r => r.kits.map(id => C.kitById(DB, id).nome).join(', ');
const quando = r => r.modalidade === 'local' ? `${r.inicio} às ${r.fim}` : `retirada ${fDH(C.parse(r.retirada))}`;
const dataR = r => C.parse(r.data + 'T00:00');
const ordData = (a, b) => (a.data + (a.inicio || '')).localeCompare(b.data + (b.inicio || ''));

function venceTxt(r) {
  const v = C.venceEm(DB, r); if (!v) return '';
  const h = Math.max(0, (v - agora()) / 36e5);
  return h < 1 ? `vence em ${Math.max(1, Math.round(h * 60))} min` : `vence em ${Math.round(h)} h`;
}

function diasComExcessoEquipe(dias = 14) {
  const ini = hojeKey(), fim = C.dayKey(C.addDays(agora(), dias));
  const out = {};
  DB.reservas.filter(r => C.HOLD.includes(r.status) && r.modalidade === 'local' && r.data >= ini && r.data <= fim).forEach(r => {
    const n = C.checarReserva(DB, r, r.id).equipe;
    if (n > DB.regras.equipes) out[r.data] = Math.max(out[r.data] || 0, n);
  });
  return Object.entries(out).sort();
}

function vInicio() {
  const h = agora(), hk = hojeKey(), sem = C.dayKey(C.addDays(h, 7));
  const hr = h.getHours();
  sub(`${hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite'}, ${S.nome}. Hoje é ${fDiaLongo(h)}.`);
  const prox = DB.reservas.filter(r => C.HOLD.includes(r.status) && r.data >= hk && r.data <= sem).sort(ordData);
  const pedidos = DB.reservas.filter(r => r.status === 'pedido').sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const vencendo = DB.reservas.filter(r => r.status === 'pre' && (C.venceEm(DB, r) - h) < 24 * 36e5).sort((a, b) => C.venceEm(DB, a) - C.venceEm(DB, b));
  const mesK = hk.slice(0, 7);
  const aReceber = DB.reservas.filter(r => C.HOLD.includes(r.status) && r.data.slice(0, 7) === mesK).reduce((a, r) => a + (r.valor - r.pago), 0);
  const excesso = diasComExcessoEquipe();
  const fim30 = C.dayKey(C.addDays(h, 30));
  const uso = DB.kits.filter(k => k.status === 'ativo').map(k => ({ k, n: DB.reservas.filter(r => C.HOLD.includes(r.status) && r.kits.includes(k.id) && r.data >= hk && r.data <= fim30).length }))
    .sort((a, b) => b.n - a.n);
  const maxU = Math.max(1, ...uso.map(u => u.n));
  $('#view').innerHTML = `
    <div class="kpis">
      <a class="kpi destaque" href="#agenda"><div class="v">${prox.length}</div><div class="l">festas nos próximos 7 dias</div></a>
      <a class="kpi" href="#reservas" data-filtro="pedido"><div class="v">${pedidos.length}</div><div class="l">pedidos esperando resposta</div></a>
      <a class="kpi" href="#reservas" data-filtro="pre"><div class="v">${vencendo.length}</div><div class="l">pré-reservas vencendo em 24&nbsp;h</div></a>
      ${ehDona() ? `<div class="kpi"><div class="v">${brl(aReceber)}</div><div class="l">a receber em ${MESESL[h.getMonth()]}</div></div>`
        : `<div class="kpi"><div class="v">${DB.kits.filter(k => k.status === 'ativo').length}</div><div class="l">kits ativos</div></div>`}
    </div>
    <div class="inicio-grade">
      <section class="cartao" aria-labelledby="h-prox"><div class="cab"><h2 id="h-prox">Próximas festas</h2><a href="#agenda" class="btn btn-g btn-sm">Abrir agenda</a></div>
        <div class="lista-festas">${prox.length ? prox.slice(0, 7).map(linhaFesta).join('') + (prox.length > 7 ? `<a class="btn btn-g btn-sm" href="#agenda" style="align-self:flex-start;margin-top:8px">Mais ${prox.length - 7} festas na agenda</a>` : '') : '<div class="vazio"><b>Semana livre</b>Nenhuma festa confirmada nos próximos 7 dias.</div>'}</div></section>
      <div style="display:flex;flex-direction:column;gap:20px">
        <section class="cartao" aria-labelledby="h-voce"><div class="cab"><h2 id="h-voce">Precisa de você</h2></div>
          ${excesso.map(([d, n]) => `<div class="acao-item"><div class="ic" style="background:var(--ouro-claro);color:var(--ouro-2)">${ic('alerta', 18)}</div><div class="tx"><b>${cap(fDia(C.parse(d + 'T00:00')))}: ${n} montagens ao mesmo tempo</b>Você tem ${DB.regras.equipes} equipes. Reveja horários ou chame reforço.</div><button class="btn btn-g btn-sm" data-irdia="${d}">Ver dia</button></div>`).join('')}
          ${vencendo.map(r => `<div class="acao-item"><div class="ic" style="background:var(--ouro-claro);color:var(--ouro-2)">${ic('relogio', 18)}</div><div class="tx"><b>Pré-reserva ${r.codigo} ${venceTxt(r)}</b>${esc(C.clienteById(DB, r.clienteId).nome)}, ${esc(kitsNomes(r))}</div><button class="btn btn-g btn-sm" data-abrir="${r.id}">Abrir</button></div>`).join('')}
          ${pedidos.map(r => `<div class="acao-item"><div class="ic" style="background:var(--lilas-claro);color:#6A4752">${ic('msg', 18)}</div><div class="tx"><b>Pedido ${r.codigo}${C.disputado(DB, r) ? '<span class="tag-disputa">disputado</span>' : ''}</b>${esc(C.clienteById(DB, r.clienteId).nome)} quer ${esc(kitsNomes(r))} em ${fDia(dataR(r))}</div><button class="btn btn-g btn-sm" data-abrir="${r.id}">Responder</button></div>`).join('')}
          ${!excesso.length && !vencendo.length && !pedidos.length ? '<div class="vazio"><b>Tudo em dia</b>Sem pedidos ou prazos pendentes.</div>' : ''}
        </section>
        <section class="cartao" aria-labelledby="h-uso"><div class="cab"><div><h2 id="h-uso">Reservas por kit</h2><p class="sub" style="font-size:13px;color:var(--uva-2)">Próximos 30 dias, pré-reservas e confirmadas</p></div></div>
          <div class="barras">${uso.map(u => `<div class="barra-linha" title="${esc(u.k.nome)}: ${u.n} reservas"><span>${esc(u.k.nome)}</span><div class="barra-trilho"><i style="width:${u.n / maxU * 100}%"></i></div><span class="val">${u.n} ${u.n === 1 ? 'reserva' : 'reservas'}</span></div>`).join('')}</div>
        </section>
      </div>
    </div>`;
}
function linhaFesta(r) {
  const d = dataR(r), cli = C.clienteById(DB, r.clienteId);
  return `<button class="festa-linha" data-abrir="${r.id}"><div class="data-bloco"><div class="d">${d.getDate()}</div><div class="s">${DIAS[d.getDay()]}</div></div>
    <div><div class="t">${esc(cli.nome)}</div><div class="m">${esc(kitsNomes(r))}, ${r.modalidade === 'local' ? `${r.inicio} às ${r.fim}` : 'pegue e monte'}</div></div>${pill(r.status)}</button>`;
}

/* ---------- agenda ---------- */
const COR_ST = { pedido: '#A88A93', pre: '#E3B04B', confirmada: '#7A1E3D', concluida: '#6FBBA9', expirada: '#C9B9BD', cancelada: '#C9B9BD' };
const TXT_ST = { pedido: '#3A0F1F', pre: '#3A0F1F', confirmada: '#fff', concluida: '#1C4A3F', expirada: '#3A0F1F', cancelada: '#3A0F1F' };
function vAgenda() {
  if (!UI.dia) UI.dia = hojeKey();
  if (!UI.mes) UI.mes = UI.dia.slice(0, 7);
  sub('Cada faixa mostra o kit ocupado: ida e montagem, festa, volta e conferência.');
  $('#view').innerHTML = `<div class="agenda-grade"><section class="cartao" id="cal-area" aria-label="Calendário"></section><section class="cartao" id="dia-area" aria-live="polite"></section></div>`;
  renderCal(); renderDia();
}
function renderCal() {
  const [y, m] = UI.mes.split('-').map(Number);
  const prim = new Date(y, m - 1, 1), ini = C.addDays(prim, -prim.getDay());
  const cont = {};
  DB.reservas.filter(r => r.status !== 'cancelada' && r.status !== 'expirada').forEach(r => { (cont[r.data] = cont[r.data] || []).push(r.status); });
  const hk = hojeKey();
  let cel = '';
  for (let i = 0; i < 42; i++) {
    const d = C.addDays(ini, i), k = C.dayKey(d), sts = cont[k] || [];
    const conf = sts.filter(s => s === 'confirmada').length, pre = sts.filter(s => s === 'pre').length, ped = sts.filter(s => s === 'pedido').length, conc = sts.filter(s => s === 'concluida').length;
    const pts = [...Array(Math.min(conf, 4)).fill(COR_ST.confirmada), ...Array(Math.min(pre, 2)).fill(COR_ST.pre), ...Array(Math.min(ped, 2)).fill(COR_ST.pedido), ...Array(Math.min(conc, 3)).fill(COR_ST.concluida)].slice(0, 5);
    const desc = sts.length ? `, ${sts.length} ${sts.length === 1 ? 'reserva' : 'reservas'}` : '';
    cel += `<button class="${d.getMonth() !== m - 1 ? 'fora' : ''} ${k === hk ? 'hoje' : ''}" aria-pressed="${k === UI.dia}" data-dia="${k}" aria-label="${fDiaLongo(d)}${desc}">${d.getDate()}<span class="pts">${pts.map(c => `<i style="background:${c}"></i>`).join('')}</span></button>`;
  }
  $('#cal-area').innerHTML = `<div class="mes-nav"><button class="icone-btn" data-mes="-1" aria-label="Mês anterior">${ic('esq', 18)}</button><h2>${cap(MESESL[m - 1])} de ${y}</h2><button class="icone-btn" data-mes="1" aria-label="Próximo mês">${ic('dir', 18)}</button></div>
    <div class="cal">${DIAS.map(d => `<div class="dsem" aria-hidden="true">${d}</div>`).join('')}${cel}</div>
    <div class="legenda"><span><i style="background:${COR_ST.confirmada};width:10px;border-radius:50%"></i>Confirmada</span><span><i style="background:${COR_ST.pre};width:10px;border-radius:50%"></i>Pré-reserva</span><span><i style="background:${COR_ST.pedido};width:10px;border-radius:50%"></i>Pedido</span><span><i style="background:${COR_ST.concluida};width:10px;border-radius:50%"></i>Concluída</span></div>`;
}
function partesEstilo(tipo, st) {
  const c = COR_ST[st];
  if (st === 'pedido') return `background:repeating-linear-gradient(135deg,#fff 0 5px,#F6ECED 5px 10px);box-shadow:inset 0 0 0 1.5px ${c};color:#3A0F1F`;
  if (tipo === 'festa' || tipo === 'cliente') return `background:${c};color:${TXT_ST[st]}`;
  if (tipo === 'conferencia') return `background:${c}26;background-image:radial-gradient(${c} 1px,transparent 1.4px);background-size:6px 6px;color:#3A0F1F`;
  return `background:repeating-linear-gradient(135deg,${c}55 0 5px,${c}2a 5px 10px);color:#3A0F1F`;
}
function renderDia() {
  const d0 = C.parse(UI.dia + 'T00:00'), d1 = C.addDays(d0, 1);
  const vis = DB.reservas.filter(r => ['pedido', 'pre', 'confirmada', 'concluida'].includes(r.status));
  const linhas = [];
  DB.kits.forEach(k => {
    const itens = vis.filter(r => r.kits.includes(k.id)).map(r => ({ r, w: C.janela(r, k, DB.regras) })).filter(x => x.w.ini < d1 && x.w.fim > d0).sort((a, b) => a.w.ini - b.w.ini);
    if (!itens.length && !UI.todosKits) return;
    const lanes = [];
    const coloca = (x, de) => {
      let li = lanes.findIndex((l, i) => i >= de && l.fim <= x.w.ini);
      if (li < 0) { while (lanes.length < de) lanes.push({ fim: 0, it: [] }); lanes.push({ fim: 0, it: [] }); li = lanes.length - 1; }
      lanes[li].fim = x.w.fim; lanes[li].it.push(x);
    };
    itens.filter(x => x.r.status !== 'pedido').forEach(x => coloca(x, 0));
    itens.filter(x => x.r.status === 'pedido').forEach(x => coloca(x, k.unidades));
    while (lanes.length < Math.min(k.unidades, 3) && UI.todosKits) lanes.push({ fim: 0, it: [] });
    if (!lanes.length) lanes.push({ fim: 0, it: [] });
    linhas.push({ k, lanes });
  });
  const pos = t => Math.max(0, Math.min(100, (t - d0) / 864e5 * 100));
  const nowP = UI.dia === hojeKey() ? pos(agora()) : null;
  const barra = x => {
    const a = Math.max(x.w.ini, d0), b = Math.min(x.w.fim, d1);
    const tot = b - a, cli = C.clienteById(DB, x.r.clienteId);
    const segs = x.w.partes.map(p => ({ ...p, a: Math.max(p.ini, a), b: Math.min(p.fim, b) })).filter(p => p.b > p.a);
    const rot = `${x.r.codigo} ${cli.nome.split(' ')[0]}`;
    return `<button class="bar" style="left:${pos(a)}%;width:${pos(b) - pos(a)}%" data-abrir="${x.r.id}" title="Reserva ${x.r.codigo}, ${esc(cli.nome)}: ${C.STATUS[x.r.status].nome}. Kit ocupado de ${fDH(x.w.ini)} a ${fDH(x.w.fim)}" aria-label="Reserva ${x.r.codigo}, ${esc(cli.nome)}, ${C.STATUS[x.r.status].nome}, kit ocupado de ${fDH(x.w.ini)} a ${fDH(x.w.fim)}">
      ${segs.map(p => `<span class="sg ${p.tipo === 'festa' || p.tipo === 'cliente' ? 'festa-sg' : ''}" style="width:${(p.b - p.a) / tot * 100}%;${partesEstilo(p.tipo, x.r.status)}">${p.tipo === 'festa' || p.tipo === 'cliente' ? esc(rot) : ''}</span>`).join('')}</button>`;
  };
  const horas = [0, 3, 6, 9, 12, 15, 18, 21];
  const nFestas = vis.filter(r => r.data === UI.dia && r.status !== 'pedido').length;
  $('#dia-area').innerHTML = `<div class="cab"><div><h2>${cap(fDiaLongo(d0))}</h2><p class="sub" style="color:var(--uva-2);font-size:14px">${nFestas} ${nFestas === 1 ? 'festa' : 'festas'} neste dia, ${(n => `${n} ${n === 1 ? 'kit' : 'kits'} em uso`)(linhas.filter(l => l.lanes.some(x => x.it.length)).length)}</p></div>
    <label style="display:flex;gap:8px;align-items:center;font-size:14px"><input type="checkbox" id="todos-kits" ${UI.todosKits ? 'checked' : ''} style="accent-color:var(--framboesa)"> Mostrar todos os kits</label></div>
    ${linhas.length ? `<div class="tl-scroll"><div class="tl">
      <div class="tl-horas"><span></span><div class="esc">${horas.map(hh => `<span style="left:${hh / 24 * 100}%">${C.pad(hh % 24)}h</span>`).join('')}</div></div>
      ${linhas.map(l => `<div class="tl-linha"><div class="tl-nome">${esc(l.k.nome)}<small>${l.k.unidades} ${l.k.unidades === 1 ? 'unidade' : 'unidades'}${l.k.status !== 'ativo' ? ', em manutenção' : ''}</small></div>
        <div class="tl-faixas">${nowP !== null ? `<i class="agora" style="left:${nowP}%" title="Agora"></i>` : ''}${l.lanes.map((ln, i) => `<div class="tl-lane ${i >= l.k.unidades ? 'extra' : ''}" ${i >= l.k.unidades ? 'title="Pedidos: ainda não seguram o kit"' : ''}>${ln.it.map(barra).join('')}</div>`).join('')}</div></div>`).join('')}
    </div></div>
    <div class="legenda"><span><i style="${partesEstilo('montagem', 'confirmada')}"></i>Ida e montagem</span><span><i style="${partesEstilo('festa', 'confirmada')}"></i>Festa ou com o cliente</span><span><i style="${partesEstilo('desmontagem', 'confirmada')}"></i>Desmontagem e volta</span><span><i style="${partesEstilo('conferencia', 'confirmada')}"></i>Conferência</span><span><i style="${partesEstilo('festa', 'pre')}"></i>Pré-reserva</span><span><i style="${partesEstilo('festa', 'pedido')}"></i>Pedido (não segura o kit)</span></div>`
    : `<div class="vazio"><b>Nenhum kit em uso neste dia</b>Todos os temas estão livres.<br><br><button class="btn btn-p btn-sm" data-acao="nova" data-data="${UI.dia}">Criar reserva para ${fDia(d0)}</button></div>`}`;
}

/* ---------- reservas ---------- */
const FILTROS = [['abertas', 'Em aberto', r => ['pedido', 'pre', 'confirmada'].includes(r.status)], ['pedido', 'Pedidos', r => r.status === 'pedido'], ['pre', 'Pré-reservas', r => r.status === 'pre'], ['confirmada', 'Confirmadas', r => r.status === 'confirmada'], ['concluida', 'Concluídas', r => r.status === 'concluida'], ['outras', 'Canceladas e expiradas', r => ['cancelada', 'expirada'].includes(r.status)], ['todas', 'Todas', () => true]];
function vReservas() {
  sub('Pedidos da vitrine e reservas feitas pela equipe.');
  $('#view').innerHTML = `<div class="ferramentas"><div class="filtros" role="group" aria-label="Filtrar por status">${FILTROS.map(([k, n, f]) => `<button class="chip" aria-pressed="${UI.rFiltro === k}" data-rfiltro="${k}">${n}<span class="n">${DB.reservas.filter(f).length}</span></button>`).join('')}</div>
    <label class="busca"><span class="sr">Buscar</span>${ic('busca', 18)}<input class="inp" id="busca" placeholder="Buscar cliente, kit ou número" value="${esc(UI.busca)}"></label></div>
    <div class="cartao" style="padding:0;overflow-x:auto" id="tab-res"></div>`;
  renderTabRes();
}
function renderTabRes() {
  const f = FILTROS.find(x => x[0] === UI.rFiltro)[2];
  const q = UI.busca.trim().toLowerCase();
  const rows = DB.reservas.filter(f).filter(r => !q || `${r.codigo} ${C.clienteById(DB, r.clienteId).nome} ${kitsNomes(r)}`.toLowerCase().includes(q))
    .sort((a, b) => ['concluida', 'outras', 'todas'].includes(UI.rFiltro) ? -ordData(a, b) : ordData(a, b));
  $('#tab-res').innerHTML = rows.length ? `<table class="tabela"><thead><tr><th>Nº</th><th>Festa</th><th>Cliente</th><th>Kits</th><th class="opc">Modalidade</th>${ehDona() ? '<th class="num opc">Valor</th><th class="num opc">Pago</th>' : ''}<th>Status</th></tr></thead><tbody>
    ${rows.map(r => `<tr data-abrir="${r.id}" tabindex="0"><td class="cod">${r.codigo}</td><td>${fDia(dataR(r))}<div class="sec">${r.modalidade === 'local' ? `${r.inicio} às ${r.fim}` : `retira ${fDH(C.parse(r.retirada))}`}</div></td>
    <td>${esc(C.clienteById(DB, r.clienteId).nome)}${C.disputado(DB, r) ? '<span class="tag-disputa">disputado</span>' : ''}</td><td>${esc(kitsNomes(r))}</td><td class="opc">${r.modalidade === 'local' ? 'Montagem no local' : 'Pegue e monte'}</td>
    ${ehDona() ? `<td class="num opc">${brl(r.valor)}</td><td class="num opc">${brl(r.pago)}</td>` : ''}<td>${pill(r.status)}${r.status === 'pre' ? `<div class="sec">${venceTxt(r)}</div>` : ''}</td></tr>`).join('')}</tbody></table>`
    : `<div class="vazio"><b>Nenhuma reserva aqui</b>${q ? 'Nada encontrado com essa busca.' : 'Troque o filtro ou crie uma nova reserva.'}</div>`;
}

/* ---------- kits ---------- */
function vKits() {
  sub('Unidades, tempos e uso de cada kit. A checagem de conflito usa estes números.');
  const hk = hojeKey();
  $('#view').innerHTML = `${ehDona() ? `<div class="ferramentas"><button class="btn btn-s btn-sm" data-acao="novo-kit">${ic('mais', 16)}Novo kit</button></div>` : ''}
  <div class="kits-grade">${DB.kits.map(k => {
    const fut = DB.reservas.filter(r => C.HOLD.includes(r.status) && r.kits.includes(k.id) && r.data >= hk).sort(ordData);
    return `<button class="kit-p" data-kit="${k.id}" aria-label="Editar ${esc(k.nome)}"><div class="arte">${arte(k)}</div><div class="c">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><h3>${esc(k.nome)}</h3>${k.status === 'ativo' ? '' : `<span class="disp disp-indisponivel">${k.status === 'manutencao' ? 'Em manutenção' : 'Inativo'}</span>`}</div>
      <dl><dt>Categoria</dt><dd>${C.CATEGORIAS[k.categoria]}</dd><dt>Unidades</dt><dd><span class="unid" aria-label="${k.unidades}">${'<i></i>'.repeat(k.unidades)}</span></dd>
      <dt>Montagem</dt><dd>${k.montagem ? `${k.montagem} min, desmontagem ${k.desmontagem} min` : 'Cliente monta'}</dd>${ehDona() ? `<dt>Preço</dt><dd>${brl(k.preco)}</dd>` : ''}
      <dt>Próxima</dt><dd>${fut[0] ? `${fDia(dataR(fut[0]))}, ${fut.length} ${fut.length === 1 ? 'reserva futura' : 'reservas futuras'}` : 'Sem reservas futuras'}</dd></dl></div></button>`;
  }).join('')}</div>`;
}

/* ---------- clientes ---------- */
function vClientes() {
  sub(`${DB.clientes.length} clientes. Novos clientes entram pelos pedidos da vitrine.`);
  $('#view').innerHTML = `<div class="ferramentas"><label class="busca"><span class="sr">Buscar cliente</span>${ic('busca', 18)}<input class="inp" id="cbusca" placeholder="Buscar por nome ou bairro" value="${esc(UI.cBusca)}"></label></div><div class="cartao" style="padding:0;overflow-x:auto" id="tab-cli"></div>`;
  renderTabCli();
}
function renderTabCli() {
  const q = UI.cBusca.trim().toLowerCase();
  const rows = DB.clientes.map(c => {
    const rs = DB.reservas.filter(r => r.clienteId === c.id && r.status !== 'cancelada' && r.status !== 'expirada');
    return { c, n: rs.length, tot: rs.reduce((a, r) => a + r.valor, 0), ult: rs.map(r => r.data).sort().pop() };
  }).filter(x => !q || `${x.c.nome} ${x.c.bairro}`.toLowerCase().includes(q)).sort((a, b) => (b.ult || '').localeCompare(a.ult || ''));
  $('#tab-cli').innerHTML = rows.length ? `<table class="tabela"><thead><tr><th>Nome</th><th>WhatsApp</th><th class="opc">Bairro</th><th class="num">Festas</th>${ehDona() ? '<th class="num opc">Total</th>' : ''}<th class="opc">Última festa</th></tr></thead><tbody>
    ${rows.map(x => `<tr data-cliente="${x.c.id}" tabindex="0"><td><b>${esc(x.c.nome)}</b></td><td>${esc(x.c.whats)}</td><td class="opc">${esc(x.c.bairro || '—')}</td><td class="num">${x.n}</td>${ehDona() ? `<td class="num opc">${brl(x.tot)}</td>` : ''}<td class="opc">${x.ult ? fDia(C.parse(x.ult + 'T00:00')) : '—'}</td></tr>`).join('')}</tbody></table>`
    : '<div class="vazio"><b>Nenhum cliente encontrado</b>Tente outro nome ou bairro.</div>';
}

/* ---------- regras ---------- */
const CAMPOS_REGRA = [
  ['deslocamento', 'Deslocamento', 'min', 'Tempo de ida e de volta da equipe, somado antes e depois da festa.', 0, 240],
  ['conferencia', 'Conferência e limpeza', 'min', 'Tempo para conferir e limpar um kit que voltou, antes de liberar.', 0, 480],
  ['equipes', 'Equipes de montagem', '', 'Quantas montagens dá para fazer ao mesmo tempo. Acima disso o painel avisa.', 1, 10],
  ['sinalMin', 'Sinal mínimo', '%', 'Porcentagem do valor para passar de pré-reserva a confirmada.', 0, 100],
  ['preReservaHoras', 'Prazo da pré-reserva', 'h', 'Depois desse prazo sem sinal, a pré-reserva expira e o kit é liberado.', 1, 168],
  ['taxaMontagem', 'Taxa de montagem e frete', 'R$', 'Somada ao valor sugerido de reservas com montagem no local.', 0, 2000],
];
function vRegras() {
  sub('Mudar uma regra recalcula a janela de todas as reservas.');
  UI.regrasRasc = UI.regrasRasc || { ...DB.regras };
  $('#view').innerHTML = `<div class="form-res"><form class="cartao col" id="form-regras" novalidate style="display:flex;flex-direction:column;gap:18px">
    ${CAMPOS_REGRA.map(([k, n, u, d, mi, ma]) => `<label class="campo"><span>${n}${u ? ` (${u})` : ''}</span><input class="inp" type="number" name="${k}" min="${mi}" max="${ma}" value="${UI.regrasRasc[k]}" style="max-width:180px"><small>${d}</small></label>`).join('')}
    <div id="regras-res"></div>
    <div style="display:flex;gap:10px"><button class="btn btn-p" type="submit">Salvar regras</button><button class="btn btn-g" type="button" data-acao="regras-desfazer">Desfazer mudanças</button></div>
  </form><div class="painel-check" id="regras-prev"></div></div>`;
  renderRegrasPrev();
}
function conflitosComRegras(regras) {
  const tmp = { ...DB, regras };
  return DB.reservas.filter(r => C.HOLD.includes(r.status) && r.data >= hojeKey()).filter(r => C.checarReserva(tmp, r, r.id).bloqueada);
}
function renderRegrasPrev() {
  const rg = UI.regrasRasc, k = C.kitById(DB, 'safari') || DB.kits[0];
  const draft = { modalidade: 'local', data: hojeKey(), inicio: '15:00', fim: '19:00', kits: [k.id] };
  const w = C.janela(draft, k, rg);
  const tot = (w.fim - w.ini) / 6e4;
  const cores = { montagem: '#E3B04B', festa: '#7A1E3D', desmontagem: '#E3B04B', conferencia: '#9FD3C7' };
  const nomes = { montagem: 'ida + montagem', festa: 'festa', desmontagem: 'desmontagem + volta', conferencia: 'conferência' };
  $('#regras-prev').innerHTML = `<div class="regra-prev"><b style="font-family:var(--display);font-size:20px">Como fica uma festa das 15h às 19h</b>
    <p style="color:#E9CFD6;font-size:14px;margin-top:6px">Com o ${esc(k.nome)} (montagem ${k.montagem} min, desmontagem ${k.desmontagem} min), o kit fica ocupado das <b style="color:#fff">${hm(w.ini)}</b> às <b style="color:#fff">${hm(w.fim)}</b>.</p>
    <div class="tl-mini">${w.partes.map(p => `<div style="flex:${(p.fim - p.ini) / 6e4 / tot};background:${cores[p.tipo]};${p.tipo === 'festa' ? 'color:#fff' : ''}" title="${nomes[p.tipo]}">${(p.fim - p.ini) / 6e4 / tot > .2 ? nomes[p.tipo] : ''}</div>`).join('')}</div>
    <p style="font-size:13px;color:#E9CFD6;display:flex;gap:14px;flex-wrap:wrap">${w.partes.map(p => `<span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${cores[p.tipo]};margin-right:5px"></i>${nomes[p.tipo]} ${Math.round((p.fim - p.ini) / 6e4)} min</span>`).join('')}</p><p style="font-size:13px;color:#E9CFD6;margin-top:8px">${String(Math.round(tot / 60 * 10) / 10).replace('.', ',')} horas de ocupação para 4 horas de festa.</p></div>`;
  const cf = conflitosComRegras(rg), mudou = JSON.stringify(rg) !== JSON.stringify(DB.regras);
  $('#regras-res').innerHTML = mudou && cf.length ? `<div class="caixa av"><b class="t">${cf.length} ${cf.length === 1 ? 'reserva passa' : 'reservas passam'} a conflitar com estas regras</b>
    <ul>${cf.slice(0, 5).map(r => `<li>${r.codigo}, ${esc(C.clienteById(DB, r.clienteId).nome)}, ${fDia(dataR(r))}: ${esc(kitsNomes(r))}</li>`).join('')}</ul>
    <label style="display:flex;gap:8px;margin-top:10px;font-weight:600"><input type="checkbox" id="regras-ciente" style="accent-color:var(--framboesa)"> Entendi, salvar mesmo assim e revisar essas reservas</label></div>` : '';
}

/* ===================== GAVETA ===================== */
function abrirGaveta(g) { UI.gaveta = g; renderGaveta(); }
function fecharGaveta() { const f = UI.gaveta && UI.gaveta.foco; UI.gaveta = null; renderGaveta(); if (f) { const el = document.querySelector(f); el && el.focus(); } }
function renderGaveta() {
  let host = $('#gaveta-host');
  if (!host) { host = document.createElement('div'); host.id = 'gaveta-host'; document.body.appendChild(host); }
  const g = UI.gaveta;
  if (!g) { host.innerHTML = ''; document.body.style.overflow = ''; return; }
  document.body.style.overflow = 'hidden';
  const corpo = g.tipo === 'reserva' ? gReserva(g) : g.tipo === 'form' ? gForm(g) : g.tipo === 'kit' ? gKit(g) : gCliente(g);
  host.innerHTML = `<div class="veu" data-acao="fechar"></div><aside class="gaveta ${g.tipo === 'form' ? 'larga' : ''}" role="dialog" aria-modal="true" aria-labelledby="g-tit">${corpo}</aside>`;
  if (g.tipo === 'form') atualizarCheck();
  if (!g.jaFocou) { g.jaFocou = true; const t = host.querySelector('.g-cab .fechar'); t && t.focus(); }
}
const gCab = (tit, s, extra = '') => `<div class="g-cab"><div><h2 id="g-tit">${tit}</h2>${s ? `<p class="sub">${s}</p>` : ''}${extra}</div><button class="icone-btn fechar" data-acao="fechar" aria-label="Fechar">${ic('x', 18)}</button></div>`;

function gReserva(g) {
  const r = DB.reservas.find(x => x.id === g.id);
  if (!r) return gCab('Reserva não encontrada', '') + '<div class="g-corpo"></div>';
  const cli = C.clienteById(DB, r.clienteId), d = dataR(r);
  const saldo = r.valor - r.pago, sinalMin = Math.ceil(r.valor * DB.regras.sinalMin / 100);
  let check = g.check;
  const kitsHtml = r.kits.map(id => {
    const k = C.kitById(DB, id), w = C.janela(r, k, DB.regras);
    const ck = check && check.kits.find(x => x.kitId === id);
    return `<div class="kit-ocup"><div class="mini">${arte(k)}</div><div style="flex:1"><b>${esc(k.nome)}</b><div style="font-size:14px;color:var(--uva-2)">Ocupado ${fJanela(w)}</div></div>${ck ? (ck.ok ? '<span class="disp disp-livre">Livre</span>' : '<span class="disp disp-reservado">Ocupado</span>') : ''}</div>`;
  }).join('');
  let acoes = '', painelAcao = '';
  const pa = g.painel;
  if (pa === 'sinal' || pa === 'pagamento') {
    const sug = pa === 'sinal' ? Math.max(sinalMin - r.pago, 0) || saldo : saldo;
    painelAcao = `<form class="inline-form" id="f-pag" novalidate><label class="campo"><span>${pa === 'sinal' ? 'Valor do sinal' : 'Valor recebido'} (R$)</span><input class="inp" type="number" min="1" name="valor" value="${sug}"></label>
      <button class="btn btn-p" type="submit">${pa === 'sinal' ? 'Registrar sinal' : 'Registrar pagamento'}</button><button class="btn btn-g" type="button" data-acao="painel-x">Voltar</button>
      ${pa === 'sinal' ? `<small style="width:100%;color:var(--uva-2)">Mínimo para confirmar: ${brl(sinalMin)} (${DB.regras.sinalMin}% de ${brl(r.valor)}).</small>` : ''}${g.erro ? `<p class="erro" role="alert" style="width:100%">${esc(g.erro)}</p>` : ''}</form>`;
  } else if (pa === 'cancelar') {
    painelAcao = `<form class="inline-form" id="f-cancel" novalidate><label class="campo"><span>${r.status === 'pedido' ? 'Motivo da recusa' : 'Motivo do cancelamento'}</span><input class="inp" name="motivo" placeholder="Ex.: data já tomada, cliente desistiu"></label>
      <button class="btn btn-perigo" type="submit">${r.status === 'pedido' ? 'Recusar pedido' : 'Cancelar reserva'}</button><button class="btn btn-g" type="button" data-acao="painel-x">Voltar</button>${g.erro ? `<p class="erro" role="alert" style="width:100%">${esc(g.erro)}</p>` : ''}</form>`;
  }
  if (r.status === 'pedido') acoes = `<button class="btn btn-p" data-acao="aprovar">Aprovar como pré-reserva</button><button class="btn btn-g" data-acao="editar">Editar</button><span class="esp"></span><button class="btn btn-perigo btn-sm" data-acao="p-cancelar">Recusar</button>`;
  if (r.status === 'pre') acoes = `${ehDona() ? '<button class="btn btn-p" data-acao="p-sinal">Registrar sinal</button>' : ''}<button class="btn btn-g" data-acao="editar">Editar</button><span class="esp"></span><button class="btn btn-perigo btn-sm" data-acao="p-cancelar">Cancelar</button>`;
  if (r.status === 'confirmada') acoes = `${ehDona() && saldo > 0 ? '<button class="btn btn-s" data-acao="p-pagamento">Registrar pagamento</button>' : ''}<button class="btn btn-p" data-acao="concluir">Kit devolvido e conferido</button><button class="btn btn-g" data-acao="editar">Editar</button><span class="esp"></span><button class="btn btn-perigo btn-sm" data-acao="p-cancelar">Cancelar</button>`;
  if (r.status === 'expirada') acoes = `<button class="btn btn-p" data-acao="reabrir">Reabrir como pré-reserva</button>`;
  const bloqHtml = check && check.bloqueada ? caixaConflito(check, r, true) : '';
  return gCab(`Reserva ${r.codigo}`, `${esc(cli.nome)}, ${esc(cli.whats)}`, `<div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">${pill(r.status)}${r.status === 'pre' ? `<span style="font-size:13px;color:var(--ouro-2);font-weight:600">${venceTxt(r)}</span>` : ''}${C.disputado(DB, r) ? '<span class="tag-disputa">disputado</span>' : ''}</div>`) + `
    <div class="g-corpo">
      ${bloqHtml}${painelAcao}
      <div class="bloco"><h3>Festa</h3><dl class="dl"><dt>Data</dt><dd>${cap(fDiaLongo(d))}</dd>
        ${r.modalidade === 'local' ? `<dt>Horário</dt><dd>${r.inicio} às ${r.fim}</dd><dt>Modalidade</dt><dd>Montagem no local</dd><dt>Endereço</dt><dd>${esc(r.endereco)}</dd>`
          : `<dt>Modalidade</dt><dd>Pegue e monte</dd><dt>Retirada</dt><dd>${fDH(C.parse(r.retirada))}</dd><dt>Devolução</dt><dd>${fDH(C.parse(r.devolucao))}</dd>`}
        ${r.obs ? `<dt>Observação</dt><dd>${esc(r.obs)}</dd>` : ''}${r.motivo ? `<dt>Motivo</dt><dd>${esc(r.motivo)}</dd>` : ''}</dl></div>
      <div class="bloco"><h3>Kits e janela de ocupação</h3>${kitsHtml}</div>
      ${ehDona() ? `<div class="bloco"><h3>Valores</h3><div class="dinheiro"><div><span>Total</span><b>${brl(r.valor)}</b></div><div><span>Pago</span><b>${brl(r.pago)}</b></div><div><span>Saldo</span><b>${brl(saldo)}</b></div></div></div>` : ''}
      <div class="bloco" data-copia><h3>Resumo para o WhatsApp</h3><div class="resumo-txt">${esc(resumoWhats(r))}</div><button class="btn btn-s btn-sm" data-copiar="${r.id}">Copiar resumo</button></div>
      <div class="bloco"><h3>Histórico</h3><ul class="hist">${[...r.historico].reverse().map(h => `<li>${esc(h.txt)}<span>${fDH(C.parse(h.em))}, ${esc(h.quem)}</span></li>`).join('')}</ul></div>
    </div>${acoes ? `<div class="g-pe">${acoes}</div>` : ''}`;
}
function resumoWhats(r) {
  const cli = C.clienteById(DB, r.clienteId);
  const linhas = [`Olá, ${cli.nome.split(' ')[0]}! Aqui é da ${DB.empresa.nome}.`, `Resumo da reserva ${r.codigo}:`, `Tema: ${kitsNomes(r)}`, `Data: ${fDiaLongo(dataR(r))}`];
  linhas.push(r.modalidade === 'local' ? `Festa das ${r.inicio} às ${r.fim}, com montagem no local (${r.endereco})` : `Retirada: ${fDH(C.parse(r.retirada))}. Devolução: ${fDH(C.parse(r.devolucao))}`);
  if (ehDona()) linhas.push(`Valor: ${brl(r.valor)}. Pago: ${brl(r.pago)}. Saldo: ${brl(r.valor - r.pago)}`);
  linhas.push(`Status: ${C.STATUS[r.status].nome}`);
  if (r.status === 'pre') linhas.push(`Para confirmar, o sinal é de ${brl(Math.ceil(r.valor * DB.regras.sinalMin / 100))}.`);
  return linhas.join('\n');
}
function caixaConflito(check, draft, comTroca) {
  const ruins = check.kits.filter(k => !k.ok);
  return `<div class="caixa bloq" role="alert"><b class="t">${ruins.length === 1 ? `${esc(ruins[0].kit.nome)} não está livre nesse horário` : `${ruins.length} kits não estão livres nesse horário`}</b>
    ${ruins.map(k => {
      if (k.motivo === 'status') return `<p>${esc(k.kit.nome)} está ${k.kit.status === 'manutencao' ? 'em manutenção' : 'inativo'} e não aceita reservas novas.</p>`;
      const sug = C.sugestoes(DB, draft, k.kitId, draft.id);
      let cedo = '';
      if (k.livreEm && draft.modalidade === 'local') {
        const minIni = C.addMin(k.livreEm, DB.regras.deslocamento + k.kit.montagem);
        cedo = ` Uma unidade fica livre às ${hm(k.livreEm)} de ${fDia(k.livreEm)}; uma festa a partir das ${hm(minIni)} caberia.`;
      } else if (k.livreEm) cedo = ` Uma unidade fica livre às ${hm(k.livreEm)} de ${fDia(k.livreEm)}.`;
      return `<p style="margin-top:6px">As ${k.kit.unidades} ${k.kit.unidades === 1 ? 'unidade está' : 'unidades estão'} em uso:</p>
        <ul>${k.conflitos.map(h => `<li>Reserva ${h.r.codigo}, ${esc(C.clienteById(DB, h.r.clienteId).nome)}: ${fDH(h.w.ini)} a ${hm(h.w.fim)}</li>`).join('')}</ul>
        <p style="margin-top:6px">${cedo}</p>
        ${sug.length ? `<div class="sugs">${sug.map(s => `<button type="button" data-trocar="${k.kitId}:${s.id}">Trocar por ${esc(s.nome)} (livre)</button>`).join('')}</div>` : '<p style="margin-top:6px">Nenhum kit da mesma categoria está livre nesse horário.</p>'}`;
    }).join('')}</div>`;
}
function acaoReserva(acao) {
  const g = UI.gaveta, r = DB.reservas.find(x => x.id === g.id);
  const quem = `${S.nome} (${S.papel.toLowerCase()})`, em = C.toLocal(agora());
  const ok = (txt, t) => { r.historico.push({ em, quem, txt }); persist(); g.painel = null; g.erro = ''; g.check = null; toast(t); render(); };
  if (acao === 'aprovar' || acao === 'reabrir') {
    const ck = C.checarReserva(DB, r, r.id);
    if (ck.bloqueada) { g.check = ck; renderGaveta(); return; }
    r.status = 'pre'; r.preDesde = em;
    ok(acao === 'aprovar' ? 'Aprovado como pré-reserva' : 'Reaberta como pré-reserva', `Pré-reserva ${r.codigo} criada. Vence em ${DB.regras.preReservaHoras} h.`);
    if (ck.avisos.length) toast(ck.avisos[0].texto);
  }
  if (acao === 'concluir') { r.status = 'concluida'; ok('Kit devolvido e conferido', `Reserva ${r.codigo} concluída`); }
}

/* ---------- formulário de reserva ---------- */
function novoForm(p = {}) {
  const data = p.data || C.dayKey(C.addDays(agora(), 3));
  return { id: null, clienteId: '', novoCliente: false, nome: '', whats: '', modalidade: 'local', data, inicio: '15:00', fim: '19:00',
    retData: C.dayKey(C.addDays(C.parse(data + 'T00:00'), -1)), retHora: '17:00', devData: C.dayKey(C.addDays(C.parse(data + 'T00:00'), 1)), devHora: '12:00',
    endereco: '', kits: [], valor: null, valorManual: false, status: 'pre', sinal: '', obs: '', erro: '' };
}
function formDeReserva(r) {
  const f = novoForm({ data: r.data });
  Object.assign(f, { id: r.id, clienteId: r.clienteId, modalidade: r.modalidade, inicio: r.inicio, fim: r.fim, endereco: r.endereco === 'Retirada no ateliê' ? '' : r.endereco, kits: [...r.kits], valor: r.valor, valorManual: true, status: r.status, obs: r.obs });
  if (r.modalidade === 'retirada') { [f.retData, f.retHora] = r.retirada.split('T'); [f.devData, f.devHora] = r.devolucao.split('T'); }
  return f;
}
function draftDoForm(f) {
  const d = { id: f.id, kits: f.kits, modalidade: f.modalidade, data: f.data, inicio: f.inicio, fim: f.fim };
  if (f.modalidade === 'retirada') { d.retirada = `${f.retData}T${f.retHora}`; d.devolucao = `${f.devData}T${f.devHora}`; }
  return d;
}
function gForm(g) {
  const f = g.f, ed = !!f.id;
  const r = ed ? DB.reservas.find(x => x.id === f.id) : null;
  const clientes = [...DB.clientes].sort((a, b) => a.nome.localeCompare(b.nome));
  const stOpts = ed ? [[r.status, C.STATUS[r.status].nome]] : [['pedido', 'Pedido (não segura o kit)'], ['pre', `Pré-reserva (segura por ${DB.regras.preReservaHoras} h)`], ...(ehDona() ? [['confirmada', 'Confirmada (com sinal)']] : [])];
  return gCab(ed ? `Editar reserva ${r.codigo}` : 'Nova reserva', 'A disponibilidade dos kits é checada a cada mudança.') + `
    <form class="g-corpo" id="form-res" novalidate><div class="form-res">
      <div class="col">
        <div class="campo"><span>Cliente</span>
          ${f.novoCliente ? `<div class="cliente-novo"><div class="grade2"><label class="campo"><span>Nome</span><input class="inp" name="nome" value="${esc(f.nome)}"></label><label class="campo"><span>WhatsApp</span><input class="inp" name="whats" inputmode="tel" value="${esc(f.whats)}" placeholder="(00) 90000-0000"></label></div><button type="button" class="btn btn-g btn-sm" data-acao="cli-existente" style="align-self:flex-start">Escolher cliente cadastrado</button></div>`
            : `<div style="display:flex;gap:8px"><select class="inp" name="clienteId" aria-label="Cliente"><option value="">Escolha o cliente</option>${clientes.map(c => `<option value="${c.id}" ${c.id === f.clienteId ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>${ed ? '' : '<button type="button" class="btn btn-s btn-sm" data-acao="cli-novo">Novo</button>'}</div>`}
        </div>
        <div class="campo"><span>Modalidade</span><div class="seg" role="group" aria-label="Modalidade"><button type="button" aria-pressed="${f.modalidade === 'local'}" data-fmod="local">Montagem no local</button><button type="button" aria-pressed="${f.modalidade === 'retirada'}" data-fmod="retirada">Pegue e monte</button></div></div>
        ${f.modalidade === 'local'
          ? `<div class="grade3"><label class="campo"><span>Data da festa</span><input class="inp" type="date" name="data" value="${f.data}"></label><label class="campo"><span>Começa</span><input class="inp" type="time" name="inicio" value="${f.inicio}" step="900"></label><label class="campo"><span>Termina</span><input class="inp" type="time" name="fim" value="${f.fim}" step="900"></label></div>
             <label class="campo"><span>Endereço da festa</span><input class="inp" name="endereco" value="${esc(f.endereco)}" placeholder="Rua, número, bairro"></label>`
          : `<label class="campo"><span>Data da festa</span><input class="inp" type="date" name="data" value="${f.data}" style="max-width:220px"></label>
             <div class="grade2"><div class="campo"><span>Retirada</span><div style="display:flex;gap:6px"><input class="inp" type="date" name="retData" value="${f.retData}" aria-label="Data da retirada"><input class="inp" type="time" name="retHora" value="${f.retHora}" step="900" aria-label="Hora da retirada" style="max-width:120px"></div></div>
             <div class="campo"><span>Devolução</span><div style="display:flex;gap:6px"><input class="inp" type="date" name="devData" value="${f.devData}" aria-label="Data da devolução"><input class="inp" type="time" name="devHora" value="${f.devHora}" step="900" aria-label="Hora da devolução" style="max-width:120px"></div></div></div>`}
        <div class="campo"><span>Kits</span><div class="sel-kits" id="sel-kits"></div></div>
        <label class="campo"><span>Observações</span><textarea class="inp" name="obs">${esc(f.obs)}</textarea></label>
      </div>
      <div class="col painel-check">
        <div id="check-area"></div>
        <label class="campo"><span>Status</span><select class="inp" name="status" ${ed ? 'disabled' : ''}>${stOpts.map(([k, n]) => `<option value="${k}" ${k === f.status ? 'selected' : ''}>${n}</option>`).join('')}</select>${ed ? '<small>Para mudar o status, use as ações da reserva.</small>' : ''}</label>
        ${ehDona() ? `<div class="grade2"><label class="campo"><span>Valor total (R$)</span><input class="inp" type="number" min="0" name="valor" id="f-valor" value="${f.valor ?? ''}"><small id="valor-sug"></small></label>
          ${f.status === 'confirmada' && !ed ? `<label class="campo"><span>Sinal recebido (R$)</span><input class="inp" type="number" min="0" name="sinal" value="${esc(f.sinal)}"><small>Mínimo ${DB.regras.sinalMin}%</small></label>` : ''}</div>` : ''}
        <p class="erro" id="f-erro" role="alert">${esc(f.erro)}</p>
      </div>
    </div></form>
    <div class="g-pe"><button class="btn btn-p" data-acao="salvar-form" id="btn-salvar">${ed ? 'Salvar alterações' : 'Salvar reserva'}</button><button class="btn btn-g" data-acao="fechar">Cancelar</button><span class="esp"></span><span id="pe-msg" style="font-size:14px;color:var(--uva-2)"></span></div>`;
}
function lerForm() {
  const fm = $('#form-res'); if (!fm) return;
  const f = UI.gaveta.f, fd = new FormData(fm);
  ['clienteId', 'nome', 'whats', 'data', 'inicio', 'fim', 'endereco', 'retData', 'retHora', 'devData', 'devHora', 'obs', 'status', 'sinal'].forEach(k => { if (fd.has(k)) f[k] = fd.get(k); });
  if (fd.has('valor')) { const v = fd.get('valor'); if (v !== '' && Number(v) !== f.valorAuto) { f.valor = Number(v); f.valorManual = true; } }
}
function atualizarCheck() {
  const g = UI.gaveta; if (!g || g.tipo !== 'form') return;
  const f = g.f, d = draftDoForm(f);
  const dataOk = f.data && (f.modalidade === 'local' ? f.inicio && f.fim : f.retData && f.devData && `${f.retData}T${f.retHora}` < `${f.devData}T${f.devHora}`);
  $('#sel-kits').innerHTML = DB.kits.filter(k => k.status !== 'inativo').map(k => {
    let est = '', cls = '';
    if (k.status !== 'ativo') { est = 'Em manutenção'; cls = 'manut'; }
    else if (dataOk) {
      const ck = C.checarKit(DB, { ...d, kits: [k.id] }, k.id, f.id);
      est = ck.ok ? `Livre, ${k.unidades - ck.usadas} de ${k.unidades}` : 'Ocupado nesse horário'; cls = ck.ok ? 'livre' : 'ocup';
    }
    return `<button type="button" class="sel-kit" aria-pressed="${f.kits.includes(k.id)}" data-fkit="${k.id}" ${k.status !== 'ativo' && !f.kits.includes(k.id) ? 'disabled' : ''}><span class="mini">${arte(k)}</span><span><span class="n">${esc(k.nome)}</span><br><span class="e ${cls}">${est}</span></span></button>`;
  }).join('');
  const area = $('#check-area'), btn = $('#btn-salvar'), msg = $('#pe-msg');
  const sug = f.kits.length ? C.valorSugerido(DB, d) : 0;
  f.valorAuto = sug;
  if (!f.valorManual) { f.valor = sug || null; const vi = $('#f-valor'); if (vi) vi.value = sug || ''; }
  const vs = $('#valor-sug'); if (vs) vs.textContent = sug ? `Sugerido: ${brl(sug)}${f.modalidade === 'local' ? ', com taxa de montagem' : ''}` : '';
  if (!dataOk) { area.innerHTML = '<div class="caixa av"><b class="t">Complete data e horários</b>A checagem dos kits aparece aqui.</div>'; btn.disabled = false; msg.textContent = ''; return; }
  if (!f.kits.length) { area.innerHTML = '<div class="caixa av"><b class="t">Escolha os kits</b>Cada kit mostra quantas unidades estão livres nesse horário.</div>'; btn.disabled = false; msg.textContent = ''; return; }
  const ck = C.checarReserva(DB, d, f.id);
  g.check = ck;
  const segura = f.status !== 'pedido';
  let html = ck.bloqueada ? caixaConflito(ck, d, true)
    : `<div class="caixa ok"><b class="t">Tudo livre</b><div class="janela-lista">${ck.kits.map(k => `<span>${esc(k.kit.nome)}: ocupado ${fJanela(k.w)}</span>`).join('')}</div></div>`;
  if (ck.avisos.length) html += `<div class="caixa av"><b class="t">Atenção</b><ul>${ck.avisos.map(a => `<li>${esc(a.texto)}</li>`).join('')}</ul></div>`;
  area.innerHTML = html;
  btn.disabled = ck.bloqueada && segura;
  msg.textContent = ck.bloqueada && segura ? 'Troque o kit, mude o horário ou salve como Pedido.' : '';
}
function salvarForm() {
  lerForm();
  const g = UI.gaveta, f = g.f, ed = !!f.id;
  const err = t => { f.erro = t; const el = $('#f-erro'); if (el) el.textContent = t; };
  let cliId = f.clienteId;
  if (f.novoCliente) {
    if (f.nome.trim().length < 2) return err('Escreva o nome do cliente.');
    if (f.whats.replace(/\D/g, '').length < 10) return err('Escreva o WhatsApp do cliente com DDD.');
  } else if (!cliId) return err('Escolha o cliente.');
  if (!f.data) return err('Escolha a data da festa.');
  if (f.modalidade === 'local' && f.inicio === f.fim) return err('O horário de término precisa ser depois do início.');
  if (f.modalidade === 'retirada' && `${f.retData}T${f.retHora}` >= `${f.devData}T${f.devHora}`) return err('A devolução precisa ser depois da retirada.');
  if (!f.kits.length) return err('Escolha pelo menos um kit.');
  const d = draftDoForm(f), ck = C.checarReserva(DB, d, f.id);
  const status = ed ? DB.reservas.find(x => x.id === f.id).status : f.status;
  if (ck.bloqueada && status !== 'pedido') return err('Algum kit não está livre nesse horário.');
  const valor = ehDona() ? Number(f.valor || 0) : C.valorSugerido(DB, d);
  if (ehDona() && !(valor > 0)) return err('Informe o valor total.');
  const sinal = Number(f.sinal || 0);
  if (!ed && status === 'confirmada' && sinal < Math.ceil(valor * DB.regras.sinalMin / 100)) return err(`O sinal mínimo é ${brl(Math.ceil(valor * DB.regras.sinalMin / 100))}.`);
  if (f.novoCliente) { const c = { id: 'c' + Date.now(), nome: f.nome.trim(), whats: f.whats.trim(), email: '', bairro: '' }; DB.clientes.push(c); cliId = c.id; }
  const quem = `${S.nome} (${S.papel.toLowerCase()})`, em = C.toLocal(agora());
  const campos = { clienteId: cliId, kits: [...f.kits], modalidade: f.modalidade, data: f.data, inicio: f.inicio, fim: f.fim, obs: f.obs.trim(),
    endereco: f.modalidade === 'local' ? (f.endereco.trim() || 'Endereço a confirmar') : 'Retirada no ateliê' };
  if (f.modalidade === 'retirada') { campos.retirada = d.retirada; campos.devolucao = d.devolucao; }
  let r;
  if (ed) {
    r = DB.reservas.find(x => x.id === f.id);
    Object.assign(r, campos); if (ehDona()) r.valor = valor;
    r.historico.push({ em, quem, txt: 'Reserva editada' });
  } else {
    r = novaReservaBase({ ...campos, status, bairro: C.clienteById(DB, cliId).bairro || '' });
    r.valor = valor;
    r.historico.push({ em, quem, txt: 'Reserva criada no painel' });
    if (status !== 'pedido') { r.preDesde = em; r.historico.push({ em, quem, txt: 'Pré-reserva aberta' }); }
    if (status === 'confirmada') { r.pago = sinal; r.historico.push({ em, quem, txt: `Sinal registrado: ${brl(sinal)}` }); }
    DB.reservas.push(r);
  }
  persist();
  toast(ed ? `Reserva ${r.codigo} salva` : `Reserva ${r.codigo} criada`);
  UI.gaveta = { tipo: 'reserva', id: r.id };
  render();
}

/* ---------- kit ---------- */
function gKit(g) {
  const k = g.novo ? g.k : C.kitById(DB, g.id), dona = ehDona();
  const v = g.rasc || (g.rasc = { ...k });
  return gCab(g.novo ? 'Novo kit' : esc(k.nome), g.novo ? 'Cadastre as unidades e os tempos; a agenda passa a usar o kit na hora.' : C.CATEGORIAS[k.categoria]) + `
    <form class="g-corpo" id="form-kit" novalidate>
      <div style="border-radius:var(--r-m);overflow:hidden;height:160px">${arte(v)}</div>
      ${dona ? `<label class="campo"><span>Nome</span><input class="inp" name="nome" value="${esc(v.nome)}"></label>
      <div class="grade2"><label class="campo"><span>Categoria</span><select class="inp" name="categoria">${Object.entries(C.CATEGORIAS).map(([c, n]) => `<option value="${c}" ${c === v.categoria ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="campo"><span>Status</span><select class="inp" name="status"><option value="ativo" ${v.status === 'ativo' ? 'selected' : ''}>Ativo</option><option value="manutencao" ${v.status === 'manutencao' ? 'selected' : ''}>Em manutenção</option><option value="inativo" ${v.status === 'inativo' ? 'selected' : ''}>Inativo</option></select></label></div>
      <div class="grade2"><label class="campo"><span>Unidades</span><input class="inp" type="number" min="1" max="20" name="unidades" value="${v.unidades}"><small>Quantas festas o kit atende ao mesmo tempo.</small></label>
      <label class="campo"><span>Preço base (R$)</span><input class="inp" type="number" min="0" name="preco" value="${v.preco}"></label></div>
      <div class="grade2"><label class="campo"><span>Montagem (min)</span><input class="inp" type="number" min="0" name="montagem" value="${v.montagem}"></label>
      <label class="campo"><span>Desmontagem (min)</span><input class="inp" type="number" min="0" name="desmontagem" value="${v.desmontagem}"></label></div>
      <label class="campo"><span>O que vem no kit</span><textarea class="inp" name="itens">${esc(v.itens)}</textarea></label>
      <p class="erro" role="alert" id="k-erro">${esc(g.erro || '')}</p>`
      : `<dl class="dl"><dt>Unidades</dt><dd>${k.unidades}</dd><dt>Montagem</dt><dd>${k.montagem} min</dd><dt>Desmontagem</dt><dd>${k.desmontagem} min</dd><dt>Itens</dt><dd>${esc(k.itens)}</dd></dl><p style="color:var(--uva-2);font-size:14px">Só a dona edita kits.</p>`}
    </form>${dona ? `<div class="g-pe"><button class="btn btn-p" data-acao="salvar-kit">${g.novo ? 'Cadastrar kit' : 'Salvar kit'}</button><button class="btn btn-g" data-acao="fechar">Cancelar</button></div>` : ''}`;
}
function salvarKit() {
  const g = UI.gaveta, fm = $('#form-kit'), fd = new FormData(fm);
  const v = { ...g.rasc, nome: fd.get('nome').trim(), categoria: fd.get('categoria'), status: fd.get('status'), unidades: Number(fd.get('unidades')), preco: Number(fd.get('preco')), montagem: Number(fd.get('montagem')), desmontagem: Number(fd.get('desmontagem')), itens: fd.get('itens').trim() };
  const err = t => { g.rasc = v; g.erro = t; renderGaveta(); };
  if (v.nome.length < 2) return err('Dê um nome ao kit.');
  if (!(v.unidades >= 1)) return err('O kit precisa de pelo menos 1 unidade.');
  if (!(v.preco >= 0) || !(v.montagem >= 0) || !(v.desmontagem >= 0)) return err('Preço e tempos não podem ser negativos.');
  if (!g.novo) {
    const tmp = { ...DB, kits: DB.kits.map(k => k.id === g.id ? { ...k, ...v, status: 'ativo' } : k) };
    const hk = hojeKey();
    const fut = DB.reservas.filter(r => C.HOLD.includes(r.status) && r.kits.includes(g.id) && r.data >= hk);
    const choque = fut.find(r => !C.checarKit(tmp, r, g.id, r.id).ok);
    if (choque) return err(`Com ${v.unidades} ${v.unidades === 1 ? 'unidade' : 'unidades'} e esses tempos, a reserva ${choque.codigo} (${fDia(dataR(choque))}) fica sem kit. Ajuste a agenda antes.`);
    Object.assign(C.kitById(DB, g.id), v);
    if (v.status !== 'ativo' && fut.length) toast(`Kit salvo. As ${fut.length} reservas futuras continuam valendo.`); else toast('Kit salvo');
  } else {
    v.id = 'k' + Date.now().toString(36); DB.kits.push(v); toast('Kit cadastrado');
  }
  persist(); UI.gaveta = null; render();
}
const PALETAS = [['#FDEFF4', '#F497B6', '#9ED9CF', '#F6D36B'], ['#E3E4F4', '#33357A', '#F4B942', '#8C8FD6'], ['#E8F1DC', '#5C9A4E', '#E79A3C', '#3D6B35'], ['#F3ECE3', '#C9A27E', '#8A6F5A', '#E4D3BF']];

/* ---------- cliente ---------- */
function gCliente(g) {
  const c = C.clienteById(DB, g.id);
  const rs = DB.reservas.filter(r => r.clienteId === c.id).sort((a, b) => -ordData(a, b));
  return gCab(esc(c.nome), `${esc(c.whats)}${c.bairro ? `, ${esc(c.bairro)}` : ''}`) + `<div class="g-corpo">
    <dl class="dl"><dt>E-mail</dt><dd>${esc(c.email || '—')}</dd><dt>Festas</dt><dd>${rs.filter(r => !['cancelada', 'expirada'].includes(r.status)).length}</dd>${ehDona() ? `<dt>Total</dt><dd>${brl(rs.filter(r => !['cancelada', 'expirada'].includes(r.status)).reduce((a, r) => a + r.valor, 0))}</dd>` : ''}</dl>
    <div class="bloco"><h3>Reservas</h3><div class="lista-festas">${rs.map(linhaFesta).join('') || '<p>Nenhuma reserva.</p>'}</div></div></div>
    <div class="g-pe"><button class="btn btn-p" data-acao="nova" data-cli="${c.id}">Nova reserva para ${esc(c.nome.split(' ')[0])}</button></div>`;
}

/* ===================== EVENTOS ===================== */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-acao],[data-vdia],[data-vcat],[data-quero],[data-rolar],[data-orcmod],[data-abrir],[data-dia],[data-mes],[data-rfiltro],[data-kit],[data-cliente],[data-fmod],[data-fkit],[data-trocar],[data-copiar],[data-irdia],[data-filtro]');
  if (!t) return;
  const ds = t.dataset;
  if (ds.filtro) { UI.rFiltro = ds.filtro; return; }
  if (ds.vdia) {
    UI.vDia = ds.vdia; renderVaral(); renderResumoDia(); renderCatalogo();
    if (UI.orcForm) { lerOrcForm(); UI.orcForm.data = ds.vdia; renderOrc(); }
    if (ds.rolarTopo) $('#varal').scrollIntoView({ behavior: 'smooth' });
    const b = document.querySelector(`.band[data-vdia="${ds.vdia}"]`); b && !ds.rolarTopo && b.focus();
    return;
  }
  if (ds.vcat) { UI.vCat = ds.vcat; renderCatalogo(); return; }
  if (ds.rolar) { e.preventDefault(); const el = document.getElementById(ds.rolar); el && el.scrollIntoView({ behavior: 'smooth' }); return; }
  if (ds.quero) {
    lerOrcForm(); UI.orcOk = null;
    const f = UI.orcForm || (renderOrc(), UI.orcForm);
    f.data = UI.vDia; if (!f.kits.includes(ds.quero)) f.kits.push(ds.quero);
    if (C.kitById(DB, ds.quero).categoria === 'pegue' && f.kits.every(id => C.kitById(DB, id).categoria === 'pegue')) f.modalidade = 'retirada';
    else f.modalidade = 'local';
    renderOrc(); $('#orcamento').scrollIntoView({ behavior: 'smooth' }); return;
  }
  if (ds.orcmod) { lerOrcForm(); UI.orcForm.modalidade = ds.orcmod; if (ds.orcmod === 'retirada') UI.orcForm.kits = UI.orcForm.kits.filter(id => C.kitById(DB, id).categoria === 'pegue'); renderOrc(); return; }
  if (ds.copiar) { const r = DB.reservas.find(x => x.id === ds.copiar); copiar(ds.tipo === 'cliente' ? resumoPedidoCliente(r) : resumoWhats(r), t); return; }
  if (ds.abrir) { abrirGaveta({ tipo: 'reserva', id: ds.abrir, foco: `[data-abrir="${ds.abrir}"]` }); return; }
  if (ds.dia) { UI.dia = ds.dia; if (ds.dia.slice(0, 7) !== UI.mes) UI.mes = ds.dia.slice(0, 7); renderCal(); renderDia(); return; }
  if (ds.irdia) { UI.dia = ds.irdia; UI.mes = ds.irdia.slice(0, 7); ir('agenda'); return; }
  if (ds.mes) { const [y, m] = UI.mes.split('-').map(Number); const d = new Date(y, m - 1 + Number(ds.mes), 1); UI.mes = `${d.getFullYear()}-${C.pad(d.getMonth() + 1)}`; renderCal(); return; }
  if (ds.rfiltro) { UI.rFiltro = ds.rfiltro; vReservas(); return; }
  if (ds.kit) { abrirGaveta({ tipo: 'kit', id: ds.kit, foco: `[data-kit="${ds.kit}"]` }); return; }
  if (ds.cliente) { abrirGaveta({ tipo: 'cliente', id: ds.cliente }); return; }
  if (ds.fmod) { lerForm(); UI.gaveta.f.modalidade = ds.fmod; renderGaveta(); return; }
  if (ds.fkit) { lerForm(); const f = UI.gaveta.f; f.kits = f.kits.includes(ds.fkit) ? f.kits.filter(x => x !== ds.fkit) : [...f.kits, ds.fkit]; atualizarCheck(); return; }
  if (ds.trocar) {
    const [de, para] = ds.trocar.split(':');
    const g = UI.gaveta;
    if (g.tipo === 'form') { lerForm(); g.f.kits = g.f.kits.map(x => x === de ? para : x); atualizarCheck(); toast(`Trocado por ${C.kitById(DB, para).nome}`); return; }
    const r = DB.reservas.find(x => x.id === g.id);
    r.kits = r.kits.map(x => x === de ? para : x); r.valor = C.valorSugerido(DB, r);
    r.historico.push({ em: C.toLocal(agora()), quem: `${S.nome} (${S.papel.toLowerCase()})`, txt: `Kit trocado: ${C.kitById(DB, de).nome} por ${C.kitById(DB, para).nome}` });
    persist(); g.check = C.checarReserva(DB, r, r.id); if (!g.check.bloqueada) g.check = null;
    toast(`Trocado por ${C.kitById(DB, para).nome}`); render(); return;
  }
  const a = ds.acao;
  if (a === 'demo') { entrarDemo(); return; }
  if (a === 'ver-pedido') { entrarDemo(ds.id); return; }
  if (a === 'novo-orc') { UI.orcOk = null; renderOrc(); return; }
  if (a === 'sair') { sair(); return; }
  if (a === 'restaurar') { DB = C.seed(agora()); C.varrer(DB, agora()); persist(); UI.regrasRasc = null; toast('Dados restaurados'); render(); return; }
  if (a === 'fechar') { fecharGaveta(); return; }
  if (a === 'nova') { const f = novoForm({ data: ds.data }); if (ds.cli) f.clienteId = ds.cli; abrirGaveta({ tipo: 'form', f }); return; }
  if (a === 'cli-novo') { lerForm(); UI.gaveta.f.novoCliente = true; renderGaveta(); return; }
  if (a === 'cli-existente') { lerForm(); UI.gaveta.f.novoCliente = false; renderGaveta(); return; }
  if (a === 'salvar-form') { salvarForm(); return; }
  if (a === 'editar') { const r = DB.reservas.find(x => x.id === UI.gaveta.id); abrirGaveta({ tipo: 'form', f: formDeReserva(r) }); return; }
  if (a === 'aprovar' || a === 'reabrir' || a === 'concluir') { acaoReserva(a); return; }
  if (a === 'p-sinal') { UI.gaveta.painel = 'sinal'; UI.gaveta.erro = ''; renderGaveta(); return; }
  if (a === 'p-pagamento') { UI.gaveta.painel = 'pagamento'; UI.gaveta.erro = ''; renderGaveta(); return; }
  if (a === 'p-cancelar') { UI.gaveta.painel = 'cancelar'; UI.gaveta.erro = ''; renderGaveta(); return; }
  if (a === 'painel-x') { UI.gaveta.painel = null; renderGaveta(); return; }
  if (a === 'salvar-kit') { salvarKit(); return; }
  if (a === 'novo-kit') { abrirGaveta({ tipo: 'kit', novo: true, k: { nome: '', categoria: 'pegue', unidades: 1, preco: 250, montagem: 0, desmontagem: 0, status: 'ativo', itens: '', pal: PALETAS[DB.kits.length % PALETAS.length] } }); return; }
  if (a === 'regras-desfazer') { UI.regrasRasc = { ...DB.regras }; vRegras(); return; }
});

document.addEventListener('submit', e => {
  e.preventDefault();
  const id = e.target.id;
  if (id === 'orc-form') enviarOrc();
  if (id === 'login-form') { const fd = new FormData(e.target); entrar(fd.get('email'), fd.get('senha')); }
  if (id === 'form-res') salvarForm();
  if (id === 'f-pag') {
    const g = UI.gaveta, r = DB.reservas.find(x => x.id === g.id), v = Number(new FormData(e.target).get('valor'));
    const saldo = r.valor - r.pago, min = Math.ceil(r.valor * DB.regras.sinalMin / 100);
    if (!(v > 0)) { g.erro = 'Informe um valor maior que zero.'; renderGaveta(); return; }
    if (v > saldo) { g.erro = `O valor passa do saldo de ${brl(saldo)}.`; renderGaveta(); return; }
    if (g.painel === 'sinal' && r.pago + v < min) { g.erro = `Para confirmar, o sinal precisa somar pelo menos ${brl(min)}.`; renderGaveta(); return; }
    const em = C.toLocal(agora()), quem = `${S.nome} (${S.papel.toLowerCase()})`;
    r.pago += v;
    if (g.painel === 'sinal') { r.status = 'confirmada'; r.historico.push({ em, quem, txt: `Sinal registrado: ${brl(v)}` }); toast(`Sinal registrado. Reserva ${r.codigo} confirmada.`); }
    else { r.historico.push({ em, quem, txt: `Pagamento registrado: ${brl(v)}` }); toast('Pagamento registrado'); }
    persist(); g.painel = null; g.erro = ''; render();
  }
  if (id === 'f-cancel') {
    const g = UI.gaveta, r = DB.reservas.find(x => x.id === g.id), m = new FormData(e.target).get('motivo').trim();
    if (m.length < 3) { g.erro = 'Escreva o motivo, ele fica no histórico.'; renderGaveta(); return; }
    const era = r.status;
    r.status = 'cancelada'; r.motivo = m;
    r.historico.push({ em: C.toLocal(agora()), quem: `${S.nome} (${S.papel.toLowerCase()})`, txt: `${era === 'pedido' ? 'Pedido recusado' : 'Cancelada'}: ${m}` });
    persist(); g.painel = null; g.erro = ''; toast(era === 'pedido' ? 'Pedido recusado' : `Reserva ${r.codigo} cancelada. O kit foi liberado.`); render();
  }
  if (id === 'form-regras') {
    const rg = UI.regrasRasc;
    for (const [k, n, , , mi, ma] of CAMPOS_REGRA) if (!(rg[k] >= mi && rg[k] <= ma)) { toast(`${n}: use um valor entre ${mi} e ${ma}`); return; }
    const cf = conflitosComRegras(rg);
    if (cf.length && !($('#regras-ciente') || {}).checked) { toast('Marque a confirmação para salvar com conflitos'); return; }
    DB.regras = { ...rg }; persist(); toast('Regras salvas'); vRegras();
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'busca') { UI.busca = t.value; renderTabRes(); return; }
  if (t.id === 'cbusca') { UI.cBusca = t.value; renderTabCli(); return; }
  if (t.closest('#form-res')) { lerForm(); if (['data', 'inicio', 'fim', 'retData', 'retHora', 'devData', 'devHora', 'valor'].includes(t.name)) {
    const f = UI.gaveta.f;
    if (t.name === 'data' && f.modalidade === 'retirada') { const d = C.parse(f.data + 'T00:00'); f.retData = C.dayKey(C.addDays(d, -1)); f.devData = C.dayKey(C.addDays(d, 1)); const a = $('[name=retData]'), b = $('[name=devData]'); a && (a.value = f.retData); b && (b.value = f.devData); }
    atualizarCheck(); } return; }
  if (t.closest('#form-regras')) { UI.regrasRasc[t.name] = Number(t.value); renderRegrasPrev(); return; }
  if (t.id === 'v-outra' && t.value && t.value >= hojeKey()) { UI.vDia = t.value; renderVaral(); renderCatalogo(); const r = $('#resumo-dia h2'); renderResumoDia(); return; }
  if (t.closest('#orc-form') && t.name === 'data') { lerOrcForm(); renderOrcKits(); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'todos-kits') { UI.todosKits = t.checked; renderDia(); }
  if (t.closest('#form-res') && t.name === 'status') { lerForm(); renderGaveta(); }
  if (t.closest('#form-res') && t.name === 'clienteId') lerForm();
  if (t.closest('#orc-form') && t.type === 'checkbox') lerOrcForm();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && UI.gaveta) fecharGaveta();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-abrir],tr[data-cliente]')) { e.preventDefault(); e.target.click(); }
  if (e.key === 'Tab' && UI.gaveta) {
    const g = $('.gaveta'); if (!g) return;
    const f = [...g.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,a[href]')];
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});
// KPI que filtra
document.addEventListener('click', e => { const k = e.target.closest('a[data-filtro]'); if (k) UI.rFiltro = k.dataset.filtro; }, true);
setInterval(() => { const antes = DB.reservas.filter(r => r.status === 'pre').length; C.varrer(DB, agora()); if (DB.reservas.filter(r => r.status === 'pre').length !== antes) { persist(); if (!UI.gaveta) render(); } }, 60000);

render();
})();
