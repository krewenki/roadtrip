DEF.Contact = Backbone.Model.extend({
	defaults: {
		name: "Person 1"
	}
})

DEF.Contacts = Backbone.Highway.Collection.extend({
	model: DEF.Contact,
	url: 'dev.telegauge.com:3000/roadtrip/contacts',
});

DEF.ContactsLayout = Backbone.Marionette.LayoutView.extend({
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
		var list = new DEF.ContactList({
			collection: APP.models.contacts,
		});
		this.showChildView('list', list);
	}
});

DEF.ContactLine = Backbone.Marionette.ItemView.extend({
	tagName: 'tr',
	template: require("./templates/contact_line.html")
})


DEF.ContactList = Backbone.Marionette.CompositeView.extend({
	template: require("./templates/contact_list.html"),
	tagName: "table",
	className: "table table-full table-top",
	childView: DEF.ContactLine,
	emptyView: DEF.EmptyView,
	emptyViewOptions: {
		icon: "warning",
		msg: "No contacts found?!"
	},
	collectionEvents: {
		"sync": "render"
	}
});