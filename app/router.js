DEF.Router = Backbone.Marionette.AppRouter.extend({
	appRoutes: {
		'': 'GoHome'
	}
});

DEF.Controller = Backbone.Marionette.Object.extend({

	InitializeInterface: function () {
		if (!this.init_done) {
			var header = new DEF.HeaderLayout({});
			APP.root.showChildView('header', header);
			this.init_done = true;
		}
		$("#search").val("");
	},
	GoHome: function () {
		this.InitializeInterface();
		var page = new DEF.StaticLayout({
			page: "home"
		})
		APP.root.showChildView("main", page);
	}


});