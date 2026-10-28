sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"../model/engine"
], function (Controller, JSONModel, MessageToast, engine) {
	"use strict";

	return Controller.extend("bnb.edoc.controller.Home", {
		onInit: function () {
			this.getView().setModel(new JSONModel({}), "home");
			this.getOwnerComponent().getRouter().getRoute("home").attachPatternMatched(this._refresh, this);
		},

		_refresh: function () {
			const aList = engine.COUNTRIES.map(c => Object.assign({}, c, {rules: engine.countryRuleCount(c.code)}));
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

		onAskJoule: function (oEvent) {
			const sPrompt = oEvent.getSource().data("prompt");
			if (sPrompt) {
				this.getOwnerComponent().getEventBus().publish("edoc", "joule", {prompt: sPrompt});
			} else {
				this.getOwnerComponent().getEventBus().publish("edoc", "jouleOpen");
			}
		},

		onRequests: function () {
			this.getOwnerComponent().getEventBus().publish("edoc", "requests");
		},

		_open: function (sCode) {
			const oCountry = engine.country(sCode);
			if (oCountry.planned) {
				MessageToast.show(`${oCountry.name} is planned for a future release.`);
				return;
			}
			this.getOwnerComponent().getRouter().navTo("country", {code: sCode});
		}
	});
});
