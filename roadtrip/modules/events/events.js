DEF.modules.events = {}
DEF.modules.events.Router = Roadtrip.Router.extend({
	module: "events",
	collections: [
		"users", "events"
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
		moddule_id: false
	}
});
DEF.modules.events.Collection = Backbone.Highway.Collection.extend({
	model: DEF.modules.events.Model,
	url: 'dev.telegauge.com:3000/roadtrip/events',
});
