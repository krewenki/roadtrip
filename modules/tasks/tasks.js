DEF.modules.tasks = {};
DEF.modules.tasks.Initialize = function () {
	if (!APP.models.tasks)
		APP.models.tasks = new DEF.modules.tasks.Collection();
};
DEF.modules.tasks.Router = Roadtrip.Router.extend({
	collections: [
		"users", "tasks", "projects", "revisions", "repositories", "timeclock"
	],
	initialize: function () {
		APP.Icon_Lookup.todo = "list-ul";
		APP.Icon_Lookup.bug = "bug";
		APP.Icon_Lookup.feature = "star";
		APP.Icon_Lookup.idea = "lightbulb-o";
		APP.Icon_Lookup.product = "cubes";
		APP.Icon_Lookup.support = "wechat";

	},
	module: "tasks",
	routes: {
		"tasks/:cmd/:arg": "LoadModule",
		"tasks": "ShowRoot"
	},
});

DEF.modules.tasks.Model = Roadtrip.Model.extend({
	idAttribute: 'task_id', // #1.15  This works excellently, but it breals everythjing else, so disabled for now.
	nameAttribute: 'task', // the human-readable field in the record
	module: "tasks",
	defaults: {
		parent_id: false,
		parent_module: false,

		kind: "idea",
		task: "",
		description: "",
		task_id: false,
		subtasks: 0,

		assigned_to: false,
		completed_by: false,

		start_date: "",
		due_date: "",
		complete_date: "",

		comments: [],

		progress: 0, // scale 0..100
		state: "New", // this is autoatically calculated based on progress slider
		priority: 1, // scale 1..100

		_: {
			views: 1,
			edits: 0,
			created_by: APP.anon
		}

	},
	States: {
		"Rejected": -1,
		"New": 0,
		"Accepted": 1,
		"In Progress": 5,
		"Review": 80,
		"Complete": 100
	},
	initialize: function () {
		if (this.get('subtasks') > 0)
			this.States = {
				"New": 0,
				"In Progress": 1,
				"Complete": 100
			};
	},
	search_string: function () {
		var string = this.id + " " + this.get(this.nameAttribute);
		return string;
	},
	GetChildID: function (module, id) {
		var prefix = false,
			instance = 0;

		var parent = APP.models[module].get(id);
		if (parent)
			prefix = parent.get('task_id');
		var models = APP.models.tasks.where({
			parent_module: module,
			parent_id: id
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

	/**
	 * Returns the (html) path for this task, by recursively following it's parents
	 * @return {string} The path
	 */
	GetPath: function () {
		var path = "";
		var parent = APP.GetModel(this.get('parent_module'), this.get('parent_id'));
		if (parent.GetPath)
			path = parent.GetPath();
		else {
			path = "<a href='" + parent.GetLink() + "'>" + parent.get(parent.nameAttribute) + "</a>";
		}
		path += " / <a href='" + this.GetLink() + "'>" + this.get(this.nameAttribute) + "</a>";
		return path;
	},

	/**
	 * Translate the progress value to a state
	 * @param  {[type]} val 0..100
	 * @return {[type]}     human readable text
	 */
	GetProgressLabel: function (val) {
		var label = false;
		for (var state in this.States) {
			if (val >= this.States[state])
				label = state;
		}
		return label;
	},
});

DEF.modules.tasks.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.tasks.Model,
	url: 'roadtrip.telegauge.com/roadtrip/tasks',
	comparator: function (m) {
		var rank = 0;
		if (m.get('progress') == 100 || m.get('progress') < 0)
			rank = 10000 - m.get('priority') - m.get('_').views / 10 - m.get('subtasks');
		else
			rank = 0.0 - (m.get('progress')) - m.get('priority') - m.get('_').views / 10 - m.get('subtasks');
		if (m.get('kind') == 'bug')
			rank *= 1.5 + 10; // give a boost to bugs
		if (m.get('assigned_to') == U.get('_id')) {
			rank *= 1.2; // give a boost if the task is assigned to you
		}
		return rank;
	},
	/**
	 * Some handy pre-defined filters, for use when using these collections.
	 * @type {Object}
	 */
	filters: {
		Open: function (model) {
			return function (m) {
				return m.get('parent_id') == model.id && m.get('progress') != 100 && m.get('progress') >= 0;
			};
		},
		Closed: function (model) {
			return function (m) {
				return m.get('parent_id') == model.id && (m.get('progress') == 100 || m.get('progress') < 0);
			};
		},
		Assigned: function (model) {
			return function (m) {
				return m.get('assigned_to') == model.id && m.get('progress') != 100 && m.get('progress') >= 0 && m.get('subtasks') === 0;
			};
		},
		Kind: function (kind) {
			return function (m) {
				return m.get('kind') == kind && !m.get('assigned_to') && m.get('state') == 'New';
			};
		}
	}
});

/**
 * A single line, showing a task on the Project page
 */
DEF.modules.tasks.TaskLine = Backbone.Marionette.ItemView.extend({
	template: require("./templates/taskline.html"),
	className: "click hover",
	tagName: "tr",
	events: {
		"click": "ViewTask"
	},
	modelEvents: {
		"change": "render"
	},
	ViewTask: function () {
		APP.Route("#tasks/view/" + this.model.id);
	}
});
DEF.modules.tasks.TaskList = Backbone.Marionette.CollectionView.extend({
	tagName: "table",
	className: "table table-top table-full task-table",
	childView: DEF.modules.tasks.TaskLine,
	childViewOptions: function () {
		return {
			template: this.options.template
		};
	},
	onShow: function () {
		if (!this.children.length)
			this.$el.parent().parent().hide();
	}
});

DEF.modules.tasks.TaskDetails = Backbone.Marionette.ItemView.extend({
	template: require("./templates/task_view.html"),
	templateHelpers: function () {
		var parent = APP.models[this.model.get('parent_module')].get(this.model.get('parent_id'));
		if (!parent) {
			parent = APP.models.projects.get(this.model.get('parent_id')); // some tasks incorrectly have "task" as a parent.
			if (parent)
				this.model.set("parent_module", "projects");
		}
		var show_progress_form = this.model.get('subtasks') === 0 && this.model.get('state') != "Complete" && this.model.get('kind') != "folder";
		return {
			parent_title: APP.Icon(parent.module) + " " + parent.get(parent.nameAttribute),
			parent_link: parent.GetLink(),
			path: this.model.GetPath(),
			states: this.model.States,
			show_progress_form: show_progress_form,
			user_hours: U.GetHours(APP.Format.sysdate(), "tasks", this.model.id)
		};
	},
	ui: {
		edit: "#edit",
		subtask: "#subtask",
		subtasks: "#subtasks",
		progress: "#progress",
		state: "#state",
		star: "#star",
		hours: ".hour_picker"
	},
	events: {
		"click @ui.edit": "Edit",
		"click @ui.subtask": "AddSubtask",
		//"input @ui.progress": "UpdateProgress",
		"change @ui.progress": "UpdateProgress",
		"mouseup @ui.progress": "LogProgress",
		"change @ui.state": "UpdateProgressLabel",
		"click @ui.star": "Star",
		"click @ui.hours": "PutHours"
	},

	PutHours: function (e) {
		var hours = 0,
			model;
		$(".hour_picker:checked").each(function (i, e) {
			hours += Number(e.value);
		});
		console.log(hours);
		U.SetHours(APP.Format.sysdate(), "tasks", this.model.id, hours);
	},
	onRender: function () {
		if (U.is_starred(this.model.module, this.model.id))
			this.ui.star.html(APP.Icon('star'));
	},
	/**
	 * Show the task edit forms
	 * @return {[type]} [description]
	 */
	Edit: function () {
		APP.Route("#tasks/edit/" + this.model.id);
	},
	Star: function () {
		U.Star(this.model.module, this.model.id);
		this.render();
	},

	/**
	 * Create a new model and launch the task editor
	 * @return {[type]} [description]
	 */
	AddSubtask: function () {
		var page = new DEF.modules.tasks.views.edit({
			model: APP.models.tasks.create({
				task_id: this.model.GetChildID(this.model.module, this.model.id),
				assigned_to: this.model.getUp("assigned_to"),
				parent_module: "tasks",
				parent_id: this.model.id,
				_: {
					created_by: U.id,
					created_on: Date.now()
				}
			}),
			parent: {
				module: "tasks",
				id: this.model.id
			}
		});
		APP.root.showChildView('main', page);
	},

	/**
	 * Someone drug the progress handle, so update stuff
	 * @return {[type]}   [description]
	 */
	UpdateProgress: function () {
		if (this.ui.state.val() == "Rejected") {
			if (this.model.get('state') != "Rejected") {
				this.model.set({
					'progress': 100,
					'state': label
				});
				APP.LogEvent("tasks", this.model.id, "Task Rejected.");
			}
			return;
		}
		var label = this.model.GetProgressLabel(this.ui.progress.val());
		this.ui.state.val(label);
		if (!this.model.get('assigned_to'))
			this.model.set({
				assigned_to: U.id
			});
		if (label == 'Review') {
			this.model.set({
				assigned_to: this.model.get('_').created_by
			});
		}
		this.model.set({
			'progress': this.ui.progress.val(),
			'state': label
		});
		if (!this.model.get('start_date'))
			this.model.set({
				start_date: Date.now()
			});
		if (this.ui.progress.val() == 100 || this.ui.progress.val() < 0) {
			APP.LogEvent("tasks", this.model.id, "Task completed.");
			this.model.set({
				complete_date: Date.now(),
				completed_by: U.id
			});
		}
	},

	/**
	 * When someone changes the state, do a few actions, such as automatically set progress,
	 * before calling the UpdateProgress function, which does more automated actions.
	 * @return null
	 */
	UpdateProgressLabel: function () {
		if (this.model.get('state') == 'Complete') {
			var states = Object.keys(this.model.States);
			this.ui.progress.val(this.model.States[states[states.indexOf(this.ui.state.val()) + 1]] - 1); // WHAT!
		} else
			this.ui.progress.val(Math.max(this.model.States[this.ui.state.val()], this.ui.progress.val()));
		this.UpdateProgress();
		this.render();
	},
	LogProgress: function () {
		APP.LogEvent("tasks", this.model.id, "Task progress: " + this.model.get('progress') + "%", {
			"progress": this.model.get('progress'),
			"state": this.model.get('state')
		});
	}
});


/**
 *  General views, defined for use with the router's automatic "$cmd" mechanism.
 */
DEF.modules.tasks.views = {
	/**
	 * Edit a contact
	 */
	edit: Roadtrip.Edit.extend({
		module: "tasks",
		template: require("./templates/task_edit.html"),
		onShow: function () {
			$("input#task").focus();
			$("textarea").val(($("textarea").val() || '').trim()); // beautify inserts spaces between <textarea> in the template
		},
	}),

	view: Backbone.Marionette.LayoutView.extend({
		id: "TASKS",
		template: require("./templates/task_layout.html"),
		regions: {
			task: "#task_view",
			open: "#open_subtasks",
			closed: "#closed_subtasks",
			comments: "#comment_container",
			revisions: "#revisions_container"
		},
		onBeforeShow: function () {
			this.model.UpdateTaskProgress();
		},
		onRender: function () {
			APP.SetTitle(this.model.get(this.model.nameAttribute), "tasks");
			this.model.IncStat("views");

			var model_id = this.model.id;
			this.task.show(new DEF.modules.tasks.TaskDetails({
				model: this.model,
			}));

			this.open.show(new DEF.modules.tasks.TaskList({
				template: require("./templates/taskline.html"),
				collection: APP.models.tasks,
				filter: APP.models.tasks.filters.Open(this.model)
			}));

			this.closed.show(new DEF.modules.tasks.TaskList({
				template: require("./templates/taskline_closed.html"),
				collection: APP.models.tasks,
				filter: APP.models.tasks.filters.Closed(this.model)
			}));

			this.comments.show(new DEF.modules.comments.Comments({
				model: this.model,
				module: "tasks"
			}));

			var task_id = this.model.get('task_id');
			this.revisions.show(new DEF.modules.revisions.MainView({
				collection: APP.models.revisions,
				filter: function (r) {
					if (r.get('task_id') == task_id) { // the fast way
						return true;
					} else { // the old way didn't have task_id in the revision records, oddly
						var match = r.get('log').match(/#[\d.]+/); // so go do a regexpr
						if (match) // and see if anything at all matches
							return match.indexOf('#' + task_id) > -1;
					}
					return false;
				},
			}));

			var comments = new DEF.modules.comments.Collection(this.model.get('comments'));
			this.comments.show(new DEF.modules.comments.Comments({
				model: this.model,
				collection: comments,
				module: "tasks"
			}));

		}
	}),
};


DEF.modules.tasks.MainView = Roadtrip.RecordList.extend({
	id: 'TASKS',
	template: require("./templates/main.html"),
	childView: DEF.modules.tasks.TaskLine,
	childViewContainer: "#record_list",
	templateHelpers: function (x, y, z) {
		return {
			search: this.search,
		};
	},
	ui: {
		search: "#search",
	},
	events: {
		"keyup @ui.search": "Search",
	},
	filter: function (model, index, collection) {
		var string = model.search_string();
		if (string.indexOf(this.ui.search.val().toUpperCase()) == -1)
			return false;
		return true;
	},
	onShow: function () {
		APP.SetTitle("Tasks", "tasks");
	},
	onRender: function () {
		this.ui.search.focus().val(this.search); // this search is disgusting
	},
	Search: function (e) {
		console.log(this.ui.search.val(), this.templateHelpers());
		this.search = this.ui.search.val();
		this.render();
	},

});
