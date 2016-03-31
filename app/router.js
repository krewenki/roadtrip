DEF.Router = Backbone.Marionette.AppRouter.extend({
	appRoutes: {
		'home': 'GoHome',
		'': 'GoHome',
		'login': 'Login'
	}
});

DEF.Controller = Backbone.Marionette.Object.extend({
	initialize: function () {
		this.routers = {}
		var modules = Object.keys(DEF.modules);
		for (var m = 0; m < modules.length; m++)
			this.routers[modules[m]] = new DEF.modules[modules[m]].Router();
	},

	GoHome: function () {
		var page = new DEF.StaticLayout({
			page: "home"
		})
		APP.root.showChildView("main", page);
		APP.SetMode("home");
	},
	
	Login: function () {
		var page = new DEF.StaticLayout({
			page: "login"
		})
		APP.root.showChildView("main", page);
		APP.SetMode("home");
	},


});