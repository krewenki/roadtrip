DEF.modules.tasks = {};
DEF.modules.tasks.Router = Roadtrip.Router.extend({
	collections: [
		"users", "tasks", "projects", "orders"
	],
	initialize: function() {
		APP.models.tasks = new DEF.modules.tasks.Collection();

		APP.Icon_Lookup["todo"] = "list-ul";
		APP.Icon_Lookup["bug"] = "bug";
		APP.Icon_Lookup["feature"] = "star";
		APP.Icon_Lookup["idea"] = "lightbulb-o";
		APP.Icon_Lookup["product"] = "cubes";
		APP.Icon_Lookup["support"] = "wechat";

	},
	module: "tasks",
	routes: {
		"tasks/:cmd/:arg": "LoadModule",
		"tasks": "ShowRoot"
	},
});

DEF.modules.tasks.Model = Roadtrip.Model.extend({
	idAttribute: '_id',
	nameAttribute: 'task', // the human-readable field in the record
	module: "tasks",
	defaults: {
		parent_id: false,
		parent_module: false,

		kind: "todo",
		task: "",
		description: "",
		task_id: "0.0.0",
		subtasks: 0,
		assigned_to: false,

		start_date: "",
		due_date: "",
		complete_date: "",

		comments: [],

		progress: 0, // scale 0..100
		progress_label: "New", // this is autoatically calculated based on progress slider
		priority: 1, // scale 1..100

		_: {
			views: 1,
			edits: 0,
			created_by: APP.anon
		}

	},
	/**
	 * Returns the (html) path for this task, by recursively following it's parents
	 * @return {string} The path
	 */
	GetPath: function() {
		var path = "";
		var parent = APP.GetModel(this.get('parent_module'), this.get('_id '));
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
		if (!val)
			val = this.get('progress')
		var label = "New";
		if (val < 0)
			label = "Rejected";
		if (val > 0)
			label = "Accepted";
		if (val > 5)
			label = "In Progress"
		if (val >= 80)
			label = "Review";
		if (val == 100)
			label = "Complete";
		return label;
	},
});

DEF.modules.tasks.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.tasks.Model,
	url: 'dev.telegauge.com:3000/roadtrip/tasks',
	comparator: function(m) {
		rank = 0;
		if (m.get('progress') == 100 || m.get('progress') < 0)
			rank = 10000 - m.get('priority') - m.get('_').views / 10 - m.get('subtasks');
		else
			rank = 0.0 - (m.get('progress')) - m.get('priority') - m.get('_').views / 10 - m.get('subtasks');
		if (m.get('kind') == 'bug')
			rank *= 1.5 + 10;
		return rank
	},
	/**
	 * Some handy pre-defined filters, for use when using these collections.
	 * @type {Object}
	 */
	filters: {
		Open: function(model) {
			return function(m) {
				return m.get('parent_id') == model.id && m.get('progress') != 100 && m.get('progress') >= 0
			}
		},
		Closed: function(model) {
			return function(m) {
				return m.get('parent_id') == model.id && (m.get('progress') == 100 || m.get('progress') < 0)
			}
		},
		Assigned: function(model) {
			return function(m) {
				return m.get('assigned_to') == model.id && m.get('progress') != 100 && m.get('progress') >= 0
			}
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
		APP.Route("#tasks/view/" + this.model.get('_id'));
	}
});
DEF.modules.tasks.TaskList = Backbone.Marionette.CollectionView.extend({
	tagName: "table",
	className: "table table-top table-full task-table",
	childView: DEF.modules.tasks.TaskLine,
	childViewOptions: function() {
		return {
			template: this.options.template
		}
	},
	onShow: function() {
		if (!this.children.length)
			this.$el.parent().parent().hide()
	}
})

DEF.modules.tasks.TaskDetails = Backbone.Marionette.ItemView.extend({
	template: require("./templates/task_view.html"),
	templateHelpers: function() {
		var parent = APP.models[this.model.get('parent_module')].get(this.model.get('parent_id'));
		return {
			parent_title: APP.Icon(parent.module) + " " + parent.get(parent.nameAttribute),
			parent_link: parent.GetLink(),
			path: this.model.GetPath()
		}
	},
	ui: {
		edit: "#edit",
		subtask: "#subtask",
		subtasks: "#subtasks",
		progress: "#progress",
		progress_label: "#progress_label"
	},
	events: {
		"click @ui.edit": "Edit",
		"click @ui.subtask": "AddSubtask",
		"input @ui.progress": "UpdateProgress",
		"mouseup @ui.progress": "LogProgress",
		"change @ui.progress_label": "UpdateProgressLabel",
		"change @ui.progress_label": "LogProgress"
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
	UpdateProgress: function(label) {
		var label = this.model.GetProgressLabel(this.ui.progress.val());
		this.ui.progress_label.val(label);
		if (label == 'Accepted' && !this.model.get('assigned_to'))
			this.model.set({
				assigned_to: U.id
			})
		if (label == 'Review') {
			this.model.set({
				assigned_to: this.model.get('_').created_by
			})
		}
		this.model.set({
			'progress': this.ui.progress.val(),
			'progress_label': label
		});
		if (!this.model.get('start_date'))
			this.model.set({
				start_date: Date.now()
			})
		if (this.ui.progress.val() == 100 || this.ui.progress.val() < 0)
			this.model.set({
				complete_date: Date.now()
			})
	},

	/**
	 * When someone changes the progress_label, do a few actions, such as automatically set progress,
	 * before calling the UpdateProgress function, which does more automated actions.
	 * @return null
	 */
	UpdateProgressLabel: function() {
		switch (this.ui.progress_label.val()) {
			case "In Progress":
				this.ui.progress.val(Math.max(5, this.ui.progress.val()))
				this.UpdateProgress();
				break;
			case "Review":
				this.ui.progress.val(Math.max(80, this.ui.progress.val()))
				this.UpdateProgress();
				break;
			case "Complete":
				this.ui.progress.val(Math.max(100, this.ui.progress.val()))
				this.UpdateProgress();
				break;
		}
	},
	LogProgress: function() {
		APP.LogEvent("tasks", this.model.id, "Task progress: " + this.model.get('progress') + "%", {
			"progress": this.model.get('progress'),
			"progress_label": this.model.get('progress_label')
		})
	}
})


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
		/**
		 * Generate the task ID, by incrementing the max task_id, including parents, if available.
		 * @return {string} [1.2.3.5]
		 */
		GenerateTaskID: function() {
			if (this.model.id) // this model has been saved
				return this.model.get('task_id'); // so do not generate a task_id

			var prefix = false,
				instance = 0;

			var parent = APP.models[this.options.parent.module].get(this.options.parent.id);
			if (parent)
				prefix = parent.get('task_id');
			var models = APP.models.tasks.where({
				parent_module: this.options.parent.module,
				parent_id: this.options.parent.id
			})

			for (var m in models) {
				var model = models[m];
				var task_id = model.get('task_id');
				instance = Math.max(instance, task_id.split('.').pop())
			}
			instance++;

			if (prefix)
				return prefix + "." + instance;
			else
				return instance
		}
	}),

	view: Backbone.Marionette.LayoutView.extend({
		id: "TASKS",
		template: require("./templates/task_layout.html"),
		regions: {
			task: "#task_view",
			open: "#open_subtasks",
			closed: "#closed_subtasks",
			comments: "#comment_container"
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
					subtasks: subs.length,
					progress: sum / count,
					progress_label: this.model.GetProgressLabel(sum / count)
				})
			} else if (this.model.get('subtasks')) {
				this.model.set({
					subtasks: 0
				})
			}
		},
		onShow: function() {
			APP.SetTitle(this.model.get(this.model.nameAttribute));
			this.model.IncStat("views")

			var model_id = this.model.id;
			this.showChildView('task', new DEF.modules.tasks.TaskDetails({
				model: this.model,
			}))

			this.showChildView('open', new DEF.modules.tasks.TaskList({
				template: require("./templates/taskline.html"),
				collection: APP.models.tasks,
				filter: APP.models.tasks.filters.Open(this.model)
			}))

			this.showChildView('closed', new DEF.modules.tasks.TaskList({
				template: require("./templates/taskline_closed.html"),
				collection: APP.models.tasks,
				filter: APP.models.tasks.filters.Closed(this.model)
			}))
			var comments = new DEF.modules.comments.Collection(this.model.get('comments'));
			this.showChildView('comments', new DEF.modules.comments.Comments({
				model: this.model,
				collection: comments,
				module: "tasks"
			}))

		}
	}),
}


DEF.modules.tasks.MainView = Roadtrip.RecordList.extend({
	id: 'TASKS',
	template: require("./templates/main.html"),
	childView: DEF.modules.tasks.TaskLine,
	childViewContainer: "#record_list",
	templateHelpers: function(x, y, z) {
		return {
			search: this.search,
		}
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
})
