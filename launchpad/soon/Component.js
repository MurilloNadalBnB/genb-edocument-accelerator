sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/base/i18n/Localization",
	"sap/m/Page",
	"sap/m/IllustratedMessage",
	"sap/m/Button"
], function (UIComponent, Localization, Page, IllustratedMessage, Button) {
	"use strict";

	// One page for every launchpad tile marked "Coming soon": the tile passes ?feature=<key>, texts.json has the words
	return UIComponent.extend("bnb.soon.Component", {
		metadata: {
			manifest: "json",
			interfaces: ["sap.ui.core.IAsyncContentCreation"]
		},

		createContent: function () {
			const sFeature = ((this.getComponentData() || {}).startupParameters || {}).feature;
			const sLang = Localization.getLanguage().split("-")[0].toLowerCase();
			return fetch(sap.ui.require.toUrl("bnb/soon/texts.json")).then(r => r.json()).then(oTexts => {
				const T = oTexts[sLang] || oTexts.en, oFeature = T.features[sFeature && sFeature[0]] || {title: T.soon, text: ""};
				return new Page({
					showHeader: false,
					content: new IllustratedMessage({
						illustrationType: "sapIllus-Tent",
						title: oFeature.title,
						description: `${oFeature.text} ${T.roadmap}`,
						additionalContent: new Button({
							text: T.open,
							type: "Emphasized",
							icon: "sap-icon://chain-link",
							press: () => { window.location.hash = "#EDocumentMapping-manage"; }
						})
					}).addStyleClass("sapUiLargeMarginTop")
				});
			});
		}
	});
});
