DEF.modules.repositories = {}
DEF.modules.repositories.Router = Roadtrip.Router.extend({
	initialize: function() {
		APP.models.repositories = new DEF.modules.repositories.Collection();
	},
});
DEF.modules.repositories.Model = Roadtrip.Model.extend({
	defaults: {
		name: "Main",
		type: "svn",
		url: "svn://repo.repo"
	},
	LookupUser: function(user) {
		var out = user;
		var users = this.get('users');
		if (users && users[user]) {
			out = users[user] //APP.models.users.get(users[user]).get('name');
		}
		return out;
	}
})
DEF.modules.repositories.Collection = Backbone.Highway.Collection.extend({
	model: DEF.modules.repositories.Model,
	url: 'dev.telegauge.com:3456/roadtrip/repositories',
})
