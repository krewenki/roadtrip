DEF.modules.tasks = {};
DEF.modules.tasks.Router = Roadtrip.Router.extend({
	initialize: function() {
		APP.models.tasks = new DEF.modules.tasks.Collection();
		APP.Icon_Lookup["todo"] = "list-ul";
		APP.Icon_Lookup["bug"] = "bug";
		APP.Icon_Lookup["feature"] = "lightbulb-o";

		APP.Icon_Lookup['New'] = "battery-0";
		APP.Icon_Lookup['Accepted'] = "battery-1";
		APP.Icon_Lookup['In Progress'] = "battery-2";
		APP.Icon_Lookup['Review'] = "battery-3";
		APP.Icon_Lookup['Complete'] = "battery-4";

	},
	module: "tasks",
	routes: {
		"tasks/:cmd/:arg": "LoadModule",
	},
});

DEF.modules.tasks.Model = Roadtrip.Model.extend({
	idAttribute: '_id',
	nameAttribute: 'task', // the human-readable field in the record
	defaults: {
		parent_id: false,
		parent_module: false,

		kind: "todo",
		task: "",
		description: "",
		task_id: "0.0.0",
		subtasks: 0,

		start_date: "",
		due_date: "",
		complete_date: "",

		progress: 0, // scale 0..100
		progress_label: "New", // this is autoatically calculated based on progress slider
		priority: 0, // scale 0..100

		_views: 0,
		_edits: 0,
		_updated: Date.now(),
		_created: Date.now()
	},
	search_string: function() {
		var string = this.get('task') + "";
		return string.toUpperCase();
	}
});

DEF.modules.tasks.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.tasks.Model,
	url: 'dev.telegauge.com:3000/roadtrip/tasks',
	comparator: function(m) {
		return -m.get('progress') - m.get('priority')
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
		"click @ui.progress": "UpdateProgress",
		"input @ui.progress": "UpdateProgressLabel"

	},
	Edit: function() {
		APP.Route("#tasks/edit/" + this.model.id);
	},
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
	UpdateProgress: function(e) {
		console.log("progress", this.ui.progress.val());
		this.model.set({
			'progress': this.ui.progress.val(),
			'progress_label': this.ui.progress_label.html()
		});
		if (!this.model.get('start_date'))
			this.model.set({
				start_date: Date.now()
			})
		if (this.ui.progress.val() == 100)
			this.model.set({
				complete_date: Date.now()
			})
	},
	UpdateProgressLabel: function(e) {
		var val = this.ui.progress.val();
		var label = "New";
		if (val > 0)
			label = "Accepted";
		if (val > 5)
			label = "In Progress"
		if (val > 80)
			label = "Review";
		if (val == 100)
			label = "Complete";
		this.ui.progress_label.html(APP.Icon(label) + " " + label)
	}
})


/**
 *  Task View
 */
DEF.modules.tasks.views = {
	/**
	 * Edit a contact
	 */
	edit: Roadtrip.Edit.extend({
		module: "tasks",
		template: require("./templates/task_edit.html"),
		Return: function() {
			if (this.model.get('parent_id'))
				APP.Route("#" + this.model.get('parent_module') + "/view/" + this.model.get('parent_id'))
			else
				APP.Route("#");
		},
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
		GenerateTaskID: function() {
			if (this.model.id) // this model has been saved
				return this.model.get('task_id'); // so do not generate a task_id

			prefix = false;
			var parent = APP.models[this.options.parent.module].get(this.options.parent.id);
			if (parent)
				prefix = parent.get('task_id');
			var instance = APP.models.tasks.where({
				parent_module: this.options.parent.module,
				parent_id: this.options.parent.id
			}).length + 1
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
			task: "#task",
			open: "#open_subtasks",
			closed: "#closed_subtasks"
		},
		onBeforeShow: function() {
			var subs = APP.models.tasks.where({
				parent_id: this.model.get('_id')
			});
			if (subs.length > 0) {
				var sum = 0;
				for (var s = 0; s < subs.length; s++) {
					var sub = subs[s];
					sum += (sub.get('progress') | 0);
				}
				this.model.set({
					subtasks: subs.length,
					progress: sum / subs.length
				})
				console.log("Progress set to ", sum / subs.length)
			}

		},
		onShow: function() {
			APP.SetTitle(this.model.get(this.model.nameAttribute));
			this.model.set('_views', this.model.get('_views') + 1);

			var model_id = this.model.id;
			this.showChildView('task', new DEF.modules.tasks.TaskDetails({
				model: this.model,
			}))

			this.showChildView('open', new DEF.modules.tasks.TaskList({
				template: require("./templates/taskline.html"),
				collection: APP.models.tasks,
				filter: function(m) {
					return m.get('parent_id') == model_id && m.get('progress') != 100
				}
			}))
			this.showChildView('closed', new DEF.modules.tasks.TaskList({
				template: require("./templates/taskline_closed.html"),
				collection: APP.models.tasks,
				filter: function(m) {
					return m.get('parent_id') == model_id && m.get('progress') == 100
				}
			}))
		}
	}),
}
