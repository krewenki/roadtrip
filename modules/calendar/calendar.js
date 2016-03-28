// this module uses moment.js for now

window.moment = require('moment')
DEF.modules.calendar = {}

/**
 * The main model.  SHould be called "Model"
 */
DEF.modules.calendar.Model = Roadtrip.Model.extend({
	idAttribute: '_id',
	nameAttribute: 'date', // the human-readable field in the record
	defaults: {
		order: "2016-01-01",
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
DEF.modules.calendar.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.calendar.Model,
	url: 'dev.telegauge.com:3000/roadtrip/calendar',
});
APP.models.calendar = new DEF.modules.calendar.Collection()
/**
 * A list of commands, automatically tied to the $cmd in  #module/$cmd/$id.  See DoView
 */
DEF.modules.calendar.cmds = {
	/**
	 * Edit a contact
	 */
	edit: Roadtrip.Edit.extend({
		module: "calendar",
		template: require("./templates/edit.html"),
	}),
	/**
	 * View a plain, read-only contact
	 */
	view: Backbone.Marionette.LayoutView.extend({
		template: require("./templates/view.html"),
		regions: {
			order: "#calendar"
		},
		ui: {
			edit: "#edit",
			delete: "#delete"
		},
		events: {
			"click @ui.edit": "Edit",
			"click @ui.delete": "Delete"
		},
		onShow: function () {
			this.model.set('views', this.model.get('views') + 1);

			/*this.showChildView('order', new DEF.modules.orders.OrderView({
				model: this.model,
			}))
			this.showChildView('lineitems', new DEF.modules.orders.LineItemView({
				collection: new Backbone.Collection(this.model.get('lineitems'))
			}))*/
		},
		Edit: function () {
			APP.Route("#calendar/" + "edit" + "/" + this.model.id);
		},
		Delete: function () {
			if (confirm("Are you sure you want to delete " + this.model.get(this.model.nameAttribute))) {
				console.log("kill it");
				APP.models.calendar.remove(this.model);
				APP.Route("#orders", "orders");
			}
		}
	})
}

DEF.modules.calendar.CalendarView = Backbone.Marionette.ItemView.extend({
	template: require("./templates/calendar.html"),
})

/**
 * The MainView.  HAS to be called MainView.  This is where this module begins
 */

DEF.modules.calendar.MainView = Roadtrip.MainView.extend({
	template: require("./templates/calendar.html"),
	id: 'CALENDAR',
	icons: {

	},
	Command: function (cmd, id) {
		console.log(cmd, id);
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
DEF.modules.calendar.RecordLine = Roadtrip.RecordLine.extend({
	module: "calendar",
	template: require("./templates/day.html"),
	templateHelpers: function () {
		var rs = {
			total: ' ',
			lineitems: 0
		}
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
 * This is a list of orders
 */
DEF.modules.calendar.RecordList = Roadtrip.RecordList.extend({
	module: "calendar",
	template: require("./templates/day.html"),
	childView: DEF.modules.calendar.RecordLine,

})