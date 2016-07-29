require('backbone.marionette');

window.$ = require('jquery');
window._ = require('underscore');
window.APP = {}; // DEFINE THE MAIN APP OBJECT
window.DEF = {}; // HOLD THE DEFINITIONS. ALL THE MODULES, ETC...

require('backbone.highway');

require('../style/style.scss');
require("font-awesome-webpack");

require("./roadtrip.js");
require("./layout.js");
require("./search.js");
require("./router.js");
require("./static.js");

var MainApp = Backbone.Marionette.Application.extend({
	anon: "56fea5cc54d49c036c802e53", // the anonymous user id

	setRootLayout: function () {
		this.root = new DEF.RootLayout();
		APP.root.showChildView('header', new DEF.HeaderLayout({}));
		APP.root.showChildView('footer', new DEF.FooterLayout({}));
	},
	/**
	 * When the URL changes, scroll to the top, unless the url changed via Browser Back (when the
	 * mouse was not in the doc)
	 * @return  null
	 */
	SetUpWindowEvents: function () {

		// document.onmouseover = function() {
		// 	//User's mouse is inside the page. (This is working)
		// 	window.innerDocClick = true;
		// };
		// document.onmouseleave = function() {
		// 	//User's mouse has left the page. (this is working)
		// 	window.innerDocClick = false;
		// };
		// window.onhashchange = function() {
		// 	if (window.innerDocClick) {
		// 		// $("html, body").animate({
		// 		// 	scrollTop: 0
		// 		// }, 100);
		// 		//	window.scrollTo(0, 0);
		// 	}
		// };
		// window.onscroll = function () {
		// 	var $header = $("#HEADER");
		// 	if (document.body.scrollTop > 110 || document.documentElement.scrollTop > 110) {
		// 		if ($header.hasClass("large"))
		// 			$header.removeClass("large")
		// 			.addClass("small");
		// 	} else {
		// 		if ($header.hasClass("small"))
		// 			$header.removeClass("small")
		// 			.addClass("large");
		// 	}
		// };
		$(document).on('click', 'a.route', function (e) {
			APP.Route($(e.currentTarget).attr('href'));
			return false;
		});
	},
	SetTitle: function (title, module) {
		document.title = title + " - roadtrip";
		if (module)
			this.SetMode(module);
	},
	SetMode: function (mode) {
		$("#HEADER #mainmenu .menuitem")
			.removeClass('active');
		$("#HEADER #mainmenu .menuitem[data-mode=" + mode + "]")
			.addClass('active');
	},
	/**
	 * Yet another "GetLink".  Returns a <a href...
	 * @param  {string} module Name of the module ("orders")
	 * @param  {string} id     _id
	 * @param  {string} linktext    what to display in the hyperklink
	 * @return {string}        <a href...
	 */
	GetLink: function (module, id, linktext) {
		if (APP.models[module]) {
			var model = APP.models[module].get(id);
			if (model) {
				if (!linktext)
					linktext = " " + model.get(model.nameAttribute);
				return "<a title='" + id + ": " + model.get(model.nameAttribute) + " class=\"route\" href='${module}/view/${id}'>" + APP.Icon(module) + linktext + "</a>";
			}
		}
		return "--";
	},
	/**
	 * returns the specified models
	 * @param  {search_string} model module nameAttribute
	 * @param  {id} id    model  _id
	 * @return {[type]}       the model
	 */
	GetModel: function (module, id) {
		return APP.models[module].get(id);
	},
	Route: function (route, trigger = true) {

		//		if (history.pushState) {
		//			history.pushState(null, null, route);
		//		} else {
		//			location.hash = route;
		//		}
		//
		APP.controller.router.navigate(route, {
			trigger: trigger
		});
		//console.log(route, title);
	},
	/**
	 * Create an event in the event log
	 * @param {string} module Name of the module_id
	 * @param {string} id     ID of the model in question
	 * @param {text} event  The event
	 * @param {object} extras  Any additional info?
	 */
	LogEvent: function (module, id, event, extras = false, group = false) {
		APP.models.events._create({
			module: module,
			module_id: id,
			event: event,
			datetime: Date.now(),
			user_id: U.id,
			extras: extras,
			group: group
		});
	},
	CreateTodo: function (user_id, module, module_id, task) {
		APP.models.todo.create({
			assigned_to: user_id,
			module: module,
			module_id: module_id,
			task: task,
			created_by: U.id
		});
		APP.LogEvent(module, module_id, "Todo created: " + task, {
			for: user_id
		}, "todo");
	},
	Icon_Lookup: {
		// module icons.  Gotta be here, so the UI can be drawn prior to init
		calendar: "calendar",
		contacts: "group",
		projects: "pie-chart",
		tasks: "check-circle-o",
		orders: "money",
		expenses: "dollar",
		timeclock: "clock-o",
		wiki: "wikipedia-w",
		comments: "comments",
		events: "sticky-note-o",
		users: "user",
		revisions: "code-fork",
		db: "database",
		todo: "list",

		// general icons
		edit: "pencil",
		view: "search",
		cancel: "remove",
		delete: "trash",
		done: "check",
		new: "plus"
	},
	/**
	 * Get an icon
	 * @param  {string} icon  Which icon.  See font-asesome
	 * @param  {string} title Tooltip title
	 * @return {string}       <i...>
	 */
	Icon: function (icon, title = icon) {
		if (!icon)
			return;
		if (icon.substring(0, 4) == "http")
			return "<img class='icon' src='" + icon + "'>";

		switch (icon) {
		case 'loading':
			return "<span class='loading'><i class='fa fa-refresh fa-spin'></i></span>";
		default:
			if (this.Icon_Lookup[icon])
				icon = this.Icon_Lookup[icon];
		}
		return "<i title='" + title + "' class='icon fa fa-" + icon + "'></i>";
	},
});


window.APP = new MainApp();
APP.models = {}; // hold the collections
DEF.modules = {}; // hold the models definitions

/*
██████  ███████  ██████  ██    ██ ██ ██████  ███████
██   ██ ██      ██    ██ ██    ██ ██ ██   ██ ██
██████  █████   ██    ██ ██    ██ ██ ██████  █████
██   ██ ██      ██ ▄▄ ██ ██    ██ ██ ██   ██ ██
██   ██ ███████  ██████   ██████  ██ ██   ██ ███████
                    ▀▀
*/
require("../modules/comments/comments.js");
require("../modules/tasks/tasks.js");
require("../modules/users/users.js");
require("../modules/wiki/wiki.js");
require("../modules/contacts/contacts.js");
require("../modules/orders/orders.js");
require("../modules/projects/projects.js");
require("../modules/timeclock/timeclock.js");
require("../modules/calendar/calendar.js");
require("../modules/expenses/expenses.js");
require("../modules/repositories/repository.js");
require("../modules/revisions/revisions.js");
require("../modules/events/events.js");
require("../modules/db/db.js");
require("../modules/todo/todo.js");
require("./auth.js");


/*
██   ██ ████████ ███    ███ ██
██   ██    ██    ████  ████ ██
███████    ██    ██ ████ ██ ██
██   ██    ██    ██  ██  ██ ██
██   ██    ██    ██      ██ ███████
*/
APP.HTML = {
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
	Select: function (id, collection, display, key, value, className, leave_empty) {
		key = key || "_id";
		var html = "<select id='" + id + "' class='" + (className || "") + "'>";
		if (leave_empty) {
			html += "<option></option>";
		}
		collection.each(function (model) {
			html += "<option " + (value == model.get(key) ? "selected" : "") + " value='" + model.get(key) + "'>" + model.get(display) + "</option>";
		});

		html += "</select>";
		return html;

	},
	Autocomplete: function (id, collection, display, key, value, className, leave_empty) {
		var data_list_id = _.uniqueId(id);
		var html = "<input value='" + value + "'list='" + data_list_id + "' type='text' id='" + id + "' class='" + (className || "") + "'>";
		html += "<datalist id='" + data_list_id + "'>";
		collection.each(function (model) {
			html += "<option value='" + model.get(key) + "'>" + model.GetTitle() + "</option>";
		});
		html += "</datalist>";
		return html;
	}
};


/*
████████  ██████   ██████  ██      ███████
   ██    ██    ██ ██    ██ ██      ██
   ██    ██    ██ ██    ██ ██      ███████
   ██    ██    ██ ██    ██ ██           ██
   ██     ██████   ██████  ███████ ███████
*/

/**
 * A collection of convenience functions
 * @type {Object}
 */
APP.Tools = {
	/**
	 * Given a collection (or an array from a collection.filter), return the counts of "key"
	 * @param  {collection or array} collection The collection
	 * @param  {string} key        The field to counts
	 * @return {Object}            {bug:20,feature:40}
	 */
	CountFields: function (collection, key) {
		var counts = {};
		if (!_.isArray(collection)) // unfiltered, i guess
			collection = collection.models;
		for (let model of collection) {
			var field = model.get(key);
			counts[field] = counts[field] ? counts[field] + 1 : 1;
		}
		var Σ = 45;
		return counts;
	},
	/**
	 * Perform some simple operations
	 * @param  {collection} collection A collection (not an array yet)
	 * @param  {string} key        Column
	 * @param  {string} func       size(count), min, max.  anything _ provides
	 * @return {number}            The result
	 */
	Aggregate: function (collection, func, key) {
		var rs = false;
		if (key)
			collection = new Backbone.Collection(collection).pluck(key);
		switch (func) {
		case "min":
		case "max":
		case "size":
			rs = Number(_[func](collection));
			break;
		case "avg":
			var sum = collection.reduce(function (a, b) {
				return Number(a) + Number(b);
			});
			rs = sum / collection.length;
			break;

		}
		return rs;
	}
};

/*
███████  ██████  ██████  ███    ███  █████  ████████ ████████ ███████ ██████  ███████
██      ██    ██ ██   ██ ████  ████ ██   ██    ██       ██    ██      ██   ██ ██
█████   ██    ██ ██████  ██ ████ ██ ███████    ██       ██    █████   ██████  ███████
██      ██    ██ ██   ██ ██  ██  ██ ██   ██    ██       ██    ██      ██   ██      ██
██       ██████  ██   ██ ██      ██ ██   ██    ██       ██    ███████ ██   ██ ███████
*/

APP.Format = {
	/**
	 * Returns a float, truncated to the number of decimals
	 * @param  {float} val The original value
	 * @param  {int} dec Number of decimals
	 * @return {string}     "5.50"
	 */
	fixed: function (val, dec) {
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
	clamp: function (val, min, max) {
		return Math.max(Math.min(val, max), min);
	},
	/**
	 * Returns a number with commas inserted appropriately
	 * @param  {float} val A number
	 * @return {string}     A number, with , in the thousands
	 */
	number: function (val) {
		return val;
	},
	bytes: function (val) {
		var unit = 'b';
		if (val > 1000) {
			unit = 'kb';
			val /= 1000;
		}
		if (val > 1000) {
			unit = 'mb';
			val /= 1000;
		}
		return APP.Format.fixed(val, 1) + unit;
	},
	/**
	 * Returns a number with commas and dollarsigns and all that shit removed.
	 * Deccimals remain, though
	 * @param  {string} val "$5,500.00"
	 * @return {number}     5500
	 */
	pure: function (val) {
		if (_.isString(val))
			val = val.match(/[\.\d]+/g)
			.join([]);
		return Number(val);
	},
	/**
	 * Returns the value formatted as money
	 * @param  {float} val The money value
	 * @return {string}     $5.50
	 */
	money: function (val) {
		if (U.get("is_anonymous"))
			return "<span class='notallowed'>" + APP.Icon("eye-slash", "You do not have permission to view money") + "</span>";
		val = Number(val);
		var sign = "zero";
		if (val < 0)
			sign = "negative";
		if (val > 0)
			sign = "positive";
		return '<span class="money ' + sign + '">$' + val.toFixed(2)
			.replace(/(\d)(?=(\d{3})+\.)/g, '$1,') + "</span>";
	},
	sysdate: function (time = Date.now()) {
		var date = new Date(time);
		var datef = date.getFullYear() + "-" + ("00" + (date.getMonth() + 1))
			.slice(-2) + "-" + ("00" + date.getDate())
			.slice(-2);
		return datef;
	},
	date: function (time) {
		if (!time)
			return "--";
		var date = new Date(time);
		var datef = ("00" + (date.getMonth() + 1))
			.slice(-2) + "/" + ("00" + date.getDate())
			.slice(-2) + "/" + date.getFullYear();
		return "<a href='/calendar/date/" + date.toISOString()
			.slice(0, 10) + "' class='route'>" + datef + "</a>";
	},
	time: function (time) {
		if (!time)
			return "--";
		var date = new Date(time);
		var datef = date.getHours() + ":" + ("00" + date.getMinutes())
			.slice(-2) + ":" + ("00" + date.getSeconds())
			.slice(-2);
		return datef;
	},
	datetime: function (time) {
		if (!time)
			return "--";
		return APP.Format.date(time) + " " + APP.Format.time(time);
	},
	monday: function (date, sysdate) {
		if (!date)
			date = new Date();
		if (_.isString(date))
			date = new Date(date);
		if (!_.isDate(date))
			date = new Date(date);
		var day = date.getDay() || 7;
		if (day !== 1)
			date.setHours(-24 * (day - 1));
		if (sysdate)
			return APP.Format.sysdate(date);
		else
			return date;
	},
	/**
	 * Returns html, given markdown
	 * @param  {text} 'marked' Markdown formatted text
	 * @return {html}          HTML formatted text
	 */
	markdown: require('marked'),
	htmlentities: function (str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	},
	/**
	 * Parses "bla.. #1.5...bla" into "bla.. <a href=task..> ..bla"
	 * @param  {String} str The raw text
	 * @return {String}     The text with HTML links for things that match
	 */
	linktext: function (str) {
		// TODO:0 pick up emails and urls
		if (APP.models.tasks)
			return str.replace(/(#)(\d.[\d.]+)/, APP.Format._replace);
		else
			return str;

	},
	_replace: function (match, key, id) {
		return APP.GetLink("tasks", id, id);
	},
	/**
	 * Capitalize first letters
	 * @param  {string} text "a things"
	 * @return {string}      "A thing"
	 */
	first: function (text) {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}
};

APP.util = {
	DeleteField: function (collection, field) {

	},
	RenameField: function (collection, old_name, new_name) {
		collection.each(function (m) {
			var set = {};
			set[new_name] = m.get(old_name);
			console.log(m.id, set);
			m.set(set);
		});
		APP.util.DeleteField(collection, old_name);
	}
};


/*
███    ███  █████  ██ ███    ██
████  ████ ██   ██ ██ ████   ██
██ ████ ██ ███████ ██ ██ ██  ██
██  ██  ██ ██   ██ ██ ██  ██ ██
██      ██ ██   ██ ██ ██   ████
*/
APP.on('before:start', function () {
	APP.SetUpWindowEvents();
	APP.setRootLayout();
});

APP.on('start', function () {
	APP.controller = new DEF.Controller();
	APP.controller.router = new DEF.Router({
		controller: APP.controller
	});
	Backbone.history.start({
		pushState: true
	});
});


APP.start();
