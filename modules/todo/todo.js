DEF.modules.todo = {
	views: {}
};
DEF.modules.todo.Initialize = function () {
	APP.Icon_Lookup.todo = "list";
	if (!APP.models.todo)
		APP.models.todo = new DEF.modules.todo.Collection();
};
DEF.modules.todo.Router = Roadtrip.Router.extend({
	initialize: function () {},
	collections: [
		"todo", "users"
	],
	module: "todo",
	routes: {
		"todo": "ShowRoot",
		"todo/:mode/:date": "ShowWeek"
	},
	ShowWeek: function (mode, date) {
		var module = this.module;
		APP.Page = new DEF.modules[module].MainView({
			collection: APP.models[module],
			date: date,
			mode: mode
		});
		APP.root.showChildView("main", APP.Page);
	}
});


DEF.modules.todo.Model = Roadtrip.Model.extend({
	nameAttribute: 'task', // the human-readable field in the record
	module: "todo",
	defaults: {
		_: {},
		module: "order",
		module_id: "",
		task: "",
		user: ""
	},
	search_string: function () {
		return false;
	}
});

DEF.modules.todo.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.todo.Model,
	url: 'roadtrip.telegauge.com/roadtrip/todo',
});

/**
 * A single line of todo on the main project view
 */
DEF.modules.todo.RecordLine = Roadtrip.RecordLine.extend({
	module: "todo",
	tagName: "tr",
	className: 'click',
	template: require("./templates/todoline.html"),
	events: {}
});

/**
 * The MainView. A bunch of project boxes.
 */
DEF.modules.todo.MainView = Roadtrip.RecordList.extend({
	id: 'todo',
	template: require("./templates/todolist.html"),
	childView: DEF.modules.todo.RecordLine,
	childViewContainer: "#record_list",
});
