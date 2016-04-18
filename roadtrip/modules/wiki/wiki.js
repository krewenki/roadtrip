DEF.modules.wiki = {};
DEF.modules.wiki.Initialize = function() {};
DEF.modules.wiki.Router = Roadtrip.Router.extend({
	initialize: function() {},
	module: "wiki",
	routes: {
		"wiki/:path": "LoadWiki",
	},
	LoadWiki: function(path) {
		console.log("Got path", path)
	}
});

DEF.modules.wiki.Model = Roadtrip.Model.extend({
	nameAttribute: 'title',
	defaults: {
		title: "Wiki 1",
		content: ""
	}
})

DEF.modules.wiki.Collection = Backbone.Collection.extend({
	model: DEF.modules.wiki.Model
})

DEF.modules.wiki.Article = Backbone.Marionette.LayoutView.extend({
	template: require("./templates/article.html")
})
