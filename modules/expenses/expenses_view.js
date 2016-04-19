DEF.modules.expenses.ExpenseLineReadOnly = Backbone.Marionette.ItemView.extend({
	tagName: "tr",
	module: "expenses",
	template: require("./templates/expense_line_ro.html"),
	templateHelpers: function() {
		return {
			line: this.model.collection.indexOf(this.model),
			duration: this.options.duration,
			mileage_rate: this.options.mileage_rate
		};
	},
});

DEF.modules.expenses.views.view = Backbone.Marionette.CompositeView.extend({
	module: "expenses",
	template: require("./templates/view.html"),
	id: 'EXPENSES',
	childView: DEF.modules.expenses.ExpenseLineReadOnly,
	childViewContainer: "#expenses",
	childViewOptions: function() {
		return {
			duration: this.model.get('duration'),
			mileage_rate: this.model.get('mileage_rate')
		};
	},
	filter: function(m) {
		return m.get('total') !== 0;
	},
	ui: {
		"edit": "#edit"
	},
	events: {
		"click @ui.edit": "Edit"
	},
	modelEvents: {
		"change": "render"
	},
	onBeforeRender: function() {
		this.collection = new DEF.modules.expenses.ExpenseCollection(this.model.get('expenses'));

	},
	onShow: function() {
		APP.SetTitle("Expenses " + this.model.get('expense_id'), "expenses");

		this.DrawPie();
	},
	onRender: function() {
		console.log("render");
	},
	Edit: function() {
		APP.Route("#" + this.module + "/" + "edit" + "/" + this.model.id);
	},
	DrawPie: function() {
		var series = [{
			name: 'Expenses',
			data: []
		}];
		var totals = {};
		for (let line of this.model.get('expenses')) {
			if (totals[line.category])
				totals[line.category] += Number(line.total);
			else
				totals[line.category] = Number(line.total);
		}
		Object.keys(totals).forEach(function(cat) {
			if (totals[cat])
				series[0].data.push({
					name: cat,
					y: totals[cat]
				});

		});
		var Highcharts = require('highcharts');
		var chart = Highcharts.chart('chart', {
			chart: {
				type: "pie"
			},
			title: {
				text: ""
			},
			series: series
		});
	}
});
