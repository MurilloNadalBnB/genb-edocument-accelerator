# GENB Accelerator: visão geral do projeto

> **Para quem é este documento:** um agente de IA que vai trabalhar neste projeto sem ter acompanhado a história dele. Este documento traz o contexto completo: o que é a solução, quem é a B&B, o que existe hoje (e o que é só simulação), onde está cada coisa e quais regras seguir.
>
> **Estado em 02/11/2026:** o mock está publicado, o vídeo promocional está fechado (versão final aprovada) e o PPT de apresentação está em revisão com a gestão da B&B.

---

## 1. Resumo

- **O que é:** o **GENB Accelerator** é um produto da **B&B Enterprise Solutions**, ainda em conceito, para **SAP Document and Reporting Compliance (SAP DRC)**, o framework de eDocument da SAP para e-invoicing e relatórios fiscais exigidos por lei.
- **O que faz:** um key user ou consultor mapeia, de forma visual, cada campo do **XML legal** de um país para um campo SAP, sem escrever código. Ele também define validações e transformações. A ferramenta gera o **código ABAP** nos pontos de extensão padrão do SAP DRC.
- **Onde entra a IA:** o usuário pode descrever um requisito em linguagem natural, que vira uma regra. A IA também revisa o código gerado. A IA é escolha do cliente: **Joule**, **SAP Generative AI Hub** ou **GENB AI** (a IA da B&B), sozinhas ou juntas.
- **Quem implanta:** o código pode ser implantado pela equipe do cliente ou, com um clique, enviado à B&B como um **ticket**. Nesse caso, a B&B implementa, testa e entrega um transporte.
- **O que existe hoje:** não existe produto real ainda. Existe um **mock navegável** (OpenUI5, visual SAP Fiori), publicado no GitHub Pages, um **vídeo promocional** e um **PPT**. Todos servem para apresentar a ideia em eventos e a clientes.

---

## 2. Quem é a B&B Enterprise Solutions

- **Origem:** empresa fundada por especialistas SAP com **mais de 20 anos de experiência**, que entrega soluções sob medida dentro das boas práticas SAP.
- **Localização:** escritórios na **Europa (Portugal)** e na **América do Sul (Brasil)**, com clientes em todas as regiões, da Oceania às Américas.
- **Especialidade:** **localização, e-invoicing e relatórios fiscais** em SAP, principalmente com **SAP DRC**.
- **Números usados nos materiais:**
  - SAP DRC entregue em **34 países**. Um PPT institucional mais antigo fala em "mais de 30 localizações"; os materiais deste projeto usam 34.
  - **Parceiro oficial SAP DRC**.
- **Modelo de serviço:** *Build · Extend · Operate*, da primeira implementação ao AMS global.
- **Produtos próprios:**
  - extensibilidade para relatórios fiscais e e-invoice sobre o SAP DRC;
  - soluções de impressão de documentos (MM, SD, FI), low code e no padrão *clean core*;
  - **GenB AI®**: SaaS que analisa os erros de eDocument a partir do cockpit e do XML, responde na língua do usuário, tem KPIs e roda sobre Fiori. A "GENB AI" do accelerator é a IA de compliance da B&B, na mesma linha.
- **Site e frases da marca:**
  - site: **www.bnb-eu.com**;
  - *"Where expertise meets results."*;
  - *"Let us be your trusted partner for efficient and seamless SAP solutions."*
- **Identidade visual:**
  - preto e branco;
  - fotos de arquitetura em escala de cinza (um prédio visto de baixo) e uma mão segurando um cartão preto;
  - texto em **Montserrat**;
  - logo **B|B** na fonte Code Light. O segundo B é girado 180° e fica um pouco mais baixo, com um traço fino entre os dois (veja `webapp/img/logo.svg`).

---

## 3. O problema que a solução ataca

O SAP DRC gera o XML legal de cada país (eDocument) a partir dos documentos SAP: faturas SD, documentos FI e notas de entrada MM. Na prática:

- **Mandatos novos:** cada país tem seu formato, sua rede e seu prazo. Exemplos usados nos materiais:
  - França: e-invoicing e e-reporting, em vigor desde set/2026;
  - Polônia: KSeF, em vigor desde 2026;
  - Eslováquia: Peppol, a partir de jan/2027;
  - Alemanha: XRechnung e ZUGFeRD, emissão a partir de 2027;
  - UAE: Peppol PINT AE, a partir de 2027;
  - Brasil: Reforma Tributária, com CBS e IBS na NF-e, de 2026 a 2033.
- **Mandatos existentes também mudam:** chegam novos schemas, validações e códigos.
- **O SAP também muda:** a cada atualização do SAP, a extensão precisa ser revista.
- **O ciclo de cada projeto:** especificação legal (PDF e XSD) → planilha de mapeamento campo a campo → ABAP escrito à mão por poucos especialistas (BAdIs, AIF) → testes e rejeições da plataforma. **Cada mudança recomeça o ciclo.**
- **A lacuna:** entre o que a lei exige e o que a TI entrega. E toda obrigação **precisa** ser entregue no prazo.

---

## 4. A solução: GENB Accelerator

### 4.1 Fluxo em 4 passos

1. **Escolher o país.** Os formatos XML legais, os tipos de eDocument e as interfaces de cada país já vêm configurados.
2. **Escolher o cenário (processo).** Venda, compra (inbound), autofaturação, pagamentos ou reporting. Cada cenário vem com um XML real de projeto, anonimizado.
3. **Definir as regras.** O usuário clica num campo e escolhe uma regra, ou descreve o que precisa e a IA cria a regra.
4. **Gerar o código ou pedir à B&B.** Sai o ABAP do adaptor, dos custom fields, do e-mail e das UI functions, já revisado pela IA.

### 4.2 Tipos de regra

| Regra | O que faz | Exemplo |
|---|---|---|
| **MAP** | Preenche o campo do XML com um campo SAP | `VBRK-VBELN` → número da fatura |
| **CHECK** | Valida antes de criar o eDocument (erro ou aviso) | VAT do comprador não pode estar vazio |
| **CHANGE** | Converte o valor (AIF value map, concatenação, sinal, formato) | value map `F2 → 380`, `G2 → 381` |
| **CONST** | Sempre o mesmo valor | `CustomizationID` do CIUS |
| **SKIP** | Relevância do documento: não gera eDocument | billing types `ZF2`, `ZG2` |

**Princípio central: *same rules, same ABAP*.** O código sempre sai das regras, de forma determinística. Uma mudança legal se resolve atualizando a regra e gerando de novo. A IA ajuda a escrever as regras e revisa o resultado, mas não escreve código que não se possa rastrear até uma regra.

### 4.3 Your AI, your choice

| Motor | O que traz |
|---|---|
| **Joule** (SAP Business AI) | Os agentes e as knowledge bases que o cliente já tem: manual de faturamento, guias de dados mestres, agente Order-to-Cash |
| **SAP Generative AI Hub** (SAP AI Core na **SAP Business AI Platform**) | Os LLMs da assinatura do próprio cliente, com grounding nos documentos e data masking |
| **GENB AI** (B&B) | A biblioteca de regras de DRC da B&B e padrões de projetos reais |

Os motores podem ser ligados e desligados, e cada parte da resposta mostra qual deles a produziu. Eles servem para:
- responder dúvidas sobre campos e mandatos;
- transformar um requisito em linguagem natural numa regra;
- revisar o código gerado. As notas de revisão de cada IA aparecem no fim da classe.

> A SAP renomeou o **SAP BTP** para **SAP Business AI Platform** no Sapphire 2026. Use sempre o nome novo.

### 4.4 O que é gerado

Tudo sai em pontos de extensão padrão do SAP DRC, sem alterar o standard, e é entregue por transporte:

| Objeto | Ponto de extensão |
|---|---|
| Adaptor: mapeamento, checks e relevância (`IF_EDOC_ADAPTOR~IS_RELEVANT`, `SET_OUTPUT_DATA`) | BAdI `EDOC_ADAPTOR` |
| Custom fields do cockpit | BAdI `EDOC_CUSTOM_FIELDS` |
| E-mail ao cliente | BAdI `EDOC_PARTNER_CONNECTOR` |
| UI functions (ações do cockpit, como Get PDF e Cancel) | Ações do eDocument Cockpit |
| Inbound (notas de fornecedor recebidas) | Mapeamento inbound |
| AIF value maps | Configuração, não código: dá para incluir valores sem transporte |

O resultado aparece no **eDocument Cockpit do SAP (`EDOC_COCKPIT`)**. **O cockpit não faz parte do GENB Accelerator** e não deve ser desenhado nem mostrado dentro do mock.

### 4.5 Implementação pela B&B ("Open a ticket. That's it.")

1. **Envio:** com um clique a partir do código gerado, o pacote (cenário, regras e objetos) vai para a B&B.
2. **Ticket:** abre um ticket no **ERP de serviços da B&B**, com o sistema de destino, a prioridade e a data de go-live.
3. **Entrega:** os consultores da B&B implementam no sistema de desenvolvimento do cliente, testam com os documentos dele e entregam o transporte.

### 4.6 O caso de uso de referência (a "história da Tori")

Este caso é usado no vídeo. A personagem é fictícia: **Tori Hayes**, key user de eDocument da "Demo Company".

- **O requisito:** a Tori tem um requisito de negócio, deixar alguns billing types como **não relevantes** para o e-invoicing na França. O customizing padrão do DRC não resolve.
- **Os passos:**
  1. Ela abre o GENB, escolhe o país e o processo e, em poucos cliques, cria uma regra à mão: um value map no `InvoiceTypeCode`.
  2. Para o requisito específico, ela escreve no AI Assistant: *"Billing types ZF2 and ZG2 must not create e-invoices in France"*.
  3. Em segundos aparece uma regra **SKIP** (Document relevance), e o adaptor ganha o método `IS_RELEVANT`, revisado pelas três IAs.
  4. Ela decide quem implanta: a própria equipe ou a B&B, por ticket. O ticket aparece em *B&B Requests*.
- **No PPT:** o mesmo caso aparece sem citar a Tori.

---

## 5. O mock (o que existe hoje)

### 5.1 Natureza

- **Tudo é simulado:**
  - não há backend, login nem dados reais;
  - as regras ficam em memória e somem ao recarregar a página;
  - as respostas das IAs são textos simulados;
  - o ticket da B&B é simulado;
  - o ABAP gerado é **ilustrativo e não compila** (a especificação, seção 12.4, explica por quê).
- **Público:** é uma demonstração para eventos SAP e conversas com clientes.
- **Demo online:** https://murillonadalbnb.github.io/genb-edocument-accelerator/
- **Repositório:** GitHub `MurilloNadalBnB/genb-edocument-accelerator`, branch `main`, **público**. O GitHub Pages publica a partir do `main`.

### 5.2 Stack e execução

- **Base:** site estático com **OpenUI5 1.148.9** (LTS, carregado do CDN da SAP), tema SAP Fiori **Horizon**, densidade Compact. É preciso internet para carregar o UI5.
- **Rodar localmente:** sirva a raiz com qualquer servidor HTTP (`python3 -m http.server 8080`) e abra `index.html`.
- **Rotas:**
  - `#/` (Overview);
  - `#/country/{code}`;
  - `#/country/{code}/{doc}` (Workspace). Exemplo: `#/country/FR/customer-invoice`.
- **Bibliotecas:** `sap.m`, `sap.f`, `sap.tnt` (ToolPage e SideNavigation), `sap.ui.table` (TreeTable da árvore XML) e `sap.ui.codeeditor` (ABAP). Os dados ficam em JSONModel, e as telas se comunicam por EventBus.

### 5.3 Telas

- **Cabeçalho (padrão Work Zone):**
  - logo B|B, título *GENB Accelerator* e app *Mapping Workbench*;
  - busca, **AI Assistant**, troca de tema, notificações e product switch;
  - perfil fictício Tori Hayes.
- **Menu lateral:**
  - Overview;
  - Countries, dividido em *Available* e *Planned*, com etiquetas *Live*, *2027* e *Reform*;
  - Rule Library, B&B Requests e Settings.
- **Overview:**
  - card *Your AI, your choice*, com os 3 motores e um switch para cada;
  - os 4 passos;
  - tiles de países e de pedidos à B&B.
- **País:** os cenários do país, cada um com seu XML real anonimizado.
- **Workspace:**
  - árvore do XML com busca e filtros; elementos repetidos aparecem como lista (1..n);
  - painel lateral do campo selecionado e lista de regras;
  - diálogo de regra (Map, Check, Change, Constant) com o catálogo SAP da origem (SD, MM ou FI);
  - abas XML Preview e Code Preview;
  - rodapé com Save Draft, **Request B&B Implementation** e **Generate Code**. O Generate Code pergunta qual IA revisa o código.
- **AI Assistant:** uma frase como *"Billing types ZF2 and ZG2 must not create e-invoices"*, digitada com um cenário aberto, vira a regra SKIP daquele cenário.
- **Auto-suggest:** o botão foi **retirado da tela** em 29/10/2026 a pedido da gestão, porque gerava perguntas demais na demo. A lógica continua em `engine.autoSuggest`.

### 5.4 Países e cenários no mock

| País | Etiqueta | Cenários |
|---|---|---|
| Bélgica | (Peppol, B2B desde 2026) | Customer Invoice (Peppol BIS 3.0) |
| França | Live | Customer Invoice (SD, UBL CIUS FR), Supplier Invoice (MM, inbound), Self-billing (MM, tipo 389), E-reporting (FI) |
| Alemanha | 2027 | Customer Invoice e Credit Note XRechnung via Peppol (SD), FI Invoice by E-mail (CII) |
| México | (CFDI 4.0) | CFDI Invoice (SD), Payment Complement / Pagos 2.0 (FI) |
| Polônia | Live | Invoice, Credit Note, Accounting Document (KSeF FA(2)) |
| Eslováquia | 2027 | Customer Invoice (Peppol, modelo 5 cantos) |
| UAE | 2027 | Customer Invoice (Peppol PINT AE) |
| **Planejados** | | Brasil (Reform: CBS e IBS na NF-e), Croácia, Grécia, Itália, Malásia, Portugal, Arábia Saudita, Espanha |

### 5.5 Arquivos principais

```
index.html                   bootstrap do OpenUI5 (CDN)
webapp/manifest.json         rotas e dependências
webapp/Component.js          perfil fictício, notificações, motores de IA, pedidos à B&B; carrega as amostras
webapp/model/engine.js       países, cenários, catálogo SAP, sugestões, validações, regra de relevância, gerador ABAP
webapp/model/templates.js    ABAP de e-mail, custom fields e UI functions
webapp/model/assistant.js    respostas simuladas por motor de IA, detecção do requisito de relevância
webapp/model/plTemplate.js   XML de exemplo da Polônia (KSeF FA(2))
webapp/samples/<país>/       XMLs anonimizados (fr, de, mx, be, sk, ae)
webapp/view/, controller/    telas, diálogo de regra, painel de IA, pedido à B&B
webapp/css/style.css         complementos visuais sobre o Horizon (etiquetas do menu etc.)
docs/bb-edocument-accelerator-spec.md   especificação funcional completa (em português)
docs/legacy/                 mockup original em HTML puro
README.md                    visão do mock, roteiro de demo e estrutura
```

A **especificação** (`docs/bb-edocument-accelerator-spec.md`) é a referência detalhada: regras, validações, sugestões, comportamento das telas, geração ABAP, limitações e próximos passos. Leia antes de mudar o mock.

---

## 6. Materiais de marketing

Ficam em pastas **locais, fora do git** (veja a seção 8).

### 6.1 Vídeo promocional (final)

- **Arquivo e formato:** `video/genb-promo.mp4`, com 2:24, 60 fps, narração em inglês (voz neural **Kokoro**, `bm_fable`, britânica) e **legenda gravada na imagem**. Funciona com ou sem som, o que é importante para o loop sem áudio no estande.
- **Roteiro:**
  - mandatos evoluem rápido: os 6 países;
  - mandatos existentes mudam: "New XML. New validations. New problems.";
  - "every obligation must be submitted on time";
  - quem é a B&B (20+ anos, 34 países, parceiro oficial, Build · Extend · Operate);
  - "It's time to meet the GENB Accelerator";
  - as 3 IAs;
  - a história da Tori, que termina com o ticket em *B&B Requests*;
  - encerramento com a marca.
- **Como é feito:**
  - um "palco" HTML com o app num iframe, câmera, cursor e legendas;
  - gravação automatizada com Playwright e o screencast do Chrome;
  - montagem com ffmpeg numa grade exata de 60 fps.
- **Fontes e passo a passo:** em `video/build/`, com o `README.md` de como regenerar.

### 6.2 PPT de apresentação

- **Arquivo e formato:** `presentation/GENB-Accelerator.pptx`, com 17 slides para apresentação ao vivo e o roteiro de fala nas notas. A Montserrat vai embutida.
- **Estilo:** a versão **clara** da identidade B&B. Slides brancos com textura leve do prédio, títulos em maiúsculas, B|B no canto e www.bnb-eu.com no rodapé. A foto do prédio aparece só na capa e na abertura do produto, com o mesmo brilho do vídeo.
- **Slides:**
  1. Capa
  2. Welcome to B&B
  3. Tax mandates evolve fast
  4. Where DRC projects lose time
  5. Introducing GENB Accelerator
  6. At a glance
  7. How it works
  8. Rules without code
  9. Your AI, your choice
  10. From a sentence to reviewed code
  11. What you get
  12. How it fits your SAP landscape
  13. Before and after
  14. Many countries ready. More coming.
  15. Or let B&B implement it
  16. Getting started
  17. Encerramento
- **Fontes:** `video/build/deck/build.js` (pptxgenjs).

---

## 7. Regras e cuidados (obrigatórios)

1. **O repositório é público.**
   - Nunca commite nada de `private/` (material bruto de clientes: XMLs e ABAP reais) nem de `temp/` (PPTs e PDFs de referência com nomes de clientes).
   - As amostras em `webapp/samples/` precisam estar **anonimizadas**: nomes, endereços, IDs fiscais, IBANs, e-mails e UUIDs trocados por valores fictícios (domínios `.example`).
2. **Nada de nomes ou logos de clientes** da B&B no repositório, no vídeo ou no PPT, a menos que haja permissão confirmada. Antes de cada commit, procure nomes de clientes no diff.
3. **Nome do produto:** "GENB Accelerator", sem "eDocument". No áudio, fala-se "Gen B". A IA da B&B é "GENB AI".
4. **SAP BTP → "SAP Business AI Platform"** em todo lugar.
5. **Países:** nunca diga que só poucos países estão disponíveis. A mensagem é "many countries ready, more coming". Listas de países planejados levam a nota de que a lista pode mudar.
6. **eDocument Cockpit:** é o `EDOC_COCKPIT` do SAP. Pode ser citado, mas nunca recriado dentro do mock.
7. **O mock é mock:** não prometa integração real, compilação do ABAP nem persistência. Em textos para clientes, fale da visão do produto.
8. **Padrão do código do mock:**
   - mantenha o estilo existente: UI5 com `sap.ui.define`, tabs e comentários curtos;
   - teste em telas pequenas (1280–1512 px de largura) antes de entregar mudanças de UI.

---

## 8. Mapa do repositório e pastas locais

| Pasta | No git? | Conteúdo |
|---|---|---|
| `index.html`, `webapp/`, `docs/`, `README.md` | Sim | O mock e a documentação |
| `private/` | Não | Material bruto de clientes (nunca commitar) |
| `temp/` | Não | PPTs e PDFs de referência da B&B, com nomes de clientes |
| `video/` | Não | `genb-promo.mp4` (final) e `build/`, com as fontes do vídeo e do PPT e um README de como regenerar |
| `presentation/` | Não | `GENB-Accelerator.pptx` |

Para regenerar o vídeo ou o PPT é preciso instalar Node, Playwright, ffmpeg, espeak-ng e os modelos Kokoro (os links estão em `video/build/README.md`), além de pptxgenjs e fontTools.

---

## 9. Situação e próximos passos

- **Mock:** publicado e estável. Último ajuste relevante: Auto-suggest retirado da tela e a regra de relevância contando como regra em todos os lugares.
- **Vídeo:** fechado, versão final aprovada.
- **PPT:** em revisão com os dois gestores da B&B. Pontos que ainda dependem deles:
  - a fonte dos títulos (Montserrat Bold no lugar da Code Bold dos PPTs originais);
  - o conteúdo de "Getting started";
  - a frase "no change to the SAP standard";
  - o tom da coluna "tradicional" no slide antes × depois.
- **Rumo para um produto real** (especificação, seção 15):
  - XML vindo do XSD ou do proxy de cada interface DRC;
  - catálogo SAP lido do DDIC;
  - templates de código por país;
  - persistência e versionamento das regras;
  - gerador real (ABAP ou CAP) com syntax check;
  - base de conhecimento alimentada pelos projetos entregues;
  - os países planejados.

---

## 10. Glossário

| Termo | Significado |
|---|---|
| **SAP DRC** | SAP Document and Reporting Compliance: framework da SAP para e-invoicing e relatórios fiscais legais |
| **eDocument** | O documento eletrônico legal gerado pelo DRC a partir de um documento SAP |
| **eDocument Cockpit (`EDOC_COCKPIT`)** | Transação SAP de monitoramento e ações sobre os eDocuments |
| **BAdI** | Ponto de extensão do SAP (por exemplo, `EDOC_ADAPTOR`, `EDOC_CUSTOM_FIELDS`, `EDOC_PARTNER_CONNECTOR`) |
| **AIF value map** | Tabela de conversão de valores do SAP Application Interface Framework (configuração, não código) |
| **Peppol** | Rede europeia de troca de faturas eletrônicas (BIS Billing 3.0; PINT AE nos UAE) |
| **UBL / CII / Factur-X / XRechnung / ZUGFeRD** | Formatos de fatura eletrônica (os dois últimos usados na Alemanha) |
| **CIUS** | Especialização nacional da norma europeia EN 16931 |
| **KSeF** | Plataforma nacional de e-invoicing da Polônia |
| **CFDI / PAC** | Fatura eletrônica do México e o provedor que a certifica |
| **CBS / IBS** | Novos tributos da Reforma Tributária brasileira, informados na NF-e |
| **Billing type (`VBRK-FKART`)** | Tipo de documento de faturamento no SAP SD |
| **Key user** | Usuário de negócio que conhece o processo e configura o sistema |
| **AMS** | Application Management Services: sustentação contínua |
| **Transporte** | Pacote de mudanças levado entre sistemas SAP (desenvolvimento → qualidade → produção) |
