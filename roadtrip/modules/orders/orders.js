window.DEF.modules.orders = {}

/**
 * The main model.  SHould be called "Model"
 */
window.DEF.modules.orders.Model = Roadtrip.Model.extend({
	idAttribute: '_id',
	defaults: {
		order: "000001",
		order_type: "regula",
		customer_id: false,
		ship_to_id: false,
		warehouse: "JAX",
		terms: "N30",
		ship_via: "25",

		views: 0,
		edits: 0
	},
	search_string: function () {
		var string = this.get('name') + " " + this.get('email');
		return string.toUpperCase();
	}
});

/**
 * The main collection.  MUST be called "Collection"
 */
window.DEF.modules.orders.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.orders.Model,
	url: 'dev.telegauge.com:3000/roadtrip/contacts',
	comparator: function (m) {
		//var sort = ('00000' + (m.get('views') + m.get('edits'))).substr(-5) + m.get('name');
		var sort = (m.get('views') + m.get('edits'));
		return -sort
	}
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