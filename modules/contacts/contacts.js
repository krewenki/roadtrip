window.DEF.modules.contacts = {}
window.DEF.modules.contacts.Contact = Backbone.Model.extend({
	defaults: {
		name: "Person 1"
	}
});

window.DEF.modules.contacts.Collection = Backbone.Highway.Collection.extend({
	model: DEF.modules.contacts.Contact,
	url: 'dev.telegauge.com:3000/roadtrip/contacts',
});

window.DEF.modules.contacts.MainView = Backbone.Marionette.LayoutView.extend({
	template: require("./templates/contacts.html"),
	regions: {
		list: "#contact_list"
	},
	initialize: function () {
		//APP.InitializeCollection("contacts", DEF.Contacts);
	},
	onRender: function () {
		this.ListContacts();
		APP.SetMode("contacts");
	},
	ListContacts: function () {
		var list = new DEF.modules.contacts.ContactList({
			collection: APP.models.contacts,
		});
		this.showChildView('list', list);
	}
});

window.DEF.modules.contacts.ContactLine = Backbone.Marionette.ItemView.extend({
	tagName: 'tr',
	template: require("./templates/contact_line.html")
});


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