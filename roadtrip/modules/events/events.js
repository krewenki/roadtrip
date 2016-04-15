DEF.modules.events = {}
DEF.modules.events.Router = Roadtrip.Router.extend({
	module: "events",
	collections: [
		"users", "events", "expenses", "orders", "contacts", "projects", "tasks"
	],
	initialize: function() {
		APP.models.events = new DEF.modules.events.Collection();
	},
	routes: {
		"events": "ShowRoot",
		"events/:cmd": "LoadModule",
		"events/:cmd/:arg": "LoadModule",
	},
});
DEF.modules.events.Model = Roadtrip.Model.extend({
	nameAttribute: 'name', // the human-readable field in the record
	module: "events",
	defaults: {
		datetime: false,
		event: false,
		user_id: false,
		module: false,
		module_id: false
	}
});
DEF.modules.events.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.events.Model,
	url: 'dev.telegauge.com:3456/roadtrip/events',
	comparator: function(m) {
		return -m.get('datetime');
	}
});

DEF.modules.events.RecordLine = Roadtrip.RecordLine.extend({
	module: "events",
	template: require("./templates/event_line.html"),
});

DEF.modules.events.MainView = Roadtrip.RecordList.extend({
	id: 'EVENTS',
	perpage: 100,
	template: require("./templates/main.html"),
	childView: DEF.modules.events.RecordLine,
	childViewContainer: "#record_list",
	onShow: function() {
		APP.SetTitle("Events", "events");
	}
});

DEF.modules.events.views = {
	view: Roadtrip.View.extend({
		module: "events",
		template: require("./templates/view.html"),
	})
};
