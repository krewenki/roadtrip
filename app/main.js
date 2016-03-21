require('backbone.marionette');

window.$ = require('jquery');
window._ = require('underscore');
window.APP = {}; // DEFINE THE MAIN APP OBJECT
window.DEF = {}; // HOLD THE DEFINITIONS. ALL THE MODULES, ETC...

//require('../vendor/backbone.highway.js');

require('../style/style.scss');
require("font-awesome-webpack");

require("./layout.js");
require("./router.js");
require("./static.js");

var MainApp = Backbone.Marionette.Application.extend({
	setRootLayout: function () {
		this.root = new DEF.RootLayout();
	},
	SetTitle: function (title) {
		document.title = title + " - roadtrip";
	},
	Route: function (route) {
		window.location = route;
	},
	InitializeCollections: function () {
		APP.UID = 0;
		this.models = {
			//			ratings: new COW.Ratings(),
		}
	},
	Icon: function (icon, title) {
		icons = {
			calendar: "calendar",
			contacts: "group",
			projects: "pie-chart",

			warning: "warning",
			link: "external-link",
			delete: "remove",
			rate: "thumbs-up",
			more: "ellipsis-h",
			off: "square-o",
			on: "check-square-o",
			stats: "bar-chart",
			up: "chevron-up",
			down: "chevron-down",
			settings: "gear",
			user: "user",
			report: "bug",
			data: "rss",
			edit: "pencil",
			cancel: "remove",
			new: "plus"
		}

		switch (icon) {
		case 'loading':
			return "<span class='loading'><i class='fa fa-refresh fa-spin'></i></span>";
			break;
		default:
			if (icons[icon])
				icon = icons[icon];
		}
		return "<i " + (title ? "title='" + title + "'" : "") + " class='fa fa-" + icon + "'></i>";
	},
});


APP = new MainApp();

APP.Format = {
	fixed: function (val, dec) {
		if (!_.isNumber(val))
			val = 0;
		return val.toFixed(dec);
	},
	clamp: function (val, min, max) {
		return Math.max(Math.min(val, max), min);
	}
}


APP.on('before:start', function () {
	APP.InitializeCollections();
	APP.setRootLayout();
});

APP.on('start', function () {
	APP.controller = new DEF.Controller();
	APP.controller.router = new DEF.Router({
		controller: APP.controller
	});
	Backbone.history.start();
});


APP.start();