DEF.modules.users = {}
DEF.modules.users.Router = Roadtrip.Router.extend({
	module: "users",
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
		name: "Joe",
		email: "crap@fart.com",
		phone: "",
		boss: false,
		prefs: {
			header: "large"
		},
		perms: {
			tasks: {
				create: false,
				read: true,
				update: false,
				delete: false,
				comment: true
			},
			orders: {
				create: false,
				read: true,
				update: false,
				delete: false,
				comment: true
			},
			contacts: {
				create: false,
				read: false,
				update: false,
				delete: false,
				comment: true
			},
			projects: {
				create: false,
				read: true,
				update: false,
				delete: false,
				comment: true
			},
			calendar: {
				create: false,
				read: true,
				update: false,
				delete: false,
				comment: true
			},
			users: {
				create: false,
				read: true,
				update: false,
				delete: false,
				comment: true
			},
			expenses: {
				create: false,
				read: true,
				update: false,
				delete: false,
				comment: false
			},
		}
	},
	Can: function(module, perm) {
		var perms = this.get('perms');
		if (perms[module])
			return perms[module][perm] || false;
		return false
	},
});

DEF.modules.users.Collection = Backbone.Highway.Collection.extend({
	model: DEF.modules.users.Model,
	url: 'dev.telegauge.com:3000/roadtrip/users',
	initialize: function() {
		console.log("users");
		this.listenTo(this, "sync", this.UpdateUserTaskCount)
		this.listenTo(APP.models.tasks, "change:assigned_to change:progress_label", this.UpdateUserTaskCount)
	},
	UpdateUserTaskCount: function() {
		if (U) {
			var length = APP.models.tasks.filter(APP.models.tasks.filters.Assigned(U)).length;
			if (length) {
				$("#HEADER #taskcount").html("" + APP.Icon("tasks") + "" + length + "");
			} else {
				$("#HEADER #taskcount").html("");
			}
		}
	}
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
			this.showChildView('tasklist', new DEF.modules.tasks.TaskList({
				template: require("./templates/taskline.html"),
				collection: APP.models.tasks,
				filter: APP.models.tasks.filters.Assigned(this.model)
			}))
		}
	})
}

DEF.modules.users.RecordLine = Roadtrip.RecordLine.extend({
	tagName: "tr",
	module: "users",
	template: require("./templates/user_line.html"),
	ui: {
		perm: ".perms"
	},
	events: {
		"click @ui.perm": "SetPerm",
		"click": "Click"
	},
	SetPerm: function(e) {
		$el = e.currentTarget;
		console.log($el);
		var parts = $el.id.split('.');
		var perms = _.extend(this.model.defaults.perms, this.model.get('perms'))
		console.log(this.model.get('name'), parts[0], parts[1], perms)
		if (!perms[parts[0]])
			perms[parts[0]] = {}
		perms[parts[0]][parts[1]] = $el.checked;
		this.model.set({
			perms: perms
		});
		this.model.trigger('change', this.model);
		APP.trigger("auth_user"); // redraw the header to see if the modules need to be show/hide.
		APP.LogEvent("users", this.model.id, `Permission ${parts[0]}:${parts[1]} set to ` + ($el.checked ? "on" : "off"))
		return false; // stop propagation
	}
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

})
