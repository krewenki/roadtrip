DEF.modules.users = {}
DEF.modules.users.Router = Roadtrip.Router.extend({
	initialize: function() {
		APP.models.users = new DEF.modules.users.Collection();
	}
});
DEF.modules.users.Model = Backbone.Model.extend({
	defaults: {
		name: "Joe"
	}
})
DEF.modules.users.Collection = Backbone.Highway.Collection.extend({
	model: DEF.modules.users.Model,
	url: 'dev.telegauge.com:3000/roadtrip/users',
})
