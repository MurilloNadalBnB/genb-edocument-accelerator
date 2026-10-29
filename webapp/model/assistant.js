sap.ui.define([], function () {
	"use strict";

	// Canned answers for the demo. Each answer has one part per AI engine; only the parts of the
	// engines switched on are shown, so the same question shows what 1, 2 or all 3 engines add.
	//   genb  = GENB AI: B&B's DRC knowledge and rule library
	//   joule = Joule: the customer's own agents and knowledge bases
	//   hub   = SAP Generative AI Hub: the customer's LLMs in SAP AI Core, used on the customer's data
	const FIELDS = [
		{re: /BuyerReference/,
			genb: "<p><strong>BuyerReference (BT-10)</strong> is mandatory in XRechnung: for public customers it carries the <em>Leitweg-ID</em>. In France it is optional. GENB rule: <strong>MAP</strong> plus a <strong>CHECK</strong> \"is not empty\" for public customers.</p>",
			joule: "<p>Your <em>Billing handbook</em> keeps the Leitweg-ID in the sales order (<code>VBKD-BSTKD_E</code>). Your <em>Order-to-Cash Agent</em> found 7 orders of public customers without it in the last 90 days.</p>",
			hub: "<p>Drafted the error message in German and English: <em>\"Leitweg-ID fehlt im Kundenauftrag\"</em> / <em>\"Leitweg-ID missing in the sales order\"</em>.</p>"},
		{re: /EndpointID/,
			genb: "<p><strong>EndpointID</strong> is the electronic address of the party. France: scheme <code>0225</code>, built as <code>SIREN_suffix</code> from the platform directory; B&amp;B keeps the exceptions in an AIF value map. Germany (Peppol): scheme <code>9930</code> with the VAT ID.</p>",
			joule: "<p>Your <em>Customer master guidelines</em>: the AR team maintains the platform address in tax number 2 (<code>STCD2</code>).</p>",
			hub: "<p>Compared your 1,240 customers with the platform directory extract: <strong>31 addresses differ</strong>. Names and tax IDs were masked before the model call.</p>"},
		{re: /InvoiceTypeCode|TypeCode|RodzajFaktury|TipoDeComprobante/,
			genb: "<p>The type code comes from the SAP document type through an AIF value map: invoice <code>F2</code> → <strong>380</strong>, credit memo <code>G2</code> → <strong>381</strong>, French self-billing → <strong>389</strong>, Mexico <code>I</code> / <code>E</code> / <code>P</code>.</p>",
			joule: "<p>Your <em>Order-to-Cash Agent</em> lists 4 billing types in use. Two are not mapped yet: <code>ZF2</code> and <code>ZG2</code>.</p>",
			hub: "<p>Proposed value map rows from the billing type descriptions: <code>ZF2</code> → 380, <code>ZG2</code> → 381. Review and apply them in the rule dialog.</p>"},
		{re: /TaxExemption|CategoryCode|^Code$|TaxCategory/,
			genb: "<p>Exemption codes follow the <strong>VATEX</strong> list (<code>VATEX-FR-CGI275</code>, <code>VATEX-EU-AE</code>, <code>VATEX-EU-132</code>...). B&amp;B maps them from the tax code in <code>BSET</code> with an AIF value map, so finance adds codes without a transport.</p>",
			joule: "<p>Your <em>Billing handbook</em> lists 6 tax codes with an exemption text on the invoice form.</p>",
			hub: "<p>Rewrote the 6 exemption texts of your invoice form in the legal wording the platform expects.</p>"},
		{re: /UsoCFDI|RegimenFiscal/,
			genb: "<p><strong>UsoCFDI</strong> and <strong>RegimenFiscalReceptor</strong> must match the customer's tax certificate, otherwise the PAC rejects the CFDI (CFDI40147). GENB keeps them as customer custom fields with a <strong>CHECK</strong> against the SAT catalog.</p>",
			joule: "<p>Your <em>Customer master guidelines</em> already define both custom fields: <code>ZZ1_USOCFDI</code> and <code>ZZ1_REGFISCAL</code>.</p>",
			hub: "<p>Read 85 customer tax certificates (PDF) with document grounding: <strong>4 customers</strong> have a different régimen fiscal in SAP.</p>"},
		{re: /ClaveProdServ|ClaveUnidad/,
			genb: "<p>SAT product and unit keys are not in the SAP standard. In B&amp;B projects the product key is a material custom field (<code>MARA-ZZ1_CLAVEPRODSERV</code>) and units go through an AIF value map (<code>ST</code> → <code>H87</code>, <code>H</code> → <code>HUR</code>).</p>",
			joule: "<p>Your <em>Billing handbook</em>: the tax team maintains product keys for sales materials only.</p>",
			hub: "<p>Proposed SAT product keys for <strong>52 materials</strong> without one, from their descriptions, for the tax team to review.</p>"},
		{re: /MetodoPago|FormaPago|FormaDePagoP/,
			genb: "<p><strong>MetodoPago</strong> is <code>PUE</code> when paid at once and <code>PPD</code> for credit terms; PPD invoices need a <strong>payment complement</strong> later, and <strong>FormaPago</strong> is then <code>99</code>.</p>",
			joule: "<p>Your <em>Finance Operations Agent</em> reports 3 payment terms in use: <code>0001</code> (PUE), <code>Z030</code> and <code>Z075</code> (PPD).</p>",
			hub: "<p>Wrote a one-page explanation in Spanish for your Mexico AR team.</p>"},
		{re: /BusinessProcess/,
			genb: "<p>For e-reporting the business process (<strong>B1</strong> goods, <strong>S1</strong> services...) comes from the tax attributes of the tax code (<code>EDOFRTAXATTR</code>). For MM invoices the tax code is read through the FI document (<code>RBKP</code> → <code>BKPF</code>).</p>",
			joule: "<p>Your <em>Finance Operations Agent</em>: 9 purchase tax codes were used for foreign suppliers last quarter.</p>",
			hub: "<p>Classified those 9 tax codes as goods (B1) or services (S1) from their descriptions, 2 flagged for review.</p>"},
		{re: /Note|SKONTO/i,
			genb: "<p>In XRechnung, cash discount must follow <code>#SKONTO#TAGE=..#PROZENT=..#BASISBETRAG=..#</code>; B&amp;B builds it from <code>FI_TERMS_OF_PAYMENT_PROPOSE</code>. In France, notes <code>#PMT#</code>, <code>#PMD#</code> and <code>#AAB#</code> carry the mandatory late-payment wording, one note per text.</p>",
			joule: "<p>Your <em>Billing handbook</em>: the late-payment wording is kept in header text <code>Z001</code> of the billing document.</p>",
			hub: "<p>Checked your 3 French texts against the legal wording: the <code>#PMD#</code> text misses the reference to the legal interest rate.</p>"},
		{re: /unitCode|UnitCode/,
			genb: "<p>Units must use UN/ECE Rec. 20 codes. B&amp;B maps SAP units through an AIF value map with fallback <code>H87</code> (piece).</p>",
			joule: "<p>Your <em>Order-to-Cash Agent</em>: 41 sales units were used on invoices this year.</p>",
			hub: "<p>Mapped 38 of the 41 units to UN/ECE Rec. 20 codes; 3 left for review.</p>"},
		{re: /CompanyID|NIP|Rfc|CompanyId|TaxRegistration/,
			genb: "<p>Tax identifiers depend on the party and the scheme: VAT ID (<code>STCEG</code>) in <em>PartyTaxScheme</em>; France SIREN (<code>STCD2</code>, scheme <code>0002</code>) in <em>PartyLegalEntity</em>; Mexico RFC (<code>STCD1</code>).</p>",
			joule: "<p>Your <em>Customer master guidelines</em>: <strong>12 customers</strong> still have no SIREN.</p>",
			hub: "<p>Matched 9 of the 12 customers to a SIREN from the public company register extract you uploaded.</p>"}
	];
	const TOPICS = [
		{re: /missing|siren|master data|customers/i,
			genb: "<p>GENB adds a <strong>CHECK</strong> rule so the eDocument stops with a clear message instead of a platform rejection.</p>",
			joule: "<p>Your <em>Order-to-Cash Agent</em> checked company code <code>FR01</code>: <strong>12 customers</strong> without SIREN (<code>STCD2</code>) and 3 without an e-mail for the platform directory.</p>",
			hub: "<p>Drafted the worklist e-mail to your master data team, grouped by sales organization.</p>"},
		{re: /self.?billing|autofactur|389/i,
			genb: "<p><strong>Self-billing</strong> (autofacturation) invoices are issued by the buyer on behalf of the supplier, type code <strong>389</strong>, from evaluated receipt settlement (<code>MRRL</code>, source type <code>INV_VERIF</code>). The invoice ID joins document number and fiscal year: <strong>CHANGE</strong> <em>Concatenate</em> <code>RBKP-BELNR</code> + <code>RBKP-GJAHR</code>.</p>",
			joule: "<p>Your <em>Finance Operations Agent</em>: ERS runs daily for 3 company codes, about 420 self-billing invoices a month.</p>",
			hub: "<p>Drafted the letter to suppliers that explains the self-billing agreement required by the reform.</p>"},
		{re: /reporting|e-report/i,
			genb: "<p><strong>E-reporting</strong> covers transactions that are not e-invoiced in France, such as purchases from foreign suppliers. The eDocument is a list (<code>EDOC_LIST</code>) built from FI and MM invoices; typical rules convert tax to EUR and treat the Canary Islands as non-EU.</p>",
			joule: "<p>Your <em>Finance Operations Agent</em>: 312 invoices from foreign suppliers last month, 18 in non-EUR currencies.</p>",
			hub: "<p>Summarised the 18 non-EUR invoices and the exchange rates that will be used in the report.</p>"},
		{re: /pac|cfdi|cancel/i,
			genb: "<p>CFDI 4.0 goes to the PAC for stamping. The accelerator generates the cockpit actions around it: <strong>Get PDF</strong>, <strong>Cancel</strong> with SAT reason 01 to 04, and a cockpit column with the PAC invoice ID.</p>",
			joule: "<p>Your <em>Finance Operations Agent</em>: 6 cancellations last month, 4 of them with reason 02.</p>",
			hub: "<p>Wrote a guide in Spanish for the AR team on when to use each cancellation reason.</p>"},
		{re: /auto.?suggest|suggest|help me map/i,
			genb: "<p>The GENB rule library has the field mappings, value maps and checks used in live projects for this scenario.</p>",
			joule: "<p>Your agents add what is specific to you: custom billing types used in the last 90 days and AIF value maps that already exist, so we reuse them.</p>",
			hub: "<p>Your model reviews the open fields against your documents and proposes rules for what is left, each marked for review.</p>"}
	];
	const FALLBACK = {
		genb: "<p>GENB AI knows the legal XML of each country and the rules B&amp;B used in live projects. Ask about a field, a scenario or a legal change.</p>",
		joule: "<p>Joule adds your own agents and knowledge bases, for example to check your master data.</p>",
		hub: "<p>The SAP Generative AI Hub uses the models of your SAP Business AI Platform subscription on your documents, with data masking.</p>"
	};

	// "Billing types ZF2 and ZG2 must not create e-invoices": a requirement, not a question. Returns the billing types or null.
	function relevance(sPrompt) {
		const p = sPrompt || "";
		if (!/billing type|fkart/i.test(p) || !/\b(not|no|never|exclude|skip|without|n't)\b/i.test(p)) { return null; }
		const types = [...new Set((p.match(/\b[A-Z]{1,2}[0-9]{1,2}[A-Z]?\b/g) || []))];
		return types.length ? types : ["ZF2", "ZG2"];
	}
	const relevanceAnswer = (types, oCtx) => {
		const t = types.map(x => `<code>${x}</code>`).join(" and ");
		const added = oCtx ? `<strong>Rule added</strong> to ${oCtx.docLabel} (${oCtx.countryName}): no eDocument for ${t}.` : "Open a scenario and ask again to add the rule.";
		return {
			joule: `<p>Your <em>Order-to-Cash Agent</em> knows these billing types: ${t} are pro forma and internal documents, not legal invoices. 37 of them were posted last month.</p>`,
			genb: `<p>The standard DRC customizing cannot exclude billing types here. In live projects B&amp;B uses the method <code>IS_RELEVANT</code> of BAdI <code>EDOC_ADAPTOR</code>. ${added}</p>`,
			hub: "<p>Generated the <code>IS_RELEVANT</code> method and reviewed it with your model: no issues, the other billing types are not affected. Open <strong>Code Preview</strong> to see it.</p>"
		};
	};

	return {
		relevance,

		/** Answer a prompt with the parts of the engines in aKeys; oCtx (optional) is the XML field selected in the workspace. */
		answer: function (sPrompt, oCtx, aKeys) {
			const types = relevance(sPrompt);
			let hit = types ? relevanceAnswer(types, oCtx) : (oCtx && FIELDS.find(f => f.re.test(oCtx.field))) || TOPICS.find(t => t.re.test(sPrompt)) || FIELDS.find(f => f.re.test(sPrompt));
			if (!hit && oCtx) {
				hit = {
					genb: `<p><strong>${oCtx.field}</strong> in ${oCtx.docLabel} (${oCtx.countryName}), path <code>${oCtx.path}</code>. ` + (oCtx.suggestion ? `The GENB rule library maps it from <code>${oCtx.suggestion}</code> in similar projects.</p>` : "No rule in the GENB library yet; B&amp;B can add it when implementing your package.</p>"),
					joule: "<p>No mention of this field in your knowledge bases.</p>",
					hub: `<p>Explained <strong>${oCtx.field}</strong> from the official schema documentation and drafted a short note for the functional specification.</p>`
				};
			}
			hit = hit || FALLBACK;
			return aKeys.map(k => ({engine: k, html: hit[k]}));
		},
		prompts: ["Billing types ZF2 and ZG2 must not create e-invoices", "Which customers are missing a SIREN?", "Explain self-billing in France", "What changes for e-reporting?"]
	};
});
