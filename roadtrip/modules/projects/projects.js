DEF.modules.projects = {};

/**
 * The main model.  SHould be called "Model"
 */
DEF.modules.projects.Model = Roadtrip.Model.extend({
	nameAttribute: 'name', // the human-readable field in the record
	defaults: {
		project: "Project 1",
		icon: "anchor",
		goal: "",
		description: "",
		tasks: 5,
		members: 2,


		_edits: 0,
		_views: 0,
		_updated: 0
	},
	GetLink: function(cmd) {
		return "#projects/" + cmd + "/" + this.get('_id');
	}
});

/**
 * The main collection.  MUST be called "Collection"
 */
DEF.modules.projects.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.projects.Model,
	url: 'dev.telegauge.com:3000/roadtrip/projects',
});

DEF.modules.projects.Router = Roadtrip.Router.extend({
	initialize: function() {
		APP.models.projects = new DEF.modules.projects.Collection();
		APP.models.tasks = new DEF.modules.tasks.Collection();
	},
	module: "projects",
	routes: {
		"projects": "ShowRoot",
		"projects/:project": "ShowProject",
		"projects/:project/edit/:arg": "EditProject",
		"projects/view/:arg": "RedirectView",
	},
	ShowProject: function(project) {
		if (!_.isUndefined(APP.models.projects) && APP.models.projects.length) {
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
		} else {
			APP.root.showChildView("main", new DEF.EmptyView({
				icon: "loading",
				msg: "Loading Projects..."
			}));
			this.listenToOnce(APP.models.projects, 'sync', this.ShowProject.bind(this, project))
		}
	},
	EditProject: function(project, id) {
		var module = this.module;
		if (!_.isUndefined(APP.models[module]) && APP.models[module].length) {
			APP.Page = new DEF.modules.projects.views.edit({
				model: APP.models[module].get(id),
			});
			APP.root.showChildView("main", APP.Page);
			APP.SetMode(module);
		} else {
			APP.root.showChildView("main", new DEF.EmptyView({
				msg: "Loading Project..."
			}));
			this.listenToOnce(APP.models[module], 'sync', this.EditProject.bind(this, id))
		}
	},
	RedirectView: function(id) {
		// the "project/view/$id" url gets rewritten to "project/$project"
		APP.Route("#projects/" + APP.models.projects.get(id).get('project'));
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
			APP.Route("#projects/" + "edit" + "/" + this.model.id);
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
		colspan: 3
	},
	ui: {
		new: "#new",
		edit: "#edit"
	},
	events: {
		"click @ui.new": "CreateTask",
		"click @ui.edit": "Edit"
	},
	onShow: function() {
		this.model.set('_views', this.model.get('_views') + 1);
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

})
