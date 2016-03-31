DEF.Search_Result = Backbone.Marionette.ItemView.extend({
	className: "search_result click",
	template: require("../templates/search_result.html"),
	templateHelpers: function() {
		return {
			term: this.model.search_string(),
			icon: this.model.icon()
		}
	},
	events: {
		"click": "Go"
	},
	Go: function() {
		$("#search").val("")
		$("#SEARCH").hide();
		APP.Route(this.model.GetLink("view"))
	}
})

DEF.Search = Backbone.Marionette.CompositeView.extend({
	template: require("../templates/search_results.html"),
	childView: DEF.Search_Result,
	childViewContainer: "#results",
	id: "search_result_box",
	onBeforeRender: function() {
		var search = this.options.search.toUpperCase();
		var matches = [];
		var modules = Object.keys(APP.models);
		for (var m = 0; m < modules.length; m++) {
			var module = modules[m];
			APP.models[module].each(function(model, index) {
				if (index < 15 && model.search_string().toUpperCase().indexOf(search) != -1)
					matches.push(model);
			})
		}
		this.collection = new Backbone.Collection(matches);
		this.collection.comparator = function(m) {
			return -m.get('_views');
		}
	},
})
