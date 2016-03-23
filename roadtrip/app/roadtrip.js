/**
 * Project-wide prototypes for convenience.
 * 
 */
window.Roadtrip = {
	Collection: Backbone.Highway.Collection.extend({
		perpage: 100,
		page: 1,
		comparator: function (m) {
			//var sort = ('00000' + (m.get('views') + m.get('edits'))).substr(-5) + m.get('name');
			var sort = (m.get('views') + m.get('edits'));
			return -sort
		}
	}),
	Model: Backbone.Model.extend({
		idAttribute: '_id',
		defaults: {},
		search_string: function () {
			var string = JSON.stringify(this.attributes);
			return string.toUpperCase();
		}
	}),
	MainView: Backbone.Marionette.LayoutView.extend({
		icons: {},
		collections: {},
		regions: {
			menu: "#menu",
			list: "#record_list"
		},
		Icon: function (icon) {
			return APP.Icon(this.icons[icon]);
		},
		childEvents: {
			'main:list': 'ListRecords',
		},
		ui: {
			add: "#add",
			search: "#search",
			filter: "#filter",
			submenu: "#submenu",
			filterfield: ".filter_field",
		},
		events: {
			"click @ui.add": "Add",
			"click @ui.list": "ListRecords",
			"keyup @ui.search": "Search",
			"click @ui.filter": "ToggleFilterView",
			"change @ui.filterfield": "ListRecords"
		},
		initialize: function () {
			//			var collections = Object.keys(this.collections);
			//			for (var c = 0; c < collections.length; c++) {
			//				var collection = collections[c];
			//				if (!APP.models[collection]) {
			//					APP.models[collection] = new collection();
			//					console.log("New collection: " + collection);
			//				}
			//			}		
		},
		onRender: function () {
			APP.SetMode(this.id.toLocaleLowerCase());
			this.Command(this.options.cmd, this.options.arg);
		},

		/**
		 * 
		 * Show a collection based $cmd in  #module/$cmd/$id
		 */
		Command: function (cmd, id) {
			var mode = this.id.toLocaleLowerCase();
			switch (cmd) {
			case 'edit':
			case 'view':
				this.view = new DEF.modules[mode].cmds[cmd]({
					model: APP.models[mode].get(id),
				});
				this.showChildView('list', this.view);
				break;
			case 'list':
			default:
				this.ListRecords();
			}
		},
		Add: function () {
			var mode = this.id.toLocaleLowerCase();
			console.log(mode);
			var page = new DEF.modules[mode].cmds.edit({
				model: false,
			});
			this.showChildView('list', page);
		},
		Search: function (e) {
			this.ListRecords(); // .setFilter does not yet exist.  this is a crappy way to do it.
		},
		ListRecords: function () {
			var mode = this.id.toLocaleLowerCase();
			var where = {
				search: this.ui.search.val(),
				fields: {}
			}
			this.ui.filterfield.each(function (i, el) {
				if (el.value && el.value != 'all')
					where.fields[el.id] = el.value
			})

			this.view = new DEF.modules[mode].RecordList({
				collection: APP.models[mode],
				filter: function (m, i, c) {
					var fields = Object.keys(where.fields);
					for (var f = 0; f < fields.length; f++) {
						var id = fields[f],
							val = where.fields[id];
						if (m.get(id) != val)
							return false;
					}

					var string = m.search_string()
					if (string.indexOf(where.search.toUpperCase()) == -1)
						return false;
					return true;
				},
			});
			this.showChildView('list', this.view);
			APP.Route("#" + mode, false); // re-route, in case they searched from some other view
		},
		ToggleFilterView: function (e) {
			if ($(e.currentTarget).hasClass('toggled')) {
				this.ui.submenu.slideUp();
				$(e.currentTarget).removeClass('toggled')
			} else {
				this.ui.submenu.slideDown();
				$(e.currentTarget).addClass('toggled');

			}
		},
	}),

	View: Backbone.Marionette.ItemView.extend({
		tagName: "table",
		className: "table table-full table-left",
		onShow: function () {
			this.model.set('views', this.model.get('views') + 1);
		}
	}),
	Edit: Backbone.Marionette.ItemView.extend({
		tagName: "table",
		className: "table table-full table-left",
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
		onBeforeRender: function () {
			if (!this.model) {
				this.model = new DEF.modules[this.module].Model({})
			}
		},
		MakeDirty: function (e) {
			if (e.currentTarget.value == this.model.get(e.currentTarget.id))
				$(e.currentTarget).removeClass("dirty");
			else
				$(e.currentTarget).addClass("dirty");
		},
		Save: function (e) {
			var model = this.model;
			$(".field.dirty").each(function (i, $el) {
				console.log($el.id, $el.value)
				model.set($el.id, $el.value);
			})
			if (!this.model.id)
				APP.models[this.module].create(model);
			else
				this.model.set('edits', this.model.get('edits') + 1);
			this.triggerMethod('main:list');
		},
		Cancel: function (e) {
			this.triggerMethod('main:list');
		},
		Delete: function (e) {
			APP.models[this.module].remove(this.model);
			this.triggerMethod('main:list');
		}
	}),
	RecordLine: Backbone.Marionette.ItemView.extend({
		tagName: 'tr',
		className: 'click hover',
		ui: {
			cmd: ".cmd"
		},
		modelEvents: {
			"change": "render"
		},
		events: {
			"click @ui.cmd": "DoCommand",
			"click": "View"
		},
		View: function () {
			this.DoCommand('view')
		},
		clickCmd: function (e) {
			this.DoCommand(e.currentTarget.id);
		},
		DoCommand(cmd) {
			APP.Route("#" + (this.module) + "/" + cmd + "/" + this.model.get('_id'));
		}
	}),
	RecordList: Backbone.Marionette.CompositeView.extend({
		page: 1,
		perpage: 40,
		tagName: "table",
		className: "table table-full table-top",
		childView: false,
		emptyView: DEF.EmptyView,
		emptyViewOptions: {
			icon: "warning",
			msg: "No records found"
		},
		collectionEvents: {
			"sync": "render"
		},

		addChild: function (child, ChildView, index) {
			var from = (this.page - 1) * this.perpage;
			var to = from + this.perpage
			if (index >= from && index < to)
				Backbone.Marionette.CollectionView.prototype.addChild.apply(this, arguments);
		}
	})

}