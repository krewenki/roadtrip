DEF.modules.tasks = {};
DEF.modules.tasks.Initialize = function() {
	if (!APP.models.tasks)
		APP.models.tasks = new DEF.modules.tasks.Collection();
};
DEF.modules.tasks.Router = Roadtrip.Router.extend({
	collections: [
		"users", "tasks", "projects", "revisions", "repositories"
	],
	initialize: function() {
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

		kind: "todo",
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
		"In Progresss": 5,
		"Review": 80,
		"Complete": 100
	},
	initialize: function() {
		if (this.get('subtasks') > 0)
			this.States = {
				"New": 0,
				"In Progress": 1,
				"Complete": 100
			};
	},
	search_string: function() {
		var string = this.id + " " + this.get(this.nameAttribute);
		return string;
	},

	/**
	 * Returns the (html) path for this task, by recursively following it's parents
	 * @return {string} The path
	 */
	GetPath: function() {
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
	GetProgressLabel: function(val) {
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
	comparator: function(m) {
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
		Open: function(model) {
			return function(m) {
				return m.get('parent_id') == model.id && m.get('progress') != 100 && m.get('progress') >= 0;
			};
		},
		Closed: function(model) {
			return function(m) {
				return m.get('parent_id') == model.id && (m.get('progress') == 100 || m.get('progress') < 0);
			};
		},
		Assigned: function(model) {
			return function(m) {
				return m.get('assigned_to') == model.id && m.get('progress') != 100 && m.get('progress') >= 0;
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
	ViewTask: function() {
		APP.Route("#tasks/view/" + this.model.id);
	}
});
DEF.modules.tasks.TaskList = Backbone.Marionette.CollectionView.extend({
	tagName: "table",
	className: "table table-top table-full task-table",
	childView: DEF.modules.tasks.TaskLine,
	childViewOptions: function() {
		return {
			template: this.options.template
		};
	},
	onShow: function() {
		if (!this.children.length)
			this.$el.parent().parent().hide();
	}
});

DEF.modules.tasks.TaskDetails = Backbone.Marionette.ItemView.extend({
	template: require("./templates/task_view.html"),
	templateHelpers: function() {
		var parent = APP.models[this.model.get('parent_module')].get(this.model.get('parent_id'));
		return {
			parent_title: APP.Icon(parent.module) + " " + parent.get(parent.nameAttribute),
			parent_link: parent.GetLink(),
			path: this.model.GetPath(),
			states: this.model.States
		};
	},
	ui: {
		edit: "#edit",
		subtask: "#subtask",
		subtasks: "#subtasks",
		progress: "#progress",
		state: "#state"
	},
	events: {
		"click @ui.edit": "Edit",
		"click @ui.subtask": "AddSubtask",
		//"input @ui.progress": "UpdateProgress",
		"change @ui.progress": "UpdateProgress",
		"mouseup @ui.progress": "LogProgress",
		"change @ui.state": "UpdateProgressLabel",
	},

	/**
	 * Show the task edit forms
	 * @return {[type]} [description]
	 */
	Edit: function() {
		APP.Route("#tasks/edit/" + this.model.id);
	},

	/**
	 * Create a new model and launch the task editor
	 * @return {[type]} [description]
	 */
	AddSubtask: function() {
		var page = new DEF.modules.tasks.views.edit({
			model: false,
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
	UpdateProgress: function() {
		var label = this.model.GetProgressLabel(this.ui.progress.val());
		this.ui.state.val(label);
		if (label == 'Accepted' && !this.model.get('assigned_to'))
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
	UpdateProgressLabel: function() {
		if (this.model.get('state') == 'Complete') {
			var states = Object.keys(this.model.States);
			this.ui.progress.val(this.model.States[states[states.indexOf(this.ui.state.val()) + 1]] - 1); // WHAT!
		} else
			this.ui.progress.val(Math.max(this.model.States[this.ui.state.val()], this.ui.progress.val()));
		this.UpdateProgress();
		this.render();
	},
	LogProgress: function() {
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
		templateHelpers: function() {
			var rs = {
				task_id: this.GenerateTaskID()
			};
			if (this.options.parent) {
				rs.parent_id = this.options.parent.id;
				rs.parent_module = this.options.parent.module;
			}
			return rs;
		},
		onShow: function() {
			$("input#task").focus();
			$("textarea").val(($("textarea").val() || '').trim()); // beautify inserts spaces between <textarea> in the template
		},
		/**
		 * Generate the task ID, by incrementing the max task_id, including parents, if available.
		 * @return {string} [1.2.3.5]
		 */
		GenerateTaskID: function() {
			if (this.model.id) // this model has been saved
				return this.model.id; // so do not generate a task_id

			var prefix = false,
				instance = 0;

			var parent = APP.models[this.options.parent.module].get(this.options.parent.id);
			if (parent)
				prefix = parent.get('task_id');
			var models = APP.models.tasks.where({
				parent_module: this.options.parent.module,
				parent_id: this.options.parent.id
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
		}
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
		onBeforeShow: function() {
			this.model.UpdateTaskProgress();
		},
		onShow: function() {
			APP.SetTitle(this.model.get(this.model.nameAttribute));
			this.model.IncStat("views");

			var model_id = this.model.id;
			this.showChildView('task', new DEF.modules.tasks.TaskDetails({
				model: this.model,
			}));

			this.showChildView('open', new DEF.modules.tasks.TaskList({
				template: require("./templates/taskline.html"),
				collection: APP.models.tasks,
				filter: APP.models.tasks.filters.Open(this.model)
			}));

			this.showChildView('closed', new DEF.modules.tasks.TaskList({
				template: require("./templates/taskline_closed.html"),
				collection: APP.models.tasks,
				filter: APP.models.tasks.filters.Closed(this.model)
			}));

			var comments = new DEF.modules.comments.Collection(this.model.get('comments'));
			this.showChildView('comments', new DEF.modules.comments.Comments({
				model: this.model,
				collection: comments,
				module: "tasks"
			}));

			var task_id = this.model.get('task_id');
			this.showChildView('revisions', new DEF.modules.revisions.MainView({
				collection: APP.models.revisions,
				filter: function(r) {
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

		}
	}),
};


DEF.modules.tasks.MainView = Roadtrip.RecordList.extend({
	id: 'TASKS',
	template: require("./templates/main.html"),
	childView: DEF.modules.tasks.TaskLine,
	childViewContainer: "#record_list",
	templateHelpers: function(x, y, z) {
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
	filter: function(model, index, collection) {
		var string = model.search_string();
		if (string.indexOf(this.ui.search.val().toUpperCase()) == -1)
			return false;
		return true;
	},
	onShow: function() {
		APP.SetTitle("Tasks", "tasks");
	},
	onRender: function() {
		this.ui.search.focus().val(this.search); // this search is disgusting
	},
	Search: function(e) {
		console.log(this.ui.search.val(), this.templateHelpers());
		this.search = this.ui.search.val();
		this.render();
	},
});
