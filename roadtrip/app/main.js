require('backbone.marionette');

window.$ = require('jquery');
window._ = require('underscore');
window.APP = {}; // DEFINE THE MAIN APP OBJECT
window.DEF = {}; // HOLD THE DEFINITIONS. ALL THE MODULES, ETC...
window.DEF.modules = {} // hold the models definitions

require('backbone.highway');
//require('../vendor/backbone.highway.js')

require('../style/style.scss');
require("font-awesome-webpack");

require("./roadtrip.js");
require("./layout.js");
require("./router.js");
require("./static.js");

require("../modules/contacts/contacts.js");

var MainApp = Backbone.Marionette.Application.extend({
	setRootLayout: function () {
		this.root = new DEF.RootLayout();
	},
	SetTitle: function (title) {
		document.title = title + " - roadtrip";
	},
	SetMode: function (mode) {
		$("#HEADER #mainmenu .menuitem").removeClass('active')
		$("#HEADER #mainmenu .menuitem#" + mode).addClass('active');
	},
	Route: function (route, trigger) {
		if (_.isUndefined(trigger))
			trigger = true;
		APP.controller.router.navigate(route, {
			trigger: trigger
		})
	},
	InitializeCollections: function () {
		//		this.models = {
		//	//		contacts: new DEF.modules.contacts.Contacts(),
		//		}
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
			view: "search",
			cancel: "remove",
			delete: "trash",
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
APP.models = {} // hold the collections

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