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
		footer: '#FOOTER',
		main: '#MAIN',
		search: "#SEARCH"
	}
});

DEF.FooterLayout = Backbone.Marionette.ItemView.extend({
	template: require('../templates/footer.html'),
	ui: {
		collections: "#collection_list"
	},
	initialize: function() {
		this.listenTo(APP, "collection:sync", this.render)
	},
	onRender: function() {
		var html = [],
			total = 0;
		var collections = Object.keys(APP.models);
		for (var c = 0; c < collections.length; c++) {
			var module = collections[c];
			var count = APP.models[module].length;
			if (count)
				html.push(module + ": " + APP.Format.number(count));
			total += count;

		}
		this.ui.collections.html("Total Records: " + APP.Format.number(total) + " &vellip; " + html.join(' &bull; '));
	}
})

// Layout Header View
// ------------------
DEF.HeaderLayout = Backbone.Marionette.LayoutView.extend({
	template: require('../templates/header.html'),
	initialize: function() {
		this.listenTo(APP, "auth_user", this.render);
	},
	ui: {
		button: ".menuitem",
		title: "#title",
		search: "#search",
		results: "#SEARCH",
		login: "#login",
		taskcount: '#taskcount'
	},
	events: {
		"click @ui.button": "Go",
		"click @ui.title": "GoHome",
		"keyup @ui.search": "Search",
		"click @ui.login": "Login"
	},
	onBeforeShow: function() {
		$("#HEADER").addClass(U.get('prefs').header);
	},
	// onShow: _.defer(function() {
	// 	console.log(APP.models.tasks);
	// 	APP.listenTo(APP.models.tasks, 'sync', function() {
	// 		var length = APP.models.tasks.where({
	// 			assigned_to: U.id
	// 		}).length;
	// 		if (length) {
	// 			$("#HEADER #taskcount").html("" + APP.Icon("tasks") + "" + length + "");
	// 		}
	// 	})
	// }),
	Search: function() {
		if (this.ui.search.val().length > 3) {
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
