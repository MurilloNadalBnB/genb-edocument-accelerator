sap.ui.define([
	"sap/base/i18n/Localization",
	"sap/base/i18n/ResourceBundle",
	"sap/base/strings/formatMessage"
], function (Localization, ResourceBundle, formatMessage) {
	"use strict";

	// Languages of the mock. English is the default; the others are chosen in the profile menu
	// (standalone), in the launchpad user menu, or with ?sap-language=de in the URL.
	const LANGUAGES = [
		{key: "en", text: "English"},
		{key: "pt", text: "Português (Brasil)"},
		{key: "es", text: "Español"},
		{key: "fr", text: "Français"},
		{key: "de", text: "Deutsch"}
	];
	const STORE = "genb-language";

	let bundle = null, content = {}, lang = "en";

	/** "pt-BR" -> "pt"; anything we do not have -> "en" */
	const supported = s => { const k = String(s || "").toLowerCase().split(/[-_]/)[0]; return LANGUAGES.some(l => l.key === k) ? k : "en"; };

	return {
		LANGUAGES,

		/** Current language of the mock: en, pt, es, fr or de. */
		lang: () => lang,

		/** BCP 47 tag for dates and times, e.g. pt-BR. */
		locale: () => lang === "pt" ? "pt-BR" : lang,

		/**
		 * Load the UI texts (i18n*.properties) and the mock content (content_xx.json) of the current language.
		 * Content keys are the English texts, so anything without a translation stays in English.
		 */
		load: function () {
			lang = supported(Localization.getLanguage());
			const pBundle = ResourceBundle.create({
				url: sap.ui.require.toUrl("bnb/edoc/i18n/i18n.properties"),
				supportedLocales: LANGUAGES.map(l => l.key === "en" ? "" : l.key),
				fallbackLocale: "",
				async: true
			}).then(b => { bundle = b; });
			const pContent = lang === "en" ? Promise.resolve() : fetch(sap.ui.require.toUrl(`bnb/edoc/i18n/content_${lang}.json`))
				.then(r => r.ok ? r.json() : {}).then(o => { content = o; }, () => { content = {}; });
			return Promise.all([pBundle, pContent]);
		},

		/** UI text by key, with {0}, {1}... placeholders. */
		t: function (sKey, ...aArgs) {
			// without arguments the text is returned as is (no formatMessage, so apostrophes stay)
			return bundle ? bundle.getText(sKey, aArgs.length ? aArgs : undefined) : sKey;
		},

		/** "{0} rule" / "{0} rules": key + "1" or key + "N"; French uses the singular for 0 and 1. */
		count: function (n, sKey) {
			return this.t(sKey + ((lang === "fr" ? n <= 1 : n === 1) ? "1" : "N"), n);
		},

		/** Mock content by its English text, with {0}, {1}... placeholders. */
		tr: function (sText, ...aArgs) {
			const s = (lang !== "en" && content[sText]) || sText;
			return aArgs.length ? formatMessage(s, aArgs) : s;
		},

		/** Switch the language: remember it, put it in the URL (so a shared link keeps it) and reload. */
		switchTo: function (sLang) {
			try {
				localStorage.setItem(STORE, sLang);
			} catch (e) {
				// private mode: the URL parameter below still does the job for this visit
			}
			const oUrl = new URL(window.location.href);
			oUrl.searchParams.set("sap-language", sLang);
			window.location.replace(oUrl.toString());
		}
	};
});
