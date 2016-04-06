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

	},
	routes: {
		"expenses": "ShowRoot",
		"expenses/:cmd": "LoadModule",
		"expenses/:cmd/:arg": "LoadModule",
	},
});
DEF.modules.expenses.Model = Roadtrip.Model.extend({
	nameAttribute: 'name', // the human-readable field in the record
	module: "expenses",
	search_string: function() {
		return false
	},
	defaults: {
		expense_id: 1,
		purpose: "",
		state: "New", // submitted, approved, completed
		job: false, // aka Order Line item?
		approved_by: false,
		start_date: false,
		total_expense: 0,
		paid_by_employer: 0,
		paid_by_employee: 0,
		duration: 5, // in days
		expenses: {}
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

DEF.modules.expenses.ExpenseLine = Backbone.Marionette.ItemView.extend({
	tagName: "tr",
	module: "expenses",
	template: require("./templates/expense_line.html"),
	template_helpers: function() {
		return {
			model: this.model
		}
	},
	ui: {
		"sum": ".sum_this",
		"total": "#total",
		"category": "#category",
		"category_icon": "#category_icon"
	},
	events: {
		"keyup @ui.sum": "Sum",
		"click @ui.sum": "Sum",
		"change @ui.category": "ChangeCat"
	},
	Sum: function() {
		total = 0
		this.ui.sum.each(function(i, el) {
			total += Number(el.value)
		})
		this.ui.total.html(APP.Format.money(total));
	},
	ChangeCat: function() {
		this.ui.category_icon.html(APP.Icon(this.ui.category.val()))
	}

})

DEF.modules.expenses.views = {
	edit: Backbone.Marionette.CompositeView.extend({
		module: "expenses",
		template: require("./templates/edit.html"),
		id: 'EXPENSES',
		childView: DEF.modules.expenses.ExpenseLine,
		childViewContainer: "#expenses",
		ui: {
			"field": ".field",
			"save": "#save",
			"cancel": "#cancel",
			"delete": "#delete"
		},
		events: {
			"change @ui.field": "MakeDirty",
			"click @ui.save": "Save",
			"click @ui.cancel": "Cancel",
			"click @ui.delete": "Delete"
		},
		onBeforeRender: function() {
			if (!this.model) { // create a new model, if needed
				this.model = new DEF.modules[this.module].Model({})
			}

			this.collection = new DEF.modules.expenses.ExpenseCollection();
			cats = ["plane", "hotel", "food", "food", "misc"]
			for (var i = 0; i < cats.length; i++) {
				var rec = {
					day: i,
					category: cats[i],
					total: 0,
					paid_by_employee: 0,
					paid_by_employer: 0,
					expenses: Array.apply(null, Array(this.model.get('duration') | 0)).map(Number.prototype.valueOf, 0)
				};
				console.log(rec);
				this.collection.push(new DEF.modules.expenses.Expense(rec))
			}

		},

		templateHelpers: function() {
			var rs = {
				expense_id: this.GenerateTaskID()
			}
			return rs;
		},
		GenerateTaskID: function() {
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
			if (!this.model.id) {
				save["_"] = {
					created_by: U._id,
					created_on: Date.now()
				}
				return APP.models[this.module].create(save, {
					success: function(model) {
						APP.Route("#expenses/view/" + model._id)
					}.bind(this)
				});
			} else {
				this.model.set(save);
				this.model.SetStats("edit")
				APP.Route("#expenses/view/" + this.model.get('_id'))
			}
		},
		Cancel: function(e) {
			this.Return();
		},
		Delete: function(e) {
			APP.models[this.module].remove(this.model);
			this.Return(true);
		}
	}),
	/**
	 * View a plain, read-only single record
	 */
	view: Roadtrip.View.extend({
		module: "expenses",
		template: require("./templates/view.html"),
	})
}
DEF.modules.expenses.ExpenseList = Roadtrip.RecordList.extend({
	childView: DEF.modules.expenses.RecordLine,
	childViewContainer: "#expenses",

})

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
	Add: function() {
		var page = new DEF.modules.expenses.views.edit({
			model: false,
		});
		APP.root.showChildView('main', page);
	}

})
