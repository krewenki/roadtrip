DEF.Router = Backbone.Marionette.AppRouter.extend({
	appRoutes: {
		'': 'GoHome',
		'contacts': "Contacts"
	}
});

DEF.Controller = Backbone.Marionette.Object.extend({

	InitializeInterface: function () {
		if (!this.init_done) {
			var header = new DEF.HeaderLayout({});
			APP.root.showChildView('header', header);
			this.init_done = true;
		}
	},
	GoHome: function () {
		this.InitializeInterface();
		var page = new DEF.StaticLayout({
			page: "home"
		})
		APP.root.showChildView("main", page);
		APP.SetMode("home");
	},
	Contacts: function () {
		this.InitializeInterface();
		if (APP.models.contacts.length) {
			var page = new DEF.ContactsLayout({});
			APP.root.showChildView("main", page);
			APP.SetMode("contacts");
		} else {
			this.listenToOnce(APP.models.contacts, 'sync', this.Contacts.bind(this))
		}
	}



});