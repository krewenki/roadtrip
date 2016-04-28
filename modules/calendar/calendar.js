/**
 * Here's how this thing is organized
 *
 * Views:
 * 	- Event
 * 	- Date / Planner
 * 	- Day (Sub of week, month and year)
 * 	- Week
 * 	- Month
 * 	- Year
 */

DEF.modules.calendar = {};
DEF.modules.calendar.Initialize = function () {
	if ( !APP.models.calendar )
		APP.models.calendar = new DEF.modules.calendar.Collection();
};
DEF.modules.calendar.Router = Roadtrip.Router.extend( {
	module: "calendar",
	routes: {
		"calendar": "ShowRoot",
		"calendar/:cmd": "LoadModule",
		"calendar/date/:arg": "LoadDate",
		"calendar/:cmd/:arg": "LoadModule"

	},
	LoadDate: function ( d ) {
		var module = 'calendar';
		var date = new Date( d );
		var offset = date.getTimezoneOffset() * 60 * 1000;

		var collection = APP.models.calendar.getEventsForDate( d );
		APP.Page = new DEF.modules.calendar.MainView( {
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

	DEF.modules.calendar.views.Month = Backbone.Marionette.LayoutView.extend( {
		module: 'calendar',
		template: require( "./templates/calendar.html" ),
		// Ok, this may be a shit way to do this.
		// I'm doing one region per day for the whole calendar.
		regions: {
			"w1d1": ".week_one .sunday",
			"w1d2": ".week_one .monday",
			"w1d3": ".week_one .tuesday",
			"w1d4": ".week_one .wednesday",
			"w1d5": ".week_one .thursday",
			"w1d6": ".week_one .friday",
			"w1d7": ".week_one .saturday",
			"w2d1": ".week_two .sunday",
			"w2d2": ".week_two .monday",
			"w2d3": ".week_two .tuesday",
			"w2d4": ".week_two .wednesday",
			"w2d5": ".week_two .thursday",
			"w2d6": ".week_two .friday",
			"w2d7": ".week_two .saturday",
			"w3d1": ".week_three .sunday",
			"w3d2": ".week_three .monday",
			"w3d3": ".week_three .tuesday",
			"w3d4": ".week_three .wednesday",
			"w3d5": ".week_three .thursday",
			"w3d6": ".week_three .friday",
			"w3d7": ".week_three .saturday",
			"w4d1": ".week_four .sunday",
			"w4d2": ".week_four .monday",
			"w4d3": ".week_four .tuesday",
			"w4d4": ".week_four .wednesday",
			"w4d5": ".week_four .thursday",
			"w4d6": ".week_four .friday",
			"w4d7": ".week_four .saturday",
			"w5d1": ".week_five .sunday",
			"w5d2": ".week_five .monday",
			"w5d3": ".week_five .tuesday",
			"w5d4": ".week_five .wednesday",
			"w5d5": ".week_five .thursday",
			"w5d6": ".week_five .friday",
			"w5d7": ".week_five .saturday",
		},
		initialize: function ( options ) {
			if ( options )
				this.options = options;
			if ( !this.options.date )
				this.options.date = new Date();
		},

		onShow: function () {
			var
				date = 1,
				d;
			var year = this.options.date.getFullYear();
			var month = this.options.date.getMonth();

			var first_day = new Date( year, month, 1 );
			var last_day = new Date( year, month, 0 );
			var stop_week = 0;

			for ( var week = 1; week < 7; week++ ) {
				for ( var day = 1; day < 8; day++ ) {
					if ( week == 1 && day == 1 && first_day.getDay() != 0 ) {
						day = first_day.getDay() + 1;
					}
					if ( date < last_day.getDate() ) {
						d = new Date( year, month, date );
						this.showChildView( 'w' + week + 'd' + day, new DEF.modules.calendar.views.Day( {
							date: new Date( year, month, date ),
							collection: APP.models.calendar.getEventsForDate( d.toISOString()
								.slice( 0, 10 ) )
						} ) )
					} else {
						stop_week = stop_week == 0 ? week : stop_week;
					}
					date++;
				}
				if ( stop_week < 6 ) {
					$( '.week_six' )
						.hide();
				}
			}
		}

	} )

DEF.modules.calendar.views.minicalendar = DEF.modules.calendar.views.Month.extend( {


} )

DEF.modules.calendar.views.eventlistitem = Roadtrip.View.extend( {
	module: 'calendar',
	template: require( './templates/eventlistitem.html' ),
	tagName: 'tr',
	events: {
		"click .fa-pencil": "handleClick"
	},
	attributes: function () {
		var self = this;
		return {
			"data-id": self.model.id
		};
	},
	handleClick: function ( e ) {
		var page = new DEF.modules.calendar.views.edit( {
			model: this.model
		} );
		APP.root.showChildView( 'main', page );
	}
} )

DEF.modules.calendar.views.eventlist = Backbone.Marionette.CompositeView.extend( {
	module: 'calendar',
	template: require( './templates/eventlist.html' ),
	childView: DEF.modules.calendar.views.eventlistitem,
	childViewContainer: 'tbody',
	emptyView: DEF.EmptyView,
	emptyViewOptions: {
		icon: "warning",
		msg: "There are no events on this date"
	}

} )



/**
 * The MainView.  HAS to be called MainView.  This is where this module begins
 */

DEF.modules.calendar.MainView = Backbone.Marionette.LayoutView.extend( {
	template: require( "./templates/date.html" ),
	id: 'CALENDAR',
	ui: {
		add: "#add"
	},
	events: {
		"click @ui.add": "Add"
	},
	regions: {
		"miniCalendar": "#minicalendar",
		"eventlist": ".rightbox"
	},
	initialize: function ( options ) {
		if ( !options.date )
			this.options.date = new Date();
	},
	onShow: function () {
		this.getRegion( 'miniCalendar' )
			.show( new DEF.modules.calendar.views.minicalendar() );
		this.getRegion( 'eventlist' )
			.show( new DEF.modules.calendar.views.eventlist( {
				collection: APP.models.calendar.getEventsForDate( this.options.date.toISOString()
					.slice( 0, 10 ) )

			} ) );
	},
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
	},
	Add: function () {
		var model = APP.models.calendar.create( {
			title: 'New Event',
			_: {
				created_by: U.id,
				created_on: Date.now()
			}
		} );
		var page = new DEF.modules.calendar.views.edit( {
			model: model
		} );
		APP.root.showChildView( 'main', page );
	}
} );
