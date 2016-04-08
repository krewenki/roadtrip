DEF.modules.expenses = {}
DEF.modules.expenses.Router = Roadtrip.Router.extend({
	module: "expenses",
	collections: [
		"users", "expenses", "orders"
	],
	initialize: function() {
		APP.models.expenses = new DEF.modules.expenses.Collection();

		APP.Icon_Lookup["car"] = "car";
		APP.Icon_Lookup["cab"] = "cab";
		APP.Icon_Lookup["plane"] = "plane";
		APP.Icon_Lookup["train"] = "train";
		APP.Icon_Lookup["hotel"] = "bed";
		APP.Icon_Lookup["food"] = "cutlery";
		APP.Icon_Lookup["baggage"] = "suitcase";
		APP.Icon_Lookup["cash"] = "money";
		APP.Icon_Lookup["delivery"] = "truck";
		APP.Icon_Lookup["education"] = "graduation-cap";
		APP.Icon_Lookup["tools"] = "wrench";
		APP.Icon_Lookup["fuel"] = "battery-full";
		APP.Icon_Lookup["misc"] = "ellipsis-h";
		APP.Icon_Lookup["boat"] = "ship";
		APP.Icon_Lookup["misc"] = "ellipsis-h";
		APP.Icon_Lookup["subway"] = "subway";
		APP.Icon_Lookup["toll"] = "dollar";
		APP.Icon_Lookup["equipment"] = "binoculars";
		APP.Icon_Lookup["service"] = "sitemap";


	},
	routes: {
		"expenses": "ShowRoot",
		"expenses/:cmd": "LoadModule",
		"expenses/:cmd/:arg": "LoadModule",
	},
});
DEF.modules.expenses.Model = Roadtrip.Model.extend({
	nameAttribute: 'expense_id', // the human-readable field in the record
	module: "expenses",
	search_string: function() {
		return false
	},
	defaults: {
		expense_id: 1,
		purpose: "",
		state: "New", // submitted, approved, completed
		kind: "fieldservice",
		job: false, // aka Order Line item?
		approved_by: false,
		start_date: false,
		total: 0,
		paid_by_employer: 0,
		paid_by_employee: 0,
		duration: 5, // in days
		expenses: []
	}
});
DEF.modules.expenses.Collection = Backbone.Highway.Collection.extend({
	model: DEF.modules.expenses.Model,
	url: 'dev.telegauge.com:3000/roadtrip/expenses',
});


DEF.modules.expenses.Expense = Roadtrip.Model.extend({
	defaults: {
		day: 0,
		kind: "meals"
	}
})
DEF.modules.expenses.ExpenseCollection = Backbone.Collection.extend({
	model: DEF.modules.expenses.Expense,
})

DEF.modules.expenses.ExpenseLineReadOnly = Backbone.Marionette.ItemView.extend({
	tagName: "tr",
	module: "expenses",
	template: require("./templates/expense_line_ro.html"),
	templateHelpers: function() {
		return {
			line: this.model.collection.indexOf(this.model),
			duration: this.options.duration,
		}
	},
})
DEF.modules.expenses.ExpenseLine = Backbone.Marionette.ItemView.extend({
	tagName: "tr",
	module: "expenses",
	template: require("./templates/expense_line.html"),
	templateHelpers: function() {
		return {
			line: this.model.collection.indexOf(this.model),
			duration: this.options.duration,
		}
	},
	ui: {
		"sum": ".sum_me",
		"resum": ".resum",
		"total_field": "#total_field",
		"employer_field": "#employer_field",
		"total": "#total",
		"category": "#category",
		"category_icon": "#category_icon",
		"field": ".expense_field",
		"employer": "#paid_by_employer",
		"employee": "#paid_by_employee",
	},
	events: {
		"keyup @ui.sum": "Sum",
		"keyup @ui.resum": "Sum",
		"click @ui.sum": "Sum",
		"click @ui.resum": "Sum",
		"change @ui.category": "ChangeCategory",
		"change @ui.field": "MakeDirty",
		"keyup @ui.field": "MakeDirty",
	},
	Sum: function() {
		total = 0
		this.ui.sum.each(function(i, el) {
			total += Number(el.value)
		})
		this.ui.total.val(total);
		this.ui.total_field.html(APP.Format.money(total));
		this.ui.employer.val(total - this.ui.employee.val())
		this.ui.employer_field.html(APP.Format.money(this.ui.employer.val()))
		this.trigger("sum"); // tell the parent
	},
	ChangeCategory: function() {
		this.ui.category_icon.html(APP.Icon(this.ui.category.val()))
	},
	MakeDirty: function(e) {
		$(e.currentTarget).addClass("dirty");
	},

})

DEF.modules.expenses.views = {
	edit: Backbone.Marionette.CompositeView.extend({
		module: "expenses",
		template: require("./templates/edit.html"),
		id: 'EXPENSES',
		childView: DEF.modules.expenses.ExpenseLine,
		childViewContainer: "#expenses",
		childViewOptions: function() {
			return {
				duration: this.model.get('duration')
			}
		},
		ui: {
			"add": "#add",
			"field": ".field",
			"save": "#save",
			"cancel": "#cancel",
			"delete": "#delete",
			"start_date": "#start_date",
			"duration": "#duration"
		},
		events: {
			"click @ui.add": "AddLine",
			"change @ui.field": "MakeDirty",
			"click @ui.save": "Save",
			"click @ui.cancel": "Cancel",
			"click @ui.delete": "Delete",
			"change @ui.start_date": "UpdateDates",
			"change @ui.duration": "UpdateDays"
		},
		childEvents: {
			"sum": "Sum",
		},
		onBeforeRender: function() {
			if (!this.model) { // create a new model, if needed
				this.model = new DEF.modules[this.module].Model({})
			}

			var expenses = this.model.get('expenses');
			if (expenses.length == 0) {
				cats = ["plane", "hotel", "food", "food", "misc"]
				for (var i = 0; i < cats.length; i++) {
					var rec = this.GetEmptyRecord(cats[i]);
					expenses.push(rec)
				}
			}
			this.collection = new DEF.modules.expenses.ExpenseCollection(expenses);
		},
		GetEmptyRecord: function(cat = "misc") {
			return {
				category: cat,
				total: 0,
				paid_by_employee: 0,
				paid_by_employer: 0,
				days: Array.apply(null, Array(this.model.get('duration') | 0)).map(Number.prototype.valueOf, 0) // generate an array of 0's
			};
		},
		onShow: function() {
			this.Sum();
			APP.SetTitle("Expenses " + this.model.get('expense_id'), "expenses");
		},
		templateHelpers: function() {
			var rs = {
				expense_id: this.GenerateExpenseID()
			}
			return rs;
		},
		GenerateExpenseID: function() {
			if (this.model.id) // this model has been saved
				return this.model.get('expense_id'); // so do not generate a task_id
			var instance = 0;
			var models = APP.models.expenses.where()
			for (var m in models) {
				var model = models[m];
				var expense_id = model.get('expense_id');
				instance = Math.max(instance, expense_id)
			}
			instance++;
			return instance
		},
		MakeDirty: function(e) {
			if (e.currentTarget.value == this.model.get(e.currentTarget.id))
				$(e.currentTarget).removeClass("dirty");
			else
				$(e.currentTarget).addClass("dirty");
		},
		Save: function(e) {
			var model = this.model,
				save = {};
			$(".field.dirty").each(function(i, $el) {
				var val = $el.value;
				save[$el.id] = val;
			})

			var expenses = model.get('expenses');
			for (let el of $(".expense_field")) {
				var day = $(el).data('day'),
					line = $(el).data('line');
				if (!expenses[line])
					expenses[line] = {
						category: $(".categories[data-line=" + line + "]").val(),
						days: [],
						paid_by_employee: 0
					}
				if ($(el).hasClass("sum_me")) {
					if (!expenses[line].days[day])
						expenses[line].days[day] = {}
					expenses[line].days[day] = Number($(el).val())
				} else {
					expenses[line][el.id] = el.value
				}
			}
			// note, the "expenses" object is a reference to the raw data, so no .save is necessary
			save.total = APP.Format.pure($("#total_total").html());
			save.paid_by_employer = APP.Format.pure($("#total_employer").html());
			save.paid_by_employee = APP.Format.pure($("#total_employee").html());

			if (!this.model.id) {
				save["_"] = {
					created_by: U.id,
					created_on: Date.now()
				}
				return APP.models[this.module].create(save, {
					success: function(model) {
						APP.Route("#expenses/view/" + model._id)
					}.bind(this)
				});
			} else {
				console.log("save", save);
				this.model.set(save);
				this.model.SetStats("edit")
					// APP.LogEvent(this.module, this.model.id, "Edited " + Object.keys(save).join(", "), {
					// 	old: orig,
					// 	new: save
					// });
				APP.Route("#expenses/view/" + this.model.get('_id'))
			}
		},
		Sum: function() {
			var sum = {
				days: []
			}
			for (let el of $(".expense_field")) {
				switch (el.id) {
					case "total":
					case "paid_by_employee":
					case "paid_by_employer":
						if (!sum[el.id])
							sum[el.id] = 0;
						sum[el.id] += Number($(el).val())
						break;
					default:
						if ($(el).hasClass("sum_me")) {
							var day = $(el).data('day');
							if (!sum.days[day])
								sum.days[day] = 0;
							sum.days[day] += Number($(el).val());
						}

				}
			}
			$("#total_total").html(APP.Format.money(sum.total))
			$("#total_employer").html(APP.Format.money(sum.paid_by_employer))
			$("#total_employee").html(APP.Format.money(sum.paid_by_employee))
			for (var d = 0; d < sum.days.length; d++) {
				$("#total_" + (d + 1)).html(APP.Format.money(sum.days[d]))
			}
		},
		AddLine: function() {
			this.collection.push(this.GetEmptyRecord())
		},
		Cancel: function(e) {
			APP.Route("#" + this.module + "/" + "view" + "/" + this.model.id);
		},
		Delete: function(e) {
			if (prompt("Are you sure?")) {
				APP.models[this.module].remove(this.model);
				APP.Route("#" + this.module);
			}
		},
		UpdateDates: function() {
			this.model.set({
				start_date: this.ui.start_date.val()
			});

			var start = this.ui.start_date.val() + " 12:00:00" // account for timezone offset, i guess.  it's stupid.
			$(".header_dates").each(function(d, el) {
				$(el).html(APP.Format.date(new Date(start).getTime() + 1000 * 3600 * 24 * d))
			})
		},
		UpdateDays: function() {
			this.model.set({
				duration: this.ui.duration.val()
			});
			this.render(); // might be slightlybetter to just re-render the colleciton

		}

	}),
	view: Backbone.Marionette.CompositeView.extend({
		module: "expenses",
		template: require("./templates/view.html"),
		id: 'EXPENSES',
		childView: DEF.modules.expenses.ExpenseLineReadOnly,
		childViewContainer: "#expenses",
		childViewOptions: function() {
			return {
				duration: this.model.get('duration')
			}
		},
		filter: function(m) {
			return m.get('total') != 0;
		},
		ui: {
			"edit": "#edit"
		},
		events: {
			"click @ui.edit": "Edit"
		},
		onBeforeRender: function() {
			this.collection = new DEF.modules.expenses.ExpenseCollection(this.model.get('expenses'));

		},
		onShow: function() {
			APP.SetTitle("Expenses " + this.model.get('expense_id'), "expenses");

			this.DrawPie();
		},
		Edit: function() {
			APP.Route("#" + this.module + "/" + "edit" + "/" + this.model.id);
		},
		DrawPie: function() {
			var series = [{
				name: 'Expenses',
				data: []
			}]
			var totals = {}
			for (let line of this.model.get('expenses')) {
				if (totals[line.category])
					totals[line.category] += Number(line.total)
				else
					totals[line.category] = Number(line.total)
			}
			Object.keys(totals).forEach(function(cat) {
				if (totals[cat])
					series[0].data.push({
						name: cat,
						y: totals[cat]
					})

			})
			var Highcharts = require('highcharts');
			var chart = Highcharts.chart('chart', {
				chart: {
					type: "pie"
				},
				title: {
					text: ""
				},
				series: series
			})
		}
	})
}
DEF.modules.expenses.RecordLine = Roadtrip.RecordLine.extend({
	tagName: "tr",
	module: "expenses",
	template: require("./templates/line.html"),
	events: {
		"click": "Click"
	},
});

DEF.modules.expenses.MainView = Roadtrip.RecordList.extend({
	template: require("./templates/main.html"),
	childView: DEF.modules.expenses.RecordLine,
	childViewContainer: "#list",
	ui: {
		add: "#add"
	},
	events: {
		"click @ui.add": "Add"
	},
	onShow: function() {
		APP.SetTitle("Expenses", "expenses");

	},
	Add: function() {
		var page = new DEF.modules.expenses.views.edit({
			model: false,
		});
		APP.root.showChildView('main', page);
	}

})
