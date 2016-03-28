/**
 * Project-wide prototypes for convenience.
 * 
 */
Roadtrip = {
	Router: Backbone.Marionette.AppRouter.extend({
		module: "module", // override, of course.
		routes: {
			"projects": "ShowRoot",
			"projects/:cmd": "LoadModule",
			"projects/:cmd/:arg": "LoadModule",
		},
		LoadModule: function (cmd, arg) {
			var module = this.module;

			if (!_.isUndefined(APP.models[module]) && APP.models[module].length) {
				console.log("route", module, cmd, arg);
				if (cmd) {
					APP.Page = new DEF.modules[module].views[cmd]({
						model: APP.models[module].get(arg),
					});
				} else {
					APP.Page = new DEF.modules[module].MainView({
						collection: APP.models[module]
					});
				}
				APP.root.showChildView("main", APP.Page);
				APP.SetMode(module);
			} else {
				APP.root.showChildView("main", new DEF.EmptyView({
					msg: "Loading..."
				}));
				this.listenToOnce(APP.models[module], 'sync', this.LoadModule.bind(this, module, cmd, arg))
			}
		},
		ShowRoot: function () {
			var module = this.module;
			console.log("root", module);
			APP.Page = new DEF.modules[module].MainView({
				collection: APP.models[module]
			});
			APP.root.showChildView("main", APP.Page);
			APP.SetMode(module);
			APP.SetTitle(module);
		}


	}),

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
		},
		GetLink: function (cmd) {
			return "#tbd/" + cmd + "/" + this.get('_id');
		}
	}),
	MainView: Backbone.Marionette.LayoutView.extend({

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
			"click": "Click"
		},
		Click: function () {
			APP.Route("#" + (this.module) + "/view/" + this.model.get('_id'), this.model.get(this.model.nameAttribute));
		}
	}),
	RecordList: Backbone.Marionette.CompositeView.extend({
		template: false,
		page: 1,
		perpage: 40,
		childView: false,
		childViewContainer: "#record_list", // override if you need to, obviously
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