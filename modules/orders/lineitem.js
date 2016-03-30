DEF.modules.orders.LineItemLine = Roadtrip.RecordLine.extend({
	tagName: "tr",
	template: require("./templates/lineitem_view.html"),
	events: {
		"click": "View"
	},
	View: function(e) {
		APP.Route("#orders/editline/" + this.model.get('_id'))
	}
})
DEF.modules.orders.LineItemView = Roadtrip.RecordList.extend({
	template: require("./templates/lineitems.html"),
	className: "#LINEITEMS",
	childView: DEF.modules.orders.LineItemLine,
	emptyView: DEF.EmptyView,
	emptyViewOptions: {
		icon: "warning",
		msg: "No line items found",
		colspan: 3
	},
})

DEF.modules.orders.views.editline = Roadtrip.View.extend({
	initialize: function() {
		console.log('x');
	}
});
