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
		execute: function(callback, args, name) {
			var module = this.module;
			if (!_.isUndefined(APP.models[module]) && APP.models[module].length) {
				console.log("execute", callback);
				return Backbone.Router.prototype.execute.call(this, callback, args, name)
			} else {
				console.log("waiting for ", module)
				APP.root.showChildView("main", new DEF.EmptyView({
					icon: "loading",
					msg: "Loading " + this.module.toUpperCase() + "&hellip;"
				}));
				this.listenToOnce(APP.models[module], 'sync', this.execute.bind(this, callback, args, name))
			}
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
			var sort = (m.get('_views') + m.get('_edits'));
			return -sort
		}
	}),
	Model: Backbone.Model.extend({
		idAttribute: '_id',
		module: "tbd", // the name of the collection
		nameAttribute: 'name', // the human-readable field in the record
		defaults: {},
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

		}
	}),
	MainView: Backbone.Marionette.LayoutView.extend({

	}),

	/**
	 * Useful for viewing a single model
	 */
	View: Backbone.Marionette.ItemView.extend({
		onShow: function() {
			this.model.set('_views', this.model.get('_views') + 1);
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
		Return: function() {
			if (this.model.id)
				APP.Route("#" + this.module + "/view/" + this.model.id)
			else
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
			save["_updated"] = Date.now();
			$(".field.dirty").each(function(i, $el) {
				console.log($el.id, $el.value)
				save[$el.id] = $el.value;
			})
			if (!this.model.id) {
				APP.models[this.module].create(save);
			} else {
				save['_edits'] = this.model.get('_edits') + 1;
				this.model.set(save);
			}
			this.Return();
		},
		Cancel: function(e) {
			this.Return();
		},
		Delete: function(e) {
			APP.models[this.module].remove(this.model);
			this.Return();
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
