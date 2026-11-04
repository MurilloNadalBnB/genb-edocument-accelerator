sap.ui.define([
	"sap/ui/core/Element",
	"sap/ui/core/Theming",
	"sap/base/i18n/Localization",
	"sap/m/Dialog",
	"sap/m/List",
	"sap/m/StandardListItem",
	"sap/m/Button"
], function (Element, Theming, Localization, Dialog, List, StandardListItem, Button) {
	"use strict";

	// Same list as webapp/model/i18n.js
	const LANGUAGES = [
		{key: "en", text: "English"},
		{key: "pt", text: "Português (Brasil)"},
		{key: "es", text: "Español"},
		{key: "fr", text: "Français"},
		{key: "de", text: "Deutsch"}
	];
	const TEXTS = {
		en: {language: "Language", cancel: "Cancel"},
		pt: {language: "Idioma", cancel: "Cancelar"},
		es: {language: "Idioma", cancel: "Cancelar"},
		fr: {language: "Langue", cancel: "Annuler"},
		de: {language: "Sprache", cancel: "Abbrechen"}
	};
	const lang = () => {
		const k = Localization.getLanguage().split("-")[0].toLowerCase();
		return TEXTS[k] ? k : "en";
	};

	function switchTo(sLang) {
		try {
			localStorage.setItem("genb-language", sLang);
		} catch (e) {
			// private mode: the URL parameter still does the job for this visit
		}
		const oUrl = new URL(window.location.href);
		oUrl.searchParams.set("sap-language", sLang);
		window.location.replace(oUrl.toString());
	}

	let oDialog;
	function openLanguages() {
		const T = TEXTS[lang()];
		if (!oDialog) {
			oDialog = new Dialog({
				title: T.language,
				icon: "sap-icon://translate",
				contentWidth: "18rem",
				content: new List({
					items: LANGUAGES.map(l => new StandardListItem({
						title: l.text,
						type: "Active",
						selected: l.key === lang(),
						icon: l.key === lang() ? "sap-icon://accept" : "",
						press: () => switchTo(l.key)
					}))
				}),
				endButton: new Button({text: T.cancel, press: () => oDialog.close()})
			});
		}
		oDialog.open();
	}

	/** Company logo of the launchpad header: B&B, white line art on dark themes (in Work Zone this is a site setting). */
	function useCompanyLogo() {
		const oHeader = Element.getElementById("shell-header");
		if (!oHeader) {
			return;
		}
		const bDark = Theming.getTheme().includes("dark");
		oHeader.setLogo(bDark ? "webapp/img/logo-dark.svg" : "webapp/img/logo.svg");
		oHeader.setLogoAltText("B&B Enterprise Solutions");
	}

	return {
		/** Called once the launchpad renderer is placed. */
		init: function (Container) {
			useCompanyLogo();
			Theming.attachApplied(useCompanyLogo);
			Container.getServiceAsync("Extension")
				.then(oExtension => oExtension.createUserAction({text: TEXTS[lang()].language, icon: "sap-icon://translate", press: openLanguages}))
				.then(oItem => {
					oItem.showOnHome();
					oItem.showForAllApps();
				});
		}
	};
});
