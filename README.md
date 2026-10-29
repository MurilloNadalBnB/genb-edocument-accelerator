# GENB Accelerator: Mapping Workbench (mock)

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
  - logo da B&B, título *GENB Accelerator* e menu do app *Mapping Workbench*;
  - busca, **AI Assistant**, troca de tema (Horizon Morning / Evening), notificações e product switch;
  - perfil fictício (*Tori Hayes*, key user de eDocument).
- **Menu lateral:** Overview; *Countries* com os nós *Available* (Bélgica, França, Alemanha, México, Polônia, Eslováquia, UAE) e *Planned* (Brasil, Croácia, Grécia, Itália, Malásia, Portugal, Arábia Saudita, Espanha), em ordem alfabética, com etiquetas nos mandatos do momento (*Live*, *2027*, *Reform*); *Rule Library* e *B&B Requests*; *Settings* no rodapé.
- **Overview:**
  - card **Your AI, your choice**: três motores de IA, que podem ser usados sozinhos ou juntos, cada um com seu switch:
    - **Joule**: agentes e knowledge bases que o cliente já tem;
    - **SAP Generative AI Hub** (SAP AI Core): os LLMs da assinatura SAP Business AI Platform (antigo SAP BTP) do cliente, com grounding e data masking;
    - **GENB AI**: o conhecimento de DRC da B&B;
  - os 4 passos, incluindo *Generate, or let B&B implement*;
  - tiles dos países e dos pedidos enviados à B&B.
- **País:** cenários próprios de cada país, cada um com um XML real de projeto, anonimizado:

  | País | Cenários |
  |---|---|
  | França | Customer Invoice (SD), Supplier Invoice (MM, inbound), Self-billing Invoice (MM/ERS, tipo 389), E-reporting (FI/MM) |
  | Alemanha | Customer Invoice e Credit Note XRechnung via Peppol (SD), FI Invoice by E-mail (CII) |
  | México | CFDI Invoice (SD), Payment Complement / Pagos 2.0 (FI) |
  | Polônia | Invoice, Credit Note, Accounting Document (KSeF FA(2), com menos ênfase) |

- **Workspace:**
  - árvore do XML com busca e filtros;
  - **Auto-suggest**, que cria as regras óbvias (MAP, CHANGE com value map, CONST para valores fixos, concatenação BELNR+GJAHR na autofaturação);
  - **Ask AI** no cabeçalho e no painel do campo selecionado. Cada parte da resposta mostra qual motor a produziu;
  - elementos repetidos (linhas, notas, meios de pagamento) aparecem uma vez só, como lista (*1..n*), com a estrutura de todas as ocorrências do exemplo;
  - diálogo de regra (Map, Check, Change, Constant) com o catálogo de campos SAP do source (SD, MM ou FI);
  - XML Preview com os campos mapeados destacados;
  - **Generate Code**: o ABAP sai das regras (mesmas regras, mesmo código). Com mais de uma IA ligada, um diálogo pergunta qual revisa o código: todas as ativas (recomendado) ou só uma. A escolha aparece no cabeçalho do código e nas notas de revisão no final; com uma IA só, gera direto;
  - Code Preview com os objetos do cenário: adaptor (BAdI `EDOC_ADAPTOR`, gerado das regras, com AIF value maps), mapeamento inbound, e-mail (partner connector), custom fields do cockpit e UI functions (ações do cockpit);
  - **requisito em linguagem natural**: no AI Assistant, frases como *Billing types ZF2 and ZG2 must not create e-invoices* viram uma regra de relevância do documento (*SKIP* na lista de regras) e o ABAP ganha o método `IF_EDOC_ADAPTOR~IS_RELEVANT`, com notas de revisão de cada IA;
  - **Request B&B Implementation**: envia o pacote à B&B, simulando a abertura de um ticket no ERP da B&B (aparece em notificações, no tile da Overview e em *B&B Requests*).

## Roteiro sugerido para o vídeo

1. Na **Overview**, mostrar o card *Your AI, your choice* e clicar em **Check my master data**: a resposta vem em três partes, uma por motor. Desligar dois motores e perguntar de novo para mostrar que cada um funciona sozinho.
2. Abrir **France** no menu lateral e comentar os 4 cenários (venda, compra inbound, autofaturação, e-reporting).
3. Abrir **Customer Invoice** e clicar em **Auto-suggest**. Os KPIs sobem e as pills MAP/CHANGE/CONST aparecem na árvore.
4. Selecionar `EndpointID` em *AccountingCustomerParty* e clicar em **Ask AI**.
5. Selecionar `InvoiceTypeCode` e mostrar o **Change value** com o value map (F2 → 380, G2 → 381).
6. Clicar em **Generate Code**, escolher quem revisa (todas as IAs ativas), rolar o ABAP até as notas de revisão e trocar o objeto para os custom fields.
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
  Component.js              perfil fictício, notificações, motores de IA e pedidos à B&B; carrega as amostras
  model/engine.js           países, cenários, catálogo SAP, sugestões, validações, gerador ABAP
  model/templates.js        ABAP de e-mail, custom fields e UI functions
  model/assistant.js        respostas simuladas, uma parte por motor de IA
  model/plTemplate.js       XML de exemplo da Polônia (KSeF FA(2))
  samples/fr|de|mx/         XMLs reais anonimizados, um por cenário
  view/, controller/        telas, diálogo de regra, painel de IA, pedido à B&B
  img/                      logo da B&B (cabeçalho), logo da SAP (card do Generative AI Hub) e favicon (ícone de IA da SAP)
  css/style.css             complementos visuais sobre o tema Horizon
docs/
  bb-edocument-accelerator-spec.md   especificação funcional
  legacy/                            mockup original em HTML puro
private/                    material bruto de clientes (fora do git)
```
