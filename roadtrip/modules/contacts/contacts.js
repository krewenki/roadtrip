DEF.modules.contacts = {}

/**
 * The main model.  SHould be called "Model"
 */
DEF.modules.contacts.Model = Roadtrip.Model.extend({
	nameAttribute: 'name', // the human-readable field in the record
	defaults: {
		name: "Person 1",
		kind: "employee",
		address: "",
		address2: "",
		phone: "",
		email: "",
		city: "",
		state: "",
		zip: "",
		views: 0,
		edits: 0
	},
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
		ui: {
			edit: "#edit",
			delete: "#delete"
		},
		events: {
			"click @ui.edit": "Edit",
			"click @ui.delete": "Delete"
		},
		Edit: function () {
			APP.Route("#contacts/" + "edit" + "/" + this.model.id);
		},
		Delete: function () {
			if (confirm("Are you sure you want to delete " + this.model.get(this.model.nameAttribute))) {
				console.log("kill it");
				APP.models.contacts.remove(this.model);
				APP.Route("#contacts", "contacts");
			}
		}
	})
}

/**
 * The MainView.  HAS to be called MainView.  This is where this module begins
 */

DEF.modules.contacts.MainView = Roadtrip.MainView.extend({
	template: require("./templates/contacts.html"),
	id: 'CONTACTS',
	icons: {
		Vendor: "money",
		Customer: "building"
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