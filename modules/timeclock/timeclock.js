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
		"timeclock", "users", "timeclock"
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

	},
	search_string: function() {
		return false;
	}
});

/**
 * The main collection.  MUST be called "Collection"
 */
DEF.modules.timeclock.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.timeclock.Model,
	url: 'dev.telegauge.com:3456/roadtrip/timeclock',
});


DEF.modules.timeclock.RecordLine = Roadtrip.RecordLine.extend({
	module: "timeclock",
	template: require("./templates/timeclock_line.html"),
});

DEF.modules.timeclock.MainView = Roadtrip.RecordList.extend({
	id: 'TIMECLOCK',
	search: "",
	template: require("./templates/timeclock.html"),
	childView: DEF.modules.timeclock.RecordLine,
	childViewContainer: "#record_list",
	filter: function(model, index, collection) {
		return true;
	},
	onShow: function() {
		APP.SetTitle("Timeclock", "timeclock");
	},
});
