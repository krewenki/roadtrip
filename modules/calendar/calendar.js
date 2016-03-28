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
		date: new Date().toISOString().slice(0,10),
		title: 'New Event',
		timestamp: new Date().getTime(),
		notes: '',
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


DEF.modules.calendar.views = {
	/**
	 * Edit a calendar
	 */
	edit: Roadtrip.Edit.extend({
		module: "calendar",
		template: require("./templates/edit.html"),
	}),
	inlineEvent: Roadtrip.View.extend({
		module: "calendar",
		template: require("./templates/inlineevent.html")
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
		Edit: function () {
			APP.Route("#calendar/" + "edit" + "/" + this.model.id);
		},
		Delete: function () {
			if (confirm("Are you sure you want to delete " + this.model.get(this.model.nameAttribute))) {
				console.log("kill it");
				APP.models.contacts.remove(this.model);
				APP.Route("#contacts", "contacts");
			}
		}
	})
}

DEF.modules.calendar.views.inlineDay = 	Backbone.Marionette.CompositeView.extend({
		module: "calendar",
		template: require("./templates/inlineday.html"),
		childView: DEF.modules.calendar.views.inlineEvent,
		initialize: function(options){
			this.options = options;
			//this.render()
		},
		ui: {
			view: ".event"
		},
		events: {
			"dblclick @ui.view": "View"
		},
		View: function(){
			APP.Route("#calendar/" + "edit" + "/" + this.model.id);
		},
		SetDate: function(date){
			this.date = date;
		}
});


/**
 * The MainView.  HAS to be called MainView.  This is where this module begins
 */

DEF.modules.calendar.MainView = Roadtrip.MainView.extend({
	template: require("./templates/calendar.html"),
	id: 'CALENDAR',
	icons: {

	},
	ui: {
		search: "#search",
		add: "#add"
	},
	events: {
		"keyup @ui.search": "Search",
		"click @ui.add": "Add"
	},
	Add: function () {
		var page = new DEF.modules.calendar.views.edit({
			model: false,
		});
		APP.root.showChildView('main', page);
	},
	onShow: function(){
		$('.calendar-day').each(function(){
			var v = new DEF.modules.calendar.views.inlineDay({
				el: $(this).find('.calendar_events'),
				collection: new Backbone.Collection(APP.models.calendar.where({ date: '2016-03-'+$(this).attr('data-date') })),
			})
			v.render();
		})
	}
});

