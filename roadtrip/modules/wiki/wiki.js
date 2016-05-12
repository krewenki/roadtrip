DEF.modules.wiki = {};
DEF.modules.wiki.Initialize = function () {};
DEF.modules.wiki.Router = Roadtrip.Router.extend({
	initialize: function () {},
	module: "wiki",
	routes: {
		"wiki/:path": "LoadWiki",
	},
	LoadWiki: function (path) {
		console.log("Got path", path);
	}
});

DEF.modules.wiki.Model = Roadtrip.Model.extend({
	nameAttribute: 'title',
	defaults: {
		title: "Wiki 1",
		content: ""
	}
});

DEF.modules.wiki.Collection = Backbone.Collection.extend({
	model: DEF.modules.wiki.Model,
});

DEF.modules.wiki.Article = Backbone.Marionette.LayoutView.extend({
	template: require("./templates/article.html"),
	ui: {
		edit: "#edit"
	},
	events: {
		"click @ui.edit": "Edit"
	},
	Edit: function () {
		APP.Route("#" + this.options.parent_module + "/" + this.options.parent_id + "/wiki/edit");
	}
});

DEF.modules.wiki.Edit = Backbone.Marionette.LayoutView.extend({
	template: require("./templates/edit_article.html"),
	ui: {
		done: "#done",
		content: "#content"
	},
	events: {
		"click @ui.done": "Save"
	},
	onShow: function () {
		$("textarea").each(function (i, el) {
			$(el).val(($(el).val() || '').trim());
		}); // beautify inserts spaces between <textarea> in the item_edit form
	},
	Save: function () {
		var parent = this.options.parent;
		console.log(this.ui.content.val(), parent);
		//parent.set("_wiki", )
	}
});
