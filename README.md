# GENB eDocument Accelerator: Mapping Workbench (mock)

Protótipo navegável, com visual **SAP Fiori (Horizon)**, de um produto que ainda não existe. A ideia: o consultor mapeia, de forma visual, cada campo do XML legal de um país (SAP DRC / eDocument) para um campo SAP, define validações e transformações, e a ferramenta gera o código ABAP.

> **Tudo é mock.** Não há backend, login nem dados reais. As regras ficam em memória e somem ao recarregar a página. O ABAP gerado é ilustrativo e não compila.

**Demo online:** https://murillonadalbnb.github.io/genb-edocument-accelerator/

## Como rodar localmente

É um site estático. Basta servir a pasta com qualquer servidor HTTP:

```bash
npx serve .            # ou: python3 -m http.server 8080
```

Abra `http://localhost:3000` (ou `:8080`). A densidade padrão é **Compact**, a mesma dos apps Fiori Elements no desktop. Para comparar com **Cozy**, use `?density=cozy` na URL, por exemplo `index.html?density=cozy#/country/FR/customer-invoice`. Precisa de internet, porque o OpenUI5 vem do CDN da SAP (`sdk.openui5.org`, versão LTS 1.148.9 fixada no `index.html`).

## O que tem na demo

- **Cabeçalho no padrão do Work Zone / Launchpad:**
  - logo da B&B, título *GENB eDocument Accelerator* e menu do app *Mapping Workbench*;
  - busca, **Joule**, troca de tema (Horizon Morning / Evening), notificações e product switch;
  - perfil fictício (*Jordan Lee*).
- **Overview:**
  - card **Works with your Joule**: agentes e knowledge bases do próprio cliente somados ao conhecimento de DRC da B&B;
  - os 4 passos, incluindo *Generate, or let B&B implement*;
  - países em ordem alfabética: França, Alemanha, México e Polônia disponíveis; Bélgica, Itália, Portugal e Espanha planejados.
- **País:** cenários próprios de cada país, cada um com um XML real de projeto, anonimizado:

  | País | Cenários |
  |---|---|
  | França | Customer Invoice (SD), Supplier Invoice (MM, inbound), Self-billing Invoice (MM/ERS, tipo 389), E-reporting (FI/MM) |
  | Alemanha | Customer Invoice e Credit Note XRechnung via Peppol (SD), FI Invoice by E-mail (CII) |
  | México | CFDI Invoice (SD), Payment Complement / Pagos 2.0 (FI) |
  | Polônia | Invoice, Credit Note, Accounting Document (KSeF FA(2), com menos ênfase) |

- **Workspace:**
  - árvore do XML com busca e filtros;
  - **Auto-suggest**, que cria as regras óbvias (MAP, CHANGE com value map, CONST para valores fixos e menções legais francesas, concatenação BELNR+GJAHR na autofaturação);
  - **Ask Joule** no cabeçalho e no painel do campo selecionado;
  - diálogo de regra (Map, Check, Change, Constant) com o catálogo de campos SAP do source (SD, MM ou FI);
  - XML Preview com os campos mapeados destacados;
  - Code Preview com os objetos do cenário: adaptor (BAdI `EDOC_ADAPTOR`, gerado das regras, com AIF value maps), mapeamento inbound, e-mail (partner connector), custom fields do cockpit e UI functions (ações do cockpit);
  - **Request B&B Implementation**: envia o pacote à B&B, simulando a abertura de um ticket no ERP da B&B (aparece em notificações, no tile da Overview e em *B&B Requests*).

## Roteiro sugerido para o vídeo

1. Na **Overview**, mostrar o card *Works with your Joule* e clicar em **Check my master data**: o Joule responde citando o agente do cliente e o conhecimento da B&B.
2. Clicar em **Start with France** e comentar os 4 cenários (venda, compra inbound, autofaturação, e-reporting).
3. Abrir **Customer Invoice** e clicar em **Auto-suggest**. Os KPIs sobem e as pills MAP/CHANGE/CONST aparecem na árvore.
4. Selecionar `EndpointID` em *AccountingCustomerParty* e clicar em **Ask Joule**.
5. Selecionar `InvoiceTypeCode` e mostrar o **Change value** com o value map (F2 → 380, G2 → 381).
6. Clicar em **Generate Code**, rolar o ABAP e trocar o objeto para os custom fields.
7. Clicar em **Request B&B Implementation**, enviar e mostrar o ticket criado.
8. *(Opcional)* Mostrar o México: **CFDI Invoice**, Auto-suggest e os objetos de UI functions (Get PDF, Cancel).

URLs diretas, úteis para começar uma tomada: `#/country/FR`, `#/country/FR/customer-invoice`, `#/country/FR/self-billing`, `#/country/FR/e-reporting`, `#/country/DE/cii-email`, `#/country/MX/cfdi-invoice`, `#/country/MX/cfdi-payment`.

## Dados de exemplo

Os XMLs em `webapp/samples/` vêm de projetos reais e foram anonimizados: nomes, endereços, IDs fiscais (VAT, SIREN, RFC), IBANs, e-mails, UUIDs e selos digitais foram trocados por valores fictícios (domínios `.example`). O material original fica em `private/`, que está no `.gitignore` e **nunca deve ir para o repositório** (ele é público).

## Estrutura

```
index.html                  bootstrap do OpenUI5 (CDN)
webapp/
  manifest.json             rotas e dependências
  Component.js              perfil fictício, notificações, Joule e pedidos à B&B; carrega as amostras
  model/engine.js           países, cenários, catálogo SAP, sugestões, validações, gerador ABAP
  model/templates.js        ABAP de e-mail, custom fields e UI functions
  model/joule.js            respostas simuladas do Joule
  model/plTemplate.js       XML de exemplo da Polônia (KSeF FA(2))
  samples/fr|de|mx/         XMLs reais anonimizados, um por cenário
  view/, controller/        telas, diálogo de regra, painel do Joule, pedido à B&B
  css/style.css             complementos visuais sobre o tema Horizon
docs/
  bb-edocument-accelerator-spec.md   especificação funcional
  legacy/                            mockup original em HTML puro
private/                    material bruto de clientes (fora do git)
```
