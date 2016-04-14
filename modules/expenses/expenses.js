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
		APP.Icon_Lookup["mileage"] = "road";
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
	idAttribute: 'expense_id',
	module: "expenses",
	search_string: function() {
		return false
	},
	defaults: {
		expense_id: false,
		purpose: "",
		state: "New", // submitted, approved, completed
		kind: "fieldservice",
		order: false, // aka Order Line item?
		approved_by: false,
		start_date: false,
		total: 0,
		paid_by_employer: 0,
		paid_by_employee: 0,
		duration: 5, // in days
		mileage_rate: 0.575,
		expenses: []
	},
	GetID: function() {
		if (this.id)
			return this.id; // the ID has  already been generated
		return APP.Tools.Aggregate(APP.models.expenses, "expense_id", "max") + 1;
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


DEF.modules.expenses.views = {}
require("./expenses_edit.js");
require("./expenses_view.js");

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

});
