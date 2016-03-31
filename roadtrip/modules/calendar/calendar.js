// this module uses moment.js for now

window.moment = require('moment')
DEF.modules.calendar = {}
DEF.modules.calendar.Router = Roadtrip.Router.extend({
	module: "calendar",
	initialize: function() {
		APP.models.calendar = new DEF.modules.calendar.Collection()
	},
	routes: {
		"calendar": "ShowRoot",
		"calendar/:cmd": "LoadModule",
		"calendar/:cmd/:arg": "LoadModule",
	},
})

/**
 * The main model.  SHould be called "Model"
 */
DEF.modules.calendar.Model = Roadtrip.Model.extend({
	idAttribute: '_id',
	nameAttribute: 'title', // the human-readable field in the record
	module: "calendar",
	defaults: {
		date: new Date().toISOString().slice(0, 10),
		title: 'New Event',
		timestamp: new Date().getTime(),
		attendees: [],
		notes: '',
		user: '',
		views: 0,
		edits: 0
	},
	search_string: function() {
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
/**
 * A list of commands, automatically tied to the $cmd in  #module/$cmd/$id.  See DoView
 */
DEF.modules.calendar.views = {
	/**
	 * Edit a calendar
	 */
	edit: Roadtrip.Edit.extend({
		module: "calendar",
		template: require("./templates/edit.html"),
	}),

	Event: Roadtrip.View.extend({
		module: "calendar",
		template: require("./templates/event.html"),
		className: 'calendar_event'
	}),

	/**
	 * View a plain, read-only single record
	 */
	view: Roadtrip.View.extend({
		module: "calendar",
		template: require("./templates/view.html"),
		ui: {
			edit: "#edit",
			delete: "#delete"
		},
		events: {
			"click @ui.edit": "Edit",
			"click @ui.delete": "Delete"
		},
		Edit: function() {
			APP.Route("#calendar/" + "edit" + "/" + this.model.id);
		},
		Delete: function() {
			if (confirm("Are you sure you want to delete " + this.model.get(this.model.nameAttribute))) {
				console.log("kill it");
				APP.models.calendar.remove(this.model);
				APP.Route("#calendar", "calendar");
			}
		}
	})
}

DEF.modules.calendar.views.Day = Backbone.Marionette.CompositeView.extend({
		module: "calendar",
		template: require('./templates/day.html'),
		childView: DEF.modules.calendar.views.Event,
		initialize: function(options) {
			this.options = options
		},
		templateHelpers: function() {
			var self = this;
			return {
				date: function() {
					return self.options.date.getDate()
				}
			};
		}
	}),

	DEF.modules.calendar.views.Week = Backbone.Marionette.LayoutView.extend({
		template: require('./templates/week.html'),
		regions: {
			sunday: ".sunday",
			monday: ".monday",
			tuesday: ".tuesday",
			wednesday: ".wednesday",
			thursday: ".thursday",
			friday: ".friday",
			saturday: ".saturday"
		},
		tagName: 'tr',
		el: '#CALENDAR table tbody',
		initialize: function(options) {
			var startDate = options.startDate || new Date();
			var sunday = startDate.getDay() == 0 ? startDate : startDate - (startDate.getDay() * (60 * 60 * 24 * 1000));
			this.sunday = sunday;
			this.render()
		},
		onRender: function() {
			var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
			var date, collection;
			for (var i in days) {
				date = new Date(this.sunday + (86400000 * i))
				collection = new Backbone.Collection(APP.models.calendar.where({
					date: date.toISOString().slice(0, 10)
				}))
				this.showChildView(days[i], new DEF.modules.calendar.views.Day({
					date: date,
					collection: collection
				}))
			}
		}
	})


/**
 * The MainView.  HAS to be called MainView.  This is where this module begins
 */

DEF.modules.calendar.MainView = Roadtrip.MainView.extend({
	template: require("./templates/calendar.html"),
	id: 'CALENDAR',
	ui: {
		search: "#search",
		add: "#add"
	},
	events: {
		"keyup @ui.search": "Search",
		"click @ui.add": "Add"
	},
	onShow: function() {
		this.weekView = new DEF.modules.calendar.views.Week();
	},
	Add: function() {
		var page = new DEF.modules.calendar.views.edit({
			model: false,
		});
		APP.root.showChildView('main', page);
	}
});