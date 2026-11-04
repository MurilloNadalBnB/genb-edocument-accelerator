sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"../model/i18n",
	"../model/engine"
], function (Controller, JSONModel, MessageToast, i18n, engine) {
	"use strict";

	const t = i18n.t;

	return Controller.extend("bnb.edoc.controller.Home", {
		onInit: function () {
			this.getView().setModel(new JSONModel({}), "home");
			this.getOwnerComponent().getRouter().getRoute("home").attachPatternMatched(this._refresh, this);
		},

		_refresh: function () {
			const aList = engine.COUNTRIES.map(c => {
				const iRules = engine.countryRuleCount(c.code), iDocs = (c.docs || []).length;
				return Object.assign({}, c, {
					rules: iRules,
					footer: c.planned ? t("nav.planned") : t(iDocs === 1 ? "common.scenario1" : "common.scenarioN", iDocs),
					scale: c.planned ? "" : t(iRules === 1 ? "common.ruleUnit1" : "common.ruleUnitN")
				});
			});
			this.getView().getModel("home").setData({
				list: aList,
				countries: aList.length,
				available: aList.filter(c => !c.planned).length,
				planned: aList.filter(c => c.planned).length,
				scenarios: aList.reduce((s, c) => s + (c.docs || []).length, 0),
				totalRules: engine.totalRuleCount()
			});
		},

		onCountry: function (oEvent) {
			this._open(oEvent.getSource().data("code"));
		},

		onTile: function (oEvent) {
			this._open(oEvent.getSource().getBindingContext("home").getProperty("code"));
		},

		onAskAi: function (oEvent) {
			const sPrompt = oEvent.getSource().data("prompt");
			if (sPrompt) {
				this.getOwnerComponent().getEventBus().publish("edoc", "ai", {prompt: sPrompt});
			} else {
				this.getOwnerComponent().getEventBus().publish("edoc", "aiOpen");
			}
		},

		onEngineSwitch: function (oEvent) {
			const oCtx = oEvent.getSource().getBindingContext("app");
			if (!this.getOwnerComponent().setEngine(oCtx.getProperty("key"), oEvent.getParameter("state"))) {
				MessageToast.show(t("ai.keepOne"));
			}
		},

		onRequests: function () {
			this.getOwnerComponent().getEventBus().publish("edoc", "requests");
		},

		_open: function (sCode) {
			const oCountry = engine.country(sCode);
			if (oCountry.planned) {
				MessageToast.show(t("msg.planned", oCountry.name));
				return;
			}
			this.getOwnerComponent().getRouter().navTo("country", {code: sCode});
		}
	});
});
