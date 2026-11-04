sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"./model/i18n",
	"./model/engine"
], function (UIComponent, JSONModel, i18n, engine) {
	"use strict";

	return UIComponent.extend("bnb.edoc.Component", {
		metadata: {
			manifest: "json",
			interfaces: ["sap.ui.core.IAsyncContentCreation"]
		},

		init: function () {
			// Texts of the current language and the sample XML files load before the root view is created
			this._pReady = i18n.load().then(() => engine.load()).then(() => this._createAppModel());
			UIComponent.prototype.init.apply(this, arguments);

			// Inside the Fiori launchpad (index.html) the shell header, density and theme belong to the launchpad
			if (!sap.ui.require("sap/ushell/Container")) {
				// Compact by default (same as Fiori Elements on desktop); ?density=cozy to compare
				const bCozy = new URLSearchParams(window.location.search).get("density") === "cozy";
				document.body.classList.toggle("sapUiSizeCompact", !bCozy);
				document.body.classList.toggle("sapUiSizeCozy", bCozy);
			}
			this._pReady.then(() => this.getRouter().initialize());
		},

		/** The root view (App) needs the app model, so it waits for the texts. */
		createContent: function () {
			const aArgs = arguments;
			// runAsOwner: the view is created later, it still has to know its component
			return this._pReady.then(() => this.runAsOwner(() => UIComponent.prototype.createContent.apply(this, aArgs)));
		},

		_createAppModel: function () {
			const t = i18n.t, toNav = c => ({code: c.code, name: c.name, tag: c.tag || ""});
			// Fictional demo profile shown in the shell bar
			this.setModel(new JSONModel({
				user: {
					name: "Tori Hayes",
					initials: "TH",
					role: t("profile.role"),
					email: "tori.hayes@demo-company.example",
					company: t("profile.company")
				},
				countries: engine.COUNTRIES.filter(c => !c.planned).map(toNav),
				planned: engine.COUNTRIES.filter(c => c.planned).map(toNav),
				embedded: !!sap.ui.require("sap/ushell/Container"),
				language: i18n.lang(),
				languages: i18n.LANGUAGES,
				sideExpanded: true,
				canGoBack: false,
				unreadCount: "2",
				darkMode: false,
				notifications: [
					{id: "n1", title: t("notif.n1Title"), description: t("notif.n1Text"), datetime: t("notif.minutesAgo", 10), priority: "High", author: t("products.complianceFeed"), initials: "CF", unread: true},
					{id: "n2", title: t("notif.n2Title"), description: t("notif.n2Text"), datetime: t("notif.hoursAgo", 2), priority: "Medium", author: "Taylor Brooks", initials: "TB", unread: true},
					{id: "n3", title: t("notif.n3Title"), description: t("notif.n3Text"), datetime: t("notif.yesterday"), priority: "Low", author: t("products.codeGenerator"), initials: "CG", unread: false}
				],
				// Implementation requests sent to B&B (ticket in the B&B service ERP)
				requests: [],
				// AI engines: use one, two or all three together
				ai: {
					busy: false,
					messages: [],
					activeText: "",
					engines: [
						{key: "joule", name: "Joule", by: "SAP Business AI", icon: "sap-icon://da-2", initials: "", color: "Accent7", status: t("ai.connected"), enabled: true,
							desc: t("ai.jouleDesc"),
							items: [
								{text: "Finance Operations Agent", icon: "sap-icon://da"},
								{text: "Order-to-Cash Agent", icon: "sap-icon://da"},
								{text: t("ai.jouleItem3"), icon: "sap-icon://course-book"},
								{text: t("ai.jouleItem4"), icon: "sap-icon://course-book"}
							]},
						{key: "hub", name: "SAP Generative AI Hub", by: "SAP AI Core on SAP Business AI Platform", icon: sap.ui.require.toUrl("bnb/edoc/img/sap-logo.svg"), initials: "", color: "Transparent", status: t("ai.connected"), enabled: true,
							desc: t("ai.hubDesc"),
							items: [
								{text: t("ai.hubItem1"), icon: "sap-icon://chain-link"},
								{text: t("ai.hubItem2"), icon: "sap-icon://documents"},
								{text: t("ai.hubItem3"), icon: "sap-icon://locked"},
								{text: t("ai.hubItem4"), icon: "sap-icon://shield"}
							]},
						{key: "genb", name: "GENB AI", by: "B&B Enterprise Solutions", icon: "sap-icon://ai", initials: "", color: "Accent7", status: t("ai.connected"), enabled: true,
							desc: t("ai.genbDesc"),
							items: [
								{text: t("ai.genbItem1"), icon: "sap-icon://course-book"},
								{text: t("ai.genbItem2"), icon: "sap-icon://official-service"},
								{text: t("ai.genbItem3"), icon: "sap-icon://employee-approvals"},
								{text: t("ai.genbItem4"), icon: "sap-icon://history"}
							]}
					]
				}
			}), "app");
			this.updateEngines();
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
