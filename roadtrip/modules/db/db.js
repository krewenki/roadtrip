DEF.modules.db = {};
DEF.modules.db.Initialize = function () {};
DEF.modules.db.Router = Roadtrip.Router.extend({
	module: "db",
	collections: ["tasks", "users", "contacts", "orders", "expenses", "revisions", "projects", "timeclock", "events"],
	routes: {
		"db": "Root",
		"db/:table": "ViewTable",
		"db/:table/:id": "EditRecord",
	},
	Root: function () {
		APP.root.showChildView("main", new DEF.modules.db.Root({}));
	},
	ViewTable: function (table) {
		APP.root.showChildView("main", new DEF.modules.db.Table({
			collection: APP.models[table],
			comparator: function () {
				return _.last_views;
			}
		}));
	},
	EditRecord: function (table, id) {
		APP.root.showChildView("main", new DEF.modules.db.Record({
			model: APP.models[table].get(id)
		}));
	}
});

/*
██████  ███████  ██████  ██████  ██████  ██████
██   ██ ██      ██      ██    ██ ██   ██ ██   ██
██████  █████   ██      ██    ██ ██████  ██   ██
██   ██ ██      ██      ██    ██ ██   ██ ██   ██
██   ██ ███████  ██████  ██████  ██   ██ ██████
*/


DEF.modules.db.Record = Roadtrip.Edit.extend({
	id: 'DB',
	template: require("./templates/record.html"),
	templateHelpers: function () {
		return {
			json: JSON.stringify(this.model, null, 4)
		};
	},
	ui: {
		"json": "#json",
		"save": "#save",
		"cancel": "#cancel",
		"delete": "#delete"
	},
	events: {
		"keyup @ui.json": "Validate",
		"click @ui.save": "Save",
		"click @ui.cancel": "Cancel",
		"click @ui.delete": "Delete"
	},
	onShow: function () {
		$("textarea").val(($("textarea").val() || '').trim()); // beautify inserts spaces between <textarea> in the item_edit form
	},
	Validate: function () {
		try {
			var json = JSON.parse(this.ui.json.val());
			this.ui.json.removeClass("badjson");
		} catch (e) {
			this.ui.json.addClass("badjson");
		}
	},
	Save: function () {
		try {
			var json = JSON.parse($("#json").val());
			this.model.set(json);
			APP.Route("#db/" + this.model.module);
		} catch (e) {
			alert("bad json");
		}
	},
	Cancel: function () {
		APP.Route("#db/" + this.model.module);
	}
});


/*
████████  █████  ██████  ██      ███████
   ██    ██   ██ ██   ██ ██      ██
   ██    ███████ ██████  ██      █████
   ██    ██   ██ ██   ██ ██      ██
   ██    ██   ██ ██████  ███████ ███████
*/
DEF.modules.db.TableLine = Roadtrip.RecordLine.extend({
	className: "row hover",
	template: require("./templates/table_line.html"),
	templateHelpers: function () {
		var fields = Object.keys(this.model.attributes);
		return {
			fields: fields.sort(),
			model: this.model
		};
	},
	Click: function (e) {
		APP.Route("#db/" + this.model.module + "/" + this.model.id);
	}
});

DEF.modules.db.Table = Roadtrip.RecordList.extend({
	id: 'DB',
	perpage: 100,
	template: require("./templates/table_list.html"),
	childView: DEF.modules.db.TableLine,
	childViewContainer: "#rows",
});



/*
██████   ██████   ██████  ████████
██   ██ ██    ██ ██    ██    ██
██████  ██    ██ ██    ██    ██
██   ██ ██    ██ ██    ██    ██
██   ██  ██████   ██████     ██
*/

DEF.modules.db.DBLine = Roadtrip.RecordLine.extend({
	tagName: "div",
	className: "database",
	template: require("./templates/db_line.html"),
	templateHelpers: function () {
		return {
			length: APP.models[this.model.get('db')].length,
			size: this.GetCollectionSize(APP.models[this.model.get('db')])
		};
	},
	initialize: function () {
		this.listenTo(APP.models[this.model.get('db')], "sync", this.render);
	},
	Click: function (e) {
		APP.Route("#db/" + this.model.get('db'));
	},
	GetCollectionSize: function (collection) {
		var size = 0;
		collection.each(function (m) {
			size += this.GetObjectSize(m);
		}.bind(this));
		return size;
	},
	GetObjectSize: function (object) {
		return JSON.stringify(object).length;
	},
});


DEF.modules.db.Root = Roadtrip.RecordList.extend({
	id: 'DB',
	template: require("./templates/root.html"),
	onBeforeRender: function () {
		var dbs = [];
		for (var db in APP.models) {
			dbs.push({
				db: db
			});
		}
		this.collection = new Backbone.Collection(dbs);
	},
	childView: DEF.modules.db.DBLine,
	childViewContainer: "#record_list",
});
