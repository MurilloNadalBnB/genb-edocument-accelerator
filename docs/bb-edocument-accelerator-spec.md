# GENB Accelerator, especificação funcional e regras de negócio

> Documento de continuidade. Descreve tudo o que foi definido e implementado no mockup original [`legacy/edoc-accelerator-mockup.html`](legacy/edoc-accelerator-mockup.html) (versão de 27/10/2026). A versão atual do mockup é a app OpenUI5 na raiz do repositório (ver seções 14 e 16), que reaproveita as mesmas regras de negócio.

---

## 1. Visão do produto

**Objetivo:** acelerar o desenvolvimento de eDocument (SAP DRC) permitindo que o consultor mapeie, de forma visual, cada campo do XML legal de um país para um campo SAP, definindo validações e transformações, e que a ferramenta gere o código ABAP correspondente.

**Princípios de UX:**

- Visual SAP Fiori (tema Horizon), simples e "user friendly".
- Fluxo em 3 passos: **País → Tipo de documento → Mapeamento de campos**.
- O usuário nunca precisa escrever código para definir uma regra.
- A geração de código é a etapa final e, no mockup, é apenas ilustrativa.

**Nome do produto:** GENB Accelerator. O cabeçalho mostra o logo da B&B, o título do produto e o nome do app (*Mapping Workbench*).

---

## 2. Fluxo de navegação

| Tela | Como chega | Conteúdo |
|---|---|---|
| **Overview (home)** | Abertura do app, item "Overview" no menu ou breadcrumb | Hero com descrição e botões de atalho (Poland, France, Germany); card "How it works" com os 3 passos; grid de países com total de regras de cada um |
| **País** | Clique num país no menu lateral ou no grid | Cabeçalho do país (formato XML, interface, eDocument type, status), wizard com o passo 2 ativo, 3 tiles de tipo de documento, aviso sobre o Accounting Document |
| **Workspace** | Clique num tile de tipo de documento | Cabeçalho com KPIs, 3 abas (Field Mapping, XML Preview, Code Preview), footer bar com Save Draft e Generate Code |

**Regras de navegação:**

- Trocar de país limpa o tipo de documento selecionado e volta para a tela do país.
- Ao entrar no workspace, a seleção, a busca e o filtro da árvore são resetados e a aba ativa volta a ser *Field Mapping*.
- Países com status *planned* não navegam: mostram o toast "<País> is planned for a future release."
- O menu lateral pode ser recolhido (só ícones). Abaixo de 800px de largura ele fica recolhido sempre.
- O breadcrumb do workspace é *Overview / País / Tipo de documento* e cada nível é clicável.

---

## 3. Países

| Código | País | Status | Cenário | Formato XML | Interface (placeholder) | eDocument type (placeholder) |
|---|---|---|---|---|---|---|
| FR | France | Disponível | Reforma B2B de e-Invoicing, UBL 2.1 (EN 16931) | UBL 2.1 Invoice / CreditNote | `FR_UBL_INVOICE` | `FR_INV` |
| PL | Poland | Disponível | KSeF, estrutura FA(2) | KSeF FA(2) | `PL_KSEF_INVOICE` | `PL_INV` |
| DE | Germany | Disponível | XRechnung 3.0 sobre UBL 2.1 | XRechnung UBL | `DE_XRECHNUNG_UBL` | `DE_INV` |
| BE | Belgium | Disponível | B2B obrigatório via Peppol desde 2026 | Peppol BIS Billing 3.0 UBL | `BE_PEPPOL_INVOICE` | `BE_INV` |
| SK | Slovakia | Disponível (etiqueta *2027*) | B2B via Peppol, modelo 5-corner, a partir de jan/2027 | Peppol BIS Billing 3.0 UBL | `SK_PEPPOL_INVOICE` | `SK_INV` |
| AE | UAE | Disponível (etiqueta *2027*) | B2B via Peppol PINT AE, por fases a partir de 2027 | Peppol PINT AE UBL | `AE_PINT_INVOICE` | `AE_INV` |
| BR | Brazil | Planejado (etiqueta *Reform*) | Reforma tributária: CBS e IBS na NF-e | | | |
| HR, GR, IT, MY, PT, SA, ES | Croatia, Greece, Italy, Malaysia, Portugal, Saudi Arabia, Spain | Planejado | Fiscalization 2.0, myDATA, FatturaPA, MyInvois, CIUS-PT, ZATCA, VeriFactu | | | |

Os países citados no vídeo promocional têm uma etiqueta no menu lateral: *Live* (França, Polônia), *2027* (Alemanha, Eslováquia, UAE) e *Reform* (Brasil). Os XMLs de Bélgica, Eslováquia e UAE derivam do exemplo francês (UBL), com dados fictícios de cada país.

> Os nomes de interface e eDocument type são **placeholders** e precisam ser substituídos pelos valores reais do DRC (EDOINTERFACE, EDOTYPE etc.).

O menu lateral mostra um contador (badge) com o total de regras definidas no país, somando todos os tipos de documento.

---

## 4. Tipos de documento

| ID | Label | Origem SAP | Descrição | Tabelas de origem |
|---|---|---|---|---|
| `invoice` | Invoice | SD | Documentos de faturamento de saída criados no SD | VBRK / VBRP |
| `credit` | Credit Note | SD | Notas de crédito de faturamento que corrigem uma fatura anterior | VBRK / VBRP / VBFA |
| `fi` | Accounting Document | FI | Faturas e notas de crédito lançadas direto na contabilidade (FB70 / FB75) | BKPF / BSEG / BSET |

**Regra de negócio importante:** o *Accounting Document* usa o **mesmo XML legal** da Invoice. Muda apenas a origem SAP, por isso o catálogo de campos e as sugestões se adaptam automaticamente (SD ou FI).

Cada combinação **País + Tipo de documento** tem o seu próprio conjunto de regras, independente das outras (chave `PAIS|DOC`, por exemplo `PL|invoice`).

---

## 5. Templates XML por país e documento

| País | Invoice | Credit Note | Accounting Document |
|---|---|---|---|
| PL | `SendInvoiceType` com `n0:Faktura` (KSeF FA(2)), `RodzajFaktury = VAT` | Mesmo XML, com `RodzajFaktury = KOR` | Mesmo XML da Invoice |
| FR | UBL `Invoice`, `InvoiceTypeCode 380`, IVA 20% | UBL `CreditNote`, `CreditNoteTypeCode 381`, com `BillingReference` | Mesmo XML da Invoice |
| DE | UBL `Invoice` com `CustomizationID` XRechnung 3.0, `BuyerReference` = Leitweg-ID, IVA 19% | UBL `CreditNote` com `BillingReference` | Mesmo XML da Invoice |

**Polônia:** é um XML de exemplo do KSeF, só com valores fictícios (wrapper `SendInvoiceType` com `header` + `invoice/n0:Faktura`, namespace `http://crd.gov.pl/wzor/2021/11/29/11089/`). Para deixar a árvore mais leve, foram removidos alguns blocos repetidos: o 2º `Transport`, o 2º `ZamowienieWiersz` e o 2º `Informacje`/`Rejestry` do `Stopka`. Os demais repetidos (Podmiot3, FaWiersz, DaneFaKorygowanej etc.) foram mantidos.

**França e Alemanha:** são UBL de exemplo, montados por um gerador (`ublXml(cc, credit)`) com: CustomizationID, ID, IssueDate, DueDate (só Invoice), TypeCode, Note, DocumentCurrencyCode, BuyerReference, OrderReference, BillingReference (só CreditNote), AccountingSupplierParty, AccountingCustomerParty (EndpointID, PartyIdentification, PostalAddress, PartyTaxScheme, PartyLegalEntity, Contact), PaymentMeans, PaymentTerms, TaxTotal/TaxSubtotal, LegalMonetaryTotal e 2 linhas (InvoiceLine ou CreditNoteLine).

> **Não são** o XML real de saída do DRC. No produto final, o template deve vir do XSD ou do proxy da interface do país.

---

## 6. Modelo de dados do XML (árvore)

O XML é convertido numa árvore de nós. Cada nó tem:

| Atributo | Descrição |
|---|---|
| `id` | Identificador interno único (`n0`, `n1`...) |
| `name` | Nome completo com prefixo (`n0:KodWaluty`) ou `@atributo` |
| `local` | Nome local sem prefixo (`KodWaluty`) |
| `prefix` | Prefixo do namespace (`n0`, `cac`, `cbc`) |
| `depth` | Profundidade na árvore |
| `parent`, `children` | Hierarquia |
| `idx` | Índice da ocorrência quando o elemento se repete entre irmãos (1, 2...); 0 quando é único |
| `path` | XPath-like, por exemplo `/SendInvoiceType/invoice/n0:Faktura/n0:Podmiot3[2]/n0:NrEORI` |
| `isAttr` | `true` para atributos (`@kodSystemowy`, `@currencyID`, `@unitCode`, `@schemeID`) |
| `leaf` | `true` quando o elemento não tem filhos elemento (é mapeável). Atributos também são leaf |
| `value` | Valor de exemplo do XML |
| `total` | Número de folhas (campos mapeáveis) abaixo do nó, incluindo ele próprio |
| `ns` | Declarações de namespace do elemento (só para exibição) |
| `order` | Ordem no documento, usada para ordenar regras e o código |

**Regras:**

- **Só folhas são mapeáveis** (elementos sem filhos elemento e atributos). Nós de grupo mostram apenas contagem.
- Um elemento com texto **e** atributos (por exemplo `KodFormularza`) é mapeável e também expansível para mostrar os atributos.
- Declarações `xmlns` não viram nós mapeáveis.
- **Expansão inicial:** Polônia abre até a profundidade 3 (SendInvoiceType, header/invoice, Faktura). UBL abre só a raiz.

---

## 7. Catálogo de campos SAP

### 7.1 Tabelas e campos

| Tabela | Descrição | Campos |
|---|---|---|
| VBRK | Billing Document: Header | VBELN, FKART, VBTYP, FKDAT, WAERK, NETWR, MWSBK, KUNAG, KUNRG, BUKRS, ZTERM, XBLNR, STCEG, LAND1, INCO1, SFAKN, ERDAT |
| VBRP | Billing Document: Item | POSNR, MATNR, ARKTX, FKIMG, VRKME, NETWR, MWSBP, MWSKZ, AUBEL, VGBEL, CHARG, WERKS |
| VBKD | Sales Document: Business Data | BSTKD, BSTDK, IHREZ, ZTERM |
| VBFA | Sales Document Flow | VBELV, POSNV, VBTYP_V |
| BKPF | Accounting Document Header | BUKRS, BELNR, GJAHR, BLART, BLDAT, BUDAT, WAERS, XBLNR, BKTXT, USNAM, TCODE, STBLG |
| BSEG | Accounting Document Segment | BUZEI, KOART, KUNNR, HKONT, SHKZG, WRBTR, DMBTR, MWSKZ, SGTXT, ZUONR, ZFBDT, ZTERM, MENGE, MEINS |
| BSET | Tax Data Document Segment | MWSKZ, KBETR, FWBAS, FWSTE, HWSTE |
| KNA1 | Customer Master: General Data | KUNNR, NAME1, NAME2, STCEG, STCD1, STCD2, LAND1, ORT01, PSTLZ, STRAS, TELF1, ADRNR |
| ADRC | Addresses (BAS) | NAME1, STREET, HOUSE_NUM1, CITY1, POST_CODE1, COUNTRY, REGION, TEL_NUMBER |
| ADR6 | E-Mail Addresses (BAS) | SMTP_ADDR |
| T001 | Company Codes | BUKRS, BUTXT, LAND1, WAERS, STCEG, ADRNR |
| T012K | House Bank Accounts | HBKID, HKTID, BANKN |
| EDOCUMENT | eDocument | EDOC_GUID, PROCESS, EDOC_TYPE, PROC_STATUS, SOURCE_TYPE, SOURCE_KEY, LAND |
| SYST | ABAP System Fields | DATUM, UZEIT, SYSID |

### 7.2 Agrupamento por origem

| Origem | Grupos exibidos no diálogo |
|---|---|
| **SD** (Invoice, Credit Note) | Billing (VBRK, VBRP, VBKD, VBFA) · Partner (KNA1, ADRC, ADR6) · Company (T001, T012K) · Framework (EDOCUMENT, SYST) |
| **FI** (Accounting Document) | Accounting (BKPF, BSEG, BSET) · Partner · Company · Framework |

**Tabela de item por origem:** SD = `VBRP`, FI = `BSEG` (usada no LOOP de itens na geração de código).

> No produto final, o catálogo deve ser lido do DDIC (DD03L / DD04T) em vez de ser fixo.

---

## 8. Tipos de regra

Um campo do XML pode ter **várias regras** ao mesmo tempo (por exemplo Map + Check + Change, como no diagrama original VBRK-X → Check + Change).

| Tipo | Label | Sigla | Objetivo | Origem SAP |
|---|---|---|---|---|
| `map` | Map value | MAP | Preencher o campo XML com o valor de um campo SAP | Obrigatória |
| `check` | Check | CHECK | Validar um valor antes de criar o eDocument e gerar erro ou warning | Opcional (sem origem, valida o valor que vai no XML) |
| `change` | Change value | CHANGE | Converter o valor SAP antes de gravar no XML | Obrigatória |
| `constant` | Constant | CONST | Gravar sempre um valor fixo | Não usa (é limpa ao salvar) |

**Cores (pills):** MAP azul, CHECK laranja, CHANGE roxo, CONST verde. A regra de relevância do documento (SKIP, seção 8.5) é laranja.

### 8.1 Map value, opções de formato

| Chave | Label | Uso padrão |
|---|---|---|
| `none` | No formatting | Padrão geral |
| `date` | Date as YYYY-MM-DD | Padrão para campos de data (ver 10.3) |
| `dec2` | Decimal, 2 places | Padrão para campos de valor (ver 10.3) |
| `condense` | Condense spaces | |
| `upper` | Upper case | |
| `alpha` | Remove leading zeros | |
| `vatpfx` | Remove country prefix from VAT ID | |

### 8.2 Check, condições

| Chave | Label | Parâmetro | Exemplo |
|---|---|---|---|
| `notInitial` | Is not empty | Não precisa (padrão) | |
| `maxLen` | Maximum length | Número | `10` |
| `pattern` | Matches pattern (regex) | Regex | `^[0-9]{10}$` |
| `inList` | Value in list | Valores separados por vírgula | `PLN,EUR,USD` |
| `ref` | Exists in table | `TABELA-CAMPO` | `T005-LAND1` |

- **Severidade:** `E` = "Error, stop the eDocument" (padrão) ou `W` = "Warning only".
- **Mensagem:** texto livre, padrão `"<Campo> must not be empty"`. É o texto mostrado no eDocument Cockpit.
- Ao trocar a condição, o parâmetro é limpo.

### 8.3 Change value, transformações

| Chave | Label | Parâmetros |
|---|---|---|
| `valmap` | Value mapping | Tabela de pares *SAP value → XML value* (padrão) |
| `concat` | Concatenate with another field | Segundo campo (`TABELA-CAMPO`) e separador (padrão espaço) |
| `sign` | Invert sign (credit notes) | |
| `prefix` | Add prefix | Texto do prefixo |
| `date` | Date to timestamp (ISO 8601) | |
| `round` | Round to 2 decimals | |

**Valores pré-preenchidos no value mapping:**

| Campo XML | Pares |
|---|---|
| `RodzajFaktury` (PL) | F2 → VAT, G2 → KOR, L2 → VAT |
| `InvoiceTypeCode`, `CreditNoteTypeCode` (UBL) | F2 → 380, G2 → 381 |
| `P_12`, `Percent`, Polônia | A1 → 23, A2 → 8, A3 → 5 |
| `P_12`, `Percent`, França | A1 → 20, A2 → 10, A3 → 5.5 |
| `P_12`, `Percent`, Alemanha | A1 → 19, A2 → 7 |
| Outros | Uma linha vazia |

**Regra:** ao abrir *Change value* num campo de valor (`Kwota*`, `P_11` a `P_15`, `*Amount`) que não está na lista de value mapping, a transformação padrão passa a ser **Invert sign**.

### 8.4 Constant

- Campo obrigatório "Constant value".

### 8.5 Relevância do documento (SKIP)

Requisito do documento inteiro, não de um campo do XML. Exemplo: "Billing types ZF2 and ZG2 must not create e-invoices".

- **Como nasce:** pelo AI Assistant, com um cenário aberto. O assistente reconhece o pedido quando o texto cita *billing type* ou *FKART* junto de uma negação (*not, no, never, exclude, skip, without*). Os tipos de faturamento são lidos do texto; se nenhum aparecer, usa ZF2 e ZG2. Cada IA responde com a sua parte e o toast confirma "Rule added: no eDocument for billing types …".
- **Escopo:** só cenários outbound com origem SD. Fica uma regra por país + documento; um pedido novo substitui a anterior.
- **Na lista "All rules":** aparece no topo como *Document relevance*, com a pill **SKIP** (laranja) e a origem `VBRK-FKART`. Excluir funciona como nas outras regras; editar mostra um toast pedindo para descrever a mudança no assistente.
- **No ABAP:** gera o método `IF_EDOC_ADAPTOR~IS_RELEVANT` antes do `SET_OUTPUT_DATA`, com `cv_relevant = abap_false` para os tipos excluídos. Cada IA acrescenta uma linha sobre a regra nas notas de revisão.
- **Generate Code** funciona mesmo quando a única regra do cenário é a de relevância.

---

## 9. Validações ao salvar uma regra

| Condição | Mensagem |
|---|---|
| Map ou Change sem origem SAP | "Pick the SAP source field on the left first." |
| Constant sem valor | "Enter the constant value." |
| Check com condição diferente de *notInitial* e sem parâmetro | "Enter the parameter for this condition." |
| Change *concat* com segundo campo fora do formato `TABELA-CAMPO` (regex `^[A-Z0-9_]+-[A-Z0-9_]+$`, case insensitive) | "Second field must look like TABLE-FIELD, for example ADRC-HOUSE_NUM1." |

- O erro aparece como message strip vermelha dentro do diálogo, que continua aberto.
- Ao salvar: Constant limpa a origem; o segundo campo do *concat* é normalizado (trim + maiúsculas).
- Na edição, a regra é substituída mantendo o mesmo ID.
- Depois de salvar: o diálogo fecha, o campo fica selecionado, o draft passa a "not saved" e aparece o toast "<Tipo> rule added/updated for <Campo>".

---

## 10. Sugestões automáticas

### 10.1 Contexto do campo

O contexto é definido pelo primeiro ancestral (ou o próprio nó) que bater com:

| Contexto | Nós |
|---|---|
| `seller` (vendedor) | Podmiot1, Podmiot1K, AccountingSupplierParty |
| `buyer` (comprador) | Podmiot2, Podmiot2K, AccountingCustomerParty |
| `third` (terceiros) | Podmiot3, PodmiotUpowazniony, Transport, Przewoznik |

**Regra:** campos em contexto `third` **não recebem sugestão**. Campos de parceiro (endereço, nome, VAT) só recebem sugestão em `seller` ou `buyer`.

**Linha de item:** um campo é de item quando tem como ancestral (ou é) `FaWiersz`, `InvoiceLine`, `CreditNoteLine` ou `ZamowienieWiersz`.

### 10.2 Tabela de sugestões (SD / FI)

A primeira sugestão é a preferida (vem pré-selecionada no diálogo e é a usada pelo Auto-suggest).

**Campo `ID` (UBL), depende do pai:**

| Pai | SD | FI |
|---|---|---|
| Raiz do documento | VBRK-VBELN, VBRK-XBLNR | BKPF-XBLNR, BKPF-BELNR |
| InvoiceLine / CreditNoteLine | VBRP-POSNR | BSEG-BUZEI |
| OrderReference | VBKD-BSTKD | BSEG-ZUONR |
| InvoiceDocumentReference | VBFA-VBELV | BKPF-XBLNR |
| PayeeFinancialAccount | T012K-BANKN | T012K-BANKN |
| SellersItemIdentification | VBRP-MATNR | (nenhuma) |
| PartyIdentification | buyer: KNA1-KUNNR, seller: T001-BUKRS | idem |

**Identificação e parceiros:**

| Campo XML | Seller | Buyer |
|---|---|---|
| `NIP`, `CompanyID` (em PartyTaxScheme) | T001-STCEG | SD: VBRK-STCEG, KNA1-STCEG · FI: KNA1-STCEG |
| `CompanyID` (em PartyLegalEntity) | T001-STCEG | KNA1-STCD1 |
| `NazwaHandlowa`, `RegistrationName` | ADRC-NAME1, T001-BUTXT | KNA1-NAME1 |
| `KodKraju`, `IdentificationCode` | T001-LAND1 | KNA1-LAND1, ADRC-COUNTRY |
| `Ulica`, `StreetName` | ADRC-STREET | ADRC-STREET |
| `NrDomu` | ADRC-HOUSE_NUM1 | ADRC-HOUSE_NUM1 |
| `Miejscowosc`, `CityName` | ADRC-CITY1 | ADRC-CITY1 |
| `KodPocztowy`, `PostalZone` | ADRC-POST_CODE1 | ADRC-POST_CODE1 |
| `Wojewodztwo` | ADRC-REGION | ADRC-REGION |
| `Telefon`, `Telephone` | ADRC-TEL_NUMBER | ADRC-TEL_NUMBER |
| `Email`, `ElectronicMail`, `EndpointID` | ADR6-SMTP_ADDR | ADR6-SMTP_ADDR |
| `NrKlienta` | KNA1-KUNNR | KNA1-KUNNR |

**Documento, valores e itens:**

| Campo XML | SD | FI |
|---|---|---|
| `KodWaluty`, `DocumentCurrencyCode`, `@currencyID` | VBRK-WAERK | BKPF-WAERS |
| `P_1`, `IssueDate` | VBRK-FKDAT | BKPF-BLDAT |
| `P_6` | VBRK-FKDAT | BKPF-BUDAT |
| `P_2` | VBRK-VBELN, VBRK-XBLNR | BKPF-XBLNR, BKPF-BELNR |
| `DueDate`, `TerminPlatnosci` | BSEG-ZFBDT | BSEG-ZFBDT |
| `P_7`, `Name` | VBRP-ARKTX | BSEG-SGTXT |
| `P_8A`, `@unitCode` | VBRP-VRKME | BSEG-MEINS |
| `P_8B`, `InvoicedQuantity`, `CreditedQuantity` | VBRP-FKIMG | BSEG-MENGE |
| `P_11` | VBRP-NETWR | BSEG-WRBTR |
| `LineExtensionAmount` (na linha) | VBRP-NETWR | BSEG-WRBTR |
| `LineExtensionAmount` (no cabeçalho) | VBRK-NETWR | BSET-FWBAS |
| `P_12`, `Percent` | VBRP-MWSKZ | BSEG-MWSKZ |
| `P_13_1`, `TaxableAmount`, `TaxExclusiveAmount` | VBRK-NETWR | BSET-FWBAS |
| `P_14_1`, `TaxAmount` | VBRK-MWSBK | BSET-FWSTE |
| `P_15`, `TaxInclusiveAmount`, `PayableAmount` | VBRK-NETWR | BSEG-WRBTR |
| `PriceAmount` | VBRP-NETWR | BSEG-WRBTR |
| `RodzajFaktury`, `InvoiceTypeCode`, `CreditNoteTypeCode` | VBRK-FKART | BKPF-BLART |
| `NrFaKorygowanej` | VBFA-VBELV | BKPF-XBLNR |
| `NrZamowienia` | VBKD-BSTKD | BSEG-ZUONR |
| `DataZamowienia` | VBKD-BSTDK | (nenhuma) |
| `BuyerReference` | VBKD-IHREZ | BSEG-ZUONR |
| `NrRBPL` | T012K-BANKN | T012K-BANKN |
| `NrWierszaFa` | VBRP-POSNR | BSEG-BUZEI |
| `Note` | VBRK-XBLNR | BKPF-BKTXT |
| `DataWytworzeniaFa` | SYST-DATUM | SYST-DATUM |
| `SystemInfo` | SYST-SYSID | SYST-SYSID |

> As sugestões são uma heurística por nome de tag. No produto final, a ideia é ter uma base de conhecimento por país (mapeamento padrão SAP mais o histórico dos projetos).

### 10.3 Defaults por tipo de campo

- **Campos de data** (formato padrão `date`): P_1, P_6, P_6A, IssueDate, DueDate, TerminPlatnosci, DataZamowienia, DataWystFaKorygowanej, DataZaplaty.
- **Campos de valor** (formato padrão `dec2`): regex `^(P_11|P_13_\d|P_14_\d|P_15|.*Amount|Kwota.*|KursWaluty)$`.
- **Campos de value mapping:** RodzajFaktury, InvoiceTypeCode, CreditNoteTypeCode, P_12, Percent.

### 10.4 Auto-suggest (fora da tela por enquanto)

O botão foi retirado do cabeçalho do Workspace em 29/10/2026, a pedido da gestão (gera muitas perguntas na demo). A lógica continua em `engine.autoSuggest` para poder voltar. Para cada folha **sem nenhuma regra**:

1. Ignora o campo se ele ou algum ancestral é a 2ª ocorrência (ou posterior) de um bloco repetido (`idx > 1`). Só a primeira ocorrência é mapeada.
2. Calcula as sugestões; se não houver nenhuma, ignora.
3. Cria uma regra com a primeira sugestão:
   - campos de value mapping → **Change** com `valmap` pré-preenchido;
   - os demais → **Map** com o formato padrão (data, decimal ou nenhum).
4. Marca a regra como `auto: true` (tag "auto" na lista de regras).

Toast: "N suggested rules added. Review them in the rules list." ou "No new suggestions, every known field already has a rule."

---

## 11. Workspace, comportamento da tela

### 11.1 Cabeçalho e KPIs

- Título = tipo de documento; subtítulo = país · formato XML · origem SAP · eDocument type.
- **Fields filled:** folhas com pelo menos uma regra que **não seja Check**, sobre o total de folhas, com barra de progresso.
- **Checks:** número de regras do tipo Check.
- **Rules:** total de regras.

### 11.2 Aba Field Mapping, árvore XML (esquerda)

- Linha: seta de expansão, ícone (pasta = grupo, campo = folha, `@` = atributo), prefixo em cinza, nome local, índice `[n]` se repetido, valor de exemplo.
- Folhas com regra mostram a origem SAP (badge) e as pills das regras.
- Grupos mostram `mapeados/total` (folhas com qualquer regra abaixo do grupo).
- Ações: clique seleciona; duplo clique abre o diálogo em *Map value*; botão **+** (aparece no hover) abre o diálogo.
- **Busca:** procura no nome local, no valor de exemplo e na origem SAP das regras; mostra os resultados com os ancestrais e tudo expandido.
- **Filtros:** All / With rules / Open (sem regra). Filtro ou busca ativos expandem a árvore toda.
- Botões: Expand all, Collapse all (mantém só a raiz aberta).

### 11.3 Painel lateral (direita)

- **Nada selecionado:** dica de uso.
- **Grupo selecionado:** tipo, número de campos e número de campos com regra, com aviso para escolher um campo filho.
- **Folha selecionada:** nome, path, valor de exemplo, tipo (Element/Attribute, line item), número de regras, chips de sugestão (clicar abre o diálogo em Map com aquele campo), botões Map value / Add check / Change value / Constant e lista das regras daquele campo com editar/excluir.
- **Lista "All rules (N)":** todas as regras ordenadas pela ordem do campo no XML e, no mesmo campo, Map → Constant → Change → Check. Colunas: campo (nome + path curto), regra (pill + "auto"), origem SAP e detalhe, ações. Clicar na linha seleciona o campo na árvore, expande os ancestrais e rola até ele. Botão **Clear all** remove todas as regras daquele país + documento.

### 11.4 Diálogo de regra

Inspirado na tela SAP "Select eDocuments" (árvore à esquerda, critérios à direita).

- **Cabeçalho:** "Define rule for <campo>" ou "Edit rule for <campo>", com o path.
- **Esquerda:** catálogo SAP agrupado (ver 7.2), com busca por tabela, campo ou descrição; chips de sugestão; campos sugeridos marcados com ícone. Clique seleciona o campo; duplo clique seleciona e já aplica.
- **Direita:** tipo de regra (segmented button com texto de ajuda), alvo XML (só leitura, com valor de exemplo), origem SAP (token removível), configuração específica do tipo, **preview** em texto e área de erro.
- **Comportamentos:**
  - Ao abrir uma regra nova, a origem vem pré-selecionada com a primeira sugestão (exceto Constant). A tabela dessa origem já vem expandida.
  - Ao trocar para um tipo que não é Constant nem Check sem origem, aplica a primeira sugestão.
  - Escolher um campo SAP com o tipo em Constant muda o tipo para Map. No duplo clique, se estiver em Constant ou Check, muda para Map.
  - Esc ou clique fora fecham o diálogo sem salvar.

**Formato do preview:**

```
Map:      <tag>  ←  ORIGEM
                    <formato, se houver>
Constant: <tag>  =  'valor'
Change:   <tag>  ←  ORIGEM
                    <descrição da transformação>
Check:    CHECK ORIGEM: <condição> <parâmetro>
             otherwise ERROR|WARNING "<mensagem>"
```

### 11.5 Texto de descrição das regras (coluna Details)

| Tipo | Texto |
|---|---|
| Map | "Direct value" ou o label do formato |
| Constant | `Always '<valor>'` |
| Check | `<condição> <parâmetro>, error|warning` |
| Change valmap | `F2 → VAT, G2 → KOR` (ou "Value mapping" se vazio) |
| Change concat | `Concatenate with <campo2>` |
| Change prefix | `Prefix '<texto>'` |
| Change outros | Label da transformação |

### 11.6 Aba XML Preview

- XML indentado com syntax highlight (tags, atributos, valores).
- Linhas de campos com regra ficam destacadas em azul e mostram as pills com a origem (`MAP VBRK-WAERK`). Regras em atributos aparecem na linha do elemento.
- Clicar numa linha destacada volta para Field Mapping com o campo selecionado.

### 11.7 Aba Code Preview

- Mostra o ABAP gerado (ver seção 12) com syntax highlight e numeração de linha, tag "Mock" e botão Copy.
- Sem regras: estado vazio "Nothing to generate yet".

### 11.8 Footer bar

- Status: "Draft, not saved" (bolinha laranja) ou "Draft saved at HH:MM" (verde).
- Contador "N rules · M checks".
- **Save Draft:** só marca o horário (não persiste nada). Qualquer alteração de regra volta o status para "not saved".
- **Generate Code:** abre a aba Code Preview.

---

## 12. Geração de código ABAP (mock)

> Hoje é **montagem de texto por templates** em JavaScript (`genAbap()`), sem leitura do SAP e sem IA. O código **não compila**: serve só para mostrar a ideia.

### 12.1 Estrutura do método gerado

```abap
" ----------------------------------------------------------------
" Generated by GENB Accelerator (mock preview)
" Country ........: Poland (PL)
" Document .......: Invoice, source SD billing (VBRK / VBRP)
" eDocument type .: PL_INV / interface PL_KSEF_INVOICE
" Rules ..........: 4
" ----------------------------------------------------------------
METHOD if_edoc_adaptor~set_output_data.

  DATA(ls_vbrk) = read_vbrk( io_source ).          " 1 por tabela usada no cabeçalho

  " ===== Header =====
  " <n0:NIP>  Check from VBRK-STCEG
  IF ls_vbrk-stceg IS INITIAL.
    add_message( iv_type = 'E' iv_text = 'NIP must not be empty' ).
  ENDIF.

  " <n0:KodWaluty>  Map value from VBRK-WAERK
  cs_output_data-invoice-faktura-fa-kod_waluty = ls_vbrk-waerk.

  " ===== Line items: FaWiersz =====
  LOOP AT read_vbrp_items( io_source ) INTO DATA(ls_vbrp).
    INSERT INITIAL LINE INTO TABLE cs_output_data-invoice-faktura-fa-fa_wiersze-fa_wiersz
           ASSIGNING FIELD-SYMBOL(<ls_line>).

    " <n0:P_7>  Map value from VBRP-ARKTX
    <ls_line>-p_7 = ls_vbrp-arktx.
  ENDLOOP.

ENDMETHOD.
```

### 12.2 Regras de conversão

1. **Ordem:** a mesma da lista de regras (ordem do XML, depois Map → Constant → Change → Check).
2. **Destino (cabeçalho):** `cs_output_data-` + path a partir do filho da raiz. Cada nó é convertido com `snake()`: remove `@`, separa CamelCase com `_`, troca caracteres inválidos por `_`, minúsculas. Nó repetido vira table expression: `podmiot3[ 2 ]`.
3. **Destino (item):** `<ls_line>-` + path relativo ao nó de linha.
4. **Origem:** `TABELA-CAMPO` → `ls_tabela-campo`.
5. **Agrupamento de itens:** regras dentro de `FaWiersz`, `InvoiceLine`, `CreditNoteLine` ou `ZamowienieWiersz` vão para um LOOP por nó de linha. O caminho da tabela é o path do nó de linha **sem índices**.
6. **Variável do LOOP:** tabela de item da origem (`ls_vbrp` no SD, `ls_bseg` no FI). É declarada inline (`INTO DATA(...)`) só no primeiro LOOP e só se essa tabela não foi declarada no cabeçalho.
7. **Declarações:** um `DATA(ls_xxx) = read_xxx( io_source ).` por tabela usada no cabeçalho (inclui o segundo campo do *concat* e tabelas não-item usadas dentro dos itens), em ordem alfabética.
8. **Comentário por regra:** `" <tag>  <Tipo>[ from ORIGEM]`, seguido de linha em branco.
9. **Aspas simples** em literais são duplicadas (`'` → `''`).

### 12.3 Templates por tipo

| Regra | Template |
|---|---|
| Map `none` | `{destino} = {origem}.` |
| Map `date` | `{destino} = \|{ {origem} DATE = ISO }\|.` |
| Map `dec2` | `{destino} = \|{ {origem} DECIMALS = 2 }\|.` |
| Map `condense` | `{destino} = condense( {origem} ).` |
| Map `upper` | `{destino} = to_upper( {origem} ).` |
| Map `alpha` | `{destino} = \|{ {origem} ALPHA = OUT }\|.` |
| Map `vatpfx` | `{destino} = substring( val = {origem} off = 2 ).` |
| Constant | `{destino} = '{valor}'.` |
| Change `valmap` | `{destino} = SWITCH #( {origem} WHEN 'de' THEN 'para' ... ELSE {origem} ).` (pares com "de" vazio são ignorados) |
| Change `concat` | `{destino} = \|{ {origem} }{sep}{ {campo2} }\|.` |
| Change `sign` | `{destino} = {origem} * -1.` |
| Change `prefix` | `{destino} = \|{prefixo}{ {origem} }\|.` |
| Change `date` | `{destino} = \|{ {origem} DATE = ISO }T00:00:00Z\|.` |
| Change `round` | `{destino} = round( val = {origem} dec = 2 ).` |
| Check `notInitial` | `IF {x} IS INITIAL.` |
| Check `maxLen` | `IF strlen( {x} ) > {n}.` |
| Check `pattern` | `IF NOT matches( val = {x} regex = '{regex}' ).` |
| Check `inList` | `IF NOT ( {x} = 'A' OR {x} = 'B' ).` |
| Check `ref` | `SELECT SINGLE @abap_true FROM {tabela} WHERE {campo} = @{x} INTO @DATA(lv_found).` + `IF lv_found = abap_false.` |

Todos os Checks fecham com:

```abap
  add_message( iv_type = '{E|W}' iv_text = '{mensagem}' ).
ENDIF.
```

Onde `{x}` é a origem SAP, ou o próprio destino quando o Check não tem origem.

### 12.4 Limitações conhecidas (por que não compila)

- `read_xxx( )`, `read_xxx_items( )` e `add_message( )` são **placeholders**.
- Os nomes dos componentes da estrutura são **deduzidos** do XML, não lidos do proxy (SPROXY). O proxy real tem nomes próprios, às vezes abreviados.
- Não trata tipagem, conversão de moeda/quantidade, sinal por tipo de documento, nem tabelas aninhadas complexas.
- Usa sempre `if_edoc_adaptor~set_output_data`, sem considerar o método ou BAdI específico de cada país.
- Uma regra de cabeçalho que usa a tabela de item (por exemplo VBRP-MWSKZ em TaxTotal) declara `ls_vbrp` no cabeçalho, e o LOOP reutiliza essa variável.

---

## 13. Estado e persistência

- Tudo fica **em memória** na página: recarregar perde as regras. O mockup não usa localStorage.
- Estruturas principais: `state` (country, doc, view, selected, search, filter, tab, navCollapsed, savedAt), `models` (árvore por `PAIS|DOC`, construída sob demanda e guardada em cache, com o conjunto de nós expandidos) e `rules` (lista de regras por `PAIS|DOC`).
- **Objeto regra:**

```json
{
  "id": "r12",
  "nodeId": "n57",
  "type": "map | check | change | constant",
  "source": "VBRK-WAERK | null",
  "cfg": {
    "format": "none", "cond": "notInitial", "param": "", "severity": "E",
    "msg": "KodWaluty must not be empty", "transform": "valmap",
    "valmap": [{"from": "F2", "to": "VAT"}], "second": "", "sep": " ",
    "prefix": "", "datefmt": "ts", "constant": ""
  },
  "auto": true
}
```

> No produto final, a regra deveria referenciar o **path** do XML e não o `nodeId` interno, para sobreviver a mudanças de template e permitir importar e exportar regras em JSON.

---

## 14. Visual (SAP Fiori, OpenUI5)

O mockup original usava CSS próprio imitando o Horizon. A versão atual é uma app **OpenUI5 freestyle** (tema `sap_horizon`, com troca para `sap_horizon_dark` no menu do perfil), carregada do CDN da SAP na versão LTS **1.148.9**. Não há backend: tudo é mock em memória e a app roda como site estático (GitHub Pages).

| Área | Controle UI5 |
|---|---|
| Cabeçalho no padrão do Work Zone: voltar, logo B&B, título, menu do app, busca, tema, notificações, product switch e perfil fictício | `sap.tnt.ToolHeader` com `Image`, `Link`, `MenuButton`, `SearchField`, `Button` (badge) e `Avatar` |
| Menu lateral recolhível | `sap.tnt.ToolPage` + `sap.tnt.SideNavigation` |
| Overview, País e Workspace | `sap.f.DynamicPage` com breadcrumbs, header e footer |
| Grid de países e tipos de documento | `sap.m.GenericTile` |
| Abas | `sap.m.IconTabBar` (modo inline) |
| Árvore do XML | `sap.ui.table.TreeTable` |
| Pills de regra | `sap.m.ObjectStatus` invertido com Indication colors (MAP 05, CHECK 02, CHANGE 07, CONST 04) |
| Diálogo de regra | `sap.m.Dialog` + `sap.ui.layout.Splitter` + `sap.m.Tree` + `sap.m.SegmentedButton` |
| Code Preview | `sap.ui.codeeditor.CodeEditor` (modo `abap`, só leitura) |
| Estados vazios | `sap.m.IllustratedMessage` |

**Densidade:** Compact por padrão, igual aos apps Fiori Elements no desktop. O parâmetro `?density=cozy` troca para Cozy.

O CSS próprio ([`webapp/css/style.css`](../webapp/css/style.css)) ficou restrito ao que não tem controle UI5 equivalente: o XML Preview anotado, a fonte mono do preview da regra, a altura do diálogo e a cor do título do app no cabeçalho. Ele usa as variáveis CSS do Horizon, por isso funciona no modo claro e no escuro. O logo da B&B troca para a versão branca nos temas escuros.

**Perfil fictício:** Tori Hayes, eDocument Key User (`tori.hayes@demo-company.example`). As notificações e o product switch são ilustrativos.

---

## 15. Próximos passos sugeridos

1. **Templates reais de XML:** carregar do XSD ou do proxy da interface DRC de cada país (EDOINTERFACE + SPROXY).
2. **Metadados reais:** ligar cada nó do XML ao componente ABAP real da estrutura de saída (`cl_abap_typedescr`).
3. **Catálogo dinâmico:** ler tabelas e campos do DDIC (DD03L / DD04T) e permitir tabelas Z.
4. **Templates de código por país:** BAdI/método correto, leitura de fonte (`cl_edoc_source_sd_invoice`, `cl_edoc_source_fi_invoice`) e padrão de mensagens do eDocument Cockpit, seguindo as convenções de Clean ABAP e os padrões de adaptors já usados em projetos anteriores.
5. **Persistência:** salvar e versionar as regras por país e documento (tabela Z ou serviço CAP na SAP Business AI Platform, antigo SAP BTP) e permitir exportar e importar em JSON.
6. **Gerador real:** serviço ABAP ou CAP que recebe as regras e cria a classe via ADT API ou abapGit, com syntax check antes de entregar.
7. **Base de sugestões:** evoluir a heurística para uma base de conhecimento por país, alimentada pelos projetos já entregues.
8. **Novos países:** Brazil, Croatia, Greece, Italy, Malaysia, Portugal, Saudi Arabia e Spain já estão no menu como planejados.

---

## 16. Arquivos

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Bootstrap do OpenUI5 (CDN) |
| `webapp/manifest.json`, `webapp/Component.js` | Descriptor, rotas (`#/`, `#/country/{code}`, `#/country/{code}/{doc}`) e o modelo do perfil fictício |
| `webapp/model/engine.js` | Regras de negócio portadas do mockup original: países, catálogo SAP, templates XML, sugestões, validações, XML Preview e gerador ABAP |
| `webapp/model/plTemplate.js` | XML de exemplo da Polônia (KSeF FA(2)) |
| `webapp/view/*`, `webapp/controller/*` | Telas (App, Home, Country, Workspace) e o diálogo de regra |
| `docs/legacy/edoc-accelerator-mockup.html` | Mockup original em HTML/CSS/JS puro, mantido como referência |
| `docs/bb-edocument-accelerator-spec.md` | Este documento |
