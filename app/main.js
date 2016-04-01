require('backbone.marionette');

$ = require('jquery');
_ = require('underscore');
APP = {}; // DEFINE THE MAIN APP OBJECT
DEF = {}; // HOLD THE DEFINITIONS. ALL THE MODULES, ETC...

require('backbone.highway');

require('../style/style.scss');
require("font-awesome-webpack");

require("./auth.js");
require("./roadtrip.js");
require("./layout.js");
require("./search.js");
require("./router.js");
require("./static.js");

//$.getJSON('/auth',function(r){
//console.log(r);
//})

var MainApp = Backbone.Marionette.Application.extend({
	anon: "56fea65b54d49c036c802e54", // the anonymous user id
	setRootLayout: function() {
		this.root = new DEF.RootLayout();
		APP.root.showChildView('header', new DEF.HeaderLayout({}));
		APP.root.showChildView('footer', new DEF.FooterLayout({}));
	},
	SetTitle: function(title, module) {
		document.title = title + " - roadtrip";
		if (module)
			this.SetMode(module);
	},
	SetMode: function(mode) {
		$("#HEADER #mainmenu .menuitem").removeClass('active')
		$("#HEADER #mainmenu .menuitem[data-mode=" + mode + "]").addClass('active');
	},
	/**
	 * returns the specified models
	 * @param  {search_string} model module nameAttribute
	 * @param  {id} id    model  _id
	 * @return {[type]}       the model
	 */
	GetModel: function(module, id) {
		return APP.models[module].get(id);
	},
	Route: function(route, trigger) {
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
			//console.log(route, title);
	},
	Icon_Lookup: {
		calendar: "calendar",
		contacts: "group",
		projects: "pie-chart",
		tasks: "tasks",
		orders: "money",
		expenses: "dollar",
		timeclock: "clock-o",
		wiki: "wikipedia-w",
		comments: "wechat",

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
	Icon: function(icon, title) {
		if (icon.substring(0, 4) == "http")
			return "<img class='icon' src='" + icon + "'>";
		switch (icon) {
			case 'loading':
				return "<span class='loading'><i class='fa fa-refresh fa-spin'></i></span>";
				break;
			default:
				if (this.Icon_Lookup[icon])
					icon = this.Icon_Lookup[icon];
		}
		return "<i " + (title ? "title='" + title + "'" : "title='" + icon + "'") + " class='icon fa fa-" + icon + "'></i>";
	},

});


APP = new MainApp();
APP.models = {} // hold the collections

DEF.modules = {} // hold the models definitions
require("../modules/comments/comments.js");
require("../modules/tasks/tasks.js");
require("../modules/wiki/wiki.js");
require("../modules/contacts/contacts.js");
require("../modules/orders/orders.js");
require("../modules/projects/projects.js");
require("../modules/calendar/calendar.js");
require("../modules/users/users.js");


APP.Format = {
	fixed: function(val, dec) {
		if (!_.isNumber(val))
			val = 0;
		return val.toFixed(dec);
	},
	clamp: function(val, min, max) {
		return Math.max(Math.min(val, max), min);
	},
	number: function(val) {
		return val.toFixed(0).replace(/(\d)(?=(\d{3})+$)/g, '$1,') + "</span>";
	},
	money: function(val) {
		var sign = val < 0 ? "negative" : "positive";
		return '<span class="money ' + sign + '">$' + val.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') + "</span>";
	},
	date: function(time) {
		if (!time)
			return "--";
		var date = new Date(time);
		var datef = date.getFullYear() + "-" + ("00" + (date.getMonth() + 1)).slice(-2) + "-" + ("00" + date.getDate()).slice(-2);
		return "<a href='#calendar/date/" + datef + "'>" + datef + "</a>";
	},
	time: function(time) {
		if (!time)
			return "--";
		var date = new Date(time);
		var datef = date.getHours() + ":" + ("00" + date.getMinutes()).slice(-2) + ":" + ("00" + date.getSeconds()).slice(-2);
		return datef;
	},
	datetime: function(time) {
		if (!time)
			return "--";
		return APP.Format.date(time) + " " + APP.Format.time(time);
	},
	markdown: require('marked')
}


APP.on('before:start', function() {
	APP.setRootLayout();
});

APP.on('start', function() {
	APP.controller = new DEF.Controller();
	APP.controller.router = new DEF.Router({
		controller: APP.controller
	});
	Backbone.history.start();
});


APP.start();
