sap.ui.define([
	"./plTemplate",
	"./templates"
], function (PL_XML, templates) {
	"use strict";

	/* ======================= Master data ======================= */
	// One entry per eDocument scenario. Samples are anonymized copies of real SAP DRC output (webapp/samples).
	// company: which XML party is the company code ("seller" for sales, "buyer" for purchases)
	// partner: master data table of the business partner (KNA1 customer, LFA1 supplier)
	const COUNTRIES = [
		{code: "FR", name: "France", short: "2026 reform, UBL + e-reporting", scenario: "B2B e-invoicing and e-reporting reform through a certified platform (PA)", focus: true, docs: [
			{id: "customer-invoice", label: "Customer Invoice", icon: "sap-icon://customer-financial-fact-sheet", src: "SD", dir: "out", company: "seller", partner: "KNA1", sourceType: "SD_INVOICE", edoc: "FR_B2BINV", iface: "FR_UBL_INVOICE", schema: "UBL 2.1 Invoice, EN 16931 (CIUS FR)", format: "UBL 2.1", sample: "fr/customer-invoice.xml", lines: ["InvoiceLine"], depth: 1, objects: ["adaptor", "fields"],
				desc: "Domestic B2B invoices from SD billing, sent to the certified platform.", source: "SD billing (VBRK / VBRP)"},
			{id: "supplier-invoice", label: "Supplier Invoice", icon: "sap-icon://inbox", src: "MM", dir: "in", company: "buyer", partner: "LFA1", sourceType: "INV_VERIF", edoc: "FR_B2BINV", iface: "FR_UBL_INBOUND", schema: "UBL 2.1 Invoice, EN 16931 (received)", format: "UBL 2.1", sample: "fr/supplier-invoice.xml", lines: ["InvoiceLine"], depth: 1, objects: ["inbound"],
				desc: "Incoming invoices received from the platform and posted in invoice verification (MIRO).", source: "MM invoice verification (RBKP / RSEG / EKKO)"},
			{id: "self-billing", label: "Self-billing Invoice", icon: "sap-icon://sales-order", src: "MM", dir: "out", company: "buyer", partner: "LFA1", sourceType: "INV_VERIF", edoc: "FR_B2BINV", iface: "FR_UBL_INVOICE", schema: "UBL 2.1 Invoice, type 389 (autofacturation)", format: "UBL 2.1", sample: "fr/self-billing.xml", lines: ["InvoiceLine"], depth: 1, objects: ["adaptor"],
				desc: "Invoices issued on behalf of suppliers from evaluated receipt settlement (MRRL).", source: "MM self-billing, ERS (RBKP / RSEG)"},
			{id: "e-reporting", label: "E-reporting", icon: "sap-icon://official-service", src: "FI", dir: "out", company: "buyer", partner: "LFA1", sourceType: "EDOC_LIST", edoc: "FR_EREP", iface: "FR_EREPORTING", schema: "E-reporting report, international B2B purchases", format: "E-reporting XML", sample: "fr/e-reporting.xml", lines: ["Invoice"], depth: 2, objects: ["adaptor"],
				desc: "Purchases from foreign suppliers reported to the tax authority, built from FI and MM invoices.", source: "FI / MM invoices (BKPF / BSEG / BSET)"}
		]},
		{code: "DE", name: "Germany", short: "XRechnung, Peppol, ZUGFeRD", scenario: "B2B e-invoicing mandate: XRechnung over Peppol and EN 16931 CII by e-mail", focus: true, docs: [
			{id: "xrechnung-invoice", label: "Customer Invoice (Peppol)", icon: "sap-icon://customer-financial-fact-sheet", src: "SD", dir: "out", company: "seller", partner: "KNA1", sourceType: "SD_INVOICE", edoc: "DE_INV", iface: "DE_XRECHNUNG_SBD", schema: "XRechnung 3.0 UBL in a Peppol SBD", format: "XRechnung UBL (Peppol)", sample: "de/xrechnung-invoice.xml", lines: ["InvoiceLine"], depth: 2, objects: ["adaptor"],
				desc: "SD invoices sent over Peppol, with the billing PDF attached.", source: "SD billing (VBRK / VBRP)"},
			{id: "xrechnung-credit", label: "Credit Note (Peppol)", icon: "sap-icon://credit-card", src: "SD", dir: "out", company: "seller", partner: "KNA1", sourceType: "SD_INVOICE", edoc: "DE_CRE", iface: "DE_XRECHNUNG_SBD", schema: "XRechnung 3.0 UBL CreditNote in a Peppol SBD", format: "XRechnung UBL (Peppol)", sample: "de/xrechnung-credit.xml", lines: ["CreditNoteLine"], depth: 2, objects: ["adaptor"],
				desc: "SD credit memos that reference the original invoice.", source: "SD billing (VBRK / VBRP / VBFA)"},
			{id: "cii-email", label: "FI Invoice by E-mail", icon: "sap-icon://email", src: "FI", dir: "out", company: "seller", partner: "KNA1", sourceType: "FI_INVOICE", edoc: "DE_CII", iface: "DE_CII_EMAIL", schema: "EN 16931 CII (Cross Industry Invoice)", format: "EN 16931 CII", sample: "de/zugferd-email.xml", lines: ["IncludedSupplyChainTradeLineItem"], depth: 2, objects: ["adaptor", "email"],
				desc: "Invoices posted in FI (FB70) and e-mailed to the customer as CII XML.", source: "FI document (BKPF / BSEG / BSET)"}
		]},
		{code: "MX", name: "Mexico", short: "CFDI 4.0, Pagos 2.0", scenario: "CFDI 4.0 clearance through a PAC, with the payment complement (Complemento de Pagos 2.0)", focus: true, docs: [
			{id: "cfdi-invoice", label: "CFDI Invoice", icon: "sap-icon://customer-financial-fact-sheet", src: "SD", dir: "out", company: "seller", partner: "KNA1", sourceType: "SD_INVOICE", edoc: "MX_INVOICE", iface: "MX_CFDI_40", schema: "CFDI 4.0 Comprobante (Anexo 20)", format: "CFDI 4.0", sample: "mx/cfdi-invoice.xml", lines: ["Concepto"], depth: 1, objects: ["adaptor", "fields", "ui"],
				desc: "SD invoices (Ingreso) stamped by the PAC.", source: "SD billing (VBRK / VBRP)"},
			{id: "cfdi-payment", label: "Payment Complement", icon: "sap-icon://payment-approval", src: "FI", dir: "out", company: "seller", partner: "KNA1", sourceType: "FI_INVOICE", edoc: "MX_PAYMENT", iface: "MX_CFDI_PAGOS20", schema: "CFDI 4.0 Pago with Pagos 2.0 complement", format: "CFDI 4.0 + Pagos 2.0", sample: "mx/cfdi-payment.xml", lines: ["DoctoRelacionado"], depth: 2, objects: ["adaptor", "ui"],
				desc: "Incoming payments that settle PPD invoices.", source: "FI clearing (BKPF / BSEG / BSAD)"}
		]},
		{code: "PL", name: "Poland", short: "KSeF, FA(2)", scenario: "KSeF national e-invoicing system, structure FA(2)", docs: [
			{id: "invoice", label: "Invoice", icon: "sap-icon://customer-financial-fact-sheet", src: "SD", dir: "out", company: "seller", partner: "KNA1", sourceType: "SD_INVOICE", edoc: "PL_INV", iface: "PL_KSEF_INVOICE", format: "KSeF FA(2)", schema: "KSeF FA(2)", lines: ["FaWiersz", "ZamowienieWiersz"], depth: 3, objects: ["adaptor"],
				desc: "Outgoing billing documents created in SD billing.", source: "SD billing (VBRK / VBRP)"},
			{id: "credit", label: "Credit Note", icon: "sap-icon://credit-card", src: "SD", dir: "out", company: "seller", partner: "KNA1", sourceType: "SD_INVOICE", edoc: "PL_INV", iface: "PL_KSEF_INVOICE", format: "KSeF FA(2)", schema: "KSeF FA(2), KOR", lines: ["FaWiersz", "ZamowienieWiersz"], depth: 3, objects: ["adaptor"],
				desc: "Billing credit memos that correct a previous invoice.", source: "SD billing (VBRK / VBRP / VBFA)"},
			{id: "fi", label: "Accounting Document", icon: "sap-icon://accounting-document-verification", src: "FI", dir: "out", company: "seller", partner: "KNA1", sourceType: "FI_INVOICE", edoc: "PL_INV", iface: "PL_KSEF_INVOICE", format: "KSeF FA(2)", schema: "KSeF FA(2)", lines: ["FaWiersz", "ZamowienieWiersz"], depth: 3, objects: ["adaptor"],
				desc: "FI invoices and credit memos posted directly in accounting (FB70 / FB75).", source: "FI document (BKPF / BSEG / BSET)"}
		]},
		{code: "BE", name: "Belgium", short: "Peppol BIS 3.0", planned: true},
		{code: "IT", name: "Italy", short: "FatturaPA, SdI", planned: true},
		{code: "PT", name: "Portugal", short: "CIUS-PT", planned: true},
		{code: "ES", name: "Spain", short: "SII / VeriFactu", planned: true}
	].sort((a, b) => !!a.planned - !!b.planned || a.name.localeCompare(b.name)); // available first, each group alphabetical

	// state = IndicationColor used by sap.m.ObjectStatus (MAP blue, CHECK orange, CHANGE purple, CONST green)
	const TYPES = {
		map: {label: "Map value", short: "MAP", icon: "sap-icon://journey-arrive", state: "Indication05", help: "Fill the XML field with the value of an SAP field."},
		check: {label: "Check", short: "CHECK", icon: "sap-icon://shield", state: "Indication02", help: "Validate a value before the eDocument is created and raise an error or a warning."},
		change: {label: "Change value", short: "CHANGE", icon: "sap-icon://switch-views", state: "Indication07", help: "Convert the value before it is written (AIF value map, concatenation, sign, format)."},
		constant: {label: "Constant", short: "CONST", icon: "sap-icon://pushpin-off", state: "Indication04", help: "Always write a fixed value to the XML field."}
	};
	const TYPE_ORDER = {map: 0, constant: 1, change: 2, check: 3};

	const CATALOG = {
		VBRK: {d: "Billing Document: Header", f: [["VBELN", "Billing Document"], ["FKART", "Billing Type"], ["VBTYP", "SD Document Category"], ["FKDAT", "Billing Date"], ["ERZET", "Created At (time)"], ["WAERK", "Document Currency"], ["KURRF", "Exchange Rate"], ["NETWR", "Net Value"], ["MWSBK", "Tax Amount"], ["KUNAG", "Sold-to Party"], ["KUNRG", "Payer"], ["BUKRS", "Company Code"], ["ZTERM", "Terms of Payment"], ["ZLSCH", "Payment Method"], ["XBLNR", "Reference Document Number"], ["STCEG", "VAT Registration Number"], ["LAND1", "Destination Country"], ["INCO1", "Incoterms"], ["SFAKN", "Cancelled Billing Document"], ["FKSTO", "Billing Document Is Cancelled"]]},
		VBRP: {d: "Billing Document: Item", f: [["POSNR", "Item"], ["MATNR", "Material"], ["ARKTX", "Item Description"], ["FKIMG", "Billed Quantity"], ["VRKME", "Sales Unit"], ["NETWR", "Net Value"], ["MWSBP", "Tax Amount"], ["MWSKZ", "Tax Code"], ["SKFBP", "Amount Eligible for Cash Discount"], ["AUBEL", "Sales Document"], ["AUPOS", "Sales Document Item"], ["VGBEL", "Reference Document"], ["CHARG", "Batch"], ["WERKS", "Plant"]]},
		VBKD: {d: "Sales Document: Business Data", f: [["BSTKD", "Customer PO Number"], ["BSTDK", "Customer PO Date"], ["BSTKD_E", "Ship-to PO Number (Leitweg-ID)"], ["IHREZ", "Your Reference"], ["ZTERM", "Terms of Payment"]]},
		VBFA: {d: "Sales Document Flow", f: [["VBELV", "Preceding Document"], ["POSNV", "Preceding Item"], ["VBTYP_V", "Preceding Doc. Category"]]},
		VBPA: {d: "Sales Document: Partner", f: [["PARVW", "Partner Function"], ["KUNNR", "Customer"], ["PERNR", "Personnel Number"], ["ADRNR", "Address Number"]]},
		MARA: {d: "Material Master: General Data", f: [["MATNR", "Material"], ["MEINS", "Base Unit"], ["ZZ1_CLAVEPRODSERV", "SAT Product/Service Key (custom field)"], ["ZZ1_CLAVEUNIDAD", "SAT Unit Key (custom field)"]]},
		BKPF: {d: "Accounting Document Header", f: [["BUKRS", "Company Code"], ["BELNR", "Document Number"], ["GJAHR", "Fiscal Year"], ["BLART", "Document Type"], ["BLDAT", "Document Date"], ["BUDAT", "Posting Date"], ["WAERS", "Currency"], ["KURSF", "Exchange Rate"], ["XBLNR", "Reference"], ["BKTXT", "Document Header Text"], ["AWTYP", "Reference Transaction"], ["AWKEY", "Reference Key"], ["STBLG", "Reversed With"]]},
		BSEG: {d: "Accounting Document Segment", f: [["BUZEI", "Line Item"], ["KOART", "Account Type"], ["KUNNR", "Customer"], ["LIFNR", "Supplier"], ["HKONT", "G/L Account"], ["SHKZG", "Debit/Credit Indicator"], ["WRBTR", "Amount in Doc. Currency"], ["DMBTR", "Amount in Local Currency"], ["MWSKZ", "Tax Code"], ["SGTXT", "Item Text"], ["ZUONR", "Assignment"], ["ZFBDT", "Baseline Date"], ["ZTERM", "Terms of Payment"], ["ZLSCH", "Payment Method"], ["MENGE", "Quantity"], ["MEINS", "Base Unit"], ["AUGBL", "Clearing Document"], ["AUGDT", "Clearing Date"]]},
		BSET: {d: "Tax Data Document Segment", f: [["MWSKZ", "Tax Code"], ["KBETR", "Tax Rate"], ["FWBAS", "Tax Base (Doc. Currency)"], ["FWSTE", "Tax Amount (Doc. Currency)"], ["HWBAS", "Tax Base (Local Currency)"], ["HWSTE", "Tax Amount (Local Currency)"]]},
		BSAD: {d: "Customer Items, Cleared", f: [["BELNR", "Invoice Document"], ["XBLNR", "Reference"], ["AUGBL", "Clearing Document"], ["AUGDT", "Clearing Date"], ["WRBTR", "Amount Paid"], ["WAERS", "Currency"], ["REBZG", "Invoice Reference"]]},
		SKAT: {d: "G/L Account Master: Description", f: [["SAKNR", "G/L Account"], ["TXT50", "G/L Account Long Text"]]},
		RBKP: {d: "Supplier Invoice: Header", f: [["BELNR", "Invoice Document"], ["GJAHR", "Fiscal Year"], ["BLART", "Document Type"], ["BLDAT", "Invoice Date"], ["BUDAT", "Posting Date"], ["XBLNR", "Supplier Invoice Number"], ["LIFNR", "Invoicing Party"], ["BUKRS", "Company Code"], ["WAERS", "Currency"], ["RMWWR", "Gross Invoice Amount"], ["WMWST1", "Tax Amount"], ["ZTERM", "Terms of Payment"], ["ZFBDT", "Baseline Date"], ["IVTYP", "Origin (ERS)"]]},
		RSEG: {d: "Supplier Invoice: Item", f: [["BUZEI", "Invoice Item"], ["EBELN", "Purchase Order"], ["EBELP", "PO Item"], ["MATNR", "Material"], ["MENGE", "Quantity"], ["BSTME", "Order Unit"], ["WRBTR", "Amount"], ["MWSKZ", "Tax Code"]]},
		EKKO: {d: "Purchasing Document Header", f: [["EBELN", "Purchase Order"], ["LIFNR", "Supplier"], ["BEDAT", "Order Date"], ["WAERS", "Currency"], ["ZTERM", "Terms of Payment"]]},
		EKPO: {d: "Purchasing Document Item", f: [["EBELP", "Item"], ["MATNR", "Material"], ["TXZ01", "Short Text"], ["IDNLF", "Supplier Material Number"], ["MENGE", "Quantity"], ["MEINS", "Order Unit"], ["NETPR", "Net Price"]]},
		KNA1: {d: "Customer Master: General Data", f: [["KUNNR", "Customer"], ["NAME1", "Name"], ["STCEG", "VAT Registration Number"], ["STCD1", "Tax Number 1 (RFC)"], ["STCD2", "Tax Number 2 (SIREN)"], ["LAND1", "Country"], ["ADRNR", "Address Number"], ["ZZ1_USOCFDI", "Uso CFDI (custom field)"], ["ZZ1_REGFISCAL", "Régimen Fiscal (custom field)"]]},
		LFA1: {d: "Supplier Master: General Data", f: [["LIFNR", "Supplier"], ["NAME1", "Name"], ["STCEG", "VAT Registration Number"], ["STCD1", "Tax Number 1 (SIRET)"], ["STCD2", "Tax Number 2 (SIREN)"], ["LAND1", "Country"], ["ADRNR", "Address Number"]]},
		ADRC: {d: "Addresses (Business Address Services)", f: [["NAME1", "Name"], ["STREET", "Street"], ["HOUSE_NUM1", "House Number"], ["CITY1", "City"], ["POST_CODE1", "Postal Code"], ["COUNTRY", "Country"], ["REGION", "Region"], ["TEL_NUMBER", "Telephone"]]},
		ADR6: {d: "E-Mail Addresses (BAS)", f: [["SMTP_ADDR", "E-Mail Address"]]},
		T001: {d: "Company Codes", f: [["BUKRS", "Company Code"], ["BUTXT", "Company Name"], ["LAND1", "Country"], ["WAERS", "Currency"], ["STCEG", "VAT Registration Number"], ["ADRNR", "Address Number"]]},
		T001Z: {d: "Company Code: Additional Data", f: [["PARTY", "Parameter Type"], ["PAVAL", "Parameter Value (SIREN, RFC, régimen)"]]},
		T012K: {d: "House Bank Accounts", f: [["HBKID", "House Bank"], ["HKTID", "Account ID"], ["BANKN", "Bank Account Number"]]},
		TIBAN: {d: "IBAN", f: [["IBAN", "IBAN"]]},
		BNKA: {d: "Bank Master Record", f: [["SWIFT", "SWIFT/BIC"]]},
		EDOCUMENT: {d: "eDocument", f: [["EDOC_GUID", "eDocument GUID"], ["PROCESS", "eDocument Process"], ["EDOC_TYPE", "eDocument Type"], ["PROC_STATUS", "Process Status"], ["SOURCE_TYPE", "Source Type"], ["SOURCE_KEY", "Source Key"], ["LAND", "Country"]]},
		EDOMXINVOICE: {d: "eDocument Mexico: Invoice", f: [["UUID", "Fiscal Folio (UUID)"]]},
		TLINE: {d: "Texts (READ_TEXT)", f: [["TDID", "Text ID"], ["TDLINE", "Text Line"]]},
		SYST: {d: "ABAP System Fields", f: [["DATUM", "Current Date"], ["UZEIT", "Current Time"], ["SYSID", "System ID"]]}
	};
	const CAT_BASE = {
		SD: [["Billing", ["VBRK", "VBRP", "VBKD", "VBFA", "VBPA"]], ["Material", ["MARA"]], ["Partner", ["KNA1", "ADRC", "ADR6"]], ["Company", ["T001", "T001Z", "T012K", "TIBAN", "BNKA"]]],
		FI: [["Accounting", ["BKPF", "BSEG", "BSET", "BSAD", "SKAT"]], ["Partner", ["KNA1", "LFA1", "ADRC", "ADR6"]], ["Company", ["T001", "T001Z", "T012K", "TIBAN", "BNKA"]]],
		MM: [["Invoice verification", ["RBKP", "RSEG"]], ["Purchasing", ["EKKO", "EKPO"]], ["Material", ["MARA"]], ["Partner", ["LFA1", "ADRC", "ADR6", "TIBAN", "BNKA"]], ["Company", ["T001", "T001Z"]]]
	};
	const catGroups = (cc, d) => [...CAT_BASE[d.src], ["Texts", ["TLINE"]], ["Framework", cc === "MX" ? ["EDOCUMENT", "EDOMXINVOICE", "SYST"] : ["EDOCUMENT", "SYST"]]];
	const HEAD_TABLE = {SD: "VBRK", FI: "BKPF", MM: "RBKP"};
	const ITEM_TABLE = {SD: "VBRP", FI: "BSEG", MM: "RSEG"};
	const SRC_VAR = {SD: "is_sd_invoice", FI: "is_fi_invoice", MM: "is_mm_invoice"};
	const SRC_TYPE = {SD: "edoc_src_data_sd_invoice", FI: "edoc_src_data_fi_invoice", MM: "edoc_src_data_inv_verif"};

	const FORMATS = {none: "No formatting", date: "Date as YYYY-MM-DD", d102: "Date as YYYYMMDD (format 102)", datetime: "Date and time (YYYY-MM-DDThh:mm:ss)", dec2: "Decimal, 2 places", dec6: "Decimal, 6 places (CFDI)", condense: "Condense spaces", upper: "Upper case", alpha: "Remove leading zeros", vatpfx: "Remove country prefix from VAT ID"};
	const CONDS = {notInitial: "Is not empty", maxLen: "Maximum length", pattern: "Matches pattern (regex)", inList: "Value in list", ref: "Exists in table"};
	const TRANSFORMS = {valmap: "Value mapping (AIF value map)", concat: "Concatenate with another field", sign: "Invert sign (credit notes)", prefix: "Add prefix", date: "Date to timestamp (ISO 8601)", round: "Round to 2 decimals"};

	const DATE_FIELDS = ["P_1", "P_6", "P_6A", "IssueDate", "DueDate", "TaxPointDate", "ActualDeliveryDate", "TerminPlatnosci", "DataZamowienia", "DataWystFaKorygowanej", "DataZaplaty"];
	const D102_FIELDS = ["DateTimeString", "StartDate", "EndDate"];
	const DATETIME_FIELDS = ["Fecha", "FechaPago", "DataWytworzeniaFa"];
	const AMOUNT_RE = /^(P_11|P_13_\d|P_14_\d|P_15|.*Amount|Kwota.*|KursWaluty|SubTotal|Total|Monto.*|Importe.*|Base.*|ImpSaldo.*|ImpPagado|Total.*)$/;
	const DEC6_RE = /^(ValorUnitario|TasaOCuota.*|Importe|Base)$/;
	const VALMAP_FIELDS = ["RodzajFaktury", "InvoiceTypeCode", "CreditNoteTypeCode", "TypeCode", "P_12", "Percent", "RateApplicablePercent", "TipoDeComprobante", "FormaPago", "FormaDePagoP", "MetodoPago", "TasaOCuota", "ClaveUnidad", "unitCode", "PaymentMeansCode", "Serie", "TaxExemptionReasonCode", "CategoryCode", "Code"];

	const fieldDesc = f => { const [t, n] = f.split("-"); const x = CATALOG[t]?.f.find(a => a[0] === n); return x ? x[1] : ""; };
	const country = cc => COUNTRIES.find(c => c.code === cc);
	const docDef = (cc, id) => (country(cc)?.docs || []).find(d => d.id === id);

	/* ======================= Samples ======================= */
	const SAMPLES = {};
	const key = (cc, doc) => cc + "|" + doc;
	/** Load the sample XML of every scenario once, before the router starts. */
	function load() {
		const aJobs = [];
		COUNTRIES.filter(c => !c.planned).forEach(c => c.docs.forEach(d => {
			if (!d.sample) {
				SAMPLES[key(c.code, d.id)] = PL_XML.replace("<n0:RodzajFaktury>Token 211", "<n0:RodzajFaktury>" + (d.id === "credit" ? "KOR" : "VAT"));
				return;
			}
			aJobs.push(fetch(sap.ui.require.toUrl("bnb/edoc/samples/" + d.sample)).then(r => r.text()).then(t => { SAMPLES[key(c.code, d.id)] = t; }));
		}));
		return Promise.all(aJobs);
	}

	/* ======================= XML model ======================= */
	// Repeated elements (invoice lines, notes, payment means...) become ONE node that stands for the list:
	// the structure is the union of all occurrences in the sample, "count" is the most found under one parent.
	function buildModel(xml, expandDepth) {
		const doc = new DOMParser().parseFromString(xml, "application/xml");
		if (doc.getElementsByTagName("parsererror").length) {
			throw new Error("XML parse error");
		}
		const nodes = {};
		let seq = 0;
		function walk(els, parent, depth, count) {
			const el = els[0], id = "n" + (seq++);
			const n = {id, name: el.tagName, local: el.localName, prefix: el.prefix, depth, parent: parent ? parent.id : null, children: [], idx: 0, count, order: seq, isAttr: false, ns: []};
			n.path = (parent ? parent.path : "") + "/" + el.tagName;
			nodes[id] = n;
			const attrs = new Map();
			els.forEach(e => [...e.attributes].forEach(a => attrs.has(a.name) || attrs.set(a.name, a)));
			for (const a of attrs.values()) {
				if (a.name === "xmlns" || a.name.startsWith("xmlns:")) {
					n.ns.push([a.name, a.value]);
					continue;
				}
				const aid = "n" + (seq++);
				nodes[aid] = {id: aid, name: "@" + a.name, local: a.localName, prefix: null, depth: depth + 1, parent: id, children: [], idx: 0, count: 1, order: seq, isAttr: true, leaf: true, value: a.value, path: n.path + "/@" + a.name};
				n.children.push(aid);
			}
			const groups = new Map(), maxPer = {};
			for (const e of els) {
				const per = {};
				for (const k of e.children) {
					(groups.get(k.tagName) || groups.set(k.tagName, []).get(k.tagName)).push(k);
					per[k.tagName] = (per[k.tagName] || 0) + 1;
				}
				Object.entries(per).forEach(([tag, c]) => { maxPer[tag] = Math.max(maxPer[tag] || 0, c); });
			}
			if (!groups.size) {
				n.leaf = true;
				n.value = els.map(e => e.textContent.trim()).find(Boolean) || "";
			} else {
				groups.forEach((g, tag) => n.children.push(walk(g, n, depth + 1, maxPer[tag])));
			}
			return id;
		}
		const root = walk([doc.documentElement], null, 0, 1);
		(function tot(id) { const n = nodes[id]; n.total = (n.leaf ? 1 : 0) + n.children.reduce((s, c) => s + tot(c), 0); return n.total; })(root);
		return {nodes, root, expandDepth};
	}

	/* ======================= Store (in memory) ======================= */
	const models = {}, rules = {};
	let ruleSeq = 1;
	function model(cc, doc) {
		const k = key(cc, doc);
		if (!models[k]) {
			models[k] = buildModel(SAMPLES[k], docDef(cc, doc).depth);
		}
		return models[k];
	}
	function rulesOf(cc, doc) {
		const k = key(cc, doc);
		return rules[k] || (rules[k] = []);
	}
	const countryRuleCount = cc => Object.entries(rules).filter(([k]) => k.startsWith(cc + "|")).reduce((s, [, v]) => s + v.length, 0);
	const docRuleCount = (cc, d) => (rules[key(cc, d)] || []).length;
	const totalRuleCount = () => Object.values(rules).reduce((s, v) => s + v.length, 0);
	const ancestors = (n, m) => { const a = []; let x = n.parent ? m.nodes[n.parent] : null; while (x) { a.push(x); x = x.parent ? m.nodes[x.parent] : null; } return a; };
	const nextRuleId = () => "r" + (ruleSeq++);

	/* ======================= Suggestions ======================= */
	const SELLER = ["Podmiot1", "Podmiot1K", "AccountingSupplierParty", "SellerTradeParty", "Emisor", "Seller"];
	const BUYER = ["Podmiot2", "Podmiot2K", "AccountingCustomerParty", "BuyerTradeParty", "Receptor", "Buyer", "Issuer"];
	const DELIVERY = ["Delivery", "ShipToTradeParty"];
	function ctxOf(n, m) {
		for (const a of [n, ...ancestors(n, m)]) {
			if (SELLER.includes(a.local)) { return "seller"; }
			if (BUYER.includes(a.local)) { return "buyer"; }
			if (DELIVERY.includes(a.local)) { return "delivery"; }
			if (a.local === "Sender" && a.prefix) { return "sbdSender"; }
			if (a.local === "Receiver" && a.prefix) { return "sbdReceiver"; }
			if (["Podmiot3", "PodmiotUpowazniony", "Transport", "Przewoznik", "Sender"].includes(a.local)) { return "third"; }
		}
		return null;
	}
	const lineNodeOf = (n, m, d) => [n, ...ancestors(n, m)].find(a => d.lines.includes(a.local) && a.id !== m.root) || null;
	const isLine = (n, m, d) => !!lineNodeOf(n, m, d);

	// party attribute -> SAP field, for the company code side and the business partner side
	function partyKind(n, P) {
		const L = n.local;
		if (["Name", "RegistrationName", "NazwaHandlowa", "Nombre", "TradingBusinessName"].includes(L)) { return P === "DefinedTradeContact" || P === "Contact" ? null : "name"; }
		if (L === "CompanyID") { return P === "PartyLegalEntity" ? "legal" : "vat"; }
		if (["NIP", "TaxRegistrationId", "CompanyId"].includes(L) || (L === "ID" && ["SpecifiedTaxRegistration", "SpecifiedLegalOrganization"].includes(P))) { return "vat"; }
		if (L === "EndpointID" || (L === "URIID" && P === "URIUniversalCommunication")) { return "endpoint"; }
		if (L === "Id" && P === "Issuer") { return "legal"; }
		if (["StreetName", "LineOne", "Ulica"].includes(L)) { return "street"; }
		if (["CityName", "Miejscowosc"].includes(L)) { return "city"; }
		if (["PostalZone", "PostcodeCode", "KodPocztowy", "DomicilioFiscalReceptor"].includes(L)) { return "zip"; }
		if (["IdentificationCode", "CountryID", "CountryId", "KodKraju"].includes(L)) { return "country"; }
		if (["CountrySubentity", "CountrySubDivisionName", "Wojewodztwo"].includes(L)) { return "region"; }
		if (["Telephone", "CompleteNumber", "Telefon"].includes(L)) { return "phone"; }
		if (["ElectronicMail", "Email"].includes(L) || (L === "URIID" && P === "EmailURIUniversalCommunication")) { return "email"; }
		if (L === "Rfc") { return "rfc"; }
		if (["RegimenFiscal", "RegimenFiscalReceptor"].includes(L)) { return "regimen"; }
		if (L === "UsoCFDI") { return "uso"; }
		if (L === "NrKlienta") { return "number"; }
		return null;
	}
	function partyFields(kind, side, partnerTab, cc) {
		if (side === "company") {
			return {name: ["ADRC-NAME1", "T001-BUTXT"], vat: ["T001-STCEG"], legal: ["T001Z-PAVAL"], endpoint: cc === "FR" ? ["T001Z-PAVAL"] : ["T001-STCEG"], rfc: ["T001Z-PAVAL"], regimen: ["T001Z-PAVAL"],
				street: ["ADRC-STREET"], city: ["ADRC-CITY1"], zip: ["ADRC-POST_CODE1"], country: ["T001-LAND1", "ADRC-COUNTRY"], region: ["ADRC-REGION"], phone: ["ADRC-TEL_NUMBER"], email: ["ADR6-SMTP_ADDR"]}[kind] || [];
		}
		const P = partnerTab;
		return {name: [P + "-NAME1", "ADRC-NAME1"], vat: [P + "-STCEG"], legal: [P + "-STCD2"], endpoint: cc === "FR" ? [P + "-STCD2"] : [P + "-STCEG", "ADR6-SMTP_ADDR"], rfc: [P + "-STCD1"],
			regimen: ["KNA1-ZZ1_REGFISCAL"], uso: ["KNA1-ZZ1_USOCFDI"], number: [P + "-" + (P === "KNA1" ? "KUNNR" : "LIFNR")],
			street: ["ADRC-STREET"], city: ["ADRC-CITY1"], zip: ["ADRC-POST_CODE1"], country: [P + "-LAND1", "ADRC-COUNTRY"], region: ["ADRC-REGION"], phone: ["ADRC-TEL_NUMBER"], email: ["ADR6-SMTP_ADDR"]}[kind] || [];
	}

	// document fields by local name: [SD, FI, MM] suggestions
	const DOCF = {
		currency: [["VBRK-WAERK"], ["BKPF-WAERS"], ["RBKP-WAERS"]],
		docNo: [["VBRK-VBELN", "VBRK-XBLNR"], ["BKPF-BELNR", "BKPF-XBLNR"], ["RBKP-XBLNR", "RBKP-BELNR"]], // MM: supplier's number (inbound)
		docDate: [["VBRK-FKDAT"], ["BKPF-BLDAT"], ["RBKP-BLDAT"]],
		dueDate: [["BSEG-ZFBDT"], ["BSEG-ZFBDT"], ["RBKP-ZFBDT"]],
		docType: [["VBRK-FKART"], ["BKPF-BLART"], ["RBKP-BLART"]],
		netTotal: [["VBRK-NETWR"], ["BSET-FWBAS"], ["RSEG-WRBTR"]],
		taxTotal: [["VBRK-MWSBK"], ["BSET-FWSTE"], ["RBKP-WMWST1"]],
		grossTotal: [["VBRK-NETWR"], ["BSEG-WRBTR"], ["RBKP-RMWWR"]],
		terms: [["VBRK-ZTERM"], ["BSEG-ZTERM"], ["RBKP-ZTERM"]],
		payMethod: [["VBRK-ZLSCH"], ["BSEG-ZLSCH"], []],
		order: [["VBKD-BSTKD"], ["BSEG-ZUONR"], ["RSEG-EBELN"]],
		salesOrder: [["VBRP-AUBEL"], [], ["RSEG-EBELN"]],
		buyerRef: [["VBKD-BSTKD_E", "VBKD-IHREZ"], ["BSEG-ZUONR"], ["EKKO-EBELN"]],
		prevDoc: [["VBFA-VBELV"], ["BKPF-XBLNR"], ["RBKP-XBLNR"]],
		lineNo: [["VBRP-POSNR"], ["BSEG-BUZEI"], ["RSEG-BUZEI"]],
		lineText: [["VBRP-ARKTX"], ["BSEG-SGTXT", "SKAT-TXT50"], ["EKPO-TXZ01"]],
		material: [["VBRP-MATNR"], [], ["EKPO-IDNLF", "RSEG-MATNR"]],
		qty: [["VBRP-FKIMG"], ["BSEG-MENGE"], ["RSEG-MENGE"]],
		unit: [["VBRP-VRKME"], ["BSEG-MEINS"], ["RSEG-BSTME"]],
		lineNet: [["VBRP-NETWR"], ["BSEG-WRBTR"], ["RSEG-WRBTR"]],
		lineTax: [["VBRP-MWSBP"], ["BSET-FWSTE"], []],
		taxCode: [["VBRP-MWSKZ"], ["BSEG-MWSKZ", "BSET-MWSKZ"], ["RSEG-MWSKZ"]]
	};
	const BY_NAME = {
		DocumentCurrencyCode: "currency", KodWaluty: "currency", currencyID: "currency", InvoiceCurrencyCode: "currency", Moneda: "currency", CurrencyCode: "currency", MonedaP: "currency",
		P_2: "docNo", Folio: "docNo",
		IssueDate: "docDate", P_1: "docDate", P_6: "docDate", Fecha: "docDate", TaxPointDate: "docDate", ActualDeliveryDate: "docDate",
		DueDate: "dueDate", TerminPlatnosci: "dueDate",
		InvoiceTypeCode: "docType", CreditNoteTypeCode: "docType", RodzajFaktury: "docType", TipoDeComprobante: "docType", Serie: "docType",
		SubTotal: "netTotal", TaxExclusiveAmount: "netTotal", TaxBasisTotalAmount: "netTotal", P_13_1: "netTotal", TaxableAmount: "netTotal",
		TaxAmount: "taxTotal", TaxTotalAmount: "taxTotal", CalculatedAmount: "taxTotal", P_14_1: "taxTotal", TotalImpuestosTrasladados: "taxTotal",
		Total: "grossTotal", TaxInclusiveAmount: "grossTotal", PayableAmount: "grossTotal", GrandTotalAmount: "grossTotal", DuePayableAmount: "grossTotal", P_15: "grossTotal",
		MetodoPago: "terms", CondicionesDePago: "terms",
		FormaPago: "payMethod", PaymentMeansCode: "payMethod",
		NrZamowienia: "order", BuyerReference: "buyerRef",
		NrFaKorygowanej: "prevDoc",
		NrWierszaFa: "lineNo", LineID: "lineNo",
		P_7: "lineText", Descripcion: "lineText", Description: "lineText",
		SellerAssignedID: "material", NoIdentificacion: "material",
		P_8B: "qty", InvoicedQuantity: "qty", CreditedQuantity: "qty", BilledQuantity: "qty", Cantidad: "qty",
		P_8A: "unit", unitCode: "unit", UnitCode: "unit", ClaveUnidad: "unit",
		P_11: "lineNet", PriceAmount: "lineNet", ChargeAmount: "lineNet", ValorUnitario: "lineNet", LineTotalAmount: "lineNet",
		P_12: "taxCode", Percent: "taxCode", RateApplicablePercent: "taxCode", TasaOCuota: "taxCode", CategoryCode: "taxCode", TaxExemptionReasonCode: "taxCode", TaxExemptionReason: "taxCode"
	};
	const SRC_IDX = {SD: 0, FI: 1, MM: 2};

	function suggest(n, m, cc, d) {
		if (!n || !n.leaf) { return []; }
		const src = d.src, L = n.local, P = n.parent ? m.nodes[n.parent].local : "", ctx = ctxOf(n, m), line = isLine(n, m, d), pick = k => DOCF[k][SRC_IDX[src]];
		const cc2 = concatOf(n, m, d);
		if (cc2) { return [cc2[0]]; }
		if (ctx === "third") { return []; }
		// SBD envelope (Peppol participant IDs)
		if (L === "Identifier") { return ctx === "sbdSender" ? ["T001-STCEG"] : ctx === "sbdReceiver" ? [d.partner + "-STCEG"] : []; }
		if (L === "CreationDateAndTime") { return ["SYST-DATUM"]; }
		// party data
		if (["seller", "buyer", "delivery"].includes(ctx)) {
			const kind = partyKind(n, P);
			if (kind) {
				const side = ctx === "delivery" ? (d.company === "seller" ? "partner" : "company") : (ctx === d.company ? "company" : "partner");
				return partyFields(kind, side, d.partner, cc);
			}
		}
		// e-reporting report header
		if (P === "ReportDocument" && L === "Id") { return ["EDOCUMENT-EDOC_GUID"]; }
		if (P === "IssueDateTime" && m.nodes[m.root].local === "Report") { return ["SYST-DATUM"]; }
		// Mexico: CFDI header, stamp and payment complement
		if (L === "LugarExpedicion") { return ["ADRC-POST_CODE1"]; }
		if (L === "TipoCambio" || L === "TipoCambioP") { return src === "SD" ? ["VBRK-KURRF"] : ["BKPF-KURSF"]; }
		if (L === "ClaveProdServ") { return ["MARA-ZZ1_CLAVEPRODSERV"]; }
		if (L === "FechaPago") { return ["BKPF-BUDAT"]; }
		if (L === "FormaDePagoP") { return ["BSEG-ZLSCH"]; }
		if (L === "Monto" || L === "MontoTotalPagos") { return ["BSEG-WRBTR"]; }
		if (L === "CtaBeneficiario") { return ["T012K-BANKN"]; }
		if (L === "IdDocumento") { return ["EDOMXINVOICE-UUID"]; }
		if (["ImpSaldoAnt", "ImpPagado", "BaseDR", "BaseP"].includes(L)) { return ["BSAD-WRBTR"]; }
		if (L === "MonedaDR") { return ["BSAD-WAERS"]; }
		if (L === "Importe" && P === "Concepto") { return ["VBRP-NETWR"]; }
		if (L === "Importe" && P === "Traslado") { return line ? ["VBRP-MWSBP"] : ["VBRK-MWSBK"]; }
		if (L === "Base" && P === "Traslado") { return line ? ["VBRP-NETWR"] : ["VBRK-NETWR"]; }
		// line and header identifiers
		if (L === "ID" || L === "Id") {
			if (n.parent === m.root || P === "ExchangedDocument" || (P === "Invoice" && line)) { return pick("docNo"); }
			if (d.lines.includes(P)) { return pick("lineNo"); }
			if (P === "OrderReference") { return pick("order"); }
			if (P === "InvoiceDocumentReference") { return pick("prevDoc"); }
			if (P === "PayeeFinancialAccount") { return ["TIBAN-IBAN"]; }
			if (P === "FinancialInstitutionBranch") { return ["BNKA-SWIFT"]; }
			if (P === "SellersItemIdentification") { return pick("material"); }
			if (P === "PartyIdentification") { return d.partner === "LFA1" ? ["LFA1-STCD1"] : ["KNA1-KUNNR"]; }
			if (P === "BusinessProcess") { return ["BSET-MWSKZ"]; }
			if (P === "TaxCategory" || P === "ClassifiedTaxCategory") { return pick("taxCode"); }
			return [];
		}
		if (L === "SalesOrderID" || (L === "IssuerAssignedID" && P === "SellerOrderReferencedDocument")) { return pick("salesOrder"); }
		if (L === "IssuerAssignedID") { return pick("order"); }
		if (L === "PaymentID") { return pick("docNo"); }
		if (L === "IBANID") { return ["TIBAN-IBAN"]; }
		if (L === "BICID") { return ["BNKA-SWIFT"]; }
		if (L === "DateTimeString") { return P === "DueDateDateTime" ? pick("dueDate") : P === "OccurrenceDateTime" ? pick("docDate") : pick("docDate"); }
		if (L === "Name" && (line || P === "Item" || P === "Product" || P === "SpecifiedTradeProduct")) { return pick("lineText"); }
		if (L === "TypeCode") { return P === "ExchangedDocument" || P === "Invoice" ? pick("docType") : []; }
		if (L === "Note" && P === "PaymentTerms") { return pick("terms"); }
		if (L === "Note") { return ["TLINE-TDLINE"]; }
		if (L === "Code" && P === "TaxCategory") { return pick("taxCode"); }
		if (L === "Percent" && m.nodes[m.root].local === "Report") { return ["BSET-KBETR"]; }
		if (L === "LineExtensionAmount") { return line ? pick("lineNet") : pick("netTotal"); }
		if (L === "TaxExclusiveAmount" && line) { return pick("lineNet"); }
		if (L === "TaxAmount" && line) { return pick("lineTax"); }
		if (L === "DataWytworzeniaFa") { return ["SYST-DATUM"]; }
		if (L === "SystemInfo") { return ["SYST-SYSID"]; }
		if (L === "NrRBPL") { return ["T012K-BANKN"]; }
		if (L === "DataZamowienia") { return src === "SD" ? ["VBKD-BSTDK"] : []; }
		if (L === "Folio" && src === "FI") { return ["BKPF-BELNR"]; }
		const k = BY_NAME[L];
		return k ? pick(k) : [];
	}

	// fixed values that Auto-suggest turns into Constant rules
	const CONST_NAMES = ["CustomizationID", "ProfileID", "Version", "Exportacion", "Impuesto", "ImpuestoDR", "ImpuestoP", "TipoFactor", "TipoFactorDR", "TipoFactorP", "ObjetoImp", "ObjetoImpDR", "HeaderVersion", "Standard", "TypeVersion", "Authority", "schemeID", "schemeId", "TaxDueDateTypeCode", "TypeID", "DescriptionCode", "EquivalenciaDR", "NumParcialidad", "KodFormularza", "WariantFormularza"];
	function constantOf(n, m) {
		const P = n.parent ? m.nodes[n.parent].local : "";
		if (!n.value) { return null; }
		if (CONST_NAMES.includes(n.local)) { return n.value; }
		if (P === "TaxScheme" && n.local === "ID") { return n.value; }
		if (["BusinessProcessSpecifiedDocumentContextParameter", "GuidelineSpecifiedDocumentContextParameter"].includes(P)) { return n.value; }
		if (n.local === "TypeCode" && P === "ApplicableTradeTax") { return n.value; }
		return null;
	}

	// self-billing numbers are built from two SAP fields: [first, second, separator]
	function concatOf(n, m, d) {
		if (d.src !== "MM" || d.dir !== "out" || !n.leaf) { return null; }
		if (n.local === "ID" && n.parent === m.root) { return ["RBKP-BELNR", "RBKP-GJAHR", ""]; }
		if (n.local === "Name" && isLine(n, m, d)) { return ["RSEG-EBELN", "RSEG-EBELP", " "]; }
		return null;
	}

	function prefillValmap(n, cc, d) {
		const L = n.local, vm = a => a.map(([from, to]) => ({from, to}));
		if (L === "RodzajFaktury") { return vm([["F2", "VAT"], ["G2", "KOR"], ["L2", "VAT"]]); }
		if (["InvoiceTypeCode", "CreditNoteTypeCode", "TypeCode"].includes(L)) { return d.src === "MM" ? vm([["RE", "380"], ["ERS", "389"], ["KG", "381"]]) : d.src === "FI" ? vm([["DR", "380"], ["DG", "381"]]) : vm([["F2", "380"], ["G2", "381"], ["L2", "384"]]); }
		if (L === "TipoDeComprobante") { return vm([["F2", "I"], ["G2", "E"], ["L2", "I"]]); }
		if (L === "Serie") { return vm([["F2", "01"], ["G2", "02"]]); }
		if (["FormaPago", "FormaDePagoP"].includes(L)) { return vm([["T", "03"], ["C", "02"], ["", "99"]]); }
		if (L === "MetodoPago") { return vm([["0001", "PUE"], ["Z030", "PPD"], ["Z075", "PPD"]]); }
		if (L === "TasaOCuota") { return vm([["A1", "0.160000"], ["A0", "0.000000"]]); }
		if (L === "ClaveUnidad") { return vm([["ST", "H87"], ["H", "HUR"], ["LE", "E48"]]); }
		if (L === "unitCode" || L === "UnitCode") { return vm([["ST", "H87"], ["PC", "H87"], ["H", "HUR"], ["KG", "KGM"]]); }
		if (L === "PaymentMeansCode") { return vm([["D", "59"], ["T", "30"], ["U", "58"]]); }
		if (L === "TaxExemptionReasonCode") { return vm([["A0", "VATEX-FR-CGI275"], ["E0", "VATEX-EU-132"], ["R1", "VATEX-EU-AE"]]); }
		if (["CategoryCode", "Code"].includes(L)) { return vm([["A1", "S"], ["A0", "E"], ["R1", "AE"]]); }
		if (["P_12", "Percent", "RateApplicablePercent"].includes(L)) {
			const r = {PL: [["A1", "23"], ["A2", "8"], ["A3", "5"]], FR: [["A1", "20"], ["A2", "10"], ["A3", "5.5"]], DE: [["A1", "19"], ["A2", "7"]], MX: [["A1", "16"], ["A0", "0"]]}[cc];
			return vm(r);
		}
		return [{from: "", to: ""}];
	}
	function defaultCfg(n, cc, d) {
		const fmt = DATE_FIELDS.includes(n.local) ? "date" : D102_FIELDS.includes(n.local) ? "d102" : DATETIME_FIELDS.includes(n.local) ? "datetime" : cc === "MX" && DEC6_RE.test(n.local) ? "dec6" : AMOUNT_RE.test(n.local) ? "dec2" : "none";
		return {format: fmt, cond: "notInitial", param: "", severity: "E", msg: `${n.local} must not be empty`, transform: "valmap", valmap: prefillValmap(n, cc, d), second: "", sep: " ", prefix: "", datefmt: "ts", constant: ""};
	}

	/* ======================= Rule texts ======================= */
	function describe(r) {
		const c = r.cfg;
		switch (r.type) {
			case "map": return c.format === "none" ? "Direct value" : FORMATS[c.format];
			case "constant": return `Always '${c.constant}'`;
			case "check": {
				const p = c.cond === "notInitial" ? "" : ` ${c.param}`;
				return `${CONDS[c.cond]}${p}, ${c.severity === "E" ? "error" : "warning"}`;
			}
			case "change": switch (c.transform) {
				case "valmap": return c.valmap.filter(v => v.from || v.to).map(v => `${v.from || "(empty)"} → ${v.to}`).join(", ") || "Value mapping";
				case "concat": return `Concatenate with ${c.second || "?"}`;
				case "prefix": return `Prefix '${c.prefix}'`;
				default: return TRANSFORMS[c.transform];
			}
		}
		return "";
	}
	function previewText(n, r, bInbound) {
		const tag = `<${n.name}>`, src = r.source || (r.type === "check" ? "XML value" : "?");
		const arrow = (a, b) => bInbound ? `${b}  ←  ${a}` : `${a}  ←  ${b}`;
		switch (r.type) {
			case "map": return `${arrow(tag, src)}${r.cfg.format !== "none" ? `\n           ${FORMATS[r.cfg.format]}` : ""}`;
			case "constant": return `${tag}  =  '${r.cfg.constant}'`;
			case "change": return `${arrow(tag, src)}\n           ${describe(r)}`;
			case "check": return `CHECK ${src}: ${CONDS[r.cfg.cond]}${r.cfg.cond === "notInitial" ? "" : " " + r.cfg.param}\n   otherwise ${r.cfg.severity === "E" ? "ERROR" : "WARNING"} "${r.cfg.msg}"`;
		}
		return "";
	}
	function validate(r) {
		const c = r.cfg;
		if ((r.type === "map" || r.type === "change") && !r.source) { return "Pick the SAP field on the left first."; }
		if (r.type === "constant" && !c.constant.trim()) { return "Enter the constant value."; }
		if (r.type === "check" && c.cond !== "notInitial" && !c.param.trim()) { return "Enter the parameter for this condition."; }
		if (r.type === "change" && c.transform === "concat" && !/^[A-Z0-9_]+-[A-Z0-9_]+$/i.test(c.second.trim())) { return "Second field must look like TABLE-FIELD, for example ADRC-HOUSE_NUM1."; }
		return "";
	}

	function sortedRules(cc, doc) {
		const m = model(cc, doc);
		return [...rulesOf(cc, doc)].sort((a, b) => m.nodes[a.nodeId].order - m.nodes[b.nodeId].order || TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);
	}
	function stats(cc, doc) {
		const m = model(cc, doc), R = rulesOf(cc, doc), leaves = Object.values(m.nodes).filter(n => n.leaf);
		const filled = new Set(R.filter(r => r.type !== "check").map(r => r.nodeId));
		return {total: leaves.length, filled: filled.size, checks: R.filter(r => r.type === "check").length, rules: R.length};
	}
	function mappedCounts(cc, doc) {
		const m = model(cc, doc), cnt = {};
		for (const id of new Set(rulesOf(cc, doc).map(r => r.nodeId))) {
			const n = m.nodes[id];
			if (n) { ancestors(n, m).forEach(a => { cnt[a.id] = (cnt[a.id] || 0) + 1; }); }
		}
		return cnt;
	}

	/* ======================= Auto-suggest ======================= */
	function autoSuggest(cc, doc) {
		const m = model(cc, doc), d = docDef(cc, doc), R = rulesOf(cc, doc);
		let added = 0;
		for (const n of Object.values(m.nodes)) {
			if (!n.leaf || R.some(r => r.nodeId === n.id)) { continue; }
			const cfg = defaultCfg(n, cc, d), sConst = constantOf(n, m);
			if (sConst !== null && d.dir === "in") {
				// inbound: only the format identifiers are worth validating
				if (["CustomizationID", "ProfileID"].includes(n.local)) {
					Object.assign(cfg, {cond: "inList", param: sConst, severity: "E", msg: `Unsupported ${n.local}, expected ${sConst}`});
					R.push({id: nextRuleId(), nodeId: n.id, type: "check", source: null, cfg, auto: true});
					added++;
				}
				continue;
			}
			if (sConst !== null) {
				cfg.constant = sConst;
				R.push({id: nextRuleId(), nodeId: n.id, type: "constant", source: null, cfg, auto: true});
				added++;
				continue;
			}
			const aConcat = concatOf(n, m, d);
			if (aConcat) {
				Object.assign(cfg, {transform: "concat", second: aConcat[1], sep: aConcat[2]});
				R.push({id: nextRuleId(), nodeId: n.id, type: "change", source: aConcat[0], cfg, auto: true});
				added++;
				continue;
			}
			const sg = suggest(n, m, cc, d);
			if (!sg.length) { continue; }
			const vm = VALMAP_FIELDS.includes(n.local) && cfg.valmap[0].to;
			R.push({id: nextRuleId(), nodeId: n.id, type: vm ? "change" : "map", source: sg[0], cfg, auto: true});
			added++;
		}
		return added;
	}

	/* ======================= XML preview ======================= */
	const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"}[c]));
	function xmlHtml(cc, doc) {
		const m = model(cc, doc), R = rulesOf(cc, doc), out = [];
		const rulesFor = id => R.filter(r => r.nodeId === id);
		const attrs = n => n.children.map(id => m.nodes[id]).filter(c => c.isAttr).map(a => ` <span class="xa">${esc(a.name.slice(1))}</span>=<span class="xv">"${esc(a.value)}"</span>`).join("");
		const ns = n => n.ns.map(([k, v]) => ` <span class="xa">${esc(k)}</span>=<span class="xv">"${esc(v)}"</span>`).join("");
		const notes = rs => rs.length ? `<span class="xnote">${rs.map(r => `<span class="edocPill edocPill-${r.type}">${TYPES[r.type].short}${r.source ? " " + r.source : ""}</span>`).join("")}</span>` : "";
		(function walk(id, ind) {
			const n = m.nodes[id];
			if (n.isAttr) { return; }
			const pad = "  ".repeat(ind), kids = n.children.map(i => m.nodes[i]).filter(c => !c.isAttr);
			const rs = [...rulesFor(id), ...n.children.filter(i => m.nodes[i].isAttr).flatMap(rulesFor)];
			const open = `<span class="xt">&lt;${esc(n.name)}</span>${ns(n)}${attrs(n)}<span class="xt">${kids.length || n.value ? "&gt;" : "/&gt;"}</span>`;
			const line = (html, bMapped) => out.push(`<div class="xl ${bMapped ? "mapped" : ""}" ${bMapped ? `data-id="${id}"` : ""}><span>${pad}${html}</span>${bMapped ? notes(rs) : ""}</div>`);
			if (!kids.length) {
				line(open + (n.value ? `<span class="xx">${esc(n.value)}</span><span class="xt">&lt;/${esc(n.name)}&gt;</span>` : ""), rs.length > 0);
			} else {
				line(open, rs.length > 0);
				kids.forEach(k => walk(k.id, ind + 1));
				out.push(`<div class="xl"><span>${pad}<span class="xt">&lt;/${esc(n.name)}&gt;</span></span></div>`);
			}
			if (n.count > 1) {
				out.push(`<div class="xl"><span>${pad}<span class="xc">&lt;!-- repeats 1..n, ${n.count} in this sample --&gt;</span></span></div>`);
			}
		})(m.root, 0);
		return out.join("");
	}

	/* ======================= ABAP mock generator ======================= */
	const snake = s => s.replace(/^@/, "").replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^A-Za-z0-9_]/g, "_").toLowerCase();
	const q = s => String(s ?? "").replace(/'/g, "''");
	const className = (cc, d) => d.dir === "in" ? `ZCL_GENB_EDOC_INBOUND_${cc}` : `ZCL_GENB_EDOC_ADAPTOR_${cc}`;
	const vmapName = (cc, n) => `ZGENB_${cc}_${snake(n.local).toUpperCase()}`.slice(0, 30);

	function genAbap(cc, doc) {
		const c = country(cc), d = docDef(cc, doc), m = model(cc, doc), rs = sortedRules(cc, doc);
		if (!rs.length) { return null; }
		const bIn = d.dir === "in", srcVar = SRC_VAR[d.src], itemTab = ITEM_TABLE[d.src], sfx = d.src.toLowerCase();
		const seg = n => snake(n.local);
		const pathFrom = (n, stop) => { const parts = []; let x = n; while (x && x.id !== stop) { parts.unshift(seg(x)); x = x.parent ? m.nodes[x.parent] : null; } return parts.join("-"); };
		const helpers = new Set(), vmaps = [], LINE_TABS = ["MARA", "EKPO", "SKAT", "BSAD", "EDOMXINVOICE"];
		let lineHelpers = null; // helper reads of the line loop being generated
		// SAP side of a rule: source data of the eDocument (outbound) or SAP target structure (inbound)
		const sapRef = (f, inLoop) => {
			const [t, fl] = f.split("-"), x = fl.toLowerCase();
			if (bIn && (t === itemTab || t === "EKPO")) { return inLoop ? `<ls_item>-${x}` : `cs_invoice-items[ 1 ]-${x}`; }
			if (bIn) { return `cs_invoice-${t === HEAD_TABLE[d.src] ? "header" : t.toLowerCase()}-${x}`; }
			if (t === HEAD_TABLE[d.src]) { return `${srcVar}-document_header-${x}`; }
			if (t === itemTab) { return inLoop ? `ls_item-${x}` : `${srcVar}-document_item[ 1 ]-${x}`; }
			if (t === "BSET") { return `${srcVar}-bset[ 1 ]-${x}`; }
			if (t === "SYST") { return `sy-${x}`; }
			(inLoop && LINE_TABS.includes(t) ? lineHelpers : helpers).add(t);
			return `ls_${t.toLowerCase()}-${x}`;
		};
		const fmt = (x, f) => ({none: x, date: `|{ ${x} DATE = ISO }|`, d102: x, datetime: `|{ ${x} DATE = ISO }T{ ${srcVar}-document_header-erzet TIME = ISO }|`, dec2: `|{ ${x} DECIMALS = 2 }|`, dec6: `|{ ${x} DECIMALS = 6 }|`, condense: `condense( ${x} )`, upper: `to_upper( ${x} )`, alpha: `|{ ${x} ALPHA = OUT }|`, vatpfx: `substring( val = ${x} off = 2 )`}[f] || x);
		function value(r, n, x) {
			if (r.type === "map") { return fmt(x, r.cfg.format); }
			if (r.type === "constant") { return `'${q(r.cfg.constant)}'`; }
			const cf = r.cfg;
			switch (cf.transform) {
				case "valmap": {
					const v = vmapName(cc, n);
					if (!vmaps.some(([x]) => x === v)) {
						vmaps.push([v, cf.valmap.filter(e => e.from || e.to)]);
					}
					return `get_aif_value( iv_vmapname = '${v}'\n               iv_int_value = ${x} )`;
				}
				case "concat": return `|{ ${x} }${cf.sep}{ ${sapRef(cf.second, true)} }|`;
				case "sign": return `${x} * -1`;
				case "prefix": return `|${cf.prefix}{ ${x} }|`;
				case "date": return `|{ ${x} DATE = ISO }T00:00:00Z|`;
				case "round": return `round( val = ${x} dec = 2 )`;
			}
			return x;
		}
		function checkCode(r, x, n) {
			const cf = r.cfg, out = [];
			let cond;
			if (cf.cond === "notInitial") { cond = `${x} IS INITIAL`; }
			else if (cf.cond === "maxLen") { cond = `strlen( ${x} ) > ${parseInt(cf.param, 10) || 0}`; }
			else if (cf.cond === "pattern") { cond = `NOT matches( val = ${x} regex = '${q(cf.param)}' )`; }
			else if (cf.cond === "inList") { cond = `NOT ( ${cf.param.split(",").map(v => `${x} = '${q(v.trim())}'`).join(" OR ")} )`; }
			else { const [t, f = "KEY"] = cf.param.toUpperCase().split("-"); out.push(`SELECT SINGLE @abap_true FROM ${t.toLowerCase()} WHERE ${f.toLowerCase()} = @${x} INTO @DATA(lv_found_${snake(n.local)}).`); cond = `lv_found_${snake(n.local)} = abap_false`; }
			const sMsg = `|${q(cf.msg)}|`;
			out.push(`IF ${cond}.`, cf.severity === "E" ? `  INSERT ${sMsg} INTO TABLE lt_error_txt.` : `  cl_edoc_util=>add_message( iv_msgty = 'W' iv_text = ${sMsg} ).`, "ENDIF.");
			return out;
		}

		const header = [], checks = [], lines = {};
		for (const r of rs) {
			const n = m.nodes[r.nodeId], ln = lineNodeOf(n, m, d), xmlRoot = bIn ? "is_xml" : "cs_output_data";
			let xml, bucket, inLoop = false;
			if (ln) {
				const k = pathFrom(ln, m.root).replace(/\[ \d+ \]/g, "");
				lines[k] = lines[k] || {node: ln, out: [], helpers: new Set()};
				bucket = lines[k].out;
				lineHelpers = lines[k].helpers;
				xml = bIn ? `ls_line-${pathFrom(n, ln.id)}` : `<ls_line>-${pathFrom(n, ln.id)}`;
				inLoop = true;
			} else {
				bucket = header;
				xml = `${xmlRoot}-${pathFrom(n, m.root)}`;
			}
			const sap = r.source ? sapRef(r.source, inLoop) : null;
			const note = `" <${n.name}>  ${TYPES[r.type].label}${r.source ? (bIn ? " into " : " from ") + r.source : ""}`;
			if (r.type === "check") {
				(inLoop ? bucket : checks).push(note, ...checkCode(r, bIn ? xml : (sap || xml), n), "");
				continue;
			}
			if (bIn && r.type === "constant") {
				// inbound: a fixed value becomes a validation of the received XML
				bucket.push(note.replace("Constant", "Expected value"), `IF ${xml} <> '${q(r.cfg.constant)}'.`, `  INSERT |Unexpected <${n.local}>: { ${xml} }| INTO TABLE lt_error_txt.`, "ENDIF.", "");
				continue;
			}
			const tgt = bIn ? sap : xml, src = bIn ? xml : sap;
			const v = value(r, n, src).split("\n"), padN = tgt.length + 3;
			if (!bIn && n.count > 1 && !ln) {
				// repeated element outside the line items, e.g. one Note per text line
				bucket.push(note, `APPEND ${v.join(" ")} TO ${tgt}.`, "");
				continue;
			}
			bucket.push(note, `${tgt} = ${v[0]}`, ...v.slice(1).map(l => " ".repeat(padN) + l));
			bucket[bucket.length - 1] += ".";
			bucket.push("");
		}

		const ind = (a, s) => a.map(l => l ? s + l : "");
		const out = [
			"\" ----------------------------------------------------------------",
			"\" Generated by GENB eDocument Accelerator (mock preview)",
			`" Country ........: ${c.name} (${c.code})`,
			`" Scenario .......: ${d.label}, ${d.dir === "in" ? "inbound" : "outbound"}`,
			`" eDocument type .: ${d.edoc} / interface ${d.iface}`,
			`" Source type ....: ${d.sourceType}, ${d.source}`,
			`" Rules ..........: ${rs.length}`,
			"\" ----------------------------------------------------------------",
			`CLASS ${className(cc, d).toLowerCase()} IMPLEMENTATION.`, ""];
		const helperDecl = () => [...helpers].sort().map(t => `DATA(ls_${t.toLowerCase()}) = read_${t.toLowerCase()}( ${bIn ? "cs_invoice" : srcVar} ).`);
		if (bIn) {
			out.push("  METHOD zif_genb_edoc_inbound~map_invoice.",
				"    \" is_xml: received UBL invoice, cs_invoice: MM invoice to post (MIRO)",
				"    DATA lt_error_txt TYPE string_table.", "");
		} else {
			out.push("  METHOD if_edoc_adaptor~set_output_data.",
				`    CHECK iv_interface_id = '${d.iface}'.`, "",
				"    CASE io_source->mv_source_type.",
				`      WHEN '${d.sourceType}'.`,
				`        DATA(${srcVar.replace("is_", "ls_")}) = VALUE ${SRC_TYPE[d.src]}( ).`,
				`        io_source->get_data( IMPORTING es_data = ${srcVar.replace("is_", "ls_")} ).`,
				`        set_output_${sfx}( EXPORTING ${srcVar}   = ${srcVar.replace("is_", "ls_")}`,
				`${" ".repeat(21 + sfx.length)}CHANGING  cs_output_data = cs_output_data ).`,
				"    ENDCASE.",
				"  ENDMETHOD.", "",
				`  METHOD set_output_${sfx}.`,
				"    DATA lt_error_txt TYPE string_table.", "");
		}
		const body = [];
		if (header.length) { body.push("\" ===== Header =====", ...header); }
		for (const [k, g] of Object.entries(lines)) {
			body.push(`" ===== Line items: ${g.node.local} =====`);
			if (bIn) {
				body.push(`LOOP AT is_xml-${k} INTO DATA(ls_line).`, "  INSERT INITIAL LINE INTO TABLE cs_invoice-items ASSIGNING FIELD-SYMBOL(<ls_item>).", "");
			} else {
				body.push(`LOOP AT ${srcVar}-document_item INTO DATA(ls_item).`, `  INSERT INITIAL LINE INTO TABLE cs_output_data-${k} ASSIGNING FIELD-SYMBOL(<ls_line>).`);
				[...g.helpers].sort().forEach(x => body.push(`  DATA(ls_${x.toLowerCase()}) = read_${x.toLowerCase()}( ls_item ).`));
				body.push("");
			}
			body.push(...ind(g.out, "  "), "ENDLOOP.", "");
		}
		if (checks.length) { body.push("\" ===== Checks =====", ...checks); }
		const decl = helperDecl();
		out.push(...ind(decl, "    "), ...(decl.length ? [""] : []), ...ind(body, "    "));
		out.push("    IF lt_error_txt IS NOT INITIAL.",
			"      cl_edocument=>raise_edoc_exception( it_error_txt = lt_error_txt ).",
			"    ENDIF.",
			"  ENDMETHOD.", "", "ENDCLASS.");
		if (vmaps.length) {
			out.push("", "\" ----------------------------------------------------------------",
				"\" AIF value maps created with this rule set (configuration, no code):");
			vmaps.forEach(([v, rows]) => out.push(`"   ${v.padEnd(30)} ${rows.map(e => `${e.from || "' '"} → ${e.to}`).join(", ")}`));
			out.push("\" ----------------------------------------------------------------");
		}
		return out.join("\n");
	}

	/* ======================= Code objects per scenario ======================= */
	const OBJECT_DEFS = {
		adaptor: {badi: "BAdI EDOC_ADAPTOR", text: "Field mapping"},
		inbound: {badi: "Inbound mapping", text: "Field mapping (inbound)"},
		email: {badi: "BAdI EDOC_PARTNER_CONNECTOR", text: "E-mail to customer"},
		fields: {badi: "BAdI EDOC_CUSTOM_FIELDS", text: "Cockpit custom fields"},
		ui: {badi: "eDocument Cockpit actions", text: "UI functions"}
	};
	function objects(cc, doc) {
		const d = docDef(cc, doc);
		return d.objects.map(k => {
			const bMap = k === "adaptor" || k === "inbound";
			const name = bMap ? className(cc, d) : templates.className(k, cc);
			return {key: k, name, text: `${name} · ${OBJECT_DEFS[k].text}`, badi: OBJECT_DEFS[k].badi, generated: bMap};
		});
	}
	function objectCode(cc, doc, k) {
		return k === "adaptor" || k === "inbound" ? genAbap(cc, doc) : templates.code(k, cc, docDef(cc, doc));
	}

	const shortPath = p => { const s = p.split("/").filter(Boolean); return (s.length > 3 ? "… /" : "/") + s.slice(-3).join("/"); };

	return {
		COUNTRIES, TYPES, CATALOG, FORMATS, CONDS, TRANSFORMS, VALMAP_FIELDS,
		load, country, docDef, catGroups, fieldDesc, model, rulesOf, nextRuleId, countryRuleCount, docRuleCount, totalRuleCount,
		ancestors, isLine, suggest, defaultCfg, describe, previewText, validate,
		sortedRules, stats, mappedCounts, autoSuggest, xmlHtml, genAbap, objects, objectCode, shortPath
	};
});
