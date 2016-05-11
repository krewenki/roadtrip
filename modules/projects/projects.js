DEF.modules.projects = {};
DEF.modules.projects.Initialize = function () {
	if (!APP.models.projects)
		APP.models.projects = new DEF.modules.projects.Collection();
	// console.log(DEF.modules.projects.Router.collections);
	// debugger
};

/**
 * The main model.  SHould be called "Model"
 */
DEF.modules.projects.Model = Roadtrip.Model.extend({
	nameAttribute: 'project', // the human-readable field in the record
	//idAttribute: 'project', // can't do this, because then the project name cannot ever change
	module: "projects",
	defaults: {
		project: "Project 1",
		icon: "anchor",
		goal: "",
		description: "",
		tasks: 0,
		members: 0,
		project_id: 0,
		group: "",

		progress: 0,

		comments: [],
		_wiki: {
			title: "wiki",
			content: "Here I am!",
		},
		// state name: progress value
		task_states: {
			"Rejected": -1,
			"New": 0,
			"Accepted": 1,
			"In Progress": 5,
			"Review": 80,
			"Complete": 100
		},
		// kind name: icon
		task_kinds: {
			"folder": "folder",
			"product": "cubes",
			"todo": "list-ul",
			"bug": "bug",
			"feature": "star",
			"idea": "lightbulb-o",
			"support": "wechat",
		},

		todo_targets: {
			"review": ["56f3f7cb4b88de4618e306c0", "56fd29934b88de4618e306c5"]
		}
	},
	GetLink: function (cmd) {
		if (!cmd)
			return "#projects/" + this.get('project');
		return "#projects/" + cmd + "/" + this.get('_id');
	},
	GetID: function () { // this is required when creating tasks
		return APP.Tools.Aggregate(APP.models.projects, "max", "project_id") + 1;
	},
	GetChildID: function () {
		var prefix = false,
			instance = 0;

		prefix = this.get('project_id');
		var models = APP.models.tasks.where({
			parent_module: this.module,
			parent_id: this.id
		});

		for (var m in models) {
			var model = models[m];
			var task_id = model.get('task_id');
			instance = Math.max(instance, task_id.split('.').pop());
		}
		instance++;

		if (prefix)
			return prefix + "." + instance;
		else
			return instance;

	},
});

/**
 * The main collection.  MUST be called "Collection"
 */
DEF.modules.projects.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.projects.Model,
	url: 'roadtrip.telegauge.com/roadtrip/projects',
});

DEF.modules.projects.Router = Roadtrip.Router.extend({
	module: "projects",
	collections: [
		"users", "tasks", "projects"
	],
	collections_extra: [
		"revisions", "repositories"
	],
	initialize: function () {},
	routes: {
		"projects": "ShowRoot",
		"projects/:project": "ShowProject",
		"projects/:project/wiki/:article": "ShowWiki",
		"projects/:project/edit/:arg": "EditProject",
		"projects/view/:arg": "RedirectView",
	},
	ShowProject: function (project) {
		/**
		 * You might thing we should use "project" as attributeID.  However
		 * project names are editable, which would mean it'd instantly loose all of it's
		 * tasks and history if the name changes.  So, we skirt around that issue with
		 * custom routing.
		 */
		var model = APP.models.projects.findWhere({
			project: project
		});

		var view = new DEF.modules.projects.ProjectView({
			model: model,
			collection: APP.models.tasks,
			filter: function (m) {
				return m.get('parent_id') == this.model.id;
			}
		});
		APP.root.showChildView("main", view);
		APP.SetMode("projects");
	},
	EditProject: function (project, id) {
		var module = this.module;
		APP.Page = new DEF.modules.projects.views.edit({
			model: APP.models[module].get(id),
		});
		APP.root.showChildView("main", APP.Page);
		APP.SetMode(module);
	},
	RedirectView: function (id) {
		// the "project/view/$id" url gets rewritten to "project/$project"
		APP.Route("#projects/" + APP.models.projects.get(id).get('project'));
	},
	ShowWiki: function (project, article) {
		var wikis = new DEF.modules.wiki.Article({
			model: new DEF.modules.wiki.Model(APP.models.projects.findWhere({
				project: project
			}).get('_wiki'))
		});
		APP.root.showChildView('main', wikis);
	}
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
		template: require("./templates/edit.html")
	}),
	/**
	 * View a plain, read-only single record
	 */
	view: Roadtrip.View.extend({
		module: "projects",
		template: require("./templates/view.html"),
		ui: {
			edit: "#edit",
		},
		events: {
			"click @ui.edit": "Edit",
		},
		Edit: function () {
			APP.Route("#projects/" + "edit" + "/" + this.model.id, false);
		},
	})
};

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
 * The MainView. A bunch of project boxes.
 */
DEF.modules.projects.MainView = Roadtrip.RecordList.extend({
	id: 'PROJECTS',
	template: require("./templates/projects.html"),
	templateHelpers: function (x, y, z) {
		return {
			search: this.search,
		};
	},
	childView: DEF.modules.projects.RecordLine,
	childViewContainer: "#record_list",
	filter: function (m) {
		if (m.get('group'))
			return U.Can(m.get('group'));
		return true;
	},
	ui: {
		add: "#add",
	},
	events: {
		"click @ui.add": "Add"
	},
	onShow: function () {
		APP.SetTitle("Projects", "projects");
	},
	Add: function () {
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
		colspan: 10
	},
	ui: {
		new: "#new",
		edit: "#edit",
		wiki: "#wiki",
		comments: "#comments",
		star: "#star"
	},
	events: {
		"click @ui.new": "CreateTask",
		"click @ui.edit": "Edit",
		"click @ui.wiki": "Wiki",
		"click @ui.star": "Star",
	},
	Star: function () {
		U.Star(this.model.module, this.model.id);
		this.render();
	},
	onRender: function () {
		if (U.is_starred(this.model.module, this.model.id))
			this.ui.star.html(APP.Icon('star'));
	},
	onBeforeShow: function () {
		this.model.UpdateTaskProgress();
	},
	onShow: function () {
		this.model.IncStat("views");
		APP.SetTitle(this.model.get('project'));

		this.DrawPie();
	},
	DrawPie: function () {
		var series = [{
			name: 'Expenses',
			data: []
		}];
		var totals = APP.Tools.CountFields(APP.models.tasks.filter({
			"parent_id": this.model.id
		}), "kind");
		Object.keys(totals).forEach(function (cat) {
			if (totals[cat])
				series[0].data.push({
					name: cat + "s",
					y: totals[cat]
				});

		});
		var Highcharts = require('highcharts');
		var chart = Highcharts.chart('chart', {
			chart: {
				type: "pie",
				animation: false, // doesn't work:  http://api.highcharts.com/highcharts#chart.animation
			},
			title: {
				text: ""
			},
			series: series,
		});
		$(".highcharts-container text:contains('Highcharts')").css('display', 'none'); // hide the source, as it overlaps
	},
	CreateTask: function () {
		var page = new DEF.modules.tasks.views.edit({
			model: APP.models.tasks.create({
				task_id: this.model.GetChildID("projects", this.model.id),
				parent_module: "projects",
				parent_id: this.model.id,
				_: {
					created_by: U.id,
					created_on: Date.now()
				}
			}),
			parent: {
				module: "projects",
				id: this.model.id
			}

		});
		APP.root.showChildView('main', page);
	},
	Edit: function () {
		APP.Route("#projects/" + this.model.get('project') + "/" + "edit" + "/" + this.model.id);
	},
	Wiki: function () {
		APP.Route("#projects/" + this.model.get('project') + "/" + "wiki" + "/crap");
	}

});
