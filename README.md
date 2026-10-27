# B&B eDocument Accelerator: Mapping Workbench (mock)

Protótipo navegável, com visual **SAP Fiori (Horizon)**, de um produto que ainda não existe. A ideia: o consultor mapeia, de forma visual, cada campo do XML legal de um país (SAP DRC / eDocument) para um campo SAP, define validações e transformações, e a ferramenta gera o código ABAP.

> **Tudo é mock.** Não há backend, login nem dados reais. As regras ficam em memória e somem ao recarregar a página. O ABAP gerado é ilustrativo e não compila.

**Demo online:** https://murillonadalbnb.github.io/genb-edocument-accelerator/

## Como rodar localmente

É um site estático. Basta servir a pasta com qualquer servidor HTTP:

```bash
npx serve .            # ou: python3 -m http.server 8080
```

Abra `http://localhost:3000` (ou `:8080`). Precisa de internet, porque o OpenUI5 vem do CDN da SAP (`sdk.openui5.org`, versão LTS 1.148.9 fixada no `index.html`).

## O que tem na demo

- **Shell bar Fiori** com logo, busca, notificações, product switch e um perfil fictício (*Jordan Lee*), com troca para o tema escuro (Horizon Evening).
- **Overview:** resumo do produto, os 3 passos e os países (França, Polônia e Alemanha disponíveis; Itália, Espanha, Bélgica e Portugal planejados).
- **País:** formato XML, interface, eDocument type e os 3 tipos de documento (Invoice, Credit Note, Accounting Document).
- **Workspace:**
  - árvore do XML com busca e filtros;
  - **Auto-suggest**, que cria as regras óbvias automaticamente;
  - diálogo de regra (Map, Check, Change, Constant) com o catálogo de campos SAP;
  - XML Preview com os campos mapeados destacados;
  - Code Preview com o ABAP gerado.

## Roteiro sugerido para o vídeo

1. Na **Overview**, mostrar o hero e os 3 passos, depois clicar em **Start with Poland**.
2. No **País**, comentar o formato KSeF FA(2) e abrir o tile **Invoice**.
3. No **Workspace**, clicar em **Auto-suggest**. Os KPIs sobem e as pills MAP/CHANGE aparecem na árvore.
4. Selecionar `NIP` em *Podmiot1 › DaneIdentyfikacyjne*, clicar em **Add check** e aplicar ("NIP must not be empty").
5. Selecionar `RodzajFaktury` e mostrar o **Change value** com o value mapping (F2 → VAT, G2 → KOR).
6. Abrir a aba **XML Preview**. Clicar numa linha destacada leva de volta ao campo.
7. Clicar em **Generate Code** e rolar o ABAP.
8. *(Opcional)* No perfil (JL), ligar o tema escuro. Voltar para a Overview e mostrar o contador de regras no tile da Polônia.

URLs diretas, úteis para começar uma tomada: `#/country/PL`, `#/country/PL/invoice`, `#/country/FR/credit`, `#/country/DE/fi`.

## Estrutura

```
index.html                  bootstrap do OpenUI5 (CDN)
webapp/
  manifest.json             rotas e dependências
  Component.js              modelo do perfil fictício e das notificações
  model/engine.js           regras de negócio (catálogo, sugestões, validações, gerador ABAP)
  model/plTemplate.js       XML de exemplo da Polônia (KSeF FA(2))
  view/, controller/        telas e diálogo de regra
  css/style.css             complementos visuais sobre o tema Horizon
docs/
  bb-edocument-accelerator-spec.md   especificação funcional
  legacy/                            mockup original em HTML puro
```
