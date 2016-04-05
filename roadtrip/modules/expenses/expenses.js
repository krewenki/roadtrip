DEF.modules.expenses = {}
DEF.modules.expenses.Router = Roadtrip.Router.extend( {
	module: "expenses",
	collections: [
		"users", "expenses", "orders"
	],
	initialize: function() {
		APP.models.expenses = new DEF.modules.expenses.Collection();

		APP.Icon_Lookup[ "car" ] = "car";
		APP.Icon_Lookup[ "cab" ] = "cab";
		APP.Icon_Lookup[ "plane" ] = "plane";
		APP.Icon_Lookup[ "train" ] = "train";
		APP.Icon_Lookup[ "hotel" ] = "bed";
		APP.Icon_Lookup[ "meals" ] = "cutlery";
		APP.Icon_Lookup[ "baggage" ] = "suitcase";
		APP.Icon_Lookup[ "cash" ] = "money";
		APP.Icon_Lookup[ "delivery" ] = "truck";
		APP.Icon_Lookup[ "education" ] = "graduation-cap";
		APP.Icon_Lookup[ "tools" ] = "wrench";
		APP.Icon_Lookup[ "fuel" ] = "battery-full";


	},
	routes: {
		"expenses": "ShowRoot",
		"expenses/:cmd": "LoadModule",
		"expenses/:cmd/:arg": "LoadModule",
	},
} );
DEF.modules.expenses.Model = Roadtrip.Model.extend( {
	nameAttribute: 'name', // the human-readable field in the record
	module: "expenses",
	search_string: function() {
		return false
	},
	defaults: {
		expense_id: 1,
		state: "New", // submitted, approved, completed
		job: false, // aka Order Line item?
		approved_by: false,
		start_date: false,
		duration: 5, // in days
		expenses: {}
	}
} );
DEF.modules.expenses.Collection = Backbone.Highway.Collection.extend( {
	model: DEF.modules.expenses.Model,
	url: 'dev.telegauge.com:3000/roadtrip/expenses',
} );


DEF.modules.expenses.Expense = Roadtrip.Model.extend( {
	defaults: {
		day: 0,
		kind: "meals"
	}
} )
DEF.modules.expenses.ExpenseCollection = Backbone.Collection.extend( {
	model: DEF.modules.expenses.Expense,
} )


DEF.modules.expenses.views = {
	edit: Roadtrip.Edit.extend( {
		module: "expenses",
		template: require( "./templates/edit.html" ),
		id: 'EXPENSES',
		childView: DEF.modules.expenses.ExpenseList,
		childViewContainer: "#expenses",
		onBeforeRender: function() {
			if ( !this.model ) {
				this.model = new DEF.modules[ this.module ].Model( {} )
			}
			console.log( this.model );

			// this.collection = new DEF.modules.expenses.ExpenseCollection();
			// for (var i = 0; i< 3; i++) {
			// 	this.collection.push(new DEF.modules.expenses.Expense({
			// 		day: i,
			// 		kind: "meal"
			// 	}))
			// }
			// console.log(this.collection);

		},

		templateHelpers: function() {
			var rs = {
				expense_id: this.GenerateTaskID()
			}
			return rs;
		},
		GenerateTaskID: function() {
			if ( this.model.id ) // this model has been saved
				return this.model.get( 'expense_id' ); // so do not generate a task_id
			var instance = 0;
			var models = APP.models.expenses.where()
			for ( var m in models ) {
				var model = models[ m ];
				var expense_id = model.get( 'expense_id' );
				instance = Math.max( instance, expense_id )
			}
			instance++;
			return instance
		}
	} ),
	/**
	 * View a plain, read-only single record
	 */
	view: Roadtrip.View.extend( {
		module: "expenses",
		template: require( "./templates/view.html" ),
	} )
}
DEF.modules.expenses.ExpenseLine = Roadtrip.RecordLine.extend( {
	tagName: "tr",
	module: "expenses",
	template: require( "./templates/expense_line.html" )
} )
DEF.modules.expenses.ExpenseList = Roadtrip.RecordList.extend( {
	childView: DEF.modules.expenses.RecordLine,
	childViewContainer: "#expenses",

} )

DEF.modules.expenses.RecordLine = Roadtrip.RecordLine.extend( {
	tagName: "tr",
	module: "expenses",
	template: require( "./templates/line.html" ),
	events: {
		"click": "Click"
	},
} );

DEF.modules.expenses.MainView = Roadtrip.RecordList.extend( {
	template: require( "./templates/main.html" ),
	childView: DEF.modules.expenses.RecordLine,
	childViewContainer: "#list",
	ui: {
		add: "#add"
	},
	events: {
		"click @ui.add": "Add"
	},
	Add: function() {
		var page = new DEF.modules.expenses.views.edit( {
			model: false,
		} );
		APP.root.showChildView( 'main', page );
	}

} )
