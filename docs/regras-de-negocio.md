# Ornata — Regras de negócio (v0.1)

11 de novembro de 2026. Versão editável: documento "Ornata — Regras de negócio (v0.1)" no claude.ai.

## Visão do produto

Ornata é uma vitrine online + agenda de gestão para decoradoras de festas que nunca deixa o mesmo kit ser reservado duas vezes no mesmo horário. O nome é provisório.

- **Problema:** a agenda vive no caderno e no WhatsApp. O mesmo kit (ex.: "Safari") é prometido para duas festas no mesmo sábado, ou volta da festa da manhã sem tempo de ser conferido para a da tarde.
- **Para quem:** pequenas empreendedoras de decoração, pegue e monte e ornamentação, com 1 a 5 pessoas e 10 a 80 kits.
- **Como resolve:** cada kit tem um estoque (quantas unidades existem) e cada reserva ocupa o kit por uma janela que inclui montagem, festa, desmontagem e conferência. O sistema bloqueia a reserva quando não há unidade livre e sugere alternativas.
- **O protótipo mostra:** a vitrine de uma decoradora fictícia ("Bendita Festa") com consulta de data e pedido de orçamento, e o painel onde esse pedido vira reserva sem conflito. Todos os dados são fictícios.

## Entidades e cadastros

O MVP tem cinco cadastros; tudo pertence a uma empresa (a decoradora), e uma empresa nunca vê dados de outra.

| Entidade | Campos principais | Regras |
| --- | --- | --- |
| Empresa | nome, WhatsApp, cidade, logo, cores, regras de operação | Cada empresa tem sua vitrine pública e seu painel |
| Usuário | nome, e-mail, perfil | Perfis: **Dona** (tudo, inclusive valores e regras) e **Equipe** (agenda e reservas, sem financeiro nem regras) |
| Cliente | nome, WhatsApp, e-mail, bairro, observações | WhatsApp é obrigatório e único por empresa; o cliente nasce no primeiro pedido de orçamento |
| Kit | nome, tema, categoria, unidades, preço base, tempo de montagem e desmontagem, fotos, status | Categorias: Pegue e monte, Mesa completa, Painel e balões. Status: Ativo, Em manutenção, Inativo |
| Reserva | cliente, kits, data, início e fim da festa, modalidade, endereço, valor, sinal, status | Uma reserva pode ter vários kits; o conflito é checado kit a kit |

Modalidades de reserva:

- **Montagem no local:** a equipe leva, monta e desmonta no endereço da festa.
- **Pegue e monte:** o cliente retira no ateliê e devolve; não há deslocamento da equipe.

## Regra central: ocupação e conflito de kits

Uma reserva só é salva se, em cada minuto da janela de ocupação, sobrar pelo menos uma unidade livre de cada kit escolhido. A janela é maior que a festa, porque o kit fica preso antes e depois dela.

| Modalidade | Kit ocupado a partir de | Kit liberado em |
| --- | --- | --- |
| Montagem no local | início da festa − deslocamento − tempo de montagem do kit | fim da festa + desmontagem + deslocamento + conferência |
| Pegue e monte | horário de retirada | horário de devolução + conferência |

Valores padrão, ajustáveis em Regras: deslocamento 40 min, conferência e limpeza 60 min. Montagem e desmontagem vêm do cadastro de cada kit (ex.: mesa completa 2 h / 1 h; pegue e monte 0).

**Como o conflito é calculado**

1. Para cada kit da nova reserva, o sistema lista as reservas que seguram unidades: status Pré-reserva e Confirmada. Pedidos de orçamento não seguram.
2. Duas janelas se sobrepõem quando uma começa antes da outra terminar. Janelas que apenas se encostam (uma termina 14:00, outra começa 14:00) não conflitam.
3. Se o número de reservas sobrepostas for igual ao número de unidades do kit, a nova reserva é bloqueada para aquele kit.
4. Kit Em manutenção ou Inativo não aceita reservas novas.
5. Ao bloquear, o painel mostra quem está usando o kit, quando ele volta a ficar livre e até 3 kits da mesma categoria livres na janela.

**O que bloqueia e o que só avisa**

- Bloqueia, sem exceção: falta de unidade do kit. É um limite físico, ninguém pode forçar.
- Avisa, e a Dona pode seguir: mais montagens no mesmo horário do que equipes disponíveis (padrão 2), ou intervalo menor que 2 h entre devolução e nova saída do mesmo kit.
- Avisa no pedido de orçamento: quando outra pessoa já pediu o mesmo kit na mesma data, o pedido aparece como "disputado".

## Ciclo de vida da reserva

Uma reserva passa por seis status, e só Pré-reserva e Confirmada seguram o kit na agenda.

| Status | Segura o kit? | Como entra | Como sai |
| --- | --- | --- | --- |
| Pedido | Não | Cliente envia pela vitrine, ou a equipe cadastra | Vira Pré-reserva, ou é recusado (Cancelada) |
| Pré-reserva | Sim, por 48 h | A Dona aprova o pedido e envia o valor | Sinal pago → Confirmada; prazo vence → Expirada |
| Confirmada | Sim | Sinal registrado (mínimo 30% do valor) | Kit devolvido e conferido → Concluída; ou Cancelada |
| Concluída | Não | Conferência do kit marcada no painel | Final |
| Expirada | Não | Automático, 48 h sem sinal | Pode ser reaberta se o kit ainda estiver livre |
| Cancelada | Não | Ação manual, com motivo | Final |

**Prazos e pagamento (padrões ajustáveis)**

- Sinal mínimo: 30% do valor total, para passar de Pré-reserva a Confirmada.
- Saldo: até 48 h antes da festa na Montagem no local; na retirada no Pegue e monte.
- Pré-reserva expira em 48 h; o painel avisa 6 h antes de vencer.
- Cancelamento: o painel registra motivo e data; a política de devolução do sinal é um texto livre da empresa, mostrado no contrato e na vitrine. Vale validar esse texto com um advogado antes do primeiro cliente real.
- Toda mudança de status fica no histórico da reserva, com quem fez e quando.

## Landing page (vitrine da decoradora)

A vitrine é a página pública de cada decoradora, e seu trabalho é transformar visita em pedido de orçamento já com data e kit escolhidos.

1. **Consulta de data no topo:** o visitante escolhe o dia e vê quais kits estão livres, poucos ou reservados. Nunca mostra nome de cliente nem horário de outras festas.
2. **Catálogo de kits:** filtro por categoria, foto, preço a partir de, o que vem no kit e selo de disponibilidade para a data escolhida.
3. **Como funciona:** os três passos reais (escolher, reservar com sinal, receber ou retirar).
4. **Pedido de orçamento:** nome, WhatsApp, data, horário, modalidade, bairro e kits. Ao enviar, o pedido entra no painel com status Pedido e a pessoa recebe um resumo pronto para mandar no WhatsApp.
5. **Prova social e dúvidas:** depoimentos e perguntas frequentes. No protótipo os depoimentos são marcados como exemplo; numa vitrine real, só entram depoimentos verdadeiros.

A vitrine mostra disponibilidade aproximada ("livre", "última unidade", "reservado") e nunca confirma reserva sozinha: quem confirma é sempre a decoradora.

## Painel: módulos do MVP e acessos

| Tela | O que faz |
| --- | --- |
| Início | Próximas festas, pedidos novos, pré-reservas perto de vencer, valor a receber no mês |
| Agenda | Calendário do mês e linha do tempo do dia, com cada kit numa faixa e suas janelas de ocupação |
| Reservas | Lista com filtro por status; abrir, mudar status, registrar sinal; criar nova com checagem de conflito ao vivo |
| Kits | Estoque por kit: unidades, tempos, preço, status e taxa de uso no mês |
| Clientes | Histórico de festas e valor por cliente |
| Regras | Deslocamento, conferência, sinal mínimo, prazo da pré-reserva, equipes simultâneas |

| Acesso | Para quem | Login | O que acontece com as mudanças |
| --- | --- | --- | --- |
| Ver demonstração | Cliente olhando o projeto | Botão na vitrine, sem senha | Valem só até recarregar a página |
| Teste (Dona) | Você | teste@ornata.app / festa2026 | Ficam salvas neste navegador; botão Restaurar dados volta ao início |
| Teste (Equipe) | Você, para ver o perfil limitado | equipe@ornata.app / festa2026 | Iguais ao Teste (Dona), sem valores e sem Regras |

No protótipo o login é simulado no próprio navegador. No produto real ele vai para um backend com senha criptografada (Supabase é uma opção natural).

## Fora do MVP e perguntas para o primeiro cliente

**Fica para depois**

- Peças compartilhadas entre kits (ex.: o mesmo painel redondo usado no "Safari" e no "Jardim"), com conflito checado por peça.
- Pagamento do sinal por Pix com confirmação automática.
- Lembretes automáticos no WhatsApp (confirmação, saldo, devolução).
- Contrato gerado em PDF e assinatura digital.
- Rotas da equipe no dia com várias montagens.
- Plano multiempresa com cobrança mensal.

**Perguntas para o primeiro cliente**

- [ ] Quantos kits e quantas unidades de cada você tem hoje?
- [ ] Você empresta peças de um kit para outro?
- [ ] Quanto tempo leva, de verdade, para conferir e limpar um kit que voltou?
- [ ] Quantas montagens sua equipe aguenta ao mesmo tempo?
- [ ] Qual é hoje sua regra de sinal e de cancelamento?
- [ ] Quem além de você vai mexer na agenda?
