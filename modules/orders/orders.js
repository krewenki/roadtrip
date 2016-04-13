DEF.modules.orders = {
	views: {}
}
require("./lineitem.js");
DEF.modules.orders.Router = Roadtrip.Router.extend({
	initialize: function() {
		APP.models.orders = new DEF.modules.orders.Collection();
		APP.models.orders_lineitems = new DEF.modules.orders.Collection_LineItems();
	},
	collections: [
		"orders", "orders_lineitems"
	],

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
		lineitems: 0,
		total: 0,


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
	},
	events: {
		"click @ui.edit": "Edit",
	},
	onShow: function() {
		this.model.IncStat("views");
		APP.SetTitle(this.model.get('order'));
		this.showChildView('order', new DEF.modules.orders.OrderView({
			model: this.model,
		}));

		var order = this.model.id;
		this.showChildView('lineitems', new DEF.modules.orders.LineItemView({
			collection: APP.models.orders_lineitems,
			filter: function(m) {
				return m.get('order') == order;
			}
		}));

		APP.SetTitle("Order " + this.model.id, "orders");

		this.RefreshStats();
	},
	Edit: function() {
		APP.Route("#orders/" + "edit" + "/" + this.model.id);
	},
	/**
	 * Calculate totals and item count.  Delete this in the future, when its all been counted.
	 * @return {[type]} [description]
	 */
	RefreshStats: function() {
		var order = this.model.id;
		var items = APP.models.orders_lineitems.filter({
			order: order
		});
		console.log(items);
		var total = 0,
			count = 0;
		for (let m of items) {
			total += m.get('price');
			count++;
		}

		this.model.set({
			total: total,
			lineitems: count
		});
	},
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
