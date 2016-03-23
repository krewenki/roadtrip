DEF.modules.contacts = {}

/**
 * The main model.  SHould be called "Model"
 */
DEF.modules.contacts.Model = Roadtrip.Model.extend({
	defaults: {
		name: "Person 1",
		kind: "employee",
		phone: "",
		email: "",
		views: 0,
		edits: 0
	},
	search_string: function () {
		var string = this.get('name') + " " + this.get('email');
		return string.toUpperCase();
	}
});

/**
 * The main collection.  MUST be called "Collection"
 */
DEF.modules.contacts.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.contacts.Model,
	url: 'dev.telegauge.com:3000/roadtrip/contacts',
});

/**
 * A list of commands, automatically tied to the $cmd in  #module/$cmd/$id.  See DoView
 */
DEF.modules.contacts.cmds = {
	/**
	 * Edit a contact
	 */
	edit: Roadtrip.Edit.extend({
		module: "contacts",
		template: require("./templates/edit.html"),
	}),
	/**
	 * View a plain, read-only contact
	 */
	view: Roadtrip.View.extend({
		module: "contacts",
		template: require("./templates/view.html"),
	})
}

/**
 * The MainView.  HAS to be called MainView.  This is where this module begins
 */

DEF.modules.contacts.MainView = Roadtrip.MainView.extend({
	template: require("./templates/contacts.html"),
	id: 'CONTACTS',
	icons: {
		employee: "user",
		company: "bank",
		vendor: "money",
		customer: "building"
	},
	regions: {
		menu: "#menu",
		list: "#record_list"
	},
	ToggleFilter: function (e) {
		if ($(e.currentTarget).hasClass('toggled')) {
			this.ui.submenu.slideUp();
			$(e.currentTarget).removeClass('toggled')
		} else {
			this.ui.submenu.slideDown();
			$(e.currentTarget).addClass('toggled');

		}
	},
});

/**
 * A single line of contacts on the main contact view
 */
DEF.modules.contacts.RecordLine = Roadtrip.RecordLine.extend({
	module: "contacts",
	template: require("./templates/contact_line.html"),
});

/**
 * This is a list of contacts
 */
DEF.modules.contacts.RecordList = Roadtrip.RecordList.extend({
	module: "contacts",
	template: require("./templates/contact_list.html"),
	childView: DEF.modules.contacts.RecordLine,

})