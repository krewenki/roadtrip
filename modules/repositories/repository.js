DEF.modules.repositories = {};
DEF.modules.repositories.Initialize = function () {
	if (!APP.models.repositories)
		APP.models.repositories = new DEF.modules.repositories.Collection();
};
DEF.modules.repositories.Router = Roadtrip.Router.extend({
	module: "repositories",
	collections: [
		"repositories", "revisions", "tasks"
	],
	routes: {
		"repositories/:cmd/:arg": "LoadModule",
		"repositories": "ShowRoot"
	},
});
DEF.modules.repositories.Model = Roadtrip.Model.extend({
	defaults: {
		name: "Main",
		type: "svn",
		url: "svn://repo.repo"
	}
});
DEF.modules.repositories.Collection = Backbone.Highway.Collection.extend({
	model: DEF.modules.repositories.Model,
	url: 'roadtrip.telegauge.com/roadtrip/repositories',
});


DEF.modules.repositories.views = {
	view: Roadtrip.View.extend({
		module: 'repositories',
		template: require('./templates/view.html')
	}),
	RepositoryLine: Roadtrip.RecordLine.extend({
		module: 'repositories',
		template: require('./templates/line.html'),
		tagName: 'tr'
	})
}


DEF.modules.repositories.MainView = Roadtrip.RecordList.extend({
	id: 'REPOSITORIES',
	template: require("./templates/main.html"),
	childView: DEF.modules.repositories.views.RepositoryLine,
	childViewContainer: '#record_list',
	onShow: function () {
		if (!this.children.length)
			this.$el.parent().hide();
	}
})
