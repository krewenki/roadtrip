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

var MainApp = Backbone.Marionette.Application.extend({
	anon: "56fea5cc54d49c036c802e53", // the anonymous user id

	setRootLayout: function() {
		this.root = new DEF.RootLayout();
		APP.root.showChildView('header', new DEF.HeaderLayout({}));
		APP.root.showChildView('footer', new DEF.FooterLayout({}));
	},
	/**
	 * When the URL changes, scroll to the top, unless the url changed via Browser Back (when the
	 * mouse was not in the doc)
	 * @return  null
	 */
	SetUpScrollToTop: function() {
		document.onmouseover = function() {
			//User's mouse is inside the page. (This is working)
			window.innerDocClick = true;
		}
		document.onmouseleave = function() {
			//User's mouse has left the page. (this is working)
			window.innerDocClick = false;
		}
		window.onhashchange = function() {
			if (window.innerDocClick) {
				// $("html, body").animate({
				// 	scrollTop: 0
				// }, 100);
				window.scrollTo(0, 0)
			}
		}
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
	 * Yet another "GetLink".  Returns a <a href...
	 * @param  {string} module Name of the module ("orders")
	 * @param  {string} id     _id
	 * @param  {string} cmd    "view", by default
	 * @return {string}        <a href...
	 */
	GetLink: function(module, id, cmd = 'view') {
		var model = APP.models[module].get(id);
		return `<a href='#${module}/${cmd}/${id}'>` + APP.Icon(module) + " " + model.get(model.nameAttribute) + "</a>";
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
	Route: function(route, trigger = true) {

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
		tasks: "check-circle-o",
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
	/**
	 * Get an icon
	 * @param  {string} icon  Which icon.  See font-asesome
	 * @param  {string} title Tooltip title
	 * @return {string}       <i...>
	 */
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
	HTML: {
		/**
		 * Generate a HTML <select> element
		 * @param  {string} id          HTML ID
		 * @param  {collection} collection  A backbone collection
		 * @param  {string} display     Which field to display in the select
		 * @param  {string} key         The id of the value field
		 * @param  {string} value       The currently selected value
		 * @param  {string} className   HTML className
		 * @param  {bool} leave_empty Leave a blank line at the top
		 * @return {string}             "<select...>"
		 */
		Select: function(id, collection, display, key, value, className, leave_empty) {
			key = key || "_id";
			var html = "<select id='" + id + "' class='" + (className || "") + "'>";
			if (leave_empty) {
				html += "<option></option>";
			}
			collection.each(function(model) {
				html += "<option " + (value == model.get(key) ? "selected" : "") + " value='" + model.get(key) + "'>" + model.get(display) + "</option>";
			})

			html += "</select>";
			return html;

		}
	}
});


APP = new MainApp();
APP.models = {} // hold the collections

DEF.modules = {} // hold the models definitions
require("../modules/users/users.js");
require("../modules/comments/comments.js");
require("../modules/tasks/tasks.js");
require("../modules/wiki/wiki.js");
require("../modules/contacts/contacts.js");
require("../modules/orders/orders.js");
require("../modules/projects/projects.js");
require("../modules/calendar/calendar.js");
require("../modules/expenses/expenses.js");


APP.Format = {
	/**
	 * Returns a float, truncated to the number of decimals
	 * @param  {float} val The original value
	 * @param  {int} dec Number of decimals
	 * @return {string}     "5.50"
	 */
	fixed: function(val, dec) {
		if (!_.isNumber(val))
			val = 0;
		return val.toFixed(dec);
	},
	/**
	 * Returns a value not exceeding min or max
	 * @param  {float} val value
	 * @param  {float} min Min value
	 * @param  {float} max Max value
	 * @return {float}     Value, not exceeding Min or Max
	 */
	clamp: function(val, min, max) {
		return Math.max(Math.min(val, max), min);
	},
	/**
	 * Returns a number with commas inserted appropriately
	 * @param  {float} val A number
	 * @return {string}     A number, with , in the thousands
	 */
	number: function(val) {
		return val.toFixed(0).replace(/(\d)(?=(\d{3})+$)/g, '$1,');
	},
	/**
	 * Returns the value formatted as money
	 * @param  {float} val The money value
	 * @return {string}     $5.50
	 */
	money: function(val) {
		val = Number(val);
		sign = "zero";
		if (val < 0)
			sign = "negative"
		if (val > 0)
			sign = "positive";
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
	/**
	 * Returns html, given markdown
	 * @param  {text} 'marked' Markdown formatted text
	 * @return {html}          HTML formatted text
	 */
	markdown: require('marked')
}


APP.on('before:start', function() {
	APP.SetUpScrollToTop();
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
