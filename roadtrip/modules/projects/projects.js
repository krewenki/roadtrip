DEF.modules.projects = {};
DEF.modules.projects.Router = Roadtrip.Router.extend({
	initialize: function () {
		APP.models.projects = new DEF.modules.projects.Collection();
	},
	module: "projects",
	routes: {
		"projects": "ShowRoot",
		"projects/:project": "ShowProject",
	},
	ShowProject: function (project) {
		console.log("project");
		var view = new DEF.modules.projects.ProjectView({
			model: APP.models.projects.findWhere({
				project: project
			})
		})
		APP.root.showChildView("main", view);
		APP.SetMode("projects");
	}
})


/**
 * The main model.  SHould be called "Model"
 */
DEF.modules.projects.Model = Roadtrip.Model.extend({
	nameAttribute: 'name', // the human-readable field in the record
	defaults: {
		project: "Project 1",
		icon: "anchor",
		goal: "",
		tasks: 5,
		members: 2,

		edits: 0,
		views: 0
	},
	GetLink: function (cmd) {
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
			delete: "#delete"
		},
		events: {
			"click @ui.edit": "Edit",
			"click @ui.delete": "Delete"
		},
		Edit: function () {
			APP.Route("#projects/" + "edit" + "/" + this.model.id);
		},
		Delete: function () {
			if (confirm("Are you sure you want to delete " + this.model.get(this.model.nameAttribute))) {
				console.log("kill it");
				APP.models.projects.remove(this.model);
				APP.Route("#projects", "projects");
			}
		}
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
	Click: function () {
		APP.Route("#projects/" + this.model.get('project'));
	}
});

/**
 * The MainView.  HAS to be called MainView.  This is where this module begins
 */
DEF.modules.projects.MainView = Roadtrip.RecordList.extend({
	id: 'PROJECTS',
	template: require("./templates/projects.html"),
	templateHelpers: function (x, y, z) {
		return {
			search: this.search,
		}
	},
	childView: DEF.modules.projects.RecordLine,
	childViewContainer: "#record_list",
	ui: {
		search: "#search",
		add: "#add"
	},
	events: {
		"keyup @ui.search": "Search",
		"click @ui.add": "Add"
	},
	filter: function (model, index, collection) {
		var string = model.search_string();
		if (string.indexOf(this.ui.search.val().toUpperCase()) == -1)
			return false;
		return true;
	},
	initialize: function () {
		APP.Icon_Lookup["Vendor"] = "building";
	},
	onRender: function () {
		this.ui.search.focus().val(this.search); // this search is disgusting
	},
	Search: function (e) {
		console.log(this.ui.search.val(), this.templateHelpers());
		this.search = this.ui.search.val();
		this.render();
	},
	Add: function () {
		var page = new DEF.modules.projects.views.edit({
			model: false,
		});
		APP.root.showChildView('main', page);
	}
});
DEF.modules.projects.ProjectView = Backbone.Marionette.CompositeView.extend({
	template: require("./templates/project.html")
})