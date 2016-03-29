DEF.modules.tasks = {};
DEF.modules.tasks.Router = Roadtrip.Router.extend({
	initialize: function () {
		APP.models.tasks = new DEF.modules.tasks.Collection();
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

		task: "Do a thing",
		description: "",
		task_id: "0.0.0",

		start_date: false,
		due_date: false,

		progress: 0, // scale 0..100
		priority: 0, // scale 0..100

		views: 0,
		edits: 0
	},
	search_string: function () {
		var string = this.get('task') + "";
		return string.toUpperCase();
	}
});

DEF.modules.tasks.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.tasks.Model,
	url: 'dev.telegauge.com:3000/roadtrip/tasks',
	comparator: function (m) {
		return -m.get('priority')
	}
});

/**
 * A single line, showing a task on the Project page
 */
DEF.modules.tasks.TaskView = Backbone.Marionette.ItemView.extend({
	template: require("./templates/taskline.html"),
	className: "click hover",
	tagName: "tr",
	events: {
		"click": "ViewTask"
	},
	ViewTask: function () {
		APP.Route("#tasks/view/" + this.model.get('_id'));
	}
});

DEF.modules.tasks.views = {
	/**
	 * Edit a contact
	 */
	edit: Roadtrip.Edit.extend({
		module: "tasks",
		template: require("./templates/task_edit.html"),
		Return: function () {
			if (this.model.get('parent_id'))
				APP.Route("#" + this.model.get('parent_module') + "/view/" + this.model.get('parent_id'))
			else
				APP.Route("#");
		},
		templateHelpers: function () {
			var rs = {
				task_id: this.GenerateTaskID()
			};
			if (this.options.parent) {
				rs.parent_id = this.options.parent.id;
				rs.parent_module = this.options.parent.module;
			}
			console.log(rs, this.options);
			return rs;
		},
		GenerateTaskID: function () {
			prefix = false;
			var parent = APP.models[this.options.parent.module].get(this.options.parent.id);
			if (parent)
				prefix = parent.get('task_id');
			var instance = APP.models.tasks.where({
				parent_module: this.options.parent.module,
				parent_id: this.options.parent.id
			}).length
			if (prefix)
				return prefix + "." + (instance + 1);
			else
				return instance
		}
	}),

	/**
	 * View a plain, read-only single record
	 */
	view: Backbone.Marionette.CompositeView.extend({
		id: "TASKS",
		module: "tasks",
		template: require("./templates/task_view.html"),
		childView: DEF.modules.tasks.TaskView,
		childViewContainer: "#task_list",
		ui: {},
		collection: APP.models.tasks, // why cant we do this?
		onBeforeRender: function () {
			this.collection = APP.models.tasks; // whatever, man..
			this.filter = function (m) {
				return m.get('parent_id') == this.model.id
			}
		},
		onShow: function () {
			if (this.children.length == 0) {
				this.ui.subtasks.hide();
			}
		},
		ui: {
			edit: "#edit",
			subtask: "#subtask",
			subtasks: "#subtasks"
		},
		events: {
			"click @ui.edit": "Edit",
			"click @ui.subtask": "AddSubtask"
		},
		Edit: function () {
			APP.Route("#tasks/edit/" + this.model.id);
		},
		AddSubtask: function () {
			var page = new DEF.modules.tasks.views.edit({
				model: false,
				parent: {
					module: "tasks",
					id: this.model.id
				}
			});
			APP.root.showChildView('main', page);
		},
	})
}