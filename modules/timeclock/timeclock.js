DEF.modules.timeclock = {
	views: {}
};
DEF.modules.timeclock.Initialize = function () {
	if (!APP.models.timeclock)
		APP.models.timeclock = new DEF.modules.timeclock.Collection();
};
DEF.modules.timeclock.Router = Roadtrip.Router.extend({
	initialize: function () {},
	collections: [
		"timeclock", "users", "orders", "tasks"
	],
	module: "timeclock",
	routes: {
		"timeclock": "ShowRoot",
		"timeclock/:mode/:date": "ShowWeek"
	},
	ShowWeek: function (mode, date) {
		var module = this.module;
		APP.Page = new DEF.modules[module].MainView({
			collection: APP.models[module],
			date: date,
			mode: mode
		});
		APP.root.showChildView("main", APP.Page);
	}
});


DEF.modules.timeclock.Model = Roadtrip.Model.extend({
	nameAttribute: 'date', // the human-readable field in the record
	module: "timeclock",
	defaults: {
		_: {},
		module: "order",
		module_id: "",
		hours: [0, 0, 0, 0, 0, 0, 0],
		date: false
	},
	search_string: function () {
		return false;
	}
});

DEF.modules.timeclock.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.timeclock.Model,
	url: 'dev.telegauge.com:3456/roadtrip/timeclock',
});

DEF.modules.timeclock.LineView = Backbone.Marionette.ItemView.extend({
	tagName: "tr",
	template: require("./templates/time_line.html"),
	templateHelpers: function () {
		return {
			week: this.options.childIndex,
			date: this.options.date,
			mode: this.options.mode
		};
	},
	ui: {
		field: ".field",
		module: "#module",
		module_id: "#module_id",
		hour: ".hour_picker",
		sum: "#sum"
	},
	modelEvents: {
		"change": "render"
	},
	events: {
		"click @ui.hour": "ClickHour",
		"change @ui.field": "Save",
	},
	onRender: function () {
		this.Sum();
	},
	ClickHour: function () {
		this.trigger("total"); // tell whole view to totalize (hours per day)
		this.Sum(); // add up all the hours per line
		this.Save();
	},
	Sum: function () {
		var total = 0;
		$(this.ui.hour).each(function (i, el) {
			if (el.checked) {
				total += Number(el.value);
			}
		});
		this.ui.sum.html(APP.Format.number(total));
	},
	Save: function () {
		var totals = [0, 0, 0, 0, 0, 0, 0];
		$(this.ui.hour).each(function (i, el) {
			if (el.checked) {
				totals[$(el).data('day')] += Number(el.value);
			}
		});
		var module = this.ui.module.val();
		var change = {
			hours: totals,
			module: module,
			module_id: this.ui.module_id.val(),
			date: this.options.date,
		};
		this.model.set(change);
		console.log("save", change);
	}

});
DEF.modules.timeclock.WeekView = Backbone.Marionette.CompositeView.extend({
	template: require("./templates/week.html"),
	childView: DEF.modules.timeclock.LineView,
	childViewContainer: "#week",
	childViewOptions: function (model, index) {
		return {
			mode: this.options.mode,
			date: this.options.date,
			childIndex: index // a way to know which row you're on
		};
	},
	emptyView: DEF.EmptyView,
	emptyViewOptions: {
		icon: "warning",
		msg: "No times found",
		colspan: 9
	},

	templateHelpers: function () {
		var date = new Date(this.options.date).getTime();
		var week = 604800 * 1000;
		var day = 86400 * 1000;
		var rs = {
			prev: APP.Format.monday(date - week + day, true),
			next: APP.Format.monday(date + week + day, true),
			date: this.options.date,
			mode: this.options.mode
		};
		return rs;
	},
	childEvents: {
		"total": "Total",
	},
	ui: {
		add: "#add"
	},
	events: {
		"click @ui.add": "Add"
	},
	Total: function () {
		var totals = [0, 0, 0, 0, 0, 0, 0];
		$(".hour_picker").each(function (i, el) {
			if (el.checked)
				totals[$(el).data('day')] += Number(el.value);
		});
		var grand = 0;
		for (var t in totals) {
			$("#total_" + t).html(totals[t]);
			grand += Number(totals[t]);
		}
		$("#grand_total").html(grand);
	},
	Add: function () {
		console.log("add", this.options.date);
		APP.models.timeclock.create({
			date: this.options.date,
			_: {
				created_by: U.id,
				created_on: Date.now()
			}
		});
	}
});
DEF.modules.timeclock.MainView = Backbone.Marionette.LayoutView.extend({
	id: 'TIMECLOCK',
	initialize: function () {
		if (!this.options.date)
			this.options.date = APP.Format.monday(new Date(), true);
	},
	template: require("./templates/timeclock.html"),
	templateHelpers: function () {
		var rs = {
			date: this.options.date,
			mode: this.options.mode
		};
		return rs;
	},
	regions: {
		week: "#week",
		summary: "#summary"
	},
	onRender: function () {
		var date = this.options.date;
		this.week.show(new DEF.modules.timeclock.WeekView({
			collection: APP.models.timeclock,
			date: this.options.date,
			mode: this.options.mode,
			filter: function (m) {
				var rs = m.get('_.created_by') == U.id && m.get('date') == date;
				return rs;
			}
		}));
		this.summary.show(new DEF.modules.timeclock.Summary({}));
	}
});



DEF.modules.timeclock.Summary = Backbone.Marionette.ItemView.extend({
	tagName: 'table',
	className: 'table table-full table-left',
	template: require("./templates/summary.html")
});
