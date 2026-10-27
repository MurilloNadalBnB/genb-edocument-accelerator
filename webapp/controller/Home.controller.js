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
				totalRules: aList.reduce((s, c) => s + c.rules, 0)
			});
		},

		onCountry: function (oEvent) {
			this._open(oEvent.getSource().data("code"));
		},

		onTile: function (oEvent) {
			this._open(oEvent.getSource().getBindingContext("home").getProperty("code"));
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
