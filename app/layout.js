/**
 * Use this as the empty view of a CollectionView.
 *
 * options:
 * 	msg: the main message
 *  submsg: a sub message
 *  icon:  a icon.  What documentation!
 */
DEF.EmptyView = Backbone.Marionette.ItemView.extend({
	template: require("../templates/empty.html"),
	templateHelpers: function() {
		var rs = $.extend({}, {
			colspan: 0,
			submsg: "",
			msg: "Empty",
			icon: ""
		}, this.options);
		//console.log(rs);
		return rs;
	},
	id: "empty",
	tagName: function() {
		return this.options.colspan > 0 ? "tr" : "div"
	},
	ui: {
		msg: "#msg",
		submsg: "#submsg",
		icon: "#icon"
	},
	onRender: function() {

		//		this.ui.msg.html(this.options.msg);
		//		if (this.options.submsg)
		//			this.ui.submsg.html(this.options.submsg);
		//		if (this.options.icon)
		//			this.ui.icon.html(APP.Icon(this.options.icon));
	}
});

DEF.RootLayout = Backbone.Marionette.LayoutView.extend({
	el: 'body',
	regions: {
		header: '#HEADER',
		main: '#MAIN',
		search: "#SEARCH"
	}
});


// Layout Header View
// ------------------
DEF.HeaderLayout = Backbone.Marionette.LayoutView.extend({
	template: require('../templates/header.html'),
	ui: {
		button: ".menuitem",
		title: "#title",
		search: "#search",
		results: "#SEARCH",
		login: "#login"
	},
	events: {
		"click @ui.button": "Go",
		"click @ui.title": "GoHome",
		"keyup @ui.search": "Search",
		"click @ui.login": "Login"
	},
	Search: function() {
		if (this.ui.search.val().length) {
			var search = new DEF.Search({
				search: this.ui.search.val()
			})
			this.ui.results.show();
			APP.root.showChildView('search', search)
		} else {
			this.ui.results.hide();
		}
	},
	GoHome: function() {
		APP.Route('#');
	},
	Go: function(e) {
		var target = $(e.currentTarget).data('mode');
		APP.Route('#' + target, target);
		APP.SetMode(target); // set mode immediately, for UI sakes, in case the view has to wait for the collecton to sync
	},
	Login: function() {
		APP.Route('#login');
	}
});
