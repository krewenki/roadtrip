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
		perms: {
			tasks: {
				create: false,
				read: true,
				update: false,
				delete: false
			},
			orders: {
				create: false,
				read: true,
				update: false,
				delete: false
			},
			contacts: {
				create: false,
				read: true,
				update: false,
				delete: false
			},
			projects: {
				create: false,
				read: true,
				update: false,
				delete: false
			},
			calendar: {
				create: false,
				read: true,
				update: false,
				delete: false
			},
			users: {
				create: false,
				read: true,
				update: false,
				delete: false
			},
		}
	}
});

DEF.modules.users.Collection = Backbone.Highway.Collection.extend({
	model: DEF.modules.users.Model,
	url: 'dev.telegauge.com:3000/roadtrip/users',
});

DEF.modules.users.views = {
	/**
	 * Edit a contact
	 */
	edit: Roadtrip.Edit.extend({
		module: "users",
		template: require("./templates/edit.html"),
		// Save: function() {
		// 	return Roadtrip.Edit.prototype.Save.call(this)
		// 	debugger
		// 	$(".field.dirty").each(function(i, $el) {
		//
		// 	})
		// }
	}),
	/**
	 * View a plain, read-only single record
	 */
	view: Roadtrip.View.extend({
		module: "users",
		template: require("./templates/view.html"),
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
		"click @ui.perm": "SetPerm"
	},
	SetPerm: function(e) {
		$el = e.currentTarget;
		console.log(e.currentTarget);
		var parts = $el.id.split('.');
		var perms = this.model.get('perms');
		perms[parts[0]][parts[1]] = $el.checked;
		this.model.set({
			perms: perms
		});
		this.model.trigger('change', this.model);
		console.log(perms);
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
