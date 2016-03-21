DEF.Router = Backbone.Marionette.AppRouter.extend({
	appRoutes: {
		'': 'GoHome',
		':module': "Route",
		':module/:arg': "Route",
		':module/:arg1/:arg2': "Route"
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

	Route: function (module, arg1, arg2) {
		this.InitializeInterface();
		if (!_.isUndefined(APP.models[module]) && APP.models[module].length) {
			var page = new DEF.modules[module].MainView({
				arg1: arg1,
				arg2: arg2
			});
			APP.root.showChildView("main", page);
			APP.SetMode(module);
		} else {
			APP.models[module] = new DEF.modules[module].Collection()
			this.listenToOnce(APP.models[module], 'sync', this.Route.bind(this, module, arg1, arg2))
		}
	},


});