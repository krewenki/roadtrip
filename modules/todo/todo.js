DEF.modules.todo = {
	views: {}
};
DEF.modules.todo.Initialize = function () {
	if (!APP.models.todo)
		APP.models.todo = new DEF.modules.todo.Collection();
};
DEF.modules.todo.Router = Roadtrip.Router.extend({
	initialize: function () {},
	collections: [
		"todo", "users", "tasks"
	],
	module: "todo",
});


DEF.modules.todo.Model = Roadtrip.Model.extend({
	nameAttribute: 'task', // the human-readable field in the record
	module: "todo",
	defaults: {
		_: {},
		done: false,
		module: "order",
		module_id: "",
		task: "",
		created_by: false,
		assigned_to: false
	},
	search_string: function () {
		return false;
	}
});

DEF.modules.todo.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.todo.Model,
	url: 'https://roadtrip.telegauge.com/roadtrip/todo',
	filters: {
		Assigned: function (model) {
			return function (m) {
				return m.get('assigned_to') == model.id;
			};
		},
		Incomplete: function (model) {
			return function (m) {
				return m.get('assigned_to') == model.id && !m.get('done');
			};
		}
	}
});

/**
 * A single line of todo on the main project view
 */
DEF.modules.todo.RecordLine = Roadtrip.RecordLine.extend({
	module: "todo",
	tagName: "tr",
	template: require("./templates/todoline.html"),
	ui: {
		done: "#done"
	},
	events: {
		"click @ui.done": "CompleteTask"
	},
	initialize: function () {
		if (this.options.template)
			this.template = this.options.template;
		if (this.model.get('done'))
			this.$el.addClass("done");
	},
	CompleteTask: function () {
		this.ui.done.html(APP.Icon("check-square-o"));
		this.$el.fadeOut(function () {
			this.model.set("done", true);
			APP.LogEvent("todo", this.model.id, "Task completed: " + this.model.get('task'));

		}.bind(this));
	}
});

/**
 * The MainView. A bunch of project boxes.
 */
DEF.modules.todo.MainView = Roadtrip.RecordList.extend({
	id: 'todo',
	//	tagName:"table"
	template: require("./templates/todolist.html"),
	childView: DEF.modules.todo.RecordLine,
	childViewContainer: "#record_list",
	templateHelpers: function () {
		return {
			assigned_to: this.options.assigned_to
		};
	},
	ui: {
		create_todo: "#create_todo"
	},
	events: {
		"click @ui.create_todo": "CreateTodo"
	},
	childViewOptions: function () {
		return {
			template: this.options.line_template,
			assigned_to: this.options.assigned_to
		};
	},
	CreateTodo: function () {
		var task = $("#todo_container #new_todo").val();
		var assigned_to = $("#todo_container #assigned_to").val();
		if (task.length && assigned_to.length) {
			APP.CreateTodo(assigned_to, this.options.module, this.options.module_id, task);
		}
	},

});
