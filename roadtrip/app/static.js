DEF.StaticLayout = Backbone.Marionette.ItemView.extend({
	className: 'pad10',
	onBeforeRender: function() {
		var templates = {
			"home": require('../pages/home.md'),
			"login": require('../templates/login.html')
		};
		this.template = function() {
			return templates[this.options.page];
		}.bind(this);

	},
	ui: {
		tables: "table"
	},
	onRender: function() {
		APP.SetTitle(this.options.page);
		this.ui.tables.addClass("table");
	},
});
