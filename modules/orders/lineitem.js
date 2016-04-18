DEF.modules.orders.LineItemModel = Roadtrip.Model.extend({
	idAttribute: 'SOLI',
	nameAttribute: 'SOLI', // the human-readable field in the record
	module: "orders",
	defaults: {
		SOLI: "00000-00",
		order: 0,
		warehouse: "JAX"
	},
	GetLink: function(cmd) {
		if (!cmd)
			cmd = "view";
		return "#orders/editline/" + this.id;
	},
});

DEF.modules.orders.LineItemLine = Roadtrip.RecordLine.extend({
	tagName: "tr",
	template: require("./templates/lineitem_view.html"),
	events: {
		"click": "View"
	},
	View: function(e) {
		APP.Route("#orders/editline/" + this.model.id);
	}
});
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
});

DEF.modules.orders.views.editline = Roadtrip.View.extend({
	tagName: "table",
	className: "table table-full table-left",
	template: require("./templates/lineitem_edit.html"),
	onShow: function() {
		APP.SetTitle("Line Item " + this.model.id, "orders");
	}
});
