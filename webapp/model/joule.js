sap.ui.define([], function () {
	"use strict";

	// Canned Joule answers for the demo. Each answer cites where it comes from:
	// "agent" / "kb" = the customer's own Joule agents and knowledge bases, "bnb" = GENB DRC knowledge.
	const S = {
		billing: {kind: "kb", text: "Billing handbook"},
		master: {kind: "kb", text: "Customer master guidelines"},
		sapHelp: {kind: "kb", text: "SAP Help: DRC"},
		o2c: {kind: "agent", text: "Order-to-Cash Agent"},
		fin: {kind: "agent", text: "Finance Operations Agent"},
		bnb: {kind: "bnb", text: "GENB DRC knowledge"}
	};
	const FIELDS = [
		{re: /BuyerReference/, html: "<p><strong>BuyerReference (BT-10)</strong> carries the reference the buyer asked for.</p><ul><li><strong>Germany:</strong> mandatory in XRechnung, usually the <em>Leitweg-ID</em> for public customers. Your billing handbook stores it in the sales order (<code>VBKD-BSTKD_E</code>).</li><li><strong>France:</strong> optional, B&amp;B projects map the buyer's purchasing reference.</li></ul><p>Suggested rule: <strong>MAP</strong> from <code>VBKD-BSTKD_E</code> plus a <strong>CHECK</strong> \"is not empty\" for public customers.</p>", src: [S.billing, S.bnb]},
		{re: /EndpointID/, html: "<p><strong>EndpointID (BT-49 / BT-34)</strong> is the electronic address of the party.</p><ul><li><strong>France:</strong> scheme <code>0225</code>, built as <code>SIREN_suffix</code> from the platform directory. In live projects B&amp;B keeps the exceptions in an AIF value map per customer.</li><li><strong>Germany (Peppol):</strong> scheme <code>9930</code> with the VAT ID.</li></ul>", src: [S.master, S.bnb]},
		{re: /InvoiceTypeCode|TypeCode|RodzajFaktury|TipoDeComprobante/, html: "<p>The type code comes from the SAP document type through a value mapping:</p><ul><li>SD invoice <code>F2</code> → <strong>380</strong>, credit memo <code>G2</code> → <strong>381</strong></li><li>France self-billing (ERS) → <strong>389</strong></li><li>Mexico: <code>I</code> (ingreso), <code>E</code> (egreso), <code>P</code> (pago)</li></ul><p>Your Order-to-Cash agent lists 4 billing types in use, two of them not mapped yet: <code>ZF2</code> and <code>ZG2</code>.</p>", src: [S.o2c, S.bnb]},
		{re: /TaxExemption|CategoryCode|^Code$|TaxCategory/, html: "<p>Exemption codes follow the <strong>VATEX</strong> list. B&amp;B maps them from the tax code in <code>BSET</code> with an AIF value map, so finance can add codes without a transport:</p><ul><li><code>VATEX-FR-CGI275</code> exports and similar</li><li><code>VATEX-EU-AE</code> reverse charge</li><li><code>VATEX-EU-132</code> exempt intra-EU operations</li></ul>", src: [S.sapHelp, S.bnb]},
		{re: /UsoCFDI|RegimenFiscal/, html: "<p><strong>UsoCFDI</strong> and <strong>RegimenFiscalReceptor</strong> must match the customer's tax certificate (Constancia de Situación Fiscal), otherwise the PAC rejects the CFDI (CFDI40147).</p><p>Your customer master guidelines keep both as custom fields on the customer (<code>ZZ1_USOCFDI</code>, <code>ZZ1_REGFISCAL</code>). Suggested rule: <strong>MAP</strong> plus a <strong>CHECK</strong> \"value in list\" with the SAT catalog.</p>", src: [S.master, S.bnb]},
		{re: /ClaveProdServ|ClaveUnidad/, html: "<p>SAT product and unit keys are not in the SAP standard. In B&amp;B projects the product key is a material custom field (<code>MARA-ZZ1_CLAVEPRODSERV</code>) and units go through an AIF value map (for example <code>ST</code> → <code>H87</code>, <code>H</code> → <code>HUR</code>).</p>", src: [S.bnb]},
		{re: /MetodoPago|FormaPago|FormaDePagoP/, html: "<p><strong>MetodoPago</strong> is <code>PUE</code> when paid at once and <code>PPD</code> for credit terms. PPD invoices need a <strong>payment complement</strong> later. <strong>FormaPago</strong> is <code>99</code> for PPD.</p><p>Your Finance Operations agent reports 3 payment terms in use: <code>0001</code> (PUE), <code>Z030</code> and <code>Z075</code> (PPD).</p>", src: [S.fin, S.bnb]},
		{re: /BusinessProcess/, html: "<p>For e-reporting the business process (<strong>B1</strong> goods, <strong>S1</strong> services, ...) comes from the tax attributes of the tax code (table <code>EDOFRTAXATTR</code>). For MM invoices the tax code is read through the FI document of the invoice (<code>RBKP</code> → <code>BKPF</code>).</p>", src: [S.sapHelp, S.bnb]},
		{re: /Note|SKONTO/i, html: "<p>Payment terms notes: in XRechnung, cash discount must follow the <code>#SKONTO#TAGE=..#PROZENT=..#BASISBETRAG=..#</code> syntax. B&amp;B builds it from <code>FI_TERMS_OF_PAYMENT_PROPOSE</code>, with the base from items eligible for cash discount. In France, the notes <code>#PMT#</code>, <code>#PMD#</code> and <code>#AAB#</code> carry the mandatory late-payment wording.</p>", src: [S.billing, S.bnb]},
		{re: /unitCode|UnitCode/, html: "<p>Units must use UN/ECE Rec. 20 codes. B&amp;B maps SAP units through an AIF value map with fallback <code>H87</code> (piece), the same approach used in live French and German projects.</p>", src: [S.bnb]},
		{re: /CompanyID|NIP|Rfc|CompanyId|TaxRegistration/, html: "<p>Tax identifiers depend on the party and the scheme:</p><ul><li>VAT ID (<code>STCEG</code>) for <em>PartyTaxScheme</em></li><li>France: SIREN (<code>STCD2</code>, scheme <code>0002</code>) for <em>PartyLegalEntity</em></li><li>Mexico: RFC (<code>STCD1</code>)</li></ul><p>Your customer master guidelines say 12 customers still have no SIREN. Joule can list them for you.</p>", src: [S.master, S.bnb]}
	];
	const TOPICS = [
		{re: /missing|siren|master data|customers/i, html: "<p>Your <strong>Order-to-Cash Agent</strong> checked the customer master of company code <code>FR01</code>:</p><ul><li>12 customers have no SIREN (<code>STCD2</code>)</li><li>3 customers have no e-mail for the platform directory</li></ul><p>I can create a worklist for the master data team, or add a <strong>CHECK</strong> rule so the eDocument stops with a clear message.</p>", src: [S.o2c, S.master]},
		{re: /self.?billing|autofactur|389/i, html: "<p><strong>Self-billing</strong> (autofacturation) invoices are issued by the buyer on behalf of the supplier, type code <strong>389</strong>. In SAP they come from evaluated receipt settlement (<code>MRRL</code>), source type <code>INV_VERIF</code>. The invoice ID combines document number and fiscal year: <strong>CHANGE</strong> with <em>Concatenate</em> <code>RBKP-BELNR</code> + <code>RBKP-GJAHR</code>.</p>", src: [S.sapHelp, S.bnb]},
		{re: /reporting|e-report/i, html: "<p><strong>E-reporting</strong> covers transactions that are not e-invoiced in France, for example purchases from foreign suppliers. The eDocument is a list (source type <code>EDOC_LIST</code>) built from FI and MM invoices of the period. Typical B&amp;B rules: tax amounts converted to EUR, Canary Islands handled as non-EU, buyer ID cut to 18 characters.</p>", src: [S.sapHelp, S.bnb]},
		{re: /pac|cfdi|cancel/i, html: "<p>CFDI 4.0 goes to the PAC for stamping (<em>timbrado</em>). The accelerator generates the cockpit actions you need around it: <strong>Get PDF</strong>, <strong>Cancel</strong> with SAT reason 01 to 04, and a custom cockpit column with the PAC invoice ID.</p>", src: [S.bnb]},
		{re: /auto.?suggest|suggest|map/i, html: "<p>Auto-suggest uses the GENB rule library first and then your own knowledge. For this scenario I would also check:</p><ul><li>custom billing types your agents found in the last 90 days</li><li>value maps already in AIF, so we reuse them instead of creating new ones</li></ul>", src: [S.o2c, S.bnb]}
	];
	const FALLBACK = {html: "<p>I combined your Joule knowledge with the GENB DRC knowledge. For legal XML questions I can explain a field, propose rules, check your master data through your agents, or summarise what changed in the latest legal version.</p>", src: [S.billing, S.bnb]};

	return {
		/** Answer a prompt; oCtx (optional) is the XML field selected in the workspace. */
		answer: function (sPrompt, oCtx) {
			const hit = (oCtx && FIELDS.find(f => f.re.test(oCtx.field))) || TOPICS.find(t => t.re.test(sPrompt)) || FIELDS.find(f => f.re.test(sPrompt)) || FALLBACK;
			let html = hit.html;
			if (oCtx && hit === FALLBACK) {
				html = `<p><strong>${oCtx.field}</strong> in ${oCtx.docLabel} (${oCtx.countryName}), path <code>${oCtx.path}</code>.</p>` + (oCtx.suggestion ? `<p>The GENB rule library maps it from <code>${oCtx.suggestion}</code> in similar projects.</p>` : "<p>No rule in the GENB library yet. B&amp;B can add it when implementing your package.</p>");
			}
			return {html, sources: hit.src};
		},
		prompts: ["Which customers are missing a SIREN?", "Explain self-billing in France", "What changes for e-reporting?", "How does CFDI cancellation work?"]
	};
});
