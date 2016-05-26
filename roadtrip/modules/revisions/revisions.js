DEF.modules.revisions = {};
DEF.modules.revisions.Initialize = function () {
	if (!APP.models.revisions)
		APP.models.revisions = new DEF.modules.revisions.Collection();

};
DEF.modules.revisions.Router = Roadtrip.Router.extend({
	module: "revisions",
	collections: [
		"repositories", "revisions", "tasks"
	],
	routes: {
		"revisions/:cmd/:arg": "LoadModule",
		"revisions": "ShowRoot"
	},
});

DEF.modules.revisions.Model = Roadtrip.Model.extend({
	idAttribute: 'revision',
	nameAttribute: 'revision', // the human-readable field in the record
	module: "revisions",
	defaults: {

		revision: 0,
		repository: '56fe9a014b88de4618e306c7',
		author: '',
		log: '',
		diff: '',
		datetime: Date.now(),
		comments: [],
		changed: 0,
		removed: 0,
		diff_meta: [],
		_: {
			views: 1,
			edits: 0,
			created_by: APP.anon
		}

	},

});

DEF.modules.revisions.Collection = Roadtrip.Collection.extend({
	model: DEF.modules.revisions.Model,
	url: 'https://roadtrip.telegauge.com/roadtrip/revisions',
	comparator: function (r) {
		return -r.get('datetime');
	},
	minimum: {
		limit: 1
	}
});


/**
 *  General views, defined for use with the router's automatic "$cmd" mechanism.
 */
DEF.modules.revisions.views = {
	view: Roadtrip.View.extend({
		module: 'revisions',
		template: require('./templates/view.html'),
		templateHelpers: {
			markupDiff: function (diff) {
				var out = '';
				var files = this.splitByFile(diff);
				for (var file in files) {
					out += "<div class='file-diff'>" +
						"<div class='diff-header'>" + file + "</div>" +
						"<div class='diff-container'>" +
						this.generateDiff(files[file]) +
						"</div></div>";
				}
				return out;
			},
			splitByFile: function (diff) {

				var filename;
				var isEmpty = true;
				var files = {};
				diff.split("\n").forEach(function (line, i) {

					// Unmerged paths, and possibly other non-diffable files
					// https://github.com/scottgonzalez/pretty-diff/issues/11
					if (!line || line.charAt(0) === "*") {
						return;
					}

					if (['Modif', 'Added', 'Remove'].indexOf(line.substring(0, 5)) > -1) {
						isEmpty = false;
						filename = line.replace('Modified: ', '').replace('Added:', '').trim();
						files[filename] = [];
					}

					files[filename].push(line);
				});

				return isEmpty ? null : files;

			},
			generateDiff: function (diff) {
				diff.shift();
				diff.shift();
				var diffClasses = {
					"d": "file",
					"i": "file",
					"@": "info",
					"-": "delete",
					"+": "insert",
					" ": "context"
				};

				function escape(str) {
					return str
						.replace(/&/g, "&amp;")
						.replace(/</g, "&lt;")
						.replace(/>/g, "&gt;")
						.replace(/\t/g, "    ");
				}


				return diff.map(function (line) {
					var type = line.charAt(0);
					if (['---', '+++'].indexOf(line.substring(0, 3)) > -1) {
						return '';
					}
					return "<pre class='" + diffClasses[type] + "'>" + escape(line) + "</pre>";
				}).join("\n");

			}
		}
	}),
	RevisionLine: Roadtrip.RecordLine.extend({
		module: 'revisions',
		template: require('./templates/revisionline.html'),
		tagName: 'tr',
		Click: function (e) {
			var repo = APP.models.repositories.findWhere({
				'_id': this.model.get('repository')
			});
			APP.Route("#repositories/" + repo.get('name') + "/" + this.model.get('revision'), this.model.get(this.model.nameAttribute));
		}
	})
};


DEF.modules.revisions.MainView = Roadtrip.RecordList.extend({
	id: 'REVISIONS',
	template: require("./templates/main.html"),
	childView: DEF.modules.revisions.views.RevisionLine,
	childViewContainer: '#record_list',
	// A task can show, without requiring Revisions collection.  So, if it hasn't loaded
	// hide it.  But, if it syncs, and re-renders, figure out if we need to show it.
	onRender: function () {
		if (this.children.length)
			this.$el.parent().show();
	},
	onShow: function () {
		if (!this.children.length)
			this.$el.parent().hide();

	}
});
