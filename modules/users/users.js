DEF.modules.users = {}
DEF.modules.users.Router = Roadtrip.Router.extend({
	module: "users",
	initialize: function() {
		APP.models.users = new DEF.modules.users.Collection();
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
	defaults: {
		name: "Joe",
		email: "crap@fart.com",
		phone: "",
		boss: false,
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
				read: true,
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
				read: false,
				update: false,
				delete: false,
				comment: false
			},
		},
		Can: function(module, perm) {
			var perms = this.get('perms');
			return perms[module][perm] || false;
		}
	}
});

DEF.modules.users.Collection = Backbone.Highway.Collection.extend({
	model: DEF.modules.users.Model,
	url: 'dev.telegauge.com:3000/roadtrip/users',
	initialize: function() {
		this.listenTo(this, "sync", this.UpdateUserTaskCount)
		this.listenTo(APP.models.tasks, "change:assigned_to change:progress_label", this.UpdateUserTaskCount)
	},
	UpdateUserTaskCount: function() {
		if (U) {
			var length = APP.models.tasks.filter(APP.models.tasks.filters.Assigned(APP.models.users.get(U._id))).length;
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
		perms[parts[0]][parts[1]] = $el.checked;
		this.model.set({
			perms: perms
		});
		this.model.trigger('change', this.model);
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
	Add: function() {
		var page = new DEF.modules.users.views.edit({
			model: false,
		});
		APP.root.showChildView('main', page);
	}

})
