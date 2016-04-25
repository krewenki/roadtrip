DEF.modules.calendar = {};
DEF.modules.calendar.Initialize = function () {
	if ( !APP.models.calendar )
		APP.models.calendar = new DEF.modules.calendar.Collection();
};
DEF.modules.calendar.Router = Roadtrip.Router.extend( {
	module: "calendar",
	routes: {
		"calendar": "ShowRoot",
		"calendar/date/:arg": "LoadDate",
		"calendar/:cmd": "LoadModule",
		"calendar/:cmd/:arg": "LoadModule"

	},
	LoadDate: function ( d ) {
		var module = this.module;
		var date = new Date( d );
		var offset = date.getTimezoneOffset() * 60 * 1000;

		var collection = APP.models.calendar.getEventsForDate( d );
		APP.Page = new DEF.modules.calendar.views[ 'date' ]( {
			collection: collection,
			date: new Date( date.getTime() + offset )
		} );
		APP.root.showChildView( "main", APP.Page );
	}
} )

/**
 * The main model.  SHould be called "Model"
 */
DEF.modules.calendar.Model = Roadtrip.Model.extend( {
	idAttribute: '_id',
	nameAttribute: 'title', // the human-readable field in the record
	module: "calendar",
	defaults: {
		title: 'New Event',
		startLocal: new Date()
			.toISOString()
			.slice( 0, 10 ) + 'T09:00',
		endLocal: new Date()
			.toISOString()
			.slice( 0, 10 ) + 'T11:00',
		start: new Date()
			.getTime(),
		end: new Date()
			.getTime(),
		location: '',
		allDay: false,
		attendees: [],
		notes: ''
	},
} );

/**
 * The main collection.  MUST be called "Collection"
 */
DEF.modules.calendar.Collection = Roadtrip.Collection.extend( {
	model: DEF.modules.calendar.Model,
	url: 'roadtrip.telegauge.com/roadtrip/calendar',
	getEventsForDate: function ( date ) {
		var d = new Date( date );
		var offset = d.getTimezoneOffset() * 60 * 1000;
		var iso = d
			.getTime();
		var collection = new Backbone.Collection( this.filter( function ( c ) {
			var start = c.get( 'start' );
			var startDate = new Date( start )
				.toISOString()
				.slice( 0, 10 )
			var end = c.get( 'end' );
			var endDate = new Date( end )
				.toISOString()
				.slice( 0, 10 );
			var isoDate = new Date( iso + offset )
				.toISOString()
				.slice( 0, 10 );
			return ( start <= iso && iso <= end ) || ( startDate == isoDate ) || endDate == isoDate;
		} ) )
		return collection;
	}

} );
/**
 * A list of commands, automatically tied to the $cmd in  #module/$cmd/$id.  See DoView
 */
DEF.modules.calendar.views = {
	/**
	 * Edit a calendar
	 */
	edit: Roadtrip.Edit.extend( {
		module: "calendar",
		template: require( "./templates/edit.html" ),
		modelEvents: {
			"change": "setDates"
		},
		setDates: function () {
			var start = new Date( this.model.get( 'startLocal' )
					.replace( 'T', ' ' ) )
				.getTime();
			var end = new Date( this.model.get( 'endLocal' )
					.replace( 'T', ' ' ) )
				.getTime();
			this.model.set( {
				start: start,
				end: end
			} );
		}
	} ),

	Event: Roadtrip.View.extend( {
		module: "calendar",
		template: require( "./templates/event.html" ),
		initialize: function ( o ) {
			console.log( arguments );
		},
		attributes: function () {
			var classes = [ 'calendar_event' ];
			var start = new Date( this.model.get( 'start' ) )
				.toISOString()
				.slice( 0, 10 );
			var end = new Date( this.model.get( 'end' ) )
				.toISOString()
				.slice( 0, 10 );
			if ( start == this.options.date )
				classes.push( 'start' );
			if ( end == this.options.date )
				classes.push( 'end' );
			return {
				"data-id": this.model.id,
				"data-start": this.model.get( 'start' ),
				"data-end": this.model.get( 'end' ),
				"class": classes.join( ' ' )
			}
		},
		events: {
			"click": "handleClick"
		},
		handleClick: function () {
			APP.Route( "#calendar/view/" + this.model.id, "calendar" );
		}
	} ),

	detailed_event: Roadtrip.View.extend( {
		module: "calendar",
		template: require( "./templates/detailed_event.html" ),
		className: 'detailed_event',
		attributes: function () {
			return {
				"data-id": this.model.id,
				"data-start": this.model.get( 'start' ),
				"data-end": this.model.get( 'end' )
			}
		},
		events: {
			"click": "handleClick"
		},
		handleClick: function () {
			APP.Route( "#calendar/view/" + this.model.id, "calendar" );
		}
	} ),

	/**
	 * View a plain, read-only single record
	 */
	view: Roadtrip.View.extend( {
		module: "calendar",
		template: require( "./templates/view.html" ),
		ui: {
			edit: "#edit",
			delete: "#delete"
		},
		events: {
			"click @ui.edit": "Edit",
			"click @ui.delete": "Delete"
		},
		Edit: function () {
			APP.Route( "#calendar/" + "edit" + "/" + this.model.id );
		},
		Delete: function () {
			if ( confirm( "Are you sure you want to delete " + this.model.get( this.model.nameAttribute ) ) ) {
				console.log( "kill it" );
				APP.models.calendar.remove( this.model );
				APP.Route( "#calendar", "calendar" );
			}
		}
	} )
}

DEF.modules.calendar.views.Day = Backbone.Marionette.CompositeView.extend( {
		module: "calendar",
		template: require( './templates/day.html' ),
		childView: DEF.modules.calendar.views.Event,
		initialize: function ( options ) {
			this.options = options
		},
		templateHelpers: function () {
			var self = this;
			return {
				date: function () {
					return self.options.date.getDate()
				}
			};
		},
		childViewOptions: function () {
			var self = this;
			return {
				date: self.options.date.toISOString()
					.slice( 0, 10 )
			}
		}
	} ),

	DEF.modules.calendar.views.Week = Backbone.Marionette.LayoutView.extend( {
		template: require( './templates/week.html' ),
		regions: {
			sunday: ".sunday",
			monday: ".monday",
			tuesday: ".tuesday",
			wednesday: ".wednesday",
			thursday: ".thursday",
			friday: ".friday",
			saturday: ".saturday"
		},
		tagName: 'tr',
		el: '#CALENDAR table tbody',
		initialize: function ( options ) {
			var startDate = new Date();
			this.sunday = startDate.getDay() == 0 ? startDate : startDate - ( startDate.getDay() * ( 60 * 60 * 24 * 1000 ) );
			this.render()
		},
		onRender: function () {
			var days = [ 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday' ];
			var date, collection;
			for ( var i in days ) {
				date = new Date( this.sunday + ( 86400000 * i ) );
				collection = APP.models.calendar.getEventsForDate( date.toISOString()
					.slice( 0, 10 ) )
				this.showChildView( days[ i ], new DEF.modules.calendar.views.Day( {
					date: date,
					collection: collection
				} ) )
			}
		}
	} )

DEF.modules.calendar.views.date = Backbone.Marionette.LayoutView.extend( {
	template: require( "./templates/date.html" ),
	templateHelpers: function () {
		var self = this;
		return {
			dayName: function () {
				var weekday = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];
				return weekday[ self.options.date.getDay() ];
			},
			date: function () {
				return self.options.date.getDate();
			},
			year: function () {
				return self.options.date.getFullYear();
			},
			monthName: function () {
				var month = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]
				return month[ self.options.date.getMonth() ]
			}
		};
	}
} )

/**
 * The MainView.  HAS to be called MainView.  This is where this module begins
 */

DEF.modules.calendar.MainView = Roadtrip.MainView.extend( {
	template: require( "./templates/calendar.html" ),
	id: 'CALENDAR',
	ui: {
		search: "#search",
		add: "#add"
	},
	events: {
		"keyup @ui.search": "Search",
		"click @ui.add": "Add"
	},
	onShow: function () {
		this.weekView = new DEF.modules.calendar.views.Week();
	},
	Add: function () {
		var page = new DEF.modules.calendar.views.edit( {
			model: APP.models.calendar.create( {
				title: 'New Event',
				_: {
					created_by: U.id,
					created_on: Date.now()
				}
			} )
		} );
		APP.root.showChildView( 'main', page );
	}
} );
