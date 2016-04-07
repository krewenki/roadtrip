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
					icon: missing,
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
				if (_.isUndefined(APP.models[collection]) || APP.models[collection].length < 2)
					return collection;
			}
			return false;
		},
		/**
		 * A generic method to show the module/cmd/arg style URLs
		 * @param  {string} cmd the command name as defined in DEF.modules.$module.views
		 * @param  {string} arg An argument, usually an ID
		 * @return null
		 */
		LoadModule: function(cmd, arg) {
			var module = this.module;
			var model = APP.models[module].get(arg);
			if (!model) {
				console.error("Model not found", module, arg);
			}

			APP.Page = new DEF.modules[module].views[cmd]({
				model: model,
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
			_: {
				views: 0,
				edits: 0
			}
		},

		icon: function() {
			return APP.Icon(this.module, this.module);
		},
		search_string: function() {
			var string = this.get(this.nameAttribute)
			return string;
		},
		/**
		 * Returns a pre-fabricated <a> tag, with optional display field
		 * @param  {[text]} field Which field to displa in the <a> tag
		 * @return {html}      "<a href='linl'>field</a>"
		 */
		Link: function(field) {
			field = field || this.nameAttribute;
			return "<a href='" + this.GetLink() + "'>" + this.get(field) + "</a>";
		},
		/**
		 * Generate a URL for a record
		 * @param  {string} cmd value to use in the "cmd" portion of the URL
		 * @return {text}     "#module/cmd/id"
		 */
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
							created_by: U.id,
							created_on: Date.now()
						}
						console.log("create", stats);
						break;
					case "edit":
						stats = {
							edited_on: Date.now(),
							edited_by: U.id,
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
		},
		/**
		 * Increment the stat by 1
		 * @param  {string} stat Name of stat
		 * @return {null}      [description]
		 */
		IncStat: function(stat) {
			var stats = this.get('_') || {};
			stats[stat] = (stats[stat] + 1) || 1
			this.set({
				_: stats
			})
			this.trigger('change', this) // manually trigger a change, because Highway
		}
	}),
	MainView: Backbone.Marionette.LayoutView.extend({

	}),
	/**
	 * Useful for viewing a single model
	 */
	View: Backbone.Marionette.LayoutView.extend({
		onShow: function() {
			this.model.IncStat("views")
			APP.SetTitle(this.model.get(this.model.nameAttribute), this.module)
		},
		ui: {
			edit: "#edit",
			delete: "#delete"
		},
		events: {
			"click @ui.edit": "Edit",
			"click @ui.delete": "Delete"
		},
		modelEvents: {
			"change": "render" // This shouldn't be necessary, should it?
		},
		Edit: function() {
			APP.Route("#" + this.module + "/" + "edit" + "/" + this.model.id);
		},
		Delete: function() {
			if (confirm("Are you sure you want to delete " + this.model.get(this.model.nameAttribute))) {
				console.log("kill it");
				APP.models[this.module].remove(this.model);
				APP.Route("#" + this.module);
			}
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
		 * Where to go, by default, after some action.  This is kind of a dumb
		 * function, but i was tired of making up routes all the time, and thought
		 * each module could override it, or something.
		 * @param  {bool} go_parent [don't go back to self, go to parent]
		 */
		Return: function(go_parent) {
			if (this.model.id) {
				if (go_parent) {
					var module = this.model.get('parent_module'),
						id = this.model.get('parent_id');
					if (module)
						APP.Route(APP.GetModel(module, id).GetLink())
					else {
						APP.Route("#" + this.module + "/view/" + this.model.id)
					}
				} else
					APP.Route("#" + this.module + "/view/" + this.model.id)
			} else
				APP.Route("#" + this.module);
		},
		/**
		 * Apply dirt to a field, so it knows it has to save.
		 * @param  {e} e the field
		 * @return {null}   [description]
		 */
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
				switch ($el.type) {
					case "checkbox":
						val = $el.checked;
						break;
				}
				save[$el.id] = val;
			})
			if (!this.model.id) {
				save["_"] = {
					created_by: U.id,
					created_on: Date.now()
				}
				return APP.models[this.module].create(save, {
					success: function(model) {
						this.model.id = model._id; // _id because it's just a mongo object
						this.Return(false);
					}.bind(this)
				});
				//this.model.SetStats("create");
			} else {
				console.log("save", save);
				this.model.set(save);
				this.model.SetStats("edit")
			}
			return this.Return(false);
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



	/**
██████  ███████  ██████  ██████  ██████  ██████      ██      ██ ███████ ████████
██   ██ ██      ██      ██    ██ ██   ██ ██   ██     ██      ██ ██         ██
██████  █████   ██      ██    ██ ██████  ██   ██     ██      ██ ███████    ██
██   ██ ██      ██      ██    ██ ██   ██ ██   ██     ██      ██      ██    ██
██   ██ ███████  ██████  ██████  ██   ██ ██████      ███████ ██ ███████    ██


	 */
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
