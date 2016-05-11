DEF.modules.users = {};
DEF.modules.users.Initialize = function () {
	if (!APP.models.users)
		APP.models.users = new DEF.modules.users.Collection(); // init the collection (since it's needed first)
};
DEF.modules.users.Router = Roadtrip.Router.extend({
	module: "users",
	collections: [
		"users", "tasks", "todo", "projects"
	],
	initialize: function () {
		// Normally the collection initializes here, but Users is handled in auth.js
	},
	routes: {
		"users": "ShowRoot",
		"users/:cmd": "LoadModule",
		"users/:cmd/:arg": "LoadModule",
	},
});
DEF.modules.users.Model = Roadtrip.Model.extend({
	nameAttribute: 'name', // the human-readable field in the record
	module: "users",
	initialize: function () {
		var gravatar = require('gravatar');
		this.set("image_url", gravatar.url(this.get('email'))); // cache the gravatar
	},
	defaults: {
		initials: "abc",
		name: "Joe",
		fullname: "Joe Smith",
		email: "crap@fart.com",
		phone: "",
		boss: false,
		prefs: {
			header: "large"
		},
		groups: "comments, projects, tasks, expenses, timeclock"
	},
	/**
	 * As the user if it has permissions to use this group function.  "admin" gets everything
	 * @param  {string} group      Name of the group
	 * @param  {string} extra extra part that gets concated.  "group_extra", aka "expenses_delete"
	 * @return {[type]}            [description]
	 */
	Can: function (group, extra) {
		if (!group)
			return true;
		var groups = this.get('groups'); // the user's groups

		if (groups.split(',').indexOf("admin") >= 0)
			return true; // admin users can do everything
		return groups.indexOf(group) >= 0;
	},
	Star: function (module, id) {
		var stars = this.get('stars') || [];
		var key = module + "|" + id;
		if (stars.indexOf(key) > -1) {
			stars.splice(stars.indexOf(key), 1);
		} else {
			stars.push(key);
		}
		this.set('stars', stars);
		this.trigger('star');
	},
	is_starred: function (module, id) {
		var stars = this.get('stars') || [];
		return stars.indexOf(module + "|" + id) != -1;
	},
	/**
	 * Timeclock functions
	 */
	SetHours: function (date, module, module_id, hours) {
		var model;
		var models = APP.models.timeclock.filter(function (m) {
			return m.get('date') == APP.Format.monday(false, true) && module_id == m.get('module_id');
		});
		if (models.length === 0) {
			model = APP.models.timeclock.create({
				_: {
					created_by: U.id,
					created_on: Date.now()
				},
				hours: [0, 0, 0, 0, 0, 0, 0]
			});
			console.log("new timeclock model");
		} else {
			model = models[0];
		}

		var hourlist = model.get('hours');
		hourlist[(new Date(date).getDay())] = hours;
		var fields = {
			hours: hourlist,
			module: module,
			module_id: module_id,
			date: APP.Format.monday(date, true)
		};
		model.set(fields);
	},
	GetHours: function (date, module, module_id) {
		var model = false;
		var models = APP.models.timeclock.where({
			date: APP.Format.monday(date, true),
			module: module,
			module_id: module_id
		});
		if (models.length === 0)
			return 0;
		for (var m in models) {
			if (models[m].get('_').created_by == U.id) {
				model = models[m];
				break;
			}
		}
		if (!model)
			return 0;
		return model.get('hours')[(new Date(date).getDay())];
	}

});

DEF.modules.users.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.users.Model,
	url: 'roadtrip.telegauge.com/roadtrip/users',
	initialize: function () {
		//console.log(APP.models.tasks);
		this.listenTo(APP.models.tasks, "sync", this.UpdateUserTaskCount);
		this.listenTo(APP.models.tasks, "change:assigned_to change:state", this.UpdateUserTaskCount);
	},
});

DEF.modules.users.views = {
	/**
	 * Edit a contact
	 */
	edit: Roadtrip.Edit.extend({
		module: "users",
		template: require("./templates/edit.html"),
	}),
	/**
	 * View a plain, read-only single record
	 */
	view: Roadtrip.View.extend({
		module: "users",
		template: require("./templates/view.html"),
		regions: {
			//	details: "#details",
			tasklist: "#task_list"
		},
		onShow: function () {
			APP.SetTitle(this.model.get('name'), "users");
			this.tasklist.show(new DEF.modules.tasks.TaskList({
				template: require("./templates/taskline.html"),
				collection: APP.models.tasks,
				filter: APP.models.tasks.filters.Assigned(this.model)
			}));
		}
	}),

	home: Backbone.Marionette.LayoutView.extend({
		template: require("./templates/home.html"),
		regions: {
			todos: "#todolist",
			tasks: "#tasklist",
			ideas: "#taskideas"
		},
		onRender: function () {
			APP.SetTitle(this.model.get(this.model.nameAttribute) + " Home", "users");
			var user_id = this.model.id;

			this.todos.show(new DEF.modules.todo.MainView({
				collection: APP.models.todo,
				filter: function (m) {
					return m.get('assigned_to') == user_id && !m.get('done');
				},
				emptyView: DEF.EmptyView,
				emptyViewOptions: {
					icon: "smile-o",
					msg: "No current tasks",
					colspan: 5
				},
			}));

			this.tasks.show(new DEF.modules.tasks.TaskList({
				template: require("./templates/taskline.html"),
				collection: APP.models.tasks,
				filter: APP.models.tasks.filters.Assigned(this.model)
			}));

			this.ideas.show(new DEF.modules.tasks.TaskList({
				template: require("./templates/taskline.html"),
				collection: APP.models.tasks,
				filter: APP.models.tasks.filters.Kind("idea")
			}));
		}
	})
};

DEF.modules.users.RecordLine = Roadtrip.RecordLine.extend({
	tagName: "tr",
	module: "users",
	template: require("./templates/user_line.html"),
	ui: {},
	events: {
		"click": "Click"
	},
});

DEF.modules.users.MainView = Roadtrip.RecordList.extend({
	template: require("./templates/main.html"),
	childView: DEF.modules.users.RecordLine,
	childViewContainer: "#user_list",
	ui: {
		add: "#add"
	},
	events: {
		"click @ui.add": "Add"
	},
	onShow: function () {
		APP.SetTitle("Users", "users");
	},
	Add: function () {
		var page = new DEF.modules.users.views.edit({
			model: false,
		});
		APP.root.showChildView('main', page);
	}

});
