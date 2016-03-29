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
		console.log(rs);
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
	}
});


// Layout Header View
// ------------------
DEF.HeaderLayout = Backbone.Marionette.LayoutView.extend({
	template: require('../templates/header.html'),
	ui: {
		button: ".menuitem",
		title: "#title"
	},
	events: {
		"click @ui.button": "Go",
		"click @ui.title": "GoHome"
	},
	GoHome: function() {
		APP.Route('#');
	},
	Go: function(e) {
		var target = $(e.currentTarget).data('mode');
		APP.Route('#' + target, target);
		APP.SetMode(target); // set mode immediately, for UI sakes, in case the view has to wait for the collecton to sync
	}
});
