sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"../model/engine"
], function (Controller, JSONModel, engine) {
	"use strict";

	return Controller.extend("bnb.edoc.controller.Country", {
		onInit: function () {
			this.getView().setModel(new JSONModel({}), "c");
			this._router = this.getOwnerComponent().getRouter();
			this._router.getRoute("country").attachPatternMatched(this._onMatched, this);
		},

		_onMatched: function (oEvent) {
			const sCode = oEvent.getParameter("arguments").code;
			const oCountry = engine.country(sCode);
			if (!oCountry || oCountry.planned) {
				this._router.navTo("home", {}, true);
				return;
			}
			this.getView().getModel("c").setData(Object.assign({}, oCountry, {
				docs: engine.DOCS.map(d => Object.assign({}, d, {rules: engine.docRuleCount(sCode, d.id)}))
			}));
		},

		onHome: function () {
			this._router.navTo("home");
		},

		onDoc: function (oEvent) {
			const sDoc = oEvent.getSource().getBindingContext("c").getProperty("id");
			this._router.navTo("workspace", {code: this.getView().getModel("c").getProperty("/code"), doc: sDoc});
		}
	});
});
