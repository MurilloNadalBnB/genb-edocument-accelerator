sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
	"use strict";

	return UIComponent.extend("bnb.edoc.Component", {
		metadata: {
			manifest: "json",
			interfaces: ["sap.ui.core.IAsyncContentCreation"]
		},

		init: function () {
			UIComponent.prototype.init.apply(this, arguments);

			// Fictional demo profile shown in the shell bar
			this.setModel(new JSONModel({
				user: {
					name: "Jordan Lee",
					initials: "JL",
					role: "Senior eDocument Consultant",
					email: "jordan.lee@bnb-demo.example",
					company: "B&B Enterprise Solutions (demo)"
				},
				sideExpanded: true,
				unreadCount: "2",
				darkMode: false,
				notifications: [
					{id: "n1", title: "KSeF FA(3) schema published", description: "Poland: a new legal XML version is available. Review the Invoice mapping before the next release.", datetime: "10 minutes ago", priority: "High", author: "Compliance Feed", initials: "CF", unread: true},
					{id: "n2", title: "Rule set approved", description: "France, Invoice: 42 rules approved by Taylor Brooks.", datetime: "2 hours ago", priority: "Medium", author: "Taylor Brooks", initials: "TB", unread: true},
					{id: "n3", title: "ABAP adaptor generated", description: "Germany, Credit Note: the adaptor class passed the syntax check.", datetime: "Yesterday", priority: "Low", author: "Code Generator", initials: "CG", unread: false}
				]
			}), "app");

			this.getRouter().initialize();
		}
	});
});
