window.DEF.modules.orders = {}

/**
 * The main model.  SHould be called "Model"
 */
window.DEF.modules.orders.Model = Roadtrip.Model.extend({
	idAttribute: '_id',
	defaults: {
		order: "000001",
		order_type: "regular",
		customer_id: false,
		ship_to_id: false,
		warehouse: "JAX",
		terms: "N30",
		ship_via: "25",

		views: 0,
		edits: 0
	},
	search_string: function () {
		var string = this.get('description');
		return string.toUpperCase();
	}
});

/**
 * The main collection.  MUST be called "Collection"
 */
window.DEF.modules.orders.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.orders.Model,
	url: 'dev.telegauge.com:3000/roadtrip/orders',
});

/**
 * A list of commands, automatically tied to the $cmd in  #module/$cmd/$id.  See DoView
 */
window.DEF.modules.orders.cmds = {
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
	view: Roadtrip.View.extend({
		module: "orders",
		template: require("./templates/view.html"),
	})
}

/**
 * The MainView.  HAS to be called MainView.  This is where this module begins
 */

window.DEF.modules.orders.MainView = Roadtrip.MainView.extend({
	template: require("./templates/orders.html"),
	id: 'ORDERS',
	icons: {
		employee: "user",
		company: "building",
		vendor: "money",
		customer: "x"
	},
	regions: {
		menu: "#menu",
		list: "#record_list"
	},
});

/**
 * A single line of contacts on the main contact view
 */
window.DEF.modules.orders.RecordLine = Roadtrip.RecordLine.extend({
	module: "orders",
	template: require("./templates/order_line.html"),
});

/**
 * This is a list of contacts
 */
window.DEF.modules.orders.RecordList = Roadtrip.RecordList.extend({
	module: "orders",
	template: require("./templates/order_list.html"),
	childView: DEF.modules.orders.RecordLine,

})