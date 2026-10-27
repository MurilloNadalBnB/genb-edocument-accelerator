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
	"../model/engine"
], function (Controller, Theming, MessageToast, ResponsivePopover, VBox, HBox, Avatar, Title, Text, List,
	StandardListItem, CustomListItem, Switch, Label, Button, NotificationListItem, ProductSwitch, ProductSwitchItem, engine) {
	"use strict";

	const PRODUCTS = [
		{title: "Mapping Workbench", subTitle: "Current app", icon: "sap-icon://chain-link"},
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
		},

		_onThemeApplied: function () {
			const bDark = Theming.getTheme().includes("dark");
			this.byId("shellBar").setHomeIcon(bDark ? "webapp/img/logo-dark.svg" : "webapp/img/logo.svg");
			this.getOwnerComponent().getModel("app").setProperty("/darkMode", bDark);
		},

		_onRouteMatched: function (oEvent) {
			const sCode = oEvent.getParameter("arguments").code;
			this.byId("sideNav").setSelectedKey(sCode || "home");
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
			const oSource = oEvent.getParameter("avatar") || oEvent.getSource();
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
								new Text({text: "{app>/user/email}"}).addStyleClass("edocMuted")
							]
						}).addStyleClass("sapUiSmallMargin edocProfileHead"),
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
								new StandardListItem({title: "About", icon: "sap-icon://hint", type: "Active", press: () => MessageToast.show("B&B eDocument Accelerator, product preview (mock data).")}),
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
			const oSource = oEvent.getParameter("button");
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
			const oSource = oEvent.getParameter("button");
			if (!this._oProducts) {
				this._oProducts = new ResponsivePopover({
					showHeader: false,
					placement: "Bottom",
					content: new ProductSwitch({
						items: PRODUCTS.map(p => new ProductSwitchItem({title: p.title, subTitle: p.subTitle, src: p.icon})),
						change: function (e) {
							const sTitle = e.getParameter("itemPressed").getTitle();
							this._oProducts.close();
							if (sTitle !== "Mapping Workbench") {
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
