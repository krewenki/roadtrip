DEF.modules.orders = {}
require("./lineitem.js");

/**
 * The main model.  SHould be called "Model"
 */
DEF.modules.orders.Model = Roadtrip.Model.extend({
	idAttribute: '_id',
	defaults: {
		order: "000001",
		order_date: 0,
		customer_request_date: 0,
		release_date: 0,

		views: 0,
		edits: 0
	},
	search_string: function () {
		var string = this.get('order') + " " + this.get('description');
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
/**
 * A list of commands, automatically tied to the $cmd in  #module/$cmd/$id.  See DoView
 */
DEF.modules.orders.cmds = {
	/**
	 * Edit a contact
	 */
	edit: Roadtrip.Edit.extend({
		module: "orders",
		template: require("./templates/edit.html"),
	}),
	/**
	 * View a plain, read-only contact
	 */
	view: Backbone.Marionette.LayoutView.extend({
		template: require("./templates/view.html"),
		regions: {
			order: "#order",
			lineitems: "#lineitems"
		},
		onShow: function () {
			this.model.set('views', this.model.get('views') + 1);
			this.showChildView('order', new DEF.modules.orders.OrderView({
				model: this.model,
			}))
			this.showChildView('lineitems', new DEF.modules.orders.LineItemView({
				collection: new Backbone.Collection(this.model.get('lineitems'))
			}))
		}
	})
}

DEF.modules.orders.OrderView = Backbone.Marionette.ItemView.extend({
	template: require("./templates/order.html"),
})

/**
 * The MainView.  HAS to be called MainView.  This is where this module begins
 */

DEF.modules.orders.MainView = Roadtrip.MainView.extend({
	template: require("./templates/orders.html"),
	id: 'ORDERS',
	icons: {
		employee: "user",
		company: "building",
		vendor: "money",
		customer: "x"
	},
	Command: function (cmd, id) {
		var mode = this.id.toLocaleLowerCase();
		switch (cmd) {
		case 'view':
			this.view = new DEF.modules[mode].cmds[cmd]({
				model: APP.models[mode].get(id),
			});
			this.showChildView('list', this.view);
			break;
		default:
			Roadtrip.MainView.prototype.Command.apply(this, arguments);
		}
	},
});

/**
 * A single line of orders on the main order view
 */
DEF.modules.orders.RecordLine = Roadtrip.RecordLine.extend({
	module: "orders",
	template: require("./templates/order_line.html"),
});

/**
 * This is a list of orders
 */
DEF.modules.orders.RecordList = Roadtrip.RecordList.extend({
	module: "orders",
	template: require("./templates/order_list.html"),
	childView: DEF.modules.orders.RecordLine,

})