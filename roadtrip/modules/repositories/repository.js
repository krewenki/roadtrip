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
	}
})
DEF.modules.repositories.Collection = Backbone.Highway.Collection.extend({
	model: DEF.modules.repositories.Model,
	url: 'dev.telegauge.com:3000/roadtrip/repositories',
})
