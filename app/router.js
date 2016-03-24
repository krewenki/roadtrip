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

	Route: function (module, cmd, arg) {
		if (module === 'home') {
			this.GoHome();
			return;
		}
		this.InitializeInterface();
		if (!_.isUndefined(APP.models[module]) && APP.models[module].length) {
			console.log("route", module, cmd, arg);
			if (cmd) {
				APP.Page = new DEF.modules[module].views[cmd]({
					model: APP.models[module].get(arg),
				});
			} else {
				APP.Page = new DEF.modules[module].MainView({
					collection: APP.models[module]
				});
			}
			APP.root.showChildView("main", APP.Page);
			APP.SetMode(module);
		} else {
			APP.root.showChildView("main", new DEF.EmptyView({
				msg: "Loading..."
			}));
			//APP.models[module] = new DEF.modules[module].Collection();
			this.listenToOnce(APP.models[module], 'sync', this.Route.bind(this, module, cmd, arg))
		}
	},


});