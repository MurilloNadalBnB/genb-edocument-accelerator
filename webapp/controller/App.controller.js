sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Theming",
	"sap/m/MessageToast",
	"sap/m/ResponsivePopover",
	"sap/m/VBox",
	"sap/m/HBox",
	"sap/m/Avatar",
	"sap/m/Title",
	"sap/m/Text",
	"sap/m/List",
	"sap/m/StandardListItem",
	"sap/m/CustomListItem",
	"sap/m/Switch",
	"sap/m/Label",
	"sap/m/Button",
	"sap/m/NotificationListItem",
	"sap/f/ProductSwitch",
	"sap/f/ProductSwitchItem",
	"sap/m/MenuItem",
	"sap/m/Dialog",
	"sap/m/ObjectListItem",
	"sap/m/ObjectStatus",
	"sap/m/ObjectAttribute",
	"sap/ui/core/Fragment",
	"../model/engine",
	"../model/assistant"
], function (Controller, Theming, MessageToast, ResponsivePopover, VBox, HBox, Avatar, Title, Text, List,
	StandardListItem, CustomListItem, Switch, Label, Button, NotificationListItem, ProductSwitch, ProductSwitchItem,
	MenuItem, Dialog, ObjectListItem, ObjectStatus, ObjectAttribute, Fragment, engine, assistant) {
	"use strict";

	const PRODUCTS = [
		{title: "Mapping Workbench", subTitle: "Current app", icon: "sap-icon://chain-link"},
		{title: "AI Assistant", subTitle: "Joule, Generative AI Hub, GENB AI", icon: "sap-icon://ai"},
		{title: "B&B Service Desk", subTitle: "Implementation requests", icon: "sap-icon://collaborate"},
		{title: "eDocument Cockpit", subTitle: "Monitor eDocuments", icon: "sap-icon://monitor-payments"},
		{title: "Rule Library", subTitle: "Reusable rule sets", icon: "sap-icon://course-book"},
		{title: "Code Generator", subTitle: "ABAP adaptors", icon: "sap-icon://syntax"},
		{title: "Test Center", subTitle: "Sample documents", icon: "sap-icon://lab"},
		{title: "Compliance Feed", subTitle: "Legal changes", icon: "sap-icon://official-service"}
	];

	return Controller.extend("bnb.edoc.controller.App", {
		onInit: function () {
			this._router = this.getOwnerComponent().getRouter();
			this._router.attachRouteMatched(this._onRouteMatched, this);
			// B&B logo is black line art, use the white variant on dark themes
			Theming.attachApplied(this._onThemeApplied.bind(this));

			const oMenu = this.byId("appMenu");
			oMenu.addItem(new MenuItem({text: "Overview", icon: "sap-icon://home", key: "home"}));
			engine.COUNTRIES.filter(c => !c.planned).forEach((c, i) => oMenu.addItem(new MenuItem({text: c.name, icon: "sap-icon://flag", key: c.code, startsSection: i === 0})));

			const oApp = this.getOwnerComponent().getModel("app");
			oApp.setProperty("/ai/prompts", assistant.prompts.map(text => ({text})));
			// Other views open the assistant with a question about the field they show
			const oBus = this.getOwnerComponent().getEventBus();
			oBus.subscribe("edoc", "ai", (sChannel, sEvent, oData) => this._askAi(oData.prompt, oData.ctx));
			oBus.subscribe("edoc", "aiOpen", () => this._getAi().then(oPanel => oPanel.isOpen() || oPanel.openBy(this.byId("aiBtn"))));
			oBus.subscribe("edoc", "requests", this.onRequests, this);
		},

		/* ---------- AI assistant ---------- */
		_getAi: function () {
			if (!this._pAi) {
				this._pAi = Fragment.load({id: this.getView().getId(), name: "bnb.edoc.view.AssistantPanel", controller: this}).then(oPanel => {
					this.getView().addDependent(oPanel);
					return oPanel;
				});
			}
			return this._pAi;
		},

		onAi: function () {
			this._getAi().then(oPanel => oPanel.isOpen() ? oPanel.close() : oPanel.openBy(this.byId("aiBtn")));
		},

		onAiClose: function () {
			this._getAi().then(oPanel => oPanel.close());
		},

		onAiReset: function () {
			this.getView().getModel("app").setProperty("/ai/messages", []);
		},

		onAiPost: function (oEvent) {
			this._askAi(oEvent.getParameter("value"));
		},

		onAiPrompt: function (oEvent) {
			this._askAi(oEvent.getSource().getText());
		},

		onEngineToggle: function (oEvent) {
			const oCtx = oEvent.getSource().getBindingContext("app");
			if (!this.getOwnerComponent().setEngine(oCtx.getProperty("key"), oEvent.getParameter("pressed"))) {
				MessageToast.show("Keep at least one AI engine on.");
			}
		},

		/** Show the question, then the answer of the engines switched on, after a short "thinking" delay. */
		_askAi: function (sPrompt, oCtx) {
			const oModel = this.getView().getModel("app"), aMsgs = oModel.getProperty("/ai/messages");
			const aEngines = oModel.getProperty("/ai/engines").filter(e => e.enabled);
			this._getAi().then(oPanel => {
				if (!oPanel.isOpen()) {
					oPanel.openBy(this.byId("aiBtn"));
				}
				aMsgs.push({from: "user", text: sPrompt});
				oModel.setProperty("/ai/messages", aMsgs);
				oModel.setProperty("/ai/busy", true);
				this._scrollAi();
				setTimeout(() => {
					const aParts = assistant.answer(sPrompt, oCtx, aEngines.map(e => e.key)).map(p => {
						const oEngine = aEngines.find(e => e.key === p.engine);
						return {name: oEngine.name, icon: oEngine.icon, initials: oEngine.initials, color: oEngine.color, html: p.html};
					});
					aMsgs.push({from: "ai", parts: aParts});
					oModel.setProperty("/ai/messages", aMsgs);
					oModel.setProperty("/ai/busy", false);
					this._scrollAi();
				}, 900);
			});
		},

		_scrollAi: function () {
			setTimeout(() => {
				const oScroll = this.byId("aiScroll"), el = oScroll && oScroll.getDomRef("scroll");
				if (el) {
					oScroll.scrollTo(0, el.scrollHeight, 200);
				}
			}, 50);
		},

		/* ---------- B&B implementation requests ---------- */
		onRequests: function () {
			const oModel = this.getView().getModel("app");
			if (!oModel.getProperty("/requests").length) {
				MessageToast.show("No implementation requests yet. Open a scenario, generate the code and choose Request B&B Implementation.");
				return;
			}
			if (!this._oRequests) {
				this._oRequests = new Dialog({
					title: "Implementation Requests",
					icon: "sap-icon://collaborate",
					contentWidth: "36rem",
					content: new List({
						items: {
							path: "app>/requests",
							template: new ObjectListItem({
								title: "{app>ticket}: {app>scenario}",
								number: "{app>rules}",
								numberUnit: "rules",
								icon: "sap-icon://collaborate",
								attributes: [
									new ObjectAttribute({text: "{app>objectsText}"}),
									new ObjectAttribute({text: "Sent {app>sentAt} · {app>systemText}"})
								],
								firstStatus: new ObjectStatus({text: "{app>status}", state: "Information", icon: "sap-icon://pending"})
							})
						}
					}),
					endButton: new Button({text: "Close", press: () => this._oRequests.close()})
				});
				this._oRequests.setModel(oModel, "app");
				this.getView().addDependent(this._oRequests);
			}
			this._oRequests.open();
		},

		_onThemeApplied: function () {
			const bDark = Theming.getTheme().includes("dark");
			this.byId("logo").setSrc(bDark ? "webapp/img/logo-dark.svg" : "webapp/img/logo.svg");
			this.getOwnerComponent().getModel("app").setProperty("/darkMode", bDark);
		},

		_onRouteMatched: function (oEvent) {
			const oArgs = oEvent.getParameter("arguments");
			this._oArgs = oArgs;
			this.byId("sideNav").setSelectedKey(oArgs.code || "home");
			this.getOwnerComponent().getModel("app").setProperty("/canGoBack", !!oArgs.code);
		},

		/** Back goes one level up: workspace > country > overview */
		onBack: function () {
			const oArgs = this._oArgs || {};
			if (oArgs.doc) {
				this._router.navTo("country", {code: oArgs.code});
			} else {
				this._router.navTo("home");
			}
		},

		onAppMenu: function (oEvent) {
			const sKey = oEvent.getParameter("item").getKey();
			if (sKey === "home") {
				this._router.navTo("home");
			} else {
				this._router.navTo("country", {code: sKey});
			}
		},

		onThemeToggle: function () {
			Theming.setTheme(Theming.getTheme().includes("dark") ? "sap_horizon" : "sap_horizon_dark");
		},

		onHome: function () {
			this._router.navTo("home");
		},

		onToggleSide: function () {
			const oModel = this.getView().getModel("app");
			oModel.setProperty("/sideExpanded", !oModel.getProperty("/sideExpanded"));
		},

		onNavPress: function (oEvent) {
			const sKey = oEvent.getParameter("item").getKey();
			const oCountry = engine.country(sKey);
			if (sKey === "home") {
				this._router.navTo("home");
			} else if (oCountry && oCountry.planned) {
				MessageToast.show(`${oCountry.name} is planned for a future release.`);
			} else if (oCountry) {
				this._router.navTo("country", {code: sKey});
			} else if (sKey === "available" || sKey === "planned") {
				return; // group nodes only expand or collapse
			} else if (sKey === "requests") {
				this.onRequests();
			} else {
				this.onNotInMock();
			}
		},

		onNotInMock: function () {
			MessageToast.show("Not part of this demo yet.");
		},

		onShellSearch: function (oEvent) {
			const sQuery = (oEvent.getParameter("query") || "").trim().toLowerCase();
			if (!sQuery) {
				return;
			}
			const oCountry = engine.COUNTRIES.find(c => c.name.toLowerCase().startsWith(sQuery) || c.code.toLowerCase() === sQuery);
			if (oCountry && !oCountry.planned) {
				this._router.navTo("country", {code: oCountry.code});
			} else if (oCountry) {
				MessageToast.show(`${oCountry.name} is planned for a future release.`);
			} else {
				MessageToast.show(`No country matches "${sQuery}". Open a document type to search its XML fields.`);
			}
		},

		/* ---------- Profile ---------- */
		onAvatar: function (oEvent) {
			const oSource = oEvent.getSource();
			if (!this._oProfile) {
				const oModel = this.getView().getModel("app");
				this._oProfile = new ResponsivePopover({
					showHeader: false,
					placement: "Bottom",
					contentWidth: "18rem",
					content: [
						new VBox({
							alignItems: "Center",
							items: [
								new Avatar({initials: "{app>/user/initials}", displaySize: "L"}),
								new Title({text: "{app>/user/name}", level: "H4"}).addStyleClass("sapUiSmallMarginTop"),
								new Text({text: "{app>/user/role}"}),
								new Label({text: "{app>/user/email}"})
							]
						}).addStyleClass("sapUiSmallMargin"),
						new List({
							items: [
								new CustomListItem({
									content: new HBox({
										alignItems: "Center",
										justifyContent: "SpaceBetween",
										items: [
											new Label({text: "Dark theme (Horizon Evening)"}),
											new Switch({state: "{app>/darkMode}", change: this.onThemeSwitch.bind(this)})
										]
									}).addStyleClass("sapUiSmallMarginBeginEnd")
								}),
								new StandardListItem({title: "My Settings", icon: "sap-icon://action-settings", type: "Active", press: this.onNotInMock.bind(this)}),
								new StandardListItem({title: "About", icon: "sap-icon://hint", type: "Active", press: () => MessageToast.show("GENB eDocument Accelerator, product preview (mock data).")}),
								new StandardListItem({title: "Sign Out", icon: "sap-icon://log", type: "Active", press: () => MessageToast.show("This is a demo, there is nothing to sign out from.")})
							]
						})
					]
				});
				this._oProfile.setModel(oModel, "app");
				this.getView().addDependent(this._oProfile);
			}
			this._oProfile.openBy(oSource);
		},

		onThemeSwitch: function (oEvent) {
			Theming.setTheme(oEvent.getParameter("state") ? "sap_horizon_dark" : "sap_horizon");
		},

		/* ---------- Notifications ---------- */
		onNotifications: function (oEvent) {
			const oSource = oEvent.getSource();
			if (!this._oNotif) {
				const oModel = this.getView().getModel("app");
				this._oNotif = new ResponsivePopover({
					title: "Notifications",
					placement: "Bottom",
					contentWidth: "26rem",
					content: new List({
						items: {
							path: "app>/notifications",
							template: new NotificationListItem({
								title: "{app>title}",
								description: "{app>description}",
								datetime: "{app>datetime}",
								priority: "{app>priority}",
								unread: "{app>unread}",
								authorName: "{app>author}",
								authorInitials: "{app>initials}",
								showCloseButton: false,
								press: this.onNotificationPress.bind(this)
							})
						}
					}),
					endButton: new Button({text: "Mark all as read", type: "Transparent", press: this.onNotificationsRead.bind(this)})
				});
				this._oNotif.setModel(oModel, "app");
				this.getView().addDependent(this._oNotif);
			}
			this._oNotif.openBy(oSource);
		},

		onNotificationPress: function (oEvent) {
			const oCtx = oEvent.getSource().getBindingContext("app");
			oCtx.getModel().setProperty(oCtx.getPath() + "/unread", false);
			this._updateUnread();
			MessageToast.show(oCtx.getProperty("title"));
		},

		onNotificationsRead: function () {
			const oModel = this.getView().getModel("app");
			oModel.getProperty("/notifications").forEach(n => { n.unread = false; });
			oModel.refresh(true);
			this._updateUnread();
			this._oNotif.close();
		},

		_updateUnread: function () {
			const oModel = this.getView().getModel("app");
			const iCount = oModel.getProperty("/notifications").filter(n => n.unread).length;
			oModel.setProperty("/unreadCount", iCount ? String(iCount) : "");
		},

		/* ---------- Product switch ---------- */
		onProductSwitcher: function (oEvent) {
			const oSource = oEvent.getSource();
			if (!this._oProducts) {
				this._oProducts = new ResponsivePopover({
					showHeader: false,
					placement: "Bottom",
					content: new ProductSwitch({
						items: PRODUCTS.map(p => new ProductSwitchItem({title: p.title, subTitle: p.subTitle, src: p.icon})),
						change: function (e) {
							const sTitle = e.getParameter("itemPressed").getTitle();
							this._oProducts.close();
							if (sTitle === "AI Assistant") {
								this.onAi();
							} else if (sTitle === "B&B Service Desk") {
								this.onRequests();
							} else if (sTitle !== "Mapping Workbench") {
								MessageToast.show(`${sTitle} is part of the product vision, not of this demo.`);
							}
						}.bind(this)
					})
				});
				this.getView().addDependent(this._oProducts);
			}
			this._oProducts.openBy(oSource);
		}
	});
});
