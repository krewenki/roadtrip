window.DEF.modules.contacts = {}

/**
 * The main model.  SHould be called "Model"
 */
window.DEF.modules.contacts.Model = Backbone.Model.extend({
	idAttribute: '_id',
	defaults: {
		name: "Person 1",
		kind: "employee",
		phone: "",
		email: ""
	}
});

/**
 * The main collection.  MUST be called "Collection"
 */
window.DEF.modules.contacts.Collection = Backbone.Highway.Collection.extend({
	model: DEF.modules.contacts.Model,
	url: 'dev.telegauge.com:3000/roadtrip/contacts',
});

window.DEF.modules.contacts.cmds = {
	/**
	 * Edit a contact
	 */
	edit: Backbone.Marionette.ItemView.extend({
		tagName: "table",
		className: "table table-full table-left",
		template: require("./templates/edit.html"),
		ui: {
			"field": ".field",
			"save": "#save",
			"cancel": "#cancel"
		},
		events: {
			"change @ui.field": "MakeDirty",
			"click @ui.save": "Save",
			"click @ui.cancel": "Cancel"
		},
		MakeDirty: function (e) {
			console.log(e);
			if (e.currentTarget.value == this.model.get(e.currentTarget.id))
				$(e.currentTarget).removeClass("dirty");
			else
				$(e.currentTarget).addClass("dirty");
		},
		Save: function (e) {
			var model = this.model;
			$(".field.dirty").each(function (i, $el) {
				console.log($el.id, $el.value)
				model.set($el.id, $el.value);
			})
			this.triggerMethod('main:list');
		},
		Cancel: function (e) {
			this.triggerMethod('main:list');
		}
	}),
	/**
	 * View a plain, read-only contact
	 */
	view: Backbone.Marionette.ItemView.extend({
		tagName: "table",
		className: "table table-full table-left",
		template: require("./templates/view.html")
	})
}

/**
 * The MainView.  HAS to be called MainView.  This is where this module begins
 */

window.DEF.modules.contacts.MainView = Backbone.Marionette.LayoutView.extend({
	template: require("./templates/contacts.html"),
	id: 'CONTACTS',
	regions: {
		menu: "#menu",
		list: "#contact_list"
	},
	Icon: function (icon) {
		var icons = {
			employee: "user"
		}
		return APP.Icon(icons[icon]);
	},
	childEvents: {
		'main:list': 'ListContacts',
	},
	onRender: function () {
		APP.SetMode("contacts");
		switch (this.options.cmd) {
		case 'edit':
		case 'view':
			this.DoView(this.options.cmd, this.options.arg);
			break;
		default:
			this.ListContacts();
		}
	},
	ListContacts: function () {
		var list = new DEF.modules.contacts.ContactList({
			collection: APP.models.contacts,
		});
		this.showChildView('list', list);
		APP.Route("#contacts", false);
	},
	/**
	 * Show a collection based $cmd in  #module/$cmd/$id
	 */
	DoView: function (cmd, id) {
		var page = new DEF.modules.contacts.cmds[cmd]({
			model: APP.models.contacts.get(id),
		});
		this.showChildView('list', page);
	},
});

/**
 * A single line of contacts on the main contact view
 */
window.DEF.modules.contacts.ContactLine = Backbone.Marionette.ItemView.extend({
	tagName: 'tr',
	template: require("./templates/contact_line.html"),
	ui: {
		cmd: ".cmd"
	},
	events: {
		"click @ui.cmd": "DoCommand"
	},
	DoCommand: function (e) {
		APP.Route("#contacts/" + e.currentTarget.id + "/" + this.model.get('_id'));
	}
});

/**
 * This is a list of contacts
 */
window.DEF.modules.contacts.ContactList = Backbone.Marionette.CompositeView.extend({
	template: require("./templates/contact_list.html"),
	tagName: "table",
	className: "table table-full table-top",
	childView: DEF.modules.contacts.ContactLine,
	emptyView: DEF.EmptyView,
	emptyViewOptions: {
		icon: "warning",
		msg: "No contacts found?!"
	},
	collectionEvents: {
		"sync": "render"
	}
})