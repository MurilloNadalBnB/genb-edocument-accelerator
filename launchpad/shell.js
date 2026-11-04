sap.ui.define([
	"sap/ui/core/Element",
	"sap/ui/core/Theming",
	"sap/ui/thirdparty/jquery"
], function (Element, Theming, jQuery) {
	"use strict";

	// Same list as webapp/model/i18n.js
	const LANGUAGES = [
		{key: "en", text: "English"},
		{key: "pt", text: "Português (Brasil)"},
		{key: "es", text: "Español"},
		{key: "fr", text: "Français"},
		{key: "de", text: "Deutsch"}
	];

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

	/**
	 * Settings > Language and Region: the sandbox has no backend to store the language, so the list offers the
	 * languages of the mock and saving reloads the launchpad in the chosen one (remembered in the browser).
	 */
	function useLanguageSettings(Container) {
		Container.getServiceAsync("UserInfo").then(oUserInfo => {
			oUserInfo.getLanguageList = () => jQuery.Deferred().resolve(LANGUAGES).promise();
		});
		const oUser = Container.getUser(), fnSet = oUser.setLanguage.bind(oUser);
		oUser.setLanguage = function (sLang) {
			fnSet(sLang);
			// called on Save only when the user picked another language than the current one
			if (sLang && sLang !== document.documentElement.lang.split("-")[0]) {
				switchTo(sLang);
			}
		};
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
			useLanguageSettings(Container);
		}
	};
});
