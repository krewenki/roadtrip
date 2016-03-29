DEF.modules.contacts = {}
DEF.modules.contacts.Router = Roadtrip.Router.extend({
	module: "contacts",
	initialize: function() {
		APP.models.contacts = new DEF.modules.contacts.Collection();
		APP.Icon_Lookup["Vendor"] = "building";
		APP.Icon_Lookup["Customer"] = "money";
		APP.Icon_Lookup["Miscellaneous"] = "question";
		APP.Icon_Lookup["Customer,Marine"] = "ship";
		APP.Icon_Lookup["Insurance"] = "wheelchair";
		APP.Icon_Lookup["Freight Transportation"] = "truck";
		APP.Icon_Lookup["Services"] = "thumbs-up";

	},
	routes: {
		"contacts": "ShowRoot",
		"contacts/:cmd": "LoadModule",
		"contacts/:cmd/:arg": "LoadModule",
	},
	//	Route: function (cmd, arg) {
	//		this.LoadModule("contacts", cmd, arg)
	//	},
	//	Home: function () {
	//		this.ShowRoot("contacts");
	//	}
})

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
	GetLink: function(cmd) {
		return "#contacts/" + cmd + "/" + this.get('_id');
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
DEF.modules.contacts.views = {
	/**
	 * Edit a contact
	 */
	edit: Roadtrip.Edit.extend({
		module: "contacts",
		template: require("./templates/edit.html"),
	}),
	/**
	 * View a plain, read-only single record
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
		Edit: function() {
			APP.Route("#contacts/" + "edit" + "/" + this.model.id);
		},
		Delete: function() {
			if (confirm("Are you sure you want to delete " + this.model.get(this.model.nameAttribute))) {
				console.log("kill it");
				APP.models.contacts.remove(this.model);
				APP.Route("#contacts", "contacts");
			}
		}
	})
}

/**
 * A single line of contacts on the main contact view
 */
DEF.modules.contacts.RecordLine = Roadtrip.RecordLine.extend({
	module: "contacts",
	template: require("./templates/contact_line.html"),
});

/**
 * The MainView.  HAS to be called MainView.  This is where this module begins
 */
DEF.modules.contacts.MainView = Roadtrip.RecordList.extend({
	id: 'CONTACTS',
	template: require("./templates/contacts.html"),
	templateHelpers: function(x, y, z) {
		return {
			search: this.search,
		}
	},
	childView: DEF.modules.contacts.RecordLine,
	childViewContainer: "#record_list",
	ui: {
		search: "#search",
		add: "#add"
	},
	events: {
		"keyup @ui.search": "Search",
		"click @ui.add": "Add"
	},
	filter: function(model, index, collection) {
		var string = model.search_string();
		if (string.indexOf(this.ui.search.val().toUpperCase()) == -1)
			return false;
		return true;
	},
	initialize: function() {},
	onRender: function() {
		this.ui.search.focus().val(this.search); // this search is disgusting
	},
	Search: function(e) {
		console.log(this.ui.search.val(), this.templateHelpers());
		this.search = this.ui.search.val();
		this.render();
	},
	Add: function() {
		var page = new DEF.modules.contacts.views.edit({
			model: false,
		});
		APP.root.showChildView('main', page);
	}
});
