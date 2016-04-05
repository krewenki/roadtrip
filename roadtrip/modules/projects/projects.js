DEF.modules.projects = {};

/**
 * The main model.  SHould be called "Model"
 */
DEF.modules.projects.Model = Roadtrip.Model.extend({
	nameAttribute: 'project', // the human-readable field in the record
	module: "projects",
	defaults: {
		project: "Project 1",
		icon: "anchor",
		goal: "",
		description: "",
		tasks: 0,
		members: 0,

		progress: 0,

		comments: [],
		_wiki: {
			title: "wiki",
			content: "Here I am!",

		}
	},
	GetLink: function(cmd) {
		if (!cmd)
			return "#projects/" + this.get('project');
		return "#projects/" + cmd + "/" + this.get('_id');
	},
});

/**
 * The main collection.  MUST be called "Collection"
 */
DEF.modules.projects.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.projects.Model,
	url: 'dev.telegauge.com:3000/roadtrip/projects',
});

DEF.modules.projects.Router = Roadtrip.Router.extend({
	module: "projects",
	collections: [
		"users", "tasks", "projects"
	],
	initialize: function() {
		APP.models.projects = new DEF.modules.projects.Collection();
		APP.models.tasks = new DEF.modules.tasks.Collection();
	},
	routes: {
		"projects": "ShowRoot",
		"projects/:project": "ShowProject",
		"projects/:project/wiki/:article": "ShowWiki",
		"projects/:project/edit/:arg": "EditProject",
		"projects/view/:arg": "RedirectView",
	},
	ShowProject: function(project) {
		model = APP.models.projects.findWhere({
			project: project
		});

		var view = new DEF.modules.projects.ProjectView({
			model: model,
			collection: APP.models.tasks,
			filter: function(m) {
				return m.get('parent_id') == this.model.id
			}
		})
		APP.root.showChildView("main", view);
		APP.SetMode("projects");
	},
	EditProject: function(project, id) {
		var module = this.module;
		APP.Page = new DEF.modules.projects.views.edit({
			model: APP.models[module].get(id),
		});
		APP.root.showChildView("main", APP.Page);
		APP.SetMode(module);
	},
	RedirectView: function(id) {
		// the "project/view/$id" url gets rewritten to "project/$project"
		APP.Route("#projects/" + APP.models.projects.get(id).get('project'));
	},
	ShowWiki: function(project, article) {
		var wikis = new DEF.modules.wiki.Article({
			model: new DEF.modules.wiki.Model(APP.models.projects.findWhere({
				project: project
			}).get('_wiki'))
		})
		APP.root.showChildView('main', wikis);
	}
})


/**
 * A list of commands, automatically tied to the $cmd in  #module/$cmd/$id.  See DoView
 */
DEF.modules.projects.views = {
	/**
	 * Edit a project
	 */
	edit: Roadtrip.Edit.extend({
		module: "projects",
		template: require("./templates/edit.html"),
	}),
	/**
	 * View a plain, read-only single record
	 */
	view: Roadtrip.View.extend({
		module: "projects",
		template: require("./templates/view.html"),
		ui: {
			edit: "#edit",
			delete: "#delete",
		},
		events: {
			"click @ui.edit": "Edit",
			"click @ui.delete": "Delete",
		},
		Edit: function() {
			APP.Route("#projects/" + "edit" + "/" + this.model.id, false);
		},
		Delete: function() {
			if (confirm("Are you sure you want to delete " + this.model.get(this.model.nameAttribute))) {
				APP.models.projects.remove(this.model);
				APP.Route("#projects", "projects");
			}
		},
	})
}

/**
 * A single line of projects on the main project view
 */
DEF.modules.projects.RecordLine = Roadtrip.RecordLine.extend({
	module: "projects",
	tagName: "div",
	className: 'click',
	template: require("./templates/project_box.html"),
	Click: function() {
		APP.Route("#projects/" + this.model.get('project'));
	}
});

/**
 * The MainView. A bunch of project boxes.
 */
DEF.modules.projects.MainView = Roadtrip.RecordList.extend({
	id: 'PROJECTS',
	template: require("./templates/projects.html"),
	templateHelpers: function(x, y, z) {
		return {
			search: this.search,
		}
	},
	childView: DEF.modules.projects.RecordLine,
	childViewContainer: "#record_list",
	ui: {
		add: "#add"
	},
	events: {
		"click @ui.add": "Add"
	},
	onShow: function() {
		APP.SetTitle("Projects", "projects");
	},
	Add: function() {
		var page = new DEF.modules.projects.views.edit({
			model: false
		});
		APP.root.showChildView('main', page);
	}
});



/**
 * The main project page, with subtasks
 */
DEF.modules.projects.ProjectView = Backbone.Marionette.CompositeView.extend({
	id: 'PROJECTS',
	template: require("./templates/project.html"),
	childView: DEF.modules.tasks.TaskLine,
	childViewContainer: "#tasks",
	emptyView: DEF.EmptyView,
	emptyViewOptions: {
		icon: "tasks",
		msg: "There are no tasks",
		submsg: "<span id='new' class='btn'>" + APP.Icon("new") + " new task</span>",
		colspan: 5
	},
	ui: {
		new: "#new",
		edit: "#edit",
		wiki: "#wiki",
		comments: "#comments"
	},
	events: {
		"click @ui.new": "CreateTask",
		"click @ui.edit": "Edit",
		"click @ui.wiki": "Wiki"
	},
	onBeforeShow: function() {
		var subs = APP.models.tasks.where({
			parent_id: this.model.get('_id')
		});
		if (subs.length > 0) {
			var sum = 0,
				count = 0;
			for (var s = 0; s < subs.length; s++) {
				var sub = subs[s];
				sum += (sub.get('progress') * sub.get('priority') / 100.0);
				count += (sub.get('priority') / 100.0)
			}
			this.model.set({
				tasks: subs.length,
				progress: sum / count,
			})
			console.log("Progress automatically set to ", sum / count)
		}
	},
	onShow: function() {
		this.model.IncStat("views")
		APP.SetTitle(this.model.get('project'));

	},
	CreateTask: function() {
		var page = new DEF.modules.tasks.views.edit({
			model: false,
			parent: {
				module: "projects",
				id: this.model.id
			}

		});
		APP.root.showChildView('main', page);
	},
	Edit: function() {
		APP.Route("#projects/" + this.model.get('project') + "/" + "edit" + "/" + this.model.id);
	},
	Wiki: function() {
		APP.Route("#projects/" + this.model.get('project') + "/" + "wiki" + "/crap");
	}

})
