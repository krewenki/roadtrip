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
	templateHelpers: function () {
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
	tagName: function () {
		return this.options.colspan > 0 ? "tr" : "div";
	},
	ui: {
		msg: "#msg",
		submsg: "#submsg",
		icon: "#icon"
	},
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
});

// Layout Header View
// ------------------
DEF.HeaderLayout = Backbone.Marionette.LayoutView.extend({
	template: require('../templates/header.html'),
	initialize: function () {
		this.listenTo(APP, "auth_user", this.render);
	},
	ui: {
		button: ".menuitem",
		title: "#title",
		search: "#search",
		results: "#SEARCH",
		login: "#login",
		taskcount: '#taskcount',
		stars: "#stars"
	},
	events: {
		"click @ui.button": "Go",
		"mouseenter @ui.button": "InitCollection",
		"click @ui.title": "GoHome",
		"keyup @ui.search": "Search",
		"focus @ui.search": "LoadAll",
		"click @ui.login": "Login"
	},
	onBeforeRender: function () {
		$("#HEADER").addClass(U.get('prefs').header);
		if (U) {
			this.listenTo(APP.models.tasks, "sync add remove", this.UpdateUserTaskCount);
			this.listenTo(APP.models.tasks, "change:assigned_to change:state", this.UpdateUserTaskCount);
			this.InitStars();
		}
	},
	onRender: function () {
		this.ShowStars();
	},
	InitStars: function () {
		var stars = U.get('stars') || [];
		var collections = [];
		for (let key of stars) {
			var bits = key.split('|');
			collections.push(bits[0]);
		}
		collections = _.uniq(collections);
		for (var c in collections) {
			var module = collections[c];
			DEF.modules[module].Initialize();
			this.listenToOnce(APP.models[module], "sync", this.ShowStars);
		}

		this.listenTo(U, "star", this.ShowStars);

	},
	ShowStars: function () {
		var stars = U.get('stars') || [];
		var html = "";
		for (let key of stars) {
			var bits = key.split('|');
			html += "<div class='starred_item'>" + APP.GetLink(bits[0], bits[1]) + "</div>";
		}
		this.ui.stars.html(html);
	},
	UpdateUserTaskCount: function () {
		if (U) {
			$("#usermenu").css("background-image", 'url("' + U.get('image_url') + '")');

			var length = APP.models.tasks.filter(APP.models.tasks.filters.Assigned(U)).length;
			if (length) {
				this.ui.taskcount.html("" + APP.Icon("tasks") + "" + length + "");
			} else {
				this.ui.taskcount.html("");
			}
		}
	},
	Search: function (e) {
		if (e.keyCode == 13) {
			$(".search_result:first").trigger("click");
			return;
		}

		if (this.ui.search.val().length > 2) {
			var search = new DEF.Search({
				search: this.ui.search.val()
			});
			this.ui.results.show();
			APP.root.showChildView('search', search);
		} else {
			this.ui.results.hide();
		}
	},
	LoadAll: function () {
		for (var mod in DEF.modules)
			DEF.modules[mod].Initialize();
	},
	GoHome: function () {
		APP.Route('#');
	},
	InitCollection: function (e) {
		var target = $(e.currentTarget).data('mode');
		DEF.modules[target].Initialize();
	},
	Go: function (e) {
		var target = $(e.currentTarget).data('mode');
		APP.Route('#' + target, target);
		APP.SetMode(target); // set mode immediately, for UI sakes, in case the view has to wait for the collecton to sync
	},
	Login: function () {
		APP.Route('#login');
	}
});
