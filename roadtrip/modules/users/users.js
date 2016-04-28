DEF.modules.users = {};
DEF.modules.users.Initialize = function() {
	if (!APP.models.users)
		APP.models.users = new DEF.modules.users.Collection(); // init the collection (since it's needed first)
};
DEF.modules.users.Router = Roadtrip.Router.extend({
	module: "users",
	collections: [
		"users", "tasks"
	],
	initialize: function() {
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
	initialize: function() {
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
	Can: function(group, extra) {
		if (!group)
			return true;
		var groups = this.get('groups'); // the user's groups

		if (groups.split(',').indexOf("admin") >= 0)
			return true; // admin users can do everything
		return groups.indexOf(group) >= 0;
	}

});

DEF.modules.users.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.users.Model,
	url: 'roadtrip.telegauge.com/roadtrip/users',
	initialize: function() {
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
		onShow: function() {
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
			tasks: "#tasklist",
			ideas: "#taskideas"
		},
		onRender: function() {
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
	onShow: function() {
		APP.SetTitle("Users", "users");
	},
	Add: function() {
		var page = new DEF.modules.users.views.edit({
			model: false,
		});
		APP.root.showChildView('main', page);
	}

});
