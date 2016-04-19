DEF.modules.comments = {};
DEF.modules.comments.Initialize = function() {};
DEF.modules.comments.Router = Roadtrip.Router.extend({

});
DEF.modules.comments.Model = Backbone.Model.extend({
	defaults: {
		comment: "You don't say!"
	}
});
DEF.modules.comments.Collection = Backbone.Collection.extend({
	model: DEF.modules.comments.Model,
	comparator: 'datetime'
});

DEF.modules.comments.Comment = Backbone.Marionette.ItemView.extend({
	className: "comment",
	template: require("./templates/comment.html"),
	templateHelpers: function() {
		return {
			username: APP.models.users.get(this.model.get('user_id')).get('name')
		};
	}


});

DEF.modules.comments.Comments = Backbone.Marionette.CompositeView.extend({
	id: "COMMENTS",
	template: require("./templates/comments.html"),
	templateHelpers: function() {
		return {
			module: this.options.module
		};
	},
	childView: DEF.modules.comments.Comment,
	childViewContainer: "#comment_list",
	modelEvents: {
		"change:comments" : "render"
	},
	// emptyView: DEF.EmptyView,
	// emptyViewOptions: {
	// 	msg: "No comments yet!",
	// },
	ui: {
		save: "#save",
		comment: "#comment"
	},
	events: {
		"click @ui.save": "Save"
	},
	onBeforeRender: function(){
		this.collection = new DEF.modules.comments.Collection(this.model.get('comments'));
	},
	Save: function() {
		var comment = {
			"datetime"	: Date.now(),
			"user_id"		: U.id,
			"comment"		: this.ui.comment.val().trim()
		};

		var model = APP.models[this.model.module].get(this.model.id);
		model.set('comments',model.get('comments').concat(comment))

		this.model.SetStats({
			"comments": comments.length
		});

		APP.LogEvent(this.options.module, this.options.model.id, "New comment: " + comment.comment.substring(0, 20) + "&hellip;");
	}

});
