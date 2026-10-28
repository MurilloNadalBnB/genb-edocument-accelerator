sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Element",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/ui/table/Row",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/CustomTreeItem",
	"../model/engine"
], function (Controller, Element, Fragment, JSONModel, Row, MessageToast, MessageBox, CustomTreeItem, engine) {
	"use strict";

	const clone = o => JSON.parse(JSON.stringify(o));
	const toList = o => Object.entries(o).map(([key, text]) => ({key, text}));
	const PARAM_PH = {maxLen: "e.g. 10", pattern: "e.g. ^[0-9]{10}$", inList: "e.g. PLN,EUR,USD", ref: "e.g. T005-LAND1"};
	// what each AI engine checks when it reviews the generated code
	const REVIEW_ROLE = {
		joule: "Checks the code against your custom objects, billing types and existing AIF value maps.",
		hub: "Reviews the code with the LLM of your BTP subscription and adds explanations as comments.",
		genb: "Checks the code against B&B's DRC patterns and the legal schema of the country."
	};

	return Controller.extend("bnb.edoc.controller.Workspace", {
		onInit: function () {
			this._ws = new JSONModel({tree: [], sel: {kind: "none", suggestions: [], rules: []}, allRules: [], stats: {}});
			this._ws.setSizeLimit(5000);
			this.getView().setModel(this._ws, "ws");
			this._dlgModel = new JSONModel({});
			this._dlgModel.attachPropertyChange(this._onDlgPropertyChange, this);
			this._savedAt = {};
			this._router = this.getOwnerComponent().getRouter();
			this._router.getRoute("workspace").attachPatternMatched(this._onMatched, this);

			const oTree = this.byId("tree");
			oTree.attachToggleOpenState(this._onToggleOpenState, this);
			oTree.attachBrowserEvent("dblclick", this._onTreeDblClick, this);
			this.getView().attachBrowserEvent("click", this._onXmlClick, this);
		},

		/* =================== Routing =================== */
		_onMatched: function (oEvent) {
			const {code, doc} = oEvent.getParameter("arguments");
			const oCountry = engine.country(code), oDoc = engine.docDef(code, doc);
			if (!oCountry || oCountry.planned || !oDoc) {
				this._router.navTo("home", {}, true);
				return;
			}
			this._cc = code;
			this._doc = doc;
			this._d = oDoc;
			this._m = engine.model(code, doc);
			this._selected = null;
			this._expanded = new Set(Object.values(this._m.nodes).filter(n => !n.leaf && n.depth < this._m.expandDepth).map(n => n.id));
			this._ws.setProperty("/search", "");
			this._ws.setProperty("/filter", "all");
			this._ws.setProperty("/tab", "mapping");
			this._ws.setProperty("/code", code);
			this._ws.setProperty("/countryName", oCountry.name);
			this._ws.setProperty("/docLabel", oDoc.label);
			this._ws.setProperty("/edoc", oDoc.edoc);
			this._ws.setProperty("/source", oDoc.source);
			this._ws.setProperty("/sourceType", oDoc.sourceType);
			this._ws.setProperty("/isInbound", oDoc.dir === "in");
			this._ws.setProperty("/dirText", oDoc.dir === "in" ? "Inbound: XML to SAP" : "Outbound: SAP to XML");
			this._ws.setProperty("/sub", `${oCountry.name} · ${oDoc.schema} · ${oDoc.source} · eDocument type ${oDoc.edoc}`);
			const aObjects = engine.objects(code, doc);
			this._ws.setProperty("/objects", aObjects);
			this._ws.setProperty("/objKey", aObjects[0].key);
			this._review = null;
			this._ws.setProperty("/reviewText", "");
			this._refreshAll(true);
			this.byId("tree").setFirstVisibleRow(0);
		},

		onHome: function () {
			this._router.navTo("home");
		},

		onCountry: function () {
			this._router.navTo("country", {code: this._cc});
		},

		/* =================== Refresh =================== */
		_rules: function () {
			return engine.rulesOf(this._cc, this._doc);
		},

		_rulesFor: function (sId) {
			return this._rules().filter(r => r.nodeId === sId);
		},

		_refreshAll: function (bRebuildTree) {
			const s = engine.stats(this._cc, this._doc);
			s.pct = s.total ? Math.round(s.filled / s.total * 100) : 0;
			this._ws.setProperty("/stats", s);
			this._ws.setProperty("/savedAt", this._savedAt[this._cc + "|" + this._doc] || null);
			this._ws.setProperty("/treeSub", `${s.total} fields · ${s.filled} filled`);
			this._renderTree(bRebuildTree);
			this._refreshSide();
			this._refreshPreviews();
		},

		_refreshPreviews: function () {
			const sTab = this._ws.getProperty("/tab");
			if (sTab === "xml") {
				this._ws.setProperty("/xmlHtml", `<div class="edocXml">${engine.xmlHtml(this._cc, this._doc)}</div>`);
			} else if (sTab === "code") {
				const sKey = this._ws.getProperty("/objKey"), oObj = this._ws.getProperty("/objects").find(o => o.key === sKey);
				this._ws.setProperty("/obj", oObj);
				this._ws.setProperty("/abap", engine.objectCode(this._cc, this._doc, sKey, this._review) || "");
			}
		},

		_markDirty: function () {
			delete this._savedAt[this._cc + "|" + this._doc];
		},

		/* =================== XML tree =================== */
		_filtering: function () {
			return !!((this._ws.getProperty("/search") || "").trim() || this._ws.getProperty("/filter") !== "all");
		},

		_keepSet: function () {
			if (!this._filtering()) {
				return null;
			}
			const m = this._m, q = (this._ws.getProperty("/search") || "").trim().toLowerCase(), f = this._ws.getProperty("/filter");
			const keep = new Set();
			for (const n of Object.values(m.nodes)) {
				if (!n.leaf) { continue; }
				const rs = this._rulesFor(n.id), has = rs.length > 0;
				if (f === "mapped" && !has) { continue; }
				if (f === "open" && has) { continue; }
				if (q && !(n.local.toLowerCase().includes(q) || (n.value || "").toLowerCase().includes(q) || rs.some(r => (r.source || "").toLowerCase().includes(q)))) { continue; }
				keep.add(n.id);
				engine.ancestors(n, m).forEach(a => keep.add(a.id));
			}
			return keep;
		},

		_renderTree: function () {
			const m = this._m, keep = this._keepSet(), counts = engine.mappedCounts(this._cc, this._doc);
			this._paths = {};
			const build = (id, sPath) => {
				const n = m.nodes[id], rs = this._rulesFor(id);
				const srcRule = rs.find(r => r.source && r.type !== "check") || rs.find(r => r.source);
				this._paths[id] = sPath;
				const kids = n.children.filter(c => !keep || keep.has(c));
				return {
					id: n.id,
					local: n.isAttr ? "@" + n.local : n.local,
					prefix: n.prefix ? n.prefix + ":" : "",
					idx: n.idx,
					listText: n.count > 1 ? `1..n · ${n.count} in sample` : "",
					value: n.leaf ? n.value : "",
					leaf: !!n.leaf,
					icon: n.isAttr ? "sap-icon://tag" : n.leaf ? "sap-icon://form" : "sap-icon://folder-blank",
					iconColor: n.isAttr ? "Neutral" : n.leaf ? "Default" : "Critical",
					source: srcRule ? srcRule.source : "",
					pills: rs.map(r => ({text: engine.TYPES[r.type].short, state: engine.TYPES[r.type].state})),
					countText: n.leaf ? "" : `${counts[id] ? counts[id] + "/" : ""}${n.total}`,
					children: kids.map((c, i) => build(c, `${sPath}/children/${i}`))
				};
			};
			const aTree = (!keep || keep.has(m.root)) ? [build(m.root, "/tree/0")] : [];
			const oTree = this.byId("tree");
			this._bRestoring = true;
			this._ws.setProperty("/tree", aTree);
			oTree.collapseAll();
			if (keep) {
				oTree.expandToLevel(99);
			} else {
				// single forward pass: children appear after their parent
				for (let i = 0; i < oTree.getBinding("rows").getLength(); i++) {
					const oCtx = oTree.getContextByIndex(i);
					if (oCtx && this._expanded.has(oCtx.getProperty("id")) && !oTree.isExpanded(i)) {
						oTree.expand(i);
					}
				}
			}
			this._syncTreeSelection();
			this._bRestoring = false;
		},

		_indexOf: function (sId) {
			const oTree = this.byId("tree"), sPath = this._paths[sId];
			const iLen = oTree.getBinding("rows").getLength();
			for (let i = 0; i < iLen; i++) {
				const oCtx = oTree.getContextByIndex(i);
				if (oCtx && oCtx.getPath() === sPath) {
					return i;
				}
			}
			return -1;
		},

		_syncTreeSelection: function () {
			const oTree = this.byId("tree"), i = this._selected ? this._indexOf(this._selected) : -1;
			this._bSilent = true;
			if (i >= 0) {
				oTree.setSelectedIndex(i);
			} else {
				oTree.clearSelection();
			}
			this._bSilent = false;
			return i;
		},

		_onToggleOpenState: function (oEvent) {
			if (this._bRestoring || this._filtering()) {
				return;
			}
			const sId = oEvent.getParameter("rowContext").getProperty("id");
			if (oEvent.getParameter("expanded")) {
				this._expanded.add(sId);
			} else {
				this._expanded.delete(sId);
			}
		},

		onRowSelect: function (oEvent) {
			if (this._bSilent || this._bRestoring || !oEvent.getParameter("userInteraction")) {
				return;
			}
			const oTree = this.byId("tree"), i = oTree.getSelectedIndex();
			const oCtx = i >= 0 ? oTree.getContextByIndex(i) : null;
			this._selected = oCtx ? oCtx.getProperty("id") : null;
			this._refreshSide();
		},

		_onTreeDblClick: function (oEvent) {
			let oCtrl = Element.closestTo(oEvent.target);
			while (oCtrl && !(oCtrl instanceof Row)) {
				oCtrl = oCtrl.getParent();
			}
			const oCtx = oCtrl && oCtrl.getBindingContext("ws");
			if (oCtx && oCtx.getProperty("leaf")) {
				this._select(oCtx.getProperty("id"));
				this._openDialog(oCtx.getProperty("id"), "map");
			}
		},

		onAddRuleRow: function (oEvent) {
			const sId = oEvent.getSource().getBindingContext("ws").getProperty("id");
			this._select(sId);
			this._openDialog(sId, "map");
		},

		_select: function (sId) {
			this._selected = sId;
			this._syncTreeSelection();
			this._refreshSide();
		},

		/** Select a node, expand its ancestors and scroll it into view (used by the rules list and the XML preview). */
		_gotoNode: function (sId) {
			if (this._ws.getProperty("/tab") !== "mapping") {
				this._ws.setProperty("/tab", "mapping");
			}
			if (!this._paths[sId]) {
				this._ws.setProperty("/search", "");
				this._ws.setProperty("/filter", "all");
			}
			const n = this._m.nodes[sId];
			engine.ancestors(n, this._m).forEach(a => this._expanded.add(a.id));
			this._selected = sId;
			this._renderTree();
			const i = this._indexOf(sId), oTree = this.byId("tree");
			if (i >= 0) {
				const iFirst = oTree.getFirstVisibleRow(), iRows = oTree.getRows().length || 10;
				if (i < iFirst || i >= iFirst + iRows) {
					oTree.setFirstVisibleRow(Math.max(0, i - 3));
				}
			}
			this._refreshSide();
		},

		onTreeSearch: function () {
			this._renderTree();
		},

		onFilter: function () {
			this._renderTree();
		},

		onExpandAll: function () {
			Object.values(this._m.nodes).forEach(n => { if (n.children.length) { this._expanded.add(n.id); } });
			this._bRestoring = true;
			this.byId("tree").expandToLevel(99);
			this._bRestoring = false;
			this._syncTreeSelection();
		},

		onCollapseAll: function () {
			this._expanded = new Set([this._m.root]);
			this._renderTree();
		},

		onAutoSuggest: function () {
			const iAdded = engine.autoSuggest(this._cc, this._doc);
			this._markDirty();
			this._refreshAll();
			MessageToast.show(iAdded ? `${iAdded} suggested rules added. Review them in the rules list.` : "No new suggestions, every known field already has a rule.");
		},

		/* =================== Side panel =================== */
		_refreshSide: function () {
			const m = this._m, n = this._selected ? m.nodes[this._selected] : null;
			let sel;
			if (!n) {
				sel = {kind: "none", suggestions: [], rules: []};
			} else if (!n.leaf) {
				sel = {kind: "group", name: n.local, path: n.path, kindText: n.count > 1 ? `Repeating group (1..n, ${n.count} in sample)` : "Group", total: n.total, ruleCount: engine.mappedCounts(this._cc, this._doc)[n.id] || 0, suggestions: [], rules: []};
			} else {
				const rs = this._rulesFor(n.id);
				sel = {
					kind: "leaf",
					isAttr: n.isAttr,
					name: n.isAttr ? n.name : n.local,
					path: n.path,
					value: n.value,
					kindText: (n.isAttr ? "Attribute" : "Element") + (n.count > 1 ? ", repeats 1..n" : "") + (engine.isLine(n, m, this._d) ? ", line item" : ""),
					ruleCount: rs.length,
					suggestions: engine.suggest(n, m, this._cc, this._d).map(f => ({f, desc: engine.fieldDesc(f)})),
					rules: rs.map(r => this._ruleRow(r))
				};
			}
			this._ws.setProperty("/sel", sel);
			const aAll = engine.sortedRules(this._cc, this._doc).map(r => {
				const x = m.nodes[r.nodeId];
				return Object.assign(this._ruleRow(r), {
					field: (x.isAttr ? x.name : x.local) + (x.idx ? `[${x.idx}]` : ""),
					path: x.path,
					shortPath: engine.shortPath(x.path),
					selected: r.nodeId === this._selected,
					auto: !!r.auto
				});
			});
			this._ws.setProperty("/allRules", aAll);
			this._ws.setProperty("/allRulesTitle", `All rules (${aAll.length})`);
		},

		_ruleRow: function (r) {
			const T = engine.TYPES[r.type];
			return {id: r.id, nodeId: r.nodeId, type: r.type, short: T.short, icon: T.icon, state: T.state, source: r.source || "", desc: engine.describe(r)};
		},

		onQuickMap: function (oEvent) {
			this._openDialog(this._selected, "map", null, oEvent.getSource().getBindingContext("ws").getProperty("f"));
		},

		onOpenDlg: function (oEvent) {
			this._openDialog(this._selected, oEvent.getSource().data("type"));
		},

		onEditRule: function (oEvent) {
			const sId = oEvent.getSource().getBindingContext("ws").getProperty("id");
			const r = this._rules().find(x => x.id === sId);
			this._select(r.nodeId);
			this._openDialog(r.nodeId, r.type, r.id);
		},

		onDeleteRule: function (oEvent) {
			const sId = oEvent.getSource().getBindingContext("ws").getProperty("id");
			const aRules = this._rules();
			aRules.splice(aRules.findIndex(x => x.id === sId), 1);
			this._markDirty();
			this._refreshAll();
			MessageToast.show("Rule deleted.");
		},

		onRuleRowPress: function (oEvent) {
			this._gotoNode(oEvent.getSource().getBindingContext("ws").getProperty("nodeId"));
		},

		onClearRules: function () {
			MessageBox.confirm(`Remove all ${this._rules().length} rules for ${this._ws.getProperty("/countryName")}, ${this._ws.getProperty("/docLabel")}?`, {
				title: "Clear all rules",
				emphasizedAction: MessageBox.Action.OK,
				onClose: sAction => {
					if (sAction !== MessageBox.Action.OK) {
						return;
					}
					this._rules().length = 0;
					this._markDirty();
					this._refreshAll();
					MessageToast.show("All rules removed for this document type.");
				}
			});
		},

		/* =================== Tabs, footer =================== */
		onTab: function () {
			this._refreshPreviews();
		},

		_onXmlClick: function (oEvent) {
			const oLine = oEvent.target && oEvent.target.closest && oEvent.target.closest(".edocXml .xl.mapped");
			if (oLine) {
				this._gotoNode(oLine.getAttribute("data-id"));
			}
		},

		onSave: function () {
			this._savedAt[this._cc + "|" + this._doc] = new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
			this._ws.setProperty("/savedAt", this._savedAt[this._cc + "|" + this._doc]);
			MessageToast.show("Draft saved (in this browser session only).");
		},

		onObject: function () {
			this._refreshPreviews();
		},

		/* =================== AI assistant =================== */
		onAskAi: function () {
			const n = this._selected ? this._m.nodes[this._selected] : null;
			if (!n || !n.leaf) {
				this.getOwnerComponent().getEventBus().publish("edoc", "ai", {prompt: `Help me map the ${this._d.label} for ${this._ws.getProperty("/countryName")}. What should I suggest?`});
				return;
			}
			const sField = n.isAttr ? n.name.slice(1) : n.local, sg = engine.suggest(n, this._m, this._cc, this._d);
			this.getOwnerComponent().getEventBus().publish("edoc", "ai", {
				prompt: `Explain <${sField}> in the ${this._d.label} (${this._ws.getProperty("/countryName")}) and how to fill it`,
				ctx: {field: n.local, path: n.path, countryName: this._ws.getProperty("/countryName"), docLabel: this._d.label, suggestion: sg[0]}
			});
		},

		/* =================== B&B implementation request =================== */
		onRequestImpl: function () {
			const iRules = this._rules().length;
			if (!iRules) {
				MessageBox.information("Define at least one rule (or use Auto-suggest) before sending the package to B&B.");
				return;
			}
			const s = engine.stats(this._cc, this._doc), oUser = this.getOwnerComponent().getModel("app").getProperty("/user");
			const oGoLive = new Date(Date.now() + 45 * 864e5);
			this._implModel = this._implModel || new JSONModel();
			this._implModel.setData({
				scenario: `${this._ws.getProperty("/countryName")}, ${this._d.label}`,
				edoc: `${this._d.edoc} (interface ${this._d.iface})`,
				ruleText: `${s.rules} rules, ${s.checks} checks, ${s.filled} of ${s.total} fields filled`,
				objects: engine.objects(this._cc, this._doc).map(o => ({name: o.name, badi: o.badi, selected: true})),
				system: "DEV",
				priority: "normal",
				golive: oGoLive.toISOString().slice(0, 10),
				contact: oUser.email,
				notes: "",
				busy: false
			});
			if (!this._pImpl) {
				this._pImpl = Fragment.load({id: this.getView().getId(), name: "bnb.edoc.view.ImplementationDialog", controller: this}).then(oDialog => {
					oDialog.setModel(this._implModel, "impl");
					this.getView().addDependent(oDialog);
					return oDialog;
				});
			}
			this._pImpl.then(oDialog => oDialog.open());
		},

		onImplCancel: function () {
			this.byId("implDialog").close();
		},

		onImplSend: function () {
			const oDialog = this.byId("implDialog"), d = this._implModel.getData(), oApp = this.getOwnerComponent().getModel("app");
			const aObjects = d.objects.filter(o => o.selected);
			if (!aObjects.length) {
				MessageToast.show("Select at least one object to implement.");
				return;
			}
			this._implModel.setProperty("/busy", true);
			oDialog.setBusy(true);
			// Simulated call to the B&B service ERP
			setTimeout(() => {
				const aReq = oApp.getProperty("/requests"), sTicket = `GENB-2026-${String(147 + aReq.length).padStart(4, "0")}`;
				oApp.setProperty("/requests", [...aReq, {
					ticket: sTicket,
					scenario: d.scenario,
					rules: String(this._rules().length),
					objectsText: aObjects.map(o => o.name).join(", "),
					systemText: d.system === "DEV" ? "S4D, client 100" : "S4X, client 200",
					sentAt: new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}),
					status: "Received by B&B"
				}]);
				const aNotif = oApp.getProperty("/notifications");
				aNotif.unshift({id: sTicket, title: `${sTicket} received by B&B`, description: `${d.scenario}: a B&B consultant will contact you within one business day.`, datetime: "Just now", priority: "Medium", author: "B&B Service Desk", initials: "BB", unread: true});
				oApp.setProperty("/notifications", aNotif);
				oApp.setProperty("/unreadCount", String(aNotif.filter(x => x.unread).length));
				oDialog.setBusy(false);
				oDialog.close();
				MessageBox.success(`Ticket ${sTicket} was created in the B&B service ERP.`, {
					title: "Sent to B&B",
					details: `<p><strong>${d.scenario}</strong></p><ul>${aObjects.map(o => `<li>${o.name}</li>`).join("")}</ul><p>Next steps: analysis, implementation in ${d.system === "DEV" ? "S4D" : "S4X"}, tests with your documents, transport for your approval.</p>`
				});
			}, 1200);
		},

		/* =================== Generate code =================== */
		_activeEngines: function () {
			return this.getOwnerComponent().getModel("app").getProperty("/ai/engines").filter(e => e.enabled);
		},

		/** One AI active: generate right away. More than one: ask which AI reviews the code, unless remembered. */
		onGenerate: function () {
			if (!this._rules().length) {
				MessageToast.show("Add at least one rule first.");
				return;
			}
			const aOn = this._activeEngines();
			if (aOn.length === 1) {
				this._generate([aOn[0].key]);
				return;
			}
			const aKept = (this._genChoice || []).filter(k => aOn.some(e => e.key === k));
			if (aKept.length) {
				this._generate(aKept);
				return;
			}
			this._genModel = this._genModel || new JSONModel();
			this._genModel.setData({
				remember: false,
				options: [
					{key: "all", name: `All active AI: ${aOn.map(e => e.name).join(", ")}`, desc: "Each one checks its part. The review notes show who found what.", icon: "sap-icon://ai", initials: "", color: "Accent7", recommended: true, selected: true},
					...aOn.map(e => ({key: e.key, name: e.name, desc: REVIEW_ROLE[e.key], icon: e.icon, initials: e.initials, color: e.color, recommended: false, selected: false}))
				]
			});
			if (!this._pGen) {
				this._pGen = Fragment.load({id: this.getView().getId(), name: "bnb.edoc.view.GenerateDialog", controller: this}).then(oDialog => {
					oDialog.setModel(this._genModel, "gen");
					this.getView().addDependent(oDialog);
					return oDialog;
				});
			}
			this._pGen.then(oDialog => oDialog.open());
		},

		onGenConfirm: function () {
			const d = this._genModel.getData(), oPick = d.options.find(o => o.selected) || d.options[0];
			const aKeys = oPick.key === "all" ? this._activeEngines().map(e => e.key) : [oPick.key];
			this._genChoice = d.remember ? aKeys : null;
			this.byId("genDialog").close();
			this._generate(aKeys);
		},

		onGenCancel: function () {
			this.byId("genDialog").close();
		},

		_generate: function (aKeys) {
			const aEngines = this.getOwnerComponent().getModel("app").getProperty("/ai/engines");
			this._review = aKeys;
			this._ws.setProperty("/reviewText", aKeys.map(k => aEngines.find(e => e.key === k).name).join(", "));
			this._ws.setProperty("/objKey", this._ws.getProperty("/objects")[0].key);
			this._ws.setProperty("/tab", "code");
			this._refreshPreviews();
			MessageToast.show(`ABAP generated and reviewed by ${this._ws.getProperty("/reviewText")}.`);
		},

		onCopyCode: function () {
			const sCode = this._ws.getProperty("/abap");
			const fail = () => MessageToast.show("Copy is blocked here, select the code manually.");
			try {
				navigator.clipboard.writeText(sCode).then(() => MessageToast.show("Code copied to clipboard."), fail);
			} catch (e) {
				fail();
			}
		},

		/* =================== Rule dialog =================== */
		_getDialog: function () {
			if (!this._pDialog) {
				this._pDialog = Fragment.load({
					id: this.getView().getId(),
					name: "bnb.edoc.view.RuleDialog",
					controller: this
				}).then(oDialog => {
					oDialog.setModel(this._dlgModel, "dlg");
					this.getView().addDependent(oDialog);
					this.byId("catalogTree").attachBrowserEvent("dblclick", this._onCatalogDblClick, this);
					return oDialog;
				});
			}
			return this._pDialog;
		},

		_openDialog: function (sNodeId, sType, sRuleId, sPresetSource) {
			const m = this._m, n = m.nodes[sNodeId], oDoc = this._d, sg = engine.suggest(n, m, this._cc, oDoc);
			const r = sRuleId ? this._rules().find(x => x.id === sRuleId) : null;
			const d = r
				? {type: r.type, source: r.source, cfg: clone(r.cfg), editId: r.id}
				: {type: sType || "map", source: sType === "constant" ? null : (sPresetSource || sg[0] || null), cfg: engine.defaultCfg(n, this._cc, oDoc), editId: null};
			if (!r && sType === "change" && !engine.VALMAP_FIELDS.includes(n.local) && /^(Kwota|P_1[1-5]|.*Amount)/.test(n.local)) {
				d.cfg.transform = "sign";
			}
			this._dlgNode = n;
			this._dlgSugg = sg;
			this._dlgOpen = new Set(d.source ? [d.source.split("-")[0]] : []);
			this._dlgModel.setData(Object.assign(d, {
				title: `${d.editId ? "Edit" : "Define"} rule for <${n.name}>`,
				path: n.path,
				nodeName: n.name,
				nodeValue: n.value,
				sourceLabel: oDoc.source,
				catalogTitle: oDoc.dir === "in" ? "SAP target fields" : "SAP source fields",
				saveText: d.editId ? "Save Rule" : "Apply Rule",
				q: "",
				error: "",
				formats: toList(engine.FORMATS),
				conds: toList(engine.CONDS),
				transforms: toList(engine.TRANSFORMS)
			}));
			this._dlgDerived();
			this._getDialog().then(oDialog => {
				oDialog.open();
				this._buildCatalog();
			});
		},

		/** Recompute everything in the dialog that depends on type, source or cfg. */
		_dlgDerived: function () {
			const M = this._dlgModel, d = M.getData();
			M.setProperty("/typeHelp", engine.TYPES[d.type].help);
			M.setProperty("/sourceDesc", d.source ? engine.fieldDesc(d.source) : "");
			M.setProperty("/suggestions", this._dlgSugg.map(f => ({f, desc: engine.fieldDesc(f), selected: d.source === f})));
			M.setProperty("/paramPlaceholder", PARAM_PH[d.cfg.cond] || "");
			M.setProperty("/preview", engine.previewText(this._dlgNode, d, this._d.dir === "in"));
		},

		_onDlgPropertyChange: function (oEvent) {
			if (oEvent.getParameter("path") !== "preview") {
				this._dlgModel.setProperty("/preview", engine.previewText(this._dlgNode, this._dlgModel.getData(), this._d.dir === "in"));
			}
		},

		_buildCatalog: function () {
			const q = (this._dlgModel.getProperty("/q") || "").trim().toLowerCase();
			const aCat = [];
			engine.catGroups(this._cc, this._d).forEach(([g, aTabs]) => {
				const aTables = [];
				aTabs.forEach(t => {
					const T = engine.CATALOG[t];
					const bTable = !q || t.toLowerCase().includes(q) || T.d.toLowerCase().includes(q);
					const aFields = T.f.filter(([f, dsc]) => bTable || f.toLowerCase().includes(q) || dsc.toLowerCase().includes(q));
					if (q && !aFields.length) {
						return;
					}
					aTables.push({kind: "table", key: t, text: t, desc: T.d, icon: "sap-icon://table-view",
						nodes: aFields.map(([f, dsc]) => ({kind: "field", key: t + "-" + f, text: f, desc: dsc, suggested: this._dlgSugg.includes(t + "-" + f)}))});
				});
				if (aTables.length) {
					aCat.push({kind: "group", key: g, text: g, desc: "", icon: "sap-icon://folder-blank", nodes: aTables});
				}
			});
			this._dlgModel.setProperty("/catalog", aCat);
			this._syncCatalogTree();
		},

		_syncCatalogTree: function () {
			const oTree = this.byId("catalogTree"), bSearch = !!(this._dlgModel.getProperty("/q") || "").trim();
			oTree.collapseAll();
			oTree.expandToLevel(bSearch ? 2 : 1);
			if (!bSearch) {
				oTree.getItems().slice().reverse().forEach(oItem => {
					const oCtx = oItem.getBindingContext("dlg");
					if (oCtx.getProperty("kind") === "table" && this._dlgOpen.has(oCtx.getProperty("key"))) {
						oTree.expand(oTree.indexOfItem(oItem));
					}
				});
			}
			this._syncCatalogSelection(true);
		},

		_syncCatalogSelection: function (bScroll) {
			const sSource = this._dlgModel.getProperty("/source");
			this.byId("catalogTree").getItems().forEach(oItem => {
				const oCtx = oItem.getBindingContext("dlg"), bSel = oCtx.getProperty("kind") === "field" && oCtx.getProperty("key") === sSource;
				oItem.setSelected(bSel);
				if (bSel && bScroll) {
					setTimeout(() => { const el = oItem.getDomRef(); if (el) { el.scrollIntoView({block: "center"}); } }, 50);
				}
			});
		},

		onCatalogUpdated: function () {
			this._syncCatalogSelection(false);
		},

		onCatalogPress: function (oEvent) {
			const oItem = oEvent.getParameter("listItem"), oCtx = oItem.getBindingContext("dlg"), oTree = this.byId("catalogTree");
			if (oCtx.getProperty("kind") === "field") {
				this._dlgPick(oCtx.getProperty("key"));
				return;
			}
			const i = oTree.indexOfItem(oItem);
			if (oItem.getExpanded()) {
				oTree.collapse(i);
				this._dlgOpen.delete(oCtx.getProperty("key"));
			} else {
				oTree.expand(i);
				this._dlgOpen.add(oCtx.getProperty("key"));
			}
			this._syncCatalogSelection(false);
		},

		_onCatalogDblClick: function (oEvent) {
			let oCtrl = Element.closestTo(oEvent.target);
			while (oCtrl && !(oCtrl instanceof CustomTreeItem)) {
				oCtrl = oCtrl.getParent();
			}
			const oCtx = oCtrl && oCtrl.getBindingContext("dlg");
			if (oCtx && oCtx.getProperty("kind") === "field") {
				const sType = this._dlgModel.getProperty("/type");
				if (sType === "constant" || sType === "check") {
					this._dlgModel.setProperty("/type", "map");
				}
				this._dlgPick(oCtx.getProperty("key"));
				this.onDlgApply();
			}
		},

		_dlgPick: function (sField) {
			const M = this._dlgModel;
			if (M.getProperty("/type") === "constant") {
				M.setProperty("/type", "map");
			}
			M.setProperty("/source", sField);
			M.setProperty("/error", "");
			this._dlgOpen.add(sField.split("-")[0]);
			this._dlgDerived();
			this._syncCatalogSelection(false);
		},

		onDlgPickSuggestion: function (oEvent) {
			this._dlgPick(oEvent.getSource().getBindingContext("dlg").getProperty("f"));
			this._syncCatalogTree();
		},

		onDlgSearch: function () {
			this._buildCatalog();
		},

		onDlgType: function (oEvent) {
			const M = this._dlgModel, t = oEvent.getParameter("item").getKey();
			M.setProperty("/type", t);
			M.setProperty("/error", "");
			if (t !== "constant" && t !== "check" && !M.getProperty("/source") && this._dlgSugg[0]) {
				M.setProperty("/source", this._dlgSugg[0]);
				this._dlgOpen.add(this._dlgSugg[0].split("-")[0]);
				this._syncCatalogTree();
			}
			this._dlgDerived();
		},

		onDlgCondChange: function () {
			this._dlgModel.setProperty("/cfg/param", "");
			this._dlgDerived();
		},

		onDlgClearSource: function () {
			this._dlgModel.setProperty("/source", null);
			this._dlgDerived();
			this._syncCatalogSelection(false);
		},

		onVmAdd: function () {
			const a = this._dlgModel.getProperty("/cfg/valmap");
			a.push({from: "", to: ""});
			this._dlgModel.setProperty("/cfg/valmap", a);
			this._dlgDerived();
		},

		onVmDelete: function (oEvent) {
			const a = this._dlgModel.getProperty("/cfg/valmap");
			const i = +oEvent.getSource().getBindingContext("dlg").getPath().split("/").pop();
			a.splice(i, 1);
			if (!a.length) {
				a.push({from: "", to: ""});
			}
			this._dlgModel.setProperty("/cfg/valmap", a);
			this._dlgDerived();
		},

		onDlgApply: function () {
			const M = this._dlgModel, d = M.getData(), c = d.cfg;
			const sError = engine.validate(d);
			M.setProperty("/error", sError);
			if (sError) {
				return;
			}
			if (d.type === "constant") {
				d.source = null;
			}
			if (d.type === "change" && c.transform === "concat") {
				c.second = c.second.trim().toUpperCase();
			}
			const rule = {id: d.editId || engine.nextRuleId(), nodeId: this._dlgNode.id, type: d.type, source: d.source, cfg: clone(c)};
			const aRules = this._rules(), i = aRules.findIndex(x => x.id === rule.id);
			if (i >= 0) {
				aRules[i] = rule;
			} else {
				aRules.push(rule);
			}
			this.byId("ruleDialog").close();
			this._selected = rule.nodeId;
			this._markDirty();
			this._refreshAll();
			MessageToast.show(`${engine.TYPES[rule.type].label} rule ${d.editId ? "updated" : "added"} for <${this._dlgNode.local}>`);
		},

		onDlgClose: function () {
			this.byId("ruleDialog").close();
		}
	});
});
