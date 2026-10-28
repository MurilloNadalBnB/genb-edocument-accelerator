sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"./model/engine"
], function (UIComponent, JSONModel, engine) {
	"use strict";

	return UIComponent.extend("bnb.edoc.Component", {
		metadata: {
			manifest: "json",
			interfaces: ["sap.ui.core.IAsyncContentCreation"]
		},

		init: function () {
			UIComponent.prototype.init.apply(this, arguments);

			// Compact by default (same as Fiori Elements on desktop); ?density=cozy to compare
			const bCozy = new URLSearchParams(window.location.search).get("density") === "cozy";
			document.body.classList.toggle("sapUiSizeCompact", !bCozy);
			document.body.classList.toggle("sapUiSizeCozy", bCozy);

			const toNav = c => ({code: c.code, name: c.name});
			// Fictional demo profile shown in the shell bar
			this.setModel(new JSONModel({
				user: {
					name: "Jordan Lee",
					initials: "JL",
					role: "Senior eDocument Consultant",
					email: "jordan.lee@bnb-demo.example",
					company: "B&B Enterprise Solutions (demo)"
				},
				countries: engine.COUNTRIES.filter(c => !c.planned).map(toNav),
				planned: engine.COUNTRIES.filter(c => c.planned).map(toNav),
				sideExpanded: true,
				canGoBack: false,
				unreadCount: "2",
				darkMode: false,
				notifications: [
					{id: "n1", title: "France: lifecycle statuses updated", description: "The certified platform published new invoice lifecycle codes. Review the Customer Invoice mapping before the next release.", datetime: "10 minutes ago", priority: "High", author: "Compliance Feed", initials: "CF", unread: true},
					{id: "n2", title: "Rule set approved", description: "Mexico, CFDI Invoice: 38 rules approved by Taylor Brooks.", datetime: "2 hours ago", priority: "Medium", author: "Taylor Brooks", initials: "TB", unread: true},
					{id: "n3", title: "ABAP adaptor generated", description: "Germany, FI Invoice by E-mail: the adaptor class passed the syntax check.", datetime: "Yesterday", priority: "Low", author: "Code Generator", initials: "CG", unread: false}
				],
				// Implementation requests sent to B&B (ticket in the B&B service ERP)
				requests: [],
				// AI engines: use one, two or all three together
				ai: {
					busy: false,
					messages: [],
					activeText: "",
					engines: [
						{key: "joule", name: "Joule", by: "SAP Business AI", icon: "sap-icon://da-2", initials: "", color: "Accent7", status: "Connected", enabled: true,
							desc: "Reuse the Joule agents and knowledge bases you already have.",
							items: [
								{text: "Finance Operations Agent", icon: "sap-icon://da"},
								{text: "Order-to-Cash Agent", icon: "sap-icon://da"},
								{text: "Billing handbook, 214 documents", icon: "sap-icon://course-book"},
								{text: "Customer master guidelines, 38 documents", icon: "sap-icon://course-book"}
							]},
						{key: "hub", name: "SAP Generative AI Hub", by: "SAP AI Core on SAP BTP", icon: "webapp/img/sap-logo.svg", initials: "", color: "Transparent", status: "Connected", enabled: true,
							desc: "Use the LLMs of your own BTP subscription on your documents.",
							items: [
								{text: "Your choice of model: GPT, Claude, Gemini, Mistral", icon: "sap-icon://chain-link"},
								{text: "Grounding on your documents and eDocument history", icon: "sap-icon://documents"},
								{text: "Data masking of names and tax IDs", icon: "sap-icon://locked"},
								{text: "Runs under your SAP contract and data residency", icon: "sap-icon://shield"}
							]},
						{key: "genb", name: "GENB AI", by: "B&B Enterprise Solutions", icon: "sap-icon://ai", initials: "", color: "Accent7", status: "Connected", enabled: true,
							desc: "Add B&B's DRC knowledge, built from live projects.",
							items: [
								{text: "Rule library for FR, DE, MX and PL", icon: "sap-icon://course-book"},
								{text: "Legal XML schemas and change feed", icon: "sap-icon://official-service"},
								{text: "Patterns reviewed by B&B consultants", icon: "sap-icon://employee-approvals"},
								{text: "Updated with every new go-live", icon: "sap-icon://history"}
							]}
					]
				}
			}), "app");

			this.updateEngines();
			// Samples are small static XML files, load them all before the first route renders
			engine.load().then(() => this.getRouter().initialize());
		},

		/** Switch an AI engine on or off; at least one stays on. Returns false when the change was refused. */
		setEngine: function (sKey, bOn) {
			const oModel = this.getModel("app"), aEngines = oModel.getProperty("/ai/engines");
			const oEngine = aEngines.find(e => e.key === sKey);
			if (!bOn && aEngines.filter(e => e.enabled && e !== oEngine).length === 0) {
				oEngine.enabled = true; // the two-way binding already switched it off
				oModel.refresh(true);
				return false;
			}
			oEngine.enabled = bOn;
			this.updateEngines();
			return true;
		},

		updateEngines: function () {
			const oModel = this.getModel("app"), aOn = oModel.getProperty("/ai/engines").filter(e => e.enabled);
			oModel.setProperty("/ai/activeText", aOn.map(e => e.name).join(" + "));
			oModel.refresh(true);
		}
	});
});
