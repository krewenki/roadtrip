/**
 * Project-wide prototypes for convenience.
 * 
 */
Roadtrip = {
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
		nameAttribute: 'name', // the human-readable field in the record
		defaults: {},
		search_string: function () {
			var string = JSON.stringify(this.attributes);
			return string.toUpperCase();
		}
	}),
	MainView: Backbone.Marionette.LayoutView.extend({
		icons: {},
		//		regions: {
		//			list: "#record_list"
		//		},
		//		Icon: function (icon) {
		//			return APP.Icon(this.icons[icon]);
		//		},//		childEvents: {
		//			'main:list': 'ListRecords',
		//		},
		//		ui: {
		//			add: "#add",
		//			search: "#search",
		//			filter: "#filter",
		//			submenu: "#submenu",
		//			filterfield: ".filter_field",
		//		},
		//		events: {
		//			"click @ui.add": "Add",
		//			"click @ui.list": "ListRecords",
		//			"keyup @ui.search": "Search",
		//			"click @ui.filter": "ToggleFilterView",
		//			"change @ui.filterfield": "ListRecords"
		//		},
		//		onRender: function () {
		//			var mode = this.id.toLocaleLowerCase();
		//			APP.SetMode(mode);
		//			this.Command(this.options.cmd, this.options.arg);
		//		},
		//
		//		/**
		//		 * 
		//		 * Show a collection based $cmd in  #module/$cmd/$id
		//		 */
		//		Command: function (cmd, id) {
		//			var mode = this.id.toLocaleLowerCase();
		//			console.log(mode, cmd, id);
		//			switch (cmd) {
		//			case 'edit':
		//			case 'view':
		//				this.view = new DEF.modules[mode].cmds[cmd]({
		//					model: APP.models[mode].get(id),
		//				});
		//				APP.root.showChildView('main', this.view);
		//				break;
		//			case 'list':
		//			default:
		//				this.ListRecords();
		//			}
		//		},
		//		Add: function () {
		//			var mode = this.id.toLocaleLowerCase();
		//			console.log(mode);
		//			var page = new DEF.modules[mode].cmds.edit({
		//				model: false,
		//			});
		//			this.showChildView('list', page);
		//		},
		//		Search: function (e) {
		//			this.ListRecords(); // .setFilter does not yet exist.  this is a crappy way to do it.
		//		},
		//		ListRecords: function () {
		//			var mode = this.id.toLocaleLowerCase();
		//			var where = {
		//				search: this.ui.search.val(),
		//				fields: {}
		//			}
		//			this.ui.filterfield.each(function (i, el) {
		//				if (el.value && el.value != 'all')
		//					where.fields[el.id] = el.value
		//			})
		//
		//			this.view = new DEF.modules[mode].RecordList({
		//				collection: APP.models[mode],
		//				filter: function (m, i, c) {
		//					var fields = Object.keys(where.fields);
		//					for (var f = 0; f < fields.length; f++) {
		//						var id = fields[f],
		//							val = where.fields[id];
		//						if (m.get(id) != val)
		//							return false;
		//					}
		//
		//					var string = m.search_string()
		//					if (string.indexOf(where.search.toUpperCase()) == -1)
		//						return false;
		//					return true;
		//				},
		//			});
		//			this.showChildView('list', this.view);
		//			APP.Route("#" + mode, mode, false); // re-route, in case they searched from some other view
		//		},
		//		ToggleFilterView: function (e) {
		//			if ($(e.currentTarget).hasClass('toggled')) {
		//				this.ui.submenu.slideUp();
		//				$(e.currentTarget).removeClass('toggled')
		//			} else {
		//				this.ui.submenu.slideDown();
		//				$(e.currentTarget).addClass('toggled');
		//
		//			}
		//		},
	}),

	/**
	 * Useful for viewing a single model
	 */
	View: Backbone.Marionette.ItemView.extend({
		onShow: function () {
			this.model.set('views', this.model.get('views') + 1);
		},
	}),
	/**
	 * Useful for supporting edit forms.  Has all the save/dirty logic built in.
	 */
	Edit: Backbone.Marionette.ItemView.extend({
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
			APP.Route("#" + this.module + "/view/" + this.model.id);
		},
		Cancel: function (e) {
			if (this.model.get('_id'))
				APP.Route("#" + this.module + "/view/" + this.model.get('_id'));
			else
				APP.Route("#" + this.module);
		},
		Delete: function (e) {
			APP.models[this.module].remove(this.model);
			APP.Route("#" + this.module + "");
		}
	}),
	RecordLine: Backbone.Marionette.ItemView.extend({
		tagName: 'tr',
		className: 'click hover',
		modelEvents: {
			"change": "render"
		},
		events: {
			"click": "View"
		},
		View: function () {
			APP.Route("#" + (this.module) + "/view/" + this.model.get('_id'), this.model.get(this.model.nameAttribute));
		}
	}),
	RecordList: Backbone.Marionette.CompositeView.extend({
		template: false,
		page: 1,
		perpage: 40,
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
		},

	})

}