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
			var rs = {};
			if (this.options.parent) {
				rs.parent_id = this.options.parent.id;
				rs.parent_module = this.options.parent.module;
			}
			console.log(rs, this.options);
			return rs;
		}
	}),
	/**
	 * View a plain, read-only single record
	 */
	view: Roadtrip.View.extend({
		module: "tasks",
		template: require("./templates/task_view.html"),
		ui: {
			edit: "#edit",
		},
		events: {
			"click @ui.edit": "Edit",
		},
		Edit: function () {
			APP.Route("#tasks/" + "edit" + "/" + this.model.id);
		},
	})
}