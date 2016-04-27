DEF.modules.orders.reports.production_line = Roadtrip.RecordLine.extend({
	template: require("./templates/reports/production_line.html"),
});

DEF.modules.orders.reports.production = Roadtrip.RecordList.extend({
	id: 'PRODUCTION',
	search: "",
	template: require("./templates/reports/production.html"),
	childView: DEF.modules.orders.reports.production_line,
	childViewContainer: "#record_list",

});
