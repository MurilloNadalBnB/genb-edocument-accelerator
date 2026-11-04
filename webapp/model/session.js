sap.ui.define([], function () {
	"use strict";

	/**
	 * Demo state that must outlive the app component. In the launchpad the component is destroyed when the user
	 * goes back to the home page; a module lives as long as the page, like the rules in model/engine.js.
	 * Reloading the page starts a clean demo.
	 */
	return {
		app: null,       // data of the "app" model: requests to B&B, notifications, AI conversation and engines
		savedAt: {},     // "Draft saved at" per country|scenario
		genChoice: null  // AI chosen to review the generated code, when "use for the rest of the session" was ticked
	};
});
