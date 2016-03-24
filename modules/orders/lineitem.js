DEF.modules.orders.LineItemLine = Backbone.Marionette.ItemView.extend({
	tagName: "tr",
	template: require("./templates/view_lineitem.html")
})
DEF.modules.orders.LineItemView = Backbone.Marionette.CollectionView.extend({
	tagName: "table",
	className: "table table-full table-top",
	childView: DEF.modules.orders.LineItemLine
})