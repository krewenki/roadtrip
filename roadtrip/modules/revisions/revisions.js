DEF.modules.revisions = {};
DEF.modules.revisions.Router = Roadtrip.Router.extend({

	initialize: function() {
		APP.models.revisions = new DEF.modules.revisions.Collection();
	},
	module: "revisions",
	routes: {
		"revisions/:cmd/:arg": "LoadModule",
		"revisions": "ShowRoot"
	},
});

DEF.modules.revisions.Model = Roadtrip.Model.extend({
	nameAttribute: 'revision', // the human-readable field in the record
	module: "revisions",
	defaults: {

    revision: 0,
    author: '',
    log: '',
    diff: '',
		comments: [],

		_: {
			views: 1,
			edits: 0,
			created_by: APP.anon
		}

	},

});

DEF.modules.revisions.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.revisions.Model,
	url: 'dev.telegauge.com:3000/roadtrip/revisions',
  comparator: function(r){
    return -r.get('revision');
  }
});


/**
 *  General views, defined for use with the router's automatic "$cmd" mechanism.
 */
DEF.modules.revisions.views = {
  view: Roadtrip.View.extend({
    module: 'revisions',
    template: require('./templates/view.html')
  }),
  RevisionLine: Roadtrip.RecordLine.extend({
    module: 'revisions',
    template: require('./templates/revisionline.html'),
    tagName: 'tr'
  })
}


DEF.modules.revisions.MainView = Roadtrip.RecordList.extend({
	id: 'REVISIONS',
	template: require("./templates/main.html"),
	childView: DEF.modules.revisions.views.RevisionLine,
  childViewContainer: '#record_list'
})
