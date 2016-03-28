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
		parent_task: false,
		task: "Do a thing",
		description: "",
		task_id: "0.0.0",

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