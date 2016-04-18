/**
 * Project-wide prototypes for convenience.
 *
 */
window.Roadtrip = {
	Router: Backbone.Marionette.AppRouter.extend({
		module: "module", // override, of course.
		collections: [], // list collections required for this module
		routes: {},
		/**
		 * This is a clever function that looks at a list of collections that must be present.
		 * If all collections in the list have been sync'd, the Route continues, otherwise, it
		 * flashes an empty view, while waiting for a collection to sync.  It uses the
		 * "GetMissingCollections" function, which it calls until it returns false.
		 * @param  {Function} callback [description]
		 * @param  {[type]}   args     [description]
		 * @param  {[type]}   name     [description]
		 * @return {[type]}            [description]
		 */
		execute: function(callback, args, name) {
			var module = this.module;
			var missing = this.GetMissingCollections();
			if (missing === false) {
				return Backbone.Router.prototype.execute.call(this, callback, args, name);
			} else {
				console.log("waiting for collection", missing);
				APP.root.showChildView("main", new DEF.EmptyView({
					icon: missing,
					msg: "Loading " + missing.toUpperCase() + "&hellip;",
					submsg: "<progress value=" + this.collections.indexOf(missing) + " min=0 max=" + (this.collections.length - 1) + ">"
				}));
				var collection = (missing.indexOf('_') > 0) ? missing.split('_')[0] : missing; // "orders_lineitems"
				DEF.modules[collection].Initialize();
				this.listenToOnce(APP.models[missing], 'sync', this.execute.bind(this, callback, args, name));
			}
		},
		/**
		 * returns the name of a missing collection, or FALSE if they are all loaded
		 */
		GetMissingCollections: function() {
			if (this.collections.length === 0)
				this.collections = [this.module];
			for (var c = 0; c < this.collections.length; c++) {
				var collection = this.collections[c];
				if (_.isUndefined(APP.models[collection]) || APP.models[collection].length === 0)
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
			var attr = m.get('_');
			if (attr) {
				var sort = attr.views + attr.edits;
				return -sort;
			}
		},
		initialize: function() {
			this.listenTo(this, "sync", this.UpdateFooterCount, this);
			this.listenTo(this, "add", this.UpdateFooterCount, this);
			this.listenTo(this, "remove", this.UpdateFooterCount, this);
		},
		UpdateFooterCount: function() {
			var module = this.at(0).module;
			var $el = $("#FOOTER #" + module + "_count");
			if ($el.html() != this.length) { // check for sync in case this is just a "update from server event"
				$el.html(APP.Icon(module) + " " + this.length).addClass("new"); // add a flash
				setTimeout(function() { // clear the flash
					$el.removeClass("new");
				}, 200);
			}
		},
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
		// disabled per #1.38
		set: function(key, val, options) {
			var orig = {},
				save = {},
				data = {},
				changed = false;
			if (this.id && !this._remoteChanging) {
				if (_.isObject(key)) {
					data = key;
				} else {
					data[key] = val;
				}
				Object.keys(data).forEach(function(field) {
					if (field == '_')
						return;
					if (_.isArray(data[field]) || _.isObject(data[field])) {
						var o = JSON.stringify(data[field]),
							n = JSON.stringify(this.get(field));
						if (o != n) {
							orig[field] = o;
							save[field] = n;
							changed = true;
						}
					} else if (data[field] != this.get(field)) {
						orig[field] = this.get(field);
						save[field] = data[field];
						changed = true;
					}
				}.bind(this));
				if (changed) {
					APP.LogEvent(this.module, this.id, "Edited " + Object.keys(save).join(", "), {
						old: orig,
						new: save
					});
					console.info("Edited", orig, save);
				}

			}

			return Backbone.Model.prototype.set.call(this, key, val, options);
		},
		icon: function() {
			return APP.Icon(this.module, this.module);
		},
		search_string: function() {
			var string = this.get(this.nameAttribute) + "";
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
			return "#" + this.module + "/" + cmd + "/" + this.id;
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
			};
			var model = _.extend(defaults, this.get('_'));
			if (!_.isObject(stats)) {
				switch (stats) {
					case "create": // this will not run, as there is no model yet
						stats = {
							created_by: U.id,
							created_on: Date.now()
						};
						console.log("create", stats);
						break;
					case "edit":
						stats = {
							edited_on: Date.now(),
							edited_by: U.id,
							edits: model.edits + 1
						};
						break;
					default:
						console.warn("unhandled stat", stats);
				}
			}
			this.set({
				_: _.extend(model, stats)
			});
		},
		/**
		 * Increment the stat by 1
		 * @param  {string} stat Name of stat
		 * @return {null}      [description]
		 */
		IncStat: function(stat) {
			var stats = this.get('_') || {};
			stats[stat] = (stats[stat] + 1) || 1;
			stats["last_" + stat] = Date.now();
			this.set({
				_: stats
			});
			this.trigger('change', this); // manually trigger a change, because Highway
		},
		/**
		 * Generate a unique ID.  Don't even use this if you don't need a unique ID.  Else override it
		 * @return {string} A Unique ID
		 */
		GetID: function() {
			if (this.id)
				return this.id; // the ID has  already been generated
			return this.get('_id');
		},

		/**
		 * Theoretically, all modules cna support sub-tasks, so this is now at the module level.
		 * What it does is it looks for all the subtasks that have this model as a parent, and
		 * averages their progress, to determine this model's progress.  IF this model has subtasks,
		 * that is.
		 * @return null
		 */
		UpdateTaskProgress: function() {
			var subs = APP.models.tasks.where({
				parent_id: this.id
			});
			if (subs.length > 0) {
				var sum = 0,
					count = 0;
				for (var s = 0; s < subs.length; s++) {
					var sub = subs[s];
					if (sub.get('state') != 'Rejected') {
						sum += (sub.get('progress') * sub.get('priority') / 100.0);
						count += (sub.get('priority') / 100.0);
					}
				}
				var progress = sum / count;
				progress = Number(progress.toFixed(2));
				if (progress != this.get('progress')) {
					console.log("Progress automatically set to ", progress, this.get('progress'));
					this.set({
						tasks: subs.length,
						progress: progress,
					});
				}
			}

		},

	}),
	MainView: Backbone.Marionette.LayoutView.extend({

	}),
	/**
	 * Useful for viewing a single model
	 */
	View: Backbone.Marionette.LayoutView.extend({
		onShow: function() {
			this.model.IncStat("views");
			APP.SetTitle(this.model.get(this.model.nameAttribute), this.module);
		},
		ui: {
			edit: "#edit",
		},
		events: {
			"click @ui.edit": "Edit",
		},
		modelEvents: {
			"change": "render" // This shouldn't be necessary, should it?
		},
		Edit: function() {
			APP.Route("#" + this.module + "/" + "edit" + "/" + this.model.id);
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
			"delete": "#delete",
			"record": "#editrecord"
		},
		events: {
			"change @ui.field": "MakeDirty",
			"click @ui.save": "Save",
			"click @ui.cancel": "Cancel",
			"click @ui.delete": "Delete",
			"click @ui.record": "EditRecord"
		},
		onBeforeRender: function() {
			if (!this.model) {
				this.model = new DEF.modules[this.module].Model({});
			}
		},
		onShow: function() {
			$("textarea").val(($("textarea").val() || '').trim()); // beautify inserts spaces between <textarea> in the item_edit form
			APP.SetTitle(this.model.get(this.model.nameAttribute), this.module);

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
						APP.Route(APP.GetModel(module, id).GetLink());
					else {
						APP.Route("#" + this.module + "/view/" + this.model.id);
					}
				} else {
					APP.Route("#" + this.module + "/view/" + this.model.id);
				}
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
				save = {},
				orig = {};
			$(".field.dirty").each(function(i, $el) {
				var val = $el.value;
				switch ($el.type) {
					case "checkbox":
						val = $el.checked;
						break;
				}
				save[$el.id] = val;
			});
			if (!this.model.id) {
				save._ = {
					created_by: U.id,
					created_on: Date.now()
				};
				return APP.models[this.module].create(save, {
					success: function(attr) {
						this.model.id = attr[this.model.idAttribute]; // _id because it's just a mongo object
						this.Return(false);
						APP.LogEvent(this.module, this.model.id, "Recorded created");
					}.bind(this),
					error: function(x, y, z) {
						console.log(x, y, z);
					}
				});
				//this.model.SetStats("create");
			} else {
				console.log("save", save);
				this.model.set(save);
				this.model.SetStats("edit");
			}
			return this.Return(false);
		},
		Cancel: function(e) {
			this.Return();
		},
		Delete: function(e) {
			if (confirm("Are you sure you wish to delete this thing?")) {
				APP.models[this.model.module].remove(this.model);
				this.Return(true);
			}
		},
		EditRecord: function(e) {
			APP.Route("#db/" + this.model.module + "/" + this.model.id);
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
		Click: function(e) {
			APP.Route("#" + (this.module) + "/view/" + this.model.id, this.model.get(this.model.nameAttribute));
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
			var to = from + this.perpage;
			if (index >= from && index < to)
				Backbone.Marionette.CollectionView.prototype.addChild.apply(this, arguments);
		},

	})

};
