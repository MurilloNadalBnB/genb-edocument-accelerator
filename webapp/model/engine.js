sap.ui.define([
	"./plTemplate"
], function (PL_XML) {
	"use strict";

	/* ======================= Master data ======================= */
	const COUNTRIES = [
		{code: "FR", name: "France", short: "e-Invoicing reform, UBL", scenario: "B2B e-Invoicing reform, UBL 2.1 (EN 16931)", schema: "UBL 2.1 Invoice / CreditNote", iface: "FR_UBL_INVOICE", edoc: "FR_INV"},
		{code: "PL", name: "Poland", short: "KSeF, FA(2)", scenario: "KSeF national e-invoicing system, structure FA(2)", schema: "KSeF FA(2)", iface: "PL_KSEF_INVOICE", edoc: "PL_INV"},
		{code: "DE", name: "Germany", short: "XRechnung, UBL", scenario: "XRechnung 3.0 on UBL 2.1 (EN 16931)", schema: "XRechnung UBL", iface: "DE_XRECHNUNG_UBL", edoc: "DE_INV"},
		{code: "IT", name: "Italy", short: "FatturaPA, SdI", planned: true},
		{code: "ES", name: "Spain", short: "SII / VeriFactu", planned: true},
		{code: "BE", name: "Belgium", short: "Peppol BIS 3.0", planned: true},
		{code: "PT", name: "Portugal", short: "CIUS-PT", planned: true}
	];
	const DOCS = [
		{id: "invoice", label: "Invoice", icon: "sap-icon://customer-financial-fact-sheet", src: "SD", desc: "Outgoing billing documents created in SD billing.", source: "SD billing (VBRK / VBRP)"},
		{id: "credit", label: "Credit Note", icon: "sap-icon://credit-card", src: "SD", desc: "Billing credit memos that correct a previous invoice.", source: "SD billing (VBRK / VBRP / VBFA)"},
		{id: "fi", label: "Accounting Document", icon: "sap-icon://accounting-document-verification", src: "FI", desc: "FI invoices and credit memos posted directly in accounting (FB70 / FB75).", source: "FI document (BKPF / BSEG / BSET)"}
	];
	// state = IndicationColor used by sap.m.ObjectStatus (MAP blue, CHECK orange, CHANGE purple, CONST green)
	const TYPES = {
		map: {label: "Map value", short: "MAP", icon: "sap-icon://journey-arrive", state: "Indication05", help: "Fill the XML field with the value of an SAP field."},
		check: {label: "Check", short: "CHECK", icon: "sap-icon://shield", state: "Indication02", help: "Validate a value before the eDocument is created and raise an error or a warning."},
		change: {label: "Change value", short: "CHANGE", icon: "sap-icon://switch-views", state: "Indication07", help: "Convert the SAP value before it is written to the XML (value mapping, concatenation, sign, format)."},
		constant: {label: "Constant", short: "CONST", icon: "sap-icon://pushpin-off", state: "Indication04", help: "Always write a fixed value to the XML field."}
	};
	const TYPE_ORDER = {map: 0, constant: 1, change: 2, check: 3};

	const CATALOG = {
		VBRK: {d: "Billing Document: Header", f: [["VBELN", "Billing Document"], ["FKART", "Billing Type"], ["VBTYP", "SD Document Category"], ["FKDAT", "Billing Date"], ["WAERK", "Document Currency"], ["NETWR", "Net Value"], ["MWSBK", "Tax Amount"], ["KUNAG", "Sold-to Party"], ["KUNRG", "Payer"], ["BUKRS", "Company Code"], ["ZTERM", "Terms of Payment"], ["XBLNR", "Reference Document Number"], ["STCEG", "VAT Registration Number"], ["LAND1", "Destination Country"], ["INCO1", "Incoterms"], ["SFAKN", "Cancelled Billing Document"], ["ERDAT", "Created On"]]},
		VBRP: {d: "Billing Document: Item", f: [["POSNR", "Item"], ["MATNR", "Material"], ["ARKTX", "Item Description"], ["FKIMG", "Billed Quantity"], ["VRKME", "Sales Unit"], ["NETWR", "Net Value"], ["MWSBP", "Tax Amount"], ["MWSKZ", "Tax Code"], ["AUBEL", "Sales Document"], ["VGBEL", "Reference Document"], ["CHARG", "Batch"], ["WERKS", "Plant"]]},
		VBKD: {d: "Sales Document: Business Data", f: [["BSTKD", "Customer PO Number"], ["BSTDK", "Customer PO Date"], ["IHREZ", "Your Reference"], ["ZTERM", "Terms of Payment"]]},
		VBFA: {d: "Sales Document Flow", f: [["VBELV", "Preceding Document"], ["POSNV", "Preceding Item"], ["VBTYP_V", "Preceding Doc. Category"]]},
		BKPF: {d: "Accounting Document Header", f: [["BUKRS", "Company Code"], ["BELNR", "Document Number"], ["GJAHR", "Fiscal Year"], ["BLART", "Document Type"], ["BLDAT", "Document Date"], ["BUDAT", "Posting Date"], ["WAERS", "Currency"], ["XBLNR", "Reference"], ["BKTXT", "Document Header Text"], ["USNAM", "User Name"], ["TCODE", "Transaction Code"], ["STBLG", "Reversed With"]]},
		BSEG: {d: "Accounting Document Segment", f: [["BUZEI", "Line Item"], ["KOART", "Account Type"], ["KUNNR", "Customer"], ["HKONT", "G/L Account"], ["SHKZG", "Debit/Credit Indicator"], ["WRBTR", "Amount in Doc. Currency"], ["DMBTR", "Amount in Local Currency"], ["MWSKZ", "Tax Code"], ["SGTXT", "Item Text"], ["ZUONR", "Assignment"], ["ZFBDT", "Baseline Date"], ["ZTERM", "Terms of Payment"], ["MENGE", "Quantity"], ["MEINS", "Base Unit"]]},
		BSET: {d: "Tax Data Document Segment", f: [["MWSKZ", "Tax Code"], ["KBETR", "Tax Rate"], ["FWBAS", "Tax Base (Doc. Currency)"], ["FWSTE", "Tax Amount (Doc. Currency)"], ["HWSTE", "Tax Amount (Local Currency)"]]},
		KNA1: {d: "Customer Master: General Data", f: [["KUNNR", "Customer"], ["NAME1", "Name"], ["NAME2", "Name 2"], ["STCEG", "VAT Registration Number"], ["STCD1", "Tax Number 1"], ["STCD2", "Tax Number 2"], ["LAND1", "Country"], ["ORT01", "City"], ["PSTLZ", "Postal Code"], ["STRAS", "Street"], ["TELF1", "Telephone"], ["ADRNR", "Address Number"]]},
		ADRC: {d: "Addresses (Business Address Services)", f: [["NAME1", "Name"], ["STREET", "Street"], ["HOUSE_NUM1", "House Number"], ["CITY1", "City"], ["POST_CODE1", "Postal Code"], ["COUNTRY", "Country"], ["REGION", "Region"], ["TEL_NUMBER", "Telephone"]]},
		ADR6: {d: "E-Mail Addresses (BAS)", f: [["SMTP_ADDR", "E-Mail Address"]]},
		T001: {d: "Company Codes", f: [["BUKRS", "Company Code"], ["BUTXT", "Company Name"], ["LAND1", "Country"], ["WAERS", "Currency"], ["STCEG", "VAT Registration Number"], ["ADRNR", "Address Number"]]},
		T012K: {d: "House Bank Accounts", f: [["HBKID", "House Bank"], ["HKTID", "Account ID"], ["BANKN", "Bank Account Number"]]},
		EDOCUMENT: {d: "eDocument", f: [["EDOC_GUID", "eDocument GUID"], ["PROCESS", "eDocument Process"], ["EDOC_TYPE", "eDocument Type"], ["PROC_STATUS", "Process Status"], ["SOURCE_TYPE", "Source Type"], ["SOURCE_KEY", "Source Key"], ["LAND", "Country"]]},
		SYST: {d: "ABAP System Fields", f: [["DATUM", "Current Date"], ["UZEIT", "Current Time"], ["SYSID", "System ID"]]}
	};
	const CAT_GROUPS = {
		SD: [["Billing", ["VBRK", "VBRP", "VBKD", "VBFA"]], ["Partner", ["KNA1", "ADRC", "ADR6"]], ["Company", ["T001", "T012K"]], ["Framework", ["EDOCUMENT", "SYST"]]],
		FI: [["Accounting", ["BKPF", "BSEG", "BSET"]], ["Partner", ["KNA1", "ADRC", "ADR6"]], ["Company", ["T001", "T012K"]], ["Framework", ["EDOCUMENT", "SYST"]]]
	};
	const ITEM_TABLE = {SD: "VBRP", FI: "BSEG"};
	const LINE_NODES = ["FaWiersz", "InvoiceLine", "CreditNoteLine", "ZamowienieWiersz"];

	const FORMATS = {none: "No formatting", date: "Date as YYYY-MM-DD", dec2: "Decimal, 2 places", condense: "Condense spaces", upper: "Upper case", alpha: "Remove leading zeros", vatpfx: "Remove country prefix from VAT ID"};
	const CONDS = {notInitial: "Is not empty", maxLen: "Maximum length", pattern: "Matches pattern (regex)", inList: "Value in list", ref: "Exists in table"};
	const TRANSFORMS = {valmap: "Value mapping", concat: "Concatenate with another field", sign: "Invert sign (credit notes)", prefix: "Add prefix", date: "Date to timestamp (ISO 8601)", round: "Round to 2 decimals"};

	const DATE_FIELDS = ["P_1", "P_6", "P_6A", "IssueDate", "DueDate", "TerminPlatnosci", "DataZamowienia", "DataWystFaKorygowanej", "DataZaplaty"];
	const AMOUNT_RE = /^(P_11|P_13_\d|P_14_\d|P_15|.*Amount|Kwota.*|KursWaluty)$/;
	const VALMAP_FIELDS = ["RodzajFaktury", "InvoiceTypeCode", "CreditNoteTypeCode", "P_12", "Percent"];

	const fieldDesc = f => { const [t, n] = f.split("-"); const x = CATALOG[t]?.f.find(a => a[0] === n); return x ? x[1] : ""; };
	const country = cc => COUNTRIES.find(c => c.code === cc);
	const docDef = id => DOCS.find(d => d.id === id);

	/* ======================= XML templates ======================= */
	function ublXml(cc, credit) {
		const cfg = cc === "FR"
			? {cust: "urn:cen.eu:en16931:2017", cur: "EUR", rate: "20", pfx: "FA", s: {scheme: "0225", endpoint: "123456789", id: "SUP-001", street: "12 Rue de la Paix", city: "Paris", zip: "75002", vat: "FR12123456789", name: "Demo Fournisseur SAS", reg: "123456789", tel: "+33 1 23 45 67 89", mail: "factures@fournisseur.example"}, b: {scheme: "0225", endpoint: "987654321", id: "CUST-1000", street: "5 Avenue Victor Hugo", city: "Lyon", zip: "69002", vat: "FR45987654321", name: "Client Exemple SARL", reg: "987654321", tel: "+33 4 11 22 33 44", mail: "compta@client.example"}, iban: "FR7630006000011234567890189"}
			: {cust: "urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0", cur: "EUR", rate: "19", pfx: "RE", s: {scheme: "EM", endpoint: "rechnung@lieferant.example", id: "SUP-001", street: "Hauptstrasse 1", city: "Berlin", zip: "10115", vat: "DE123456789", name: "Lieferant Demo GmbH", reg: "HRB 12345", tel: "+49 30 1234567", mail: "rechnung@lieferant.example"}, b: {scheme: "EM", endpoint: "eingang@kunde.example", id: "CUST-1000", street: "Marktplatz 7", city: "Hamburg", zip: "20095", vat: "DE987654321", name: "Kunde Beispiel AG", reg: "HRB 67890", tel: "+49 40 7654321", mail: "eingang@kunde.example"}, iban: "DE89370400440532013000"};
		const R = credit ? "CreditNote" : "Invoice", L = credit ? "CreditNoteLine" : "InvoiceLine", Q = credit ? "CreditedQuantity" : "InvoicedQuantity";
		const party = (role, p) => `<cac:${role}><cac:Party><cbc:EndpointID schemeID="${p.scheme}">${p.endpoint}</cbc:EndpointID><cac:PartyIdentification><cbc:ID>${p.id}</cbc:ID></cac:PartyIdentification><cac:PostalAddress><cbc:StreetName>${p.street}</cbc:StreetName><cbc:CityName>${p.city}</cbc:CityName><cbc:PostalZone>${p.zip}</cbc:PostalZone><cac:Country><cbc:IdentificationCode>${cc}</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyTaxScheme><cbc:CompanyID>${p.vat}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:PartyLegalEntity><cbc:RegistrationName>${p.name}</cbc:RegistrationName><cbc:CompanyID>${p.reg}</cbc:CompanyID></cac:PartyLegalEntity><cac:Contact><cbc:Telephone>${p.tel}</cbc:Telephone><cbc:ElectronicMail>${p.mail}</cbc:ElectronicMail></cac:Contact></cac:Party></cac:${role}>`;
		const line = (no, name, mat, qty, price) => `<cac:${L}><cbc:ID>${no}</cbc:ID><cbc:${Q} unitCode="C62">${qty}</cbc:${Q}><cbc:LineExtensionAmount currencyID="${cfg.cur}">${(qty * price).toFixed(2)}</cbc:LineExtensionAmount><cac:Item><cbc:Name>${name}</cbc:Name><cac:SellersItemIdentification><cbc:ID>${mat}</cbc:ID></cac:SellersItemIdentification><cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>${cfg.rate}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item><cac:Price><cbc:PriceAmount currencyID="${cfg.cur}">${price.toFixed(2)}</cbc:PriceAmount></cac:Price></cac:${L}>`;
		const net = 1000, tax = net * Number(cfg.rate) / 100;
		return `<${R} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${R}-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">`
			+ `<cbc:CustomizationID>${cfg.cust}</cbc:CustomizationID>`
			+ `<cbc:ID>${cfg.pfx}-2026-000${credit ? "456" : "123"}</cbc:ID><cbc:IssueDate>2026-10-27</cbc:IssueDate>`
			+ (credit ? "" : "<cbc:DueDate>2026-11-26</cbc:DueDate>")
			+ (credit ? "<cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode>" : "<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>")
			+ `<cbc:Note>Sample note</cbc:Note><cbc:DocumentCurrencyCode>${cfg.cur}</cbc:DocumentCurrencyCode>`
			+ `<cbc:BuyerReference>${cc === "DE" ? "04011000-12345-34" : "PO-REF-778"}</cbc:BuyerReference>`
			+ "<cac:OrderReference><cbc:ID>4500012345</cbc:ID></cac:OrderReference>"
			+ (credit ? `<cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>${cfg.pfx}-2026-000123</cbc:ID><cbc:IssueDate>2026-10-01</cbc:IssueDate></cac:InvoiceDocumentReference></cac:BillingReference>` : "")
			+ party("AccountingSupplierParty", cfg.s) + party("AccountingCustomerParty", cfg.b)
			+ `<cac:PaymentMeans><cbc:PaymentMeansCode>58</cbc:PaymentMeansCode><cac:PayeeFinancialAccount><cbc:ID>${cfg.iban}</cbc:ID></cac:PayeeFinancialAccount></cac:PaymentMeans>`
			+ "<cac:PaymentTerms><cbc:Note>30 days net</cbc:Note></cac:PaymentTerms>"
			+ `<cac:TaxTotal><cbc:TaxAmount currencyID="${cfg.cur}">${tax.toFixed(2)}</cbc:TaxAmount><cac:TaxSubtotal><cbc:TaxableAmount currencyID="${cfg.cur}">${net.toFixed(2)}</cbc:TaxableAmount><cbc:TaxAmount currencyID="${cfg.cur}">${tax.toFixed(2)}</cbc:TaxAmount><cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>${cfg.rate}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal>`
			+ `<cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="${cfg.cur}">${net.toFixed(2)}</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="${cfg.cur}">${net.toFixed(2)}</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="${cfg.cur}">${(net + tax).toFixed(2)}</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="${cfg.cur}">${(net + tax).toFixed(2)}</cbc:PayableAmount></cac:LegalMonetaryTotal>`
			+ line(1, "Office chair", "MAT-0001", 6, 100) + line(2, "Desk lamp", "MAT-0002", 8, 50)
			+ `</${R}>`;
	}
	function templateXml(cc, doc) {
		if (cc === "PL") {
			return PL_XML.replace("<n0:RodzajFaktury>Token 211", "<n0:RodzajFaktury>" + (doc === "credit" ? "KOR" : "VAT"));
		}
		return ublXml(cc, doc === "credit");
	}

	/* ======================= XML model ======================= */
	function buildModel(xml, expandDepth) {
		const doc = new DOMParser().parseFromString(xml, "application/xml");
		if (doc.getElementsByTagName("parsererror").length) {
			throw new Error("XML parse error");
		}
		const nodes = {};
		let seq = 0;
		function walk(el, parent, depth) {
			const id = "n" + (seq++);
			const sib = parent ? [...el.parentNode.children].filter(c => c.tagName === el.tagName) : [el];
			const idx = sib.length > 1 ? sib.indexOf(el) + 1 : 0;
			const n = {id, name: el.tagName, local: el.localName, prefix: el.prefix, depth, parent: parent ? parent.id : null, children: [], idx, order: seq, isAttr: false, ns: []};
			n.path = (parent ? parent.path : "") + "/" + el.tagName + (idx ? `[${idx}]` : "");
			nodes[id] = n;
			for (const a of el.attributes) {
				if (a.name === "xmlns" || a.name.startsWith("xmlns:")) {
					n.ns.push([a.name, a.value]);
					continue;
				}
				const aid = "n" + (seq++);
				nodes[aid] = {id: aid, name: "@" + a.name, local: a.localName, prefix: null, depth: depth + 1, parent: id, children: [], idx: 0, order: seq, isAttr: true, leaf: true, value: a.value, path: n.path + "/@" + a.name};
				n.children.push(aid);
			}
			const kids = [...el.children];
			if (!kids.length) {
				n.leaf = true;
				n.value = el.textContent.trim();
			} else {
				kids.forEach(k => n.children.push(walk(k, n, depth + 1)));
			}
			return id;
		}
		const root = walk(doc.documentElement, null, 0);
		(function tot(id) { const n = nodes[id]; n.total = (n.leaf ? 1 : 0) + n.children.reduce((s, c) => s + tot(c), 0); return n.total; })(root);
		return {nodes, root, expandDepth};
	}

	/* ======================= Store (in memory) ======================= */
	const models = {}, rules = {};
	let ruleSeq = 1;
	const key = (cc, doc) => cc + "|" + doc;
	function model(cc, doc) {
		const k = key(cc, doc);
		if (!models[k]) {
			models[k] = buildModel(templateXml(cc, doc), cc === "PL" ? 3 : 1);
		}
		return models[k];
	}
	function rulesOf(cc, doc) {
		const k = key(cc, doc);
		return rules[k] || (rules[k] = []);
	}
	const countryRuleCount = cc => Object.entries(rules).filter(([k]) => k.startsWith(cc + "|")).reduce((s, [, v]) => s + v.length, 0);
	const docRuleCount = (cc, d) => (rules[key(cc, d)] || []).length;
	const ancestors = (n, m) => { const a = []; let x = n.parent ? m.nodes[n.parent] : null; while (x) { a.push(x); x = x.parent ? m.nodes[x.parent] : null; } return a; };
	const nextRuleId = () => "r" + (ruleSeq++);

	/* ======================= Suggestions ======================= */
	function ctxOf(n, m) {
		for (const a of [n, ...ancestors(n, m)]) {
			if (["Podmiot1", "Podmiot1K", "AccountingSupplierParty"].includes(a.local)) { return "seller"; }
			if (["Podmiot2", "Podmiot2K", "AccountingCustomerParty"].includes(a.local)) { return "buyer"; }
			if (["Podmiot3", "PodmiotUpowazniony", "Transport", "Przewoznik"].includes(a.local)) { return "third"; }
		}
		return null;
	}
	const isLine = (n, m) => [n, ...ancestors(n, m)].some(a => LINE_NODES.includes(a.local));
	const lineNodeOf = (n, m) => [n, ...ancestors(n, m)].find(a => LINE_NODES.includes(a.local)) || null;
	function suggest(n, m, src) {
		if (!n || !n.leaf) { return []; }
		const fi = src === "FI", sd = (a, b) => fi ? b : a, L = n.local, P = n.parent ? m.nodes[n.parent].local : "", ctx = ctxOf(n, m), line = isLine(n, m);
		const seller = ctx === "seller", buyer = ctx === "buyer";
		if (ctx === "third") { return []; }
		if (L === "ID") {
			if (n.parent === m.root) { return sd(["VBRK-VBELN", "VBRK-XBLNR"], ["BKPF-XBLNR", "BKPF-BELNR"]); }
			if (LINE_NODES.includes(P)) { return sd(["VBRP-POSNR"], ["BSEG-BUZEI"]); }
			if (P === "OrderReference") { return sd(["VBKD-BSTKD"], ["BSEG-ZUONR"]); }
			if (P === "InvoiceDocumentReference") { return sd(["VBFA-VBELV"], ["BKPF-XBLNR"]); }
			if (P === "PayeeFinancialAccount") { return ["T012K-BANKN"]; }
			if (P === "SellersItemIdentification") { return sd(["VBRP-MATNR"], []); }
			if (P === "PartyIdentification") { return buyer ? ["KNA1-KUNNR"] : ["T001-BUKRS"]; }
			return [];
		}
		if (L === "NIP" || L === "CompanyID") {
			if (P === "PartyLegalEntity") { return buyer ? ["KNA1-STCD1"] : seller ? ["T001-STCEG"] : []; }
			return buyer ? sd(["VBRK-STCEG", "KNA1-STCEG"], ["KNA1-STCEG"]) : seller ? ["T001-STCEG"] : [];
		}
		if (["NazwaHandlowa", "RegistrationName"].includes(L)) { return buyer ? ["KNA1-NAME1"] : seller ? ["ADRC-NAME1", "T001-BUTXT"] : []; }
		if (["KodKraju", "IdentificationCode"].includes(L)) { return buyer ? ["KNA1-LAND1", "ADRC-COUNTRY"] : seller ? ["T001-LAND1"] : []; }
		const party = {Ulica: "ADRC-STREET", StreetName: "ADRC-STREET", NrDomu: "ADRC-HOUSE_NUM1", Miejscowosc: "ADRC-CITY1", CityName: "ADRC-CITY1", KodPocztowy: "ADRC-POST_CODE1", PostalZone: "ADRC-POST_CODE1", Wojewodztwo: "ADRC-REGION", Telefon: "ADRC-TEL_NUMBER", Telephone: "ADRC-TEL_NUMBER", Email: "ADR6-SMTP_ADDR", ElectronicMail: "ADR6-SMTP_ADDR", EndpointID: "ADR6-SMTP_ADDR", NrKlienta: "KNA1-KUNNR"};
		if (party[L]) { return (seller || buyer) ? [party[L]] : []; }
		const cur = sd(["VBRK-WAERK"], ["BKPF-WAERS"]);
		const T = {
			KodWaluty: cur, DocumentCurrencyCode: cur, currencyID: cur,
			P_1: sd(["VBRK-FKDAT"], ["BKPF-BLDAT"]), IssueDate: sd(["VBRK-FKDAT"], ["BKPF-BLDAT"]),
			P_6: sd(["VBRK-FKDAT"], ["BKPF-BUDAT"]), P_2: sd(["VBRK-VBELN", "VBRK-XBLNR"], ["BKPF-XBLNR", "BKPF-BELNR"]),
			DueDate: ["BSEG-ZFBDT"], TerminPlatnosci: ["BSEG-ZFBDT"],
			P_7: sd(["VBRP-ARKTX"], ["BSEG-SGTXT"]), Name: sd(["VBRP-ARKTX"], ["BSEG-SGTXT"]),
			P_8A: sd(["VBRP-VRKME"], ["BSEG-MEINS"]), unitCode: sd(["VBRP-VRKME"], ["BSEG-MEINS"]),
			P_8B: sd(["VBRP-FKIMG"], ["BSEG-MENGE"]), InvoicedQuantity: sd(["VBRP-FKIMG"], ["BSEG-MENGE"]), CreditedQuantity: sd(["VBRP-FKIMG"], ["BSEG-MENGE"]),
			P_11: sd(["VBRP-NETWR"], ["BSEG-WRBTR"]),
			LineExtensionAmount: line ? sd(["VBRP-NETWR"], ["BSEG-WRBTR"]) : sd(["VBRK-NETWR"], ["BSET-FWBAS"]),
			P_12: sd(["VBRP-MWSKZ"], ["BSEG-MWSKZ"]), Percent: sd(["VBRP-MWSKZ"], ["BSEG-MWSKZ"]),
			P_13_1: sd(["VBRK-NETWR"], ["BSET-FWBAS"]), TaxableAmount: sd(["VBRK-NETWR"], ["BSET-FWBAS"]), TaxExclusiveAmount: sd(["VBRK-NETWR"], ["BSET-FWBAS"]),
			P_14_1: sd(["VBRK-MWSBK"], ["BSET-FWSTE"]), TaxAmount: sd(["VBRK-MWSBK"], ["BSET-FWSTE"]),
			P_15: sd(["VBRK-NETWR"], ["BSEG-WRBTR"]), TaxInclusiveAmount: sd(["VBRK-NETWR"], ["BSEG-WRBTR"]), PayableAmount: sd(["VBRK-NETWR"], ["BSEG-WRBTR"]),
			RodzajFaktury: sd(["VBRK-FKART"], ["BKPF-BLART"]), InvoiceTypeCode: sd(["VBRK-FKART"], ["BKPF-BLART"]), CreditNoteTypeCode: sd(["VBRK-FKART"], ["BKPF-BLART"]),
			NrFaKorygowanej: sd(["VBFA-VBELV"], ["BKPF-XBLNR"]), NrZamowienia: sd(["VBKD-BSTKD"], ["BSEG-ZUONR"]), DataZamowienia: sd(["VBKD-BSTDK"], []),
			BuyerReference: sd(["VBKD-IHREZ"], ["BSEG-ZUONR"]), NrRBPL: ["T012K-BANKN"], DataWytworzeniaFa: ["SYST-DATUM"], SystemInfo: ["SYST-SYSID"],
			NrWierszaFa: sd(["VBRP-POSNR"], ["BSEG-BUZEI"]), Note: sd(["VBRK-XBLNR"], ["BKPF-BKTXT"]), PriceAmount: sd(["VBRP-NETWR"], ["BSEG-WRBTR"])
		};
		return T[L] || [];
	}
	function prefillValmap(n, cc) {
		const L = n.local;
		if (L === "RodzajFaktury") { return [{from: "F2", to: "VAT"}, {from: "G2", to: "KOR"}, {from: "L2", to: "VAT"}]; }
		if (["InvoiceTypeCode", "CreditNoteTypeCode"].includes(L)) { return [{from: "F2", to: "380"}, {from: "G2", to: "381"}]; }
		if (["P_12", "Percent"].includes(L)) {
			const r = {PL: [["A1", "23"], ["A2", "8"], ["A3", "5"]], FR: [["A1", "20"], ["A2", "10"], ["A3", "5.5"]], DE: [["A1", "19"], ["A2", "7"]]}[cc];
			return r.map(([from, to]) => ({from, to}));
		}
		return [{from: "", to: ""}];
	}
	function defaultCfg(n, cc) {
		return {format: DATE_FIELDS.includes(n.local) ? "date" : AMOUNT_RE.test(n.local) ? "dec2" : "none", cond: "notInitial", param: "", severity: "E", msg: `${n.local} must not be empty`, transform: "valmap", valmap: prefillValmap(n, cc), second: "", sep: " ", prefix: "", datefmt: "ts", constant: ""};
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
				case "valmap": return c.valmap.filter(v => v.from || v.to).map(v => `${v.from} → ${v.to}`).join(", ") || "Value mapping";
				case "concat": return `Concatenate with ${c.second || "?"}`;
				case "prefix": return `Prefix '${c.prefix}'`;
				default: return TRANSFORMS[c.transform];
			}
		}
		return "";
	}
	function previewText(n, r) {
		const tag = `<${n.name}>`, src = r.source || (r.type === "check" ? "XML value" : "?");
		switch (r.type) {
			case "map": return `${tag}  ←  ${src}${r.cfg.format !== "none" ? `\n           ${FORMATS[r.cfg.format]}` : ""}`;
			case "constant": return `${tag}  =  '${r.cfg.constant}'`;
			case "change": return `${tag}  ←  ${src}\n           ${describe(r)}`;
			case "check": return `CHECK ${src}: ${CONDS[r.cfg.cond]}${r.cfg.cond === "notInitial" ? "" : " " + r.cfg.param}\n   otherwise ${r.cfg.severity === "E" ? "ERROR" : "WARNING"} "${r.cfg.msg}"`;
		}
		return "";
	}
	function validate(r) {
		const c = r.cfg;
		if ((r.type === "map" || r.type === "change") && !r.source) { return "Pick the SAP source field on the left first."; }
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
		const m = model(cc, doc), src = docDef(doc).src, R = rulesOf(cc, doc);
		let added = 0;
		for (const n of Object.values(m.nodes)) {
			if (!n.leaf || R.some(r => r.nodeId === n.id)) { continue; }
			if ([n, ...ancestors(n, m)].some(a => a.idx > 1)) { continue; } // only first occurrence of repeated blocks
			const sg = suggest(n, m, src);
			if (!sg.length) { continue; }
			const vm = VALMAP_FIELDS.includes(n.local);
			R.push({id: nextRuleId(), nodeId: n.id, type: vm ? "change" : "map", source: sg[0], cfg: defaultCfg(n, cc), auto: true});
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
			const open = `<span class="xt">&lt;${esc(n.name)}</span>${ns(n)}${attrs(n)}<span class="xt">&gt;</span>`;
			if (!kids.length) {
				out.push(`<div class="xl ${rs.length ? "mapped" : ""}" ${rs.length ? `data-id="${id}"` : ""}><span>${pad}${open}<span class="xx">${esc(n.value)}</span><span class="xt">&lt;/${esc(n.name)}&gt;</span></span>${notes(rs)}</div>`);
			} else {
				out.push(`<div class="xl"><span>${pad}${open}</span></div>`);
				kids.forEach(k => walk(k.id, ind + 1));
				out.push(`<div class="xl"><span>${pad}<span class="xt">&lt;/${esc(n.name)}&gt;</span></span></div>`);
			}
		})(m.root, 0);
		return out.join("");
	}

	/* ======================= ABAP mock generator ======================= */
	const snake = s => s.replace(/^@/, "").replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^A-Za-z0-9_]/g, "_").toLowerCase();
	const q = s => String(s ?? "").replace(/'/g, "''");
	const alias = f => { const [t, fl] = f.split("-"); return `ls_${t.toLowerCase()}-${fl.toLowerCase()}`; };
	function genAbap(cc, doc) {
		const c = country(cc), d = docDef(doc), m = model(cc, doc), rs = sortedRules(cc, doc);
		if (!rs.length) { return null; }
		const seg = n => snake(n.local) + (n.idx ? `[ ${n.idx} ]` : "");
		const pathFrom = (n, stop) => { const parts = []; let x = n; while (x && x.id !== stop) { parts.unshift(seg(x)); x = x.parent ? m.nodes[x.parent] : null; } return parts.join("-"); };
		const itemTab = ITEM_TABLE[d.src];
		const header = [], lines = {}, headerUsed = new Set();
		const fmt = (x, f) => ({none: x, date: `|{ ${x} DATE = ISO }|`, dec2: `|{ ${x} DECIMALS = 2 }|`, condense: `condense( ${x} )`, upper: `to_upper( ${x} )`, alpha: `|{ ${x} ALPHA = OUT }|`, vatpfx: `substring( val = ${x} off = 2 )`}[f] || x);
		function value(r) {
			const x = r.source ? alias(r.source) : "";
			if (r.type === "map") { return fmt(x, r.cfg.format); }
			if (r.type === "constant") { return `'${q(r.cfg.constant)}'`; }
			const cf = r.cfg;
			switch (cf.transform) {
				case "valmap": return [`SWITCH #( ${x}`, ...cf.valmap.filter(v => v.from).map(v => `  WHEN '${q(v.from)}' THEN '${q(v.to)}'`), `  ELSE ${x} )`].join("\n");
				case "concat": return `|{ ${x} }${cf.sep}{ ${alias(cf.second)} }|`;
				case "sign": return `${x} * -1`;
				case "prefix": return `|${cf.prefix}{ ${x} }|`;
				case "date": return `|{ ${x} DATE = ISO }T00:00:00Z|`;
				case "round": return `round( val = ${x} dec = 2 )`;
			}
			return x;
		}
		function checkCode(r, tgt) {
			const x = r.source ? alias(r.source) : tgt, cf = r.cfg, out = [];
			let cond;
			if (cf.cond === "notInitial") { cond = `${x} IS INITIAL`; }
			else if (cf.cond === "maxLen") { cond = `strlen( ${x} ) > ${parseInt(cf.param, 10) || 0}`; }
			else if (cf.cond === "pattern") { cond = `NOT matches( val = ${x} regex = '${q(cf.param)}' )`; }
			else if (cf.cond === "inList") { cond = `NOT ( ${cf.param.split(",").map(v => `${x} = '${q(v.trim())}'`).join(" OR ")} )`; }
			else { const [t, f = "KEY"] = cf.param.toUpperCase().split("-"); out.push(`SELECT SINGLE @abap_true FROM ${t.toLowerCase()} WHERE ${f.toLowerCase()} = @${x} INTO @DATA(lv_found).`); cond = "lv_found = abap_false"; }
			out.push(`IF ${cond}.`, `  add_message( iv_type = '${cf.severity}' iv_text = '${q(cf.msg)}' ).`, "ENDIF.");
			return out;
		}
		for (const r of rs) {
			const n = m.nodes[r.nodeId], ln = lineNodeOf(n, m);
			const tables = [r.source, r.type === "change" && r.cfg.transform === "concat" ? r.cfg.second : null].filter(Boolean).map(s => s.split("-")[0]);
			let tgt, bucket;
			if (ln) {
				const k = pathFrom(ln, m.root).replace(/\[ \d+ \]/g, "");
				bucket = (lines[k] = lines[k] || {node: ln, out: []}).out;
				tgt = `<ls_line>-${pathFrom(n, ln.id)}`;
				tables.filter(t => t !== itemTab).forEach(t => headerUsed.add(t));
			} else {
				bucket = header;
				tgt = `cs_output_data-${pathFrom(n, m.root)}`;
				tables.forEach(t => headerUsed.add(t));
			}
			bucket.push(`" <${n.name}>  ${TYPES[r.type].label}${r.source ? " from " + r.source : ""}`);
			if (r.type === "check") {
				bucket.push(...checkCode(r, tgt));
			} else {
				const v = value(r).split("\n"), padN = tgt.length + 3;
				bucket.push(`${tgt} = ${v[0]}`, ...v.slice(1).map(l => " ".repeat(padN) + l));
				bucket[bucket.length - 1] += ".";
			}
			bucket.push("");
		}
		const out = [
			"\" ----------------------------------------------------------------",
			"\" Generated by GENB eDocument Accelerator (mock preview)",
			`" Country ........: ${c.name} (${c.code})`,
			`" Document .......: ${d.label}, source ${d.source}`,
			`" eDocument type .: ${c.edoc} / interface ${c.iface}`,
			`" Rules ..........: ${rs.length}`,
			"\" ----------------------------------------------------------------",
			"METHOD if_edoc_adaptor~set_output_data.", ""];
		const ind = l => l ? "  " + l : "";
		[...headerUsed].sort().forEach(t => out.push(ind(`DATA(ls_${t.toLowerCase()}) = read_${t.toLowerCase()}( io_source ).`)));
		if (headerUsed.size) { out.push(""); }
		if (header.length) { out.push(ind("\" ===== Header =====")); header.forEach(l => out.push(ind(l))); }
		let first = true;
		for (const [k, g] of Object.entries(lines)) {
			const itemVar = `ls_${itemTab.toLowerCase()}`, decl = (first && !headerUsed.has(itemTab)) ? `DATA(${itemVar})` : itemVar;
			first = false;
			out.push(ind(`" ===== Line items: ${g.node.local} =====`));
			out.push(ind(`LOOP AT read_${itemTab.toLowerCase()}_items( io_source ) INTO ${decl}.`));
			out.push(ind(`  INSERT INITIAL LINE INTO TABLE cs_output_data-${k} ASSIGNING FIELD-SYMBOL(<ls_line>).`));
			out.push("");
			g.out.forEach(l => out.push(l ? "    " + l : ""));
			out.push(ind("ENDLOOP."), "");
		}
		out.push("ENDMETHOD.");
		return out.join("\n");
	}

	const shortPath = p => { const s = p.split("/").filter(Boolean); return (s.length > 3 ? "… /" : "/") + s.slice(-3).join("/"); };

	return {
		COUNTRIES, DOCS, TYPES, CATALOG, CAT_GROUPS, FORMATS, CONDS, TRANSFORMS, VALMAP_FIELDS,
		country, docDef, fieldDesc, model, rulesOf, nextRuleId, countryRuleCount, docRuleCount,
		ancestors, isLine, suggest, defaultCfg, describe, previewText, validate,
		sortedRules, stats, mappedCounts, autoSuggest, xmlHtml, genAbap, shortPath
	};
});
