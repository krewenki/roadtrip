DEF.modules.orders = {
	views: {}
}
require("./lineitem.js");
DEF.modules.orders.Router = Roadtrip.Router.extend({
	initialize: function() {
		APP.models.orders = new DEF.modules.orders.Collection();
		APP.models.orders_lineitems = new DEF.modules.orders.Collection_LineItems();
	},

	module: "orders",
	routes: {
		"orders": "ShowRoot",
		"orders/editline/:soli": "EditLine",
		"orders/:cmd": "LoadModule",
		"orders/:cmd/:arg": "LoadModule",
	},
	EditLine: function(soli) {
		var module = this.module;
		var model = APP.models.orders_lineitems.get(soli);
		if (!model) {
			console.error("Model not found", module, arg);
		}

		APP.Page = new DEF.modules[module].views.editline({
			model: model,
		});
		APP.root.showChildView("main", APP.Page);
	},
});


/**
 * The main model.  SHould be called "Model"
 */
DEF.modules.orders.Model = Roadtrip.Model.extend({
	idAttribute: 'order',
	nameAttribute: 'order', // the human-readable field in the record
	module: "orders",
	defaults: {
		order: "000001",
		order_date: 0,
		customer_request_date: 0,
		release_date: 0,
		lineitems: [],

		views: 0,
		edits: 0
	},
	GetLink: function(cmd) {
		return "#orders/" + cmd + "/" + this.get('_id');
	},
	search_string: function() {
		var string = this.get('order') + "";
		return string.toUpperCase();
	}
});

/**
 * The main collection.  MUST be called "Collection"
 */
DEF.modules.orders.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.orders.Model,
	url: 'dev.telegauge.com:3000/roadtrip/orders',
});
DEF.modules.orders.Collection_LineItems = Roadtrip.Collection.extend({
	model: DEF.modules.orders.LineItemModel,
	url: 'dev.telegauge.com:3000/roadtrip/orders_lineitems',
	comparator: "SOLI"
});

/**
 * A list of commands, automatically tied to the $cmd in  #module/$cmd/$id.  See DoView
 */
DEF.modules.orders.views.edit = Roadtrip.Edit.extend({
	module: "orders",
	template: require("./templates/edit.html"),
});
/**
 * View a plain, read-only contact
 */
DEF.modules.orders.views.view = Backbone.Marionette.LayoutView.extend({
	template: require("./templates/view.html"),
	regions: {
		order: "#order",
		lineitems: "#lineitems"
	},
	ui: {
		edit: "#edit",
		delete: "#delete"
	},
	events: {
		"click @ui.edit": "Edit",
		"click @ui.delete": "Delete"
	},
	onShow: function() {
		this.model.IncStat("views");
		APP.SetTitle(this.model.get('order'));
		this.showChildView('order', new DEF.modules.orders.OrderView({
			model: this.model,
		}));

		var order = this.model.id;
		console.log(order);
		this.showChildView('lineitems', new DEF.modules.orders.LineItemView({
			collection: APP.models.orders_lineitems,
			filter: function(m) {
				return m.get('order') == order;
			}
		}));
	},
	Edit: function() {
		APP.Route("#orders/" + "edit" + "/" + this.model.id);
	},
	Delete: function() {
		if (confirm("Are you sure you want to delete " + this.model.get(this.model.nameAttribute))) {
			console.log("kill it");
			APP.models.orders.remove(this.model);
			APP.Route("#orders", "orders");
		}
	}
});


DEF.modules.orders.OrderView = Backbone.Marionette.ItemView.extend({
	template: require("./templates/order.html"),
});


/**
 * A single line of orders on the main order view
 */
DEF.modules.orders.RecordLine = Roadtrip.RecordLine.extend({
	module: "orders",
	template: require("./templates/order_line.html"),
	templateHelpers: function() {
		var rs = {
			total: ' ',
			lineitems: 0
		};
		var lineitems = this.model.get('lineitems');
		var sum = 0;
		for (var l = 0; l < lineitems.length; l++)
			sum += lineitems[l].price;
		if (sum)
			rs.total = APP.Format.money(sum);

		rs.lineitems = lineitems.length;

		return rs;
	}
});


/**
 * The MainView.  HAS to be called MainView.  This is where this module begins
 */
DEF.modules.orders.MainView = Roadtrip.RecordList.extend({
	id: 'ORDERS',
	search: "",
	template: require("./templates/orders.html"),
	childView: DEF.modules.orders.RecordLine,
	childViewContainer: "#record_list",
	templateHelpers: function() {
		return {
			search: this.search,
		};
	},
	ui: {
		search: "#search",
		add: "#add"
	},
	events: {
		"keyup @ui.search": "Search",
		"click @ui.add": "Add"
	},
	filter: function(model, index, collection) {
		var string = model.search_string();
		if (string.indexOf(this.search.toUpperCase()) == -1)
			return false;
		return true;
	},
	onShow: function() {
		APP.SetTitle("Orders", "orders");
	},
	onRender: function() {
		this.ui.search.focus().val(this.search); // this search is disgusting
	},
	Search: function(e) {
		console.log(this.ui.search.val(), this.templateHelpers());
		this.search = this.ui.search.val();
		this.render();
	},
	Add: function() {
		var page = new DEF.modules.contacts.views.edit({
			model: false,
		});
		APP.root.showChildView('main', page);
	}
});
