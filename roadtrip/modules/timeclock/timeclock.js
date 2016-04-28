DEF.modules.timeclock = {
	views: {}
};
DEF.modules.timeclock.Initialize = function() {
	if (!APP.models.timeclock)
		APP.models.timeclock = new DEF.modules.timeclock.Collection();
};
DEF.modules.timeclock.Router = Roadtrip.Router.extend({
	initialize: function() {},
	collections: [
		"timeclock", "users", "orders"
	],
	module: "timeclock",
	routes: {
		"timeclock": "ShowRoot",
	},
});


DEF.modules.timeclock.Model = Roadtrip.Model.extend({
	idAttribute: 'order',
	nameAttribute: 'order', // the human-readable field in the record
	module: "timeclock",
	defaults: {
		order: ""
	},
	search_string: function() {
		return false;
	}
});

DEF.modules.timeclock.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.timeclock.Model,
	url: 'dev.telegauge.com:3456/roadtrip/timeclock',
});

DEF.modules.timeclock.LineView = Backbone.Marionette.ItemView.extend({
	tagName: "tr",
	template: require("./templates/time_line.html"),
	templateHelpers: function() {
		return {
			week: this.options.childIndex
		};
	}
});
DEF.modules.timeclock.WeekView = Backbone.Marionette.CompositeView.extend({
	template: require("./templates/week.html"),
	childView: DEF.modules.timeclock.LineView,
	childViewContainer: "#week",
	childViewOptions: function(model, index) {
		return {
			childIndex: index
		};
	}
});
DEF.modules.timeclock.MainView = Backbone.Marionette.LayoutView.extend({
	id: 'TIMECLOCK',
	template: require("./templates/timeclock.html"),
	regions: {
		week: "#week",
		summary: "#summary"
	},
	onRender: function() {
		this.week.show(new DEF.modules.timeclock.WeekView({
			collection: APP.models.timeclock,
			filter: function() {
				return true;
			}
		}));
		this.summary.show(new DEF.modules.timeclock.Summary({}));
	}
});

DEF.modules.timeclock.Summary = Backbone.Marionette.ItemView.extend({
	tagName: 'table',
	className: 'table table-full table-left',
	template: require("./templates/summary.html")
});
