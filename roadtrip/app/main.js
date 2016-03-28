require('backbone.marionette');

$ = require('jquery');
_ = require('underscore');
APP = {}; // DEFINE THE MAIN APP OBJECT
DEF = {}; // HOLD THE DEFINITIONS. ALL THE MODULES, ETC...

require('backbone.highway');

require('../style/style.scss');
require("font-awesome-webpack");

require("./roadtrip.js");
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
	SetMode: function (mode) {
		$("#HEADER #mainmenu .menuitem").removeClass('active')
		$("#HEADER #mainmenu .menuitem[data-mode=" + mode + "]").addClass('active');
	},
	Route: function (route, title, trigger) {
		if (_.isUndefined(trigger))
			trigger = true;

		//		if (history.pushState) {
		//			history.pushState(null, null, route);
		//		} else {
		//			location.hash = route;
		//		}
		APP.controller.router.navigate(route, {
			trigger: trigger
		})
		this.SetTitle(title);
		console.log(route, title);
	},
	Icon_Lookup: {
		calendar: "calendar",
		contacts: "group",
		projects: "pie-chart",
		orders: "money",
		expenses: "dollar",
		timeclock: "clock-o",

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
	},
	Icon: function (icon, title) {
		switch (icon) {
		case 'loading':
			return "<span class='loading'><i class='fa fa-refresh fa-spin'></i></span>";
			break;
		default:
			if (this.Icon_Lookup[icon])
				icon = this.Icon_Lookup[icon];
		}
		return "<i " + (title ? "title='" + title + "'" : "") + " class='icon fa fa-" + icon + "'></i>";
	},
});


APP = new MainApp();
APP.models = {} // hold the collections

DEF.modules = {} // hold the models definitions
require("../modules/contacts/contacts.js");
require("../modules/orders/orders.js");
require("../modules/projects/projects.js");
require("../modules/calendar/calendar.js");


APP.Format = {
	fixed: function (val, dec) {
		if (!_.isNumber(val))
			val = 0;
		return val.toFixed(dec);
	},
	clamp: function (val, min, max) {
		return Math.max(Math.min(val, max), min);
	},
	money: function (val) {
		var sign = val < 0 ? "negative" : "positive";
		return '<span class="money ' + sign + '">$' + val.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') + "</span>";
	}
}


APP.on('before:start', function () {
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