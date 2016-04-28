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
	},
});


DEF.modules.timeclock.Model = Roadtrip.Model.extend({
	idAttribute: 'order',
	nameAttribute: 'order', // the human-readable field in the record
	module: "timeclock",
	defaults: {
		kind: "order",
		order: "",
		hours: [0, 0, 0, 0, 0, 0, 0]
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
			week: this.options.childIndex
		};
	},
	ui: {
		field: ".field",
		kind: "#kind",
		kind_val: "#kind_val",
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
		var kind = this.ui.kind.val();
		var change = {
			hours: totals,
			kind: kind
		};
		change[kind] = this.ui.kind_val.val();
		this.model.set(change);
		this.model.SetStats("edit");
	}

});
DEF.modules.timeclock.WeekView = Backbone.Marionette.CompositeView.extend({
	template: require("./templates/week.html"),
	childView: DEF.modules.timeclock.LineView,
	childViewContainer: "#week",
	childViewOptions: function (model, index) {
		return {
			childIndex: index // a way to know which row you're on
		};
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
		APP.models.timeclock.create({
			order: ""
		});
	}
});
DEF.modules.timeclock.MainView = Backbone.Marionette.LayoutView.extend({
	id: 'TIMECLOCK',
	template: require("./templates/timeclock.html"),
	regions: {
		week: "#week",
		summary: "#summary"
	},
	onRender: function () {
		this.week.show(new DEF.modules.timeclock.WeekView({
			collection: APP.models.timeclock,
			filter: function (model) {
				return model.get('_.created_by') == U.id;
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
