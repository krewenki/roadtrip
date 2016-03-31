DEF.modules.comments = {}
DEF.modules.comments.Router = Roadtrip.Router.extend({

});
DEF.modules.comments.Model = Backbone.Model.extend({
	defaults: {
		comment: "You don't say!"
	}
})
DEF.modules.comments.Collection = Backbone.Collection.extend({
	model: DEF.modules.comments.Model,
	comparator: function(m) {
		return -m.get('datetime')
	}
})

DEF.modules.comments.Comment = Backbone.Marionette.ItemView.extend({
	className: "comment",
	template: require("./templates/comment.html"),

})

DEF.modules.comments.Comments = Backbone.Marionette.CompositeView.extend({
	id: "COMMENTS",
	template: require("./templates/comments.html"),
	childView: DEF.modules.comments.Comment,
	childViewContainer: "#comment_list",
	emptyView: DEF.EmptyView,
	emptyViewOptions: {
		icon: "comments",
		msg: "No comments yet!",
	},
	ui: {
		save: "#save",
		comment: "#comment"
	},
	events: {
		"click @ui.save": "Save"
	},
	Save: function() {
		var comments = this.model.get('comments');
		var comment = {
			datetime: Date.now(),
			user_id: U._id,
			comment: this.ui.comment.val()
		}
		comments.push(comment);
		this.model.save({
			comments: comments
		})
	}

})
