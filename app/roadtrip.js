/**
 * Project-wide prototypes for convenience.
 *
 */
Roadtrip = {
	Router: Backbone.Marionette.AppRouter.extend({
		module: "module", // override, of course.
		collections: [], // list collections required for this module
		routes: {},
		execute: function(callback, args, name) {
			var module = this.module;
			var missing = this.missing_collections();
			if (missing === false) {
				return Backbone.Router.prototype.execute.call(this, callback, args, name)
			} else {
				console.log("waiting for collection", missing)
				APP.root.showChildView("main", new DEF.EmptyView({
					icon: "loading",
					msg: "Loading " + missing.toUpperCase() + "&hellip;"
				}));
				this.listenToOnce(APP.models[missing], 'sync', this.execute.bind(this, callback, args, name))
			}
		},
		/**
		 * returns the name of a missing collection, or FALSE if they are all loaded
		 */
		missing_collections: function() {
			if (this.collections.length == 0)
				this.collections = [this.module];
			for (var c = 0; c < this.collections.length; c++) {
				var collection = this.collections[c];
				if (_.isUndefined(APP.models[collection]) || APP.models[collection].length == 0)
					return collection;
			}
			return false;
		},
		LoadModule: function(cmd, arg) {
			var module = this.module;

			APP.Page = new DEF.modules[module].views[cmd]({
				model: APP.models[module].get(arg),
			});
			APP.root.showChildView("main", APP.Page);
		},
		ShowRoot: function() {
			var module = this.module;
			APP.Page = new DEF.modules[module].MainView({
				collection: APP.models[module]
			});
			APP.root.showChildView("main", APP.Page);
		}
	}),

	Collection: Backbone.Highway.Collection.extend({
		perpage: 100,
		page: 1,
		comparator: function(m) {
			//var sort = ('00000' + (m.get('views') + m.get('edits'))).substr(-5) + m.get('name');
			var sort = (m.get('_.views') + m.get('_.edits'));
			return -sort
		},
		initialize: function() {
			this.listenToOnce(this, "sync", this.Synced, this);
		},
		Synced: function(x, y, z) {
			APP.trigger("collection:sync");
		}
	}),
	Model: Backbone.Model.extend({
		idAttribute: '_id',
		module: "tbd", // the name of the collection
		nameAttribute: 'name', // the human-readable field in the record
		defaults: {
			_: this.common
		},

		icon: function() {
			return APP.Icon(this.module, this.module);
		},
		search_string: function() {
			var string = this.get(this.nameAttribute)
			return string;
		},
		GetLink: function(cmd) {
			if (!cmd)
				cmd = "view";
			return "#" + this.module + "/" + cmd + "/" + this.get('_id');
		},
		GetTitle: function() {
			return this.model.get(this.nameAttribute);

		},
		/**
		 * Use this to quickly set stats for the models
		 *
		 * this.model.SetStats({created_by: U.ID})
		 * this.model.SetStats("views"); // auto-increment
		 */
		SetStats: function(stats) {
			var defaults = { // these attributes go to every model as "_"
				views: 0,
				edits: 0,
				created_on: 0,
				created_by: 0,
				edited_on: 0,
				edited_by: 0
			}
			var model = _.extend(defaults, this.get('_'))
			if (!_.isObject(stats)) {
				switch (stats) {
					case "create": // this will not run, as there is no model yet
						stats = {
							created_by: U._id,
							created_on: Date.now()
						}
						console.log("create", stats);
						break;
					case "view":
						stats = {
							views: model.views + 1
						}
						break;
					case "edit":
						stats = {
							edited_on: Date.now(),
							edited_by: U._id,
							edits: model.edits + 1
						}
						break;
					default:
						console.warn("unhandled stat", stats);
				}
			}
			this.set({
				_: _.extend(model, stats)
			})
		}
	}),
	MainView: Backbone.Marionette.LayoutView.extend({

	}),
	/**
	 * Useful for viewing a single model
	 */
	View: Backbone.Marionette.ItemView.extend({
		onShow: function() {
			this.model.SetStats("view")
			APP.SetTitle(this.model.get(this.model.nameAttribute), this.module)
		},
		modelEvents: {
			"change": "render" // This shouldn't be necessary, should it?
		}
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
		onBeforeRender: function() {
			if (!this.model) {
				this.model = new DEF.modules[this.module].Model({})
			}
		},
		onShow: function() {
			$("textarea").val(($("textarea").val() || '').trim()); // beautify inserts spaces between <textarea> in the item_edit form
		},
		/**
		 * After edit, what page to load?
		 */
		Return: function(go_parent) {
			if (this.model.id) {
				if (go_parent)
					APP.Route(APP.GetModel(this.model.get('parent_module'), this.model.get('parent_id')).GetLink())
				else
					APP.Route("#" + this.module + "/view/" + this.model.id)
			} else
				APP.Route("#" + this.module);
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
				console.log($el.id, $el.value)
				save[$el.id] = $el.value;
			})
			if (!this.model.id) {
				save["_"] = {
					created_by: U._id,
					created_on: Date.now()
				}
				APP.models[this.module].create(save);
				//this.model.SetStats("create");
			} else {
				this.model.set(save);
				this.model.SetStats("edit")
			}
			this.Return(true);
		},
		Cancel: function(e) {
			this.Return();
		},
		Delete: function(e) {
			APP.models[this.module].remove(this.model);
			this.Return(true);
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
		Click: function() {
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
			msg: "No records found",
			colspan: 5
		},
		collectionEvents: {
			"sync": "render",
			"change": "render"
		},

		addChild: function(child, ChildView, index) {
			var from = (this.page - 1) * this.perpage;
			var to = from + this.perpage
			if (index >= from && index < to)
				Backbone.Marionette.CollectionView.prototype.addChild.apply(this, arguments);
		},

	})

}
