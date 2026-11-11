# Ornata — vitrine e painel para decoração de festas

Protótipo de uma vitrine online + painel de gestão para pequenas empreendedoras de ornamentação e decoração de festas. A regra central: **o mesmo kit nunca é reservado para duas festas no mesmo horário.**

Todos os dados são fictícios. A decoradora de exemplo se chama "Bendita Festa".

## Ver o protótipo

- Vitrine: abra `index.html` (ou o endereço do GitHub Pages deste repositório).
- Painel para o cliente olhar: botão **Ver o painel** na vitrine, ou **Ver demonstração** na tela de login. Não pede senha; as mudanças somem ao recarregar.
- Acesso de teste (dona): `teste@ornata.app` / `festa2026` — as mudanças ficam salvas no navegador; **Restaurar dados** volta ao início.
- Acesso de teste (equipe): `equipe@ornata.app` / `festa2026` — sem valores e sem a tela de Regras.

O login é simulado no navegador. Não use estes acessos como segurança real.

## Roteiro de demonstração

1. Na vitrine, escolha o sábado no varal e peça o **Safari Baby** no formulário de orçamento.
2. Clique em **Ver como a decoradora recebe**.
3. Tente **Aprovar como pré-reserva**: o painel bloqueia (as 2 unidades estão em uso) e sugere kits livres.
4. Abra a **Agenda** no sábado para ver a ocupação de cada kit.

## Estrutura

| Arquivo | O que é |
| --- | --- |
| `index.html` | Página final, gerada a partir de `src/` |
| `src/core.js` | Regras: janela de ocupação, checagem de conflito, dados fictícios |
| `src/app.js` | Vitrine, login e painel |
| `src/styles.css` | Visual (paleta Balões modernos) |
| `build.py` | Junta `src/` em `index.html`: `python3 build.py` |
| `docs/regras-de-negocio.md` | Regras de negócio v0.1 |

Depois de editar algo em `src/`, rode `python3 build.py` e faça commit do `index.html` gerado.
