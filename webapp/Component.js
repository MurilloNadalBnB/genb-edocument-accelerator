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
				// Joule: the customer's own Joule tenant plus the GENB DRC knowledge
				joule: {
					connected: true,
					tenant: "Joule (your SAP Business AI tenant)",
					agents: [
						{name: "Finance Operations Agent", desc: "Your agent for AR and AP processes"},
						{name: "Order-to-Cash Agent", desc: "Your agent for billing and customer master"}
					],
					knowledge: [
						{name: "Billing handbook", desc: "Your document grounding, 214 documents"},
						{name: "Customer master guidelines", desc: "Your document grounding, 38 documents"},
						{name: "SAP Help: Document and Reporting Compliance", desc: "SAP standard knowledge"}
					],
					bnb: {name: "GENB DRC knowledge", desc: "B&B rule library from live DRC projects (FR, DE, MX, PL)"},
					busy: false,
					messages: []
				}
			}), "app");

			// Samples are small static XML files, load them all before the first route renders
			engine.load().then(() => this.getRouter().initialize());
		}
	});
});
