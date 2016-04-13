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
	comparator: 'datetime'
})

DEF.modules.comments.Comment = Backbone.Marionette.ItemView.extend({
	className: "comment",
	template: require("./templates/comment.html"),
	templateHelpers: function() {
		return {
			username: APP.models.users.get(this.model.get('user_id')).get('name')
		}
	}


})

DEF.modules.comments.Comments = Backbone.Marionette.CompositeView.extend({
	id: "COMMENTS",
	template: require("./templates/comments.html"),
	templateHelpers: function() {
		return {
			module: this.options.module
		}
	},
	childView: DEF.modules.comments.Comment,
	childViewContainer: "#comment_list",
	emptyView: DEF.EmptyView,
	emptyViewOptions: {
		msg: "No comments yet!",
	},
	ui: {
		save: "#save",
		comment: "#comment"
	},
	events: {
		"click @ui.save": "Save"
	},
	modelEvents: {
		"change": "render"
	},
	Save: function() {
		var comments = this.model.get('comments');
		var comment = {
			datetime: Date.now(),
			user_id: U.id,
			comment: this.ui.comment.val()
		}
		comments.push(comment);
		this.model.set({
			comments: comments
		})
		this.model.SetStats({
			"comments": comments.length
		});
		// TODO: this adds to the model (parent) and this pseudocollection.  That's weird to have to do
		this.model.trigger('change', this.model) // manually trigger a change, because Highway
		this.collection.push(new DEF.modules.comments.Model(comment)); // manually add to the collection
	}

})
