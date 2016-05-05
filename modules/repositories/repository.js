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
		"repositories/view/:arg": "LoadModule",
		"repositories/:repo/:rev": "LoadRevision",
		"repositories": "ShowRoot"
	},
	LoadRevision: function (repo_name, rev) {
		var module = this.module;
		var repo = APP.models.repositories.get(repo_name);
		var model = APP.models.revisions.findWhere({
			repository: repo.get('_id'),
			revision: rev
		});
		if (!model) {
			console.error("Model not found", module, arg);
		}
		if (!U.Can(model.getUp('group'))) {
			alert("Permission Denied");
			return;
		}

		APP.Page = new DEF.modules.revisions.views.view({
			model: model,
		});
		APP.root.showChildView("main", APP.Page);
	},
});
DEF.modules.repositories.Model = Roadtrip.Model.extend({
	idAttribute: 'name',
	defaults: {
		name: "Main",
		type: "svn",
		url: "svn://repo.repo"
	}
});
DEF.modules.repositories.Collection = Backbone.Highway.Collection.extend({
	model: DEF.modules.repositories.Model,
	url: 'roadtrip.telegauge.com/roadtrip/repositories',
	idAttribute: 'name'
});


DEF.modules.repositories.views = {
	view: Backbone.Marionette.LayoutView.extend({
		module: 'repositories',
		template: require('./templates/view.html'),
		regions: {
			'revisions': '#revisions'
		},
		onRender: function () {
			var repository = this.model.get('_id');
			this.revisions.show(new DEF.modules.revisions.MainView({
				collection: APP.models.revisions,
				filter: function (r) {
					return r.get('repository') == repository;
				},
			}), {})
		}
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
