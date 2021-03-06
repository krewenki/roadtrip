var routes = [

	{
		"path": "/revisions/github",
		"method": "post",
		"handler": function (s) {
			var self = s;
			var ObjectId = require('mongojs').ObjectId;
			return function (req, res) {
				var request = require('request');
				var obj = req.body; // should be a JSON object

				var repos = {
					"highway": "572a3771b91539200973a1c1",
					"backbone.highway": "572a3781b91539200973a1c2"
				};
				var repo = repos[obj.repository.name];
				// https://api.github.com/repos/krewenki/ reponame /commits/:sha
				var commits = obj.commits,
					commit, url;
				for (var i in commits) {
					commit = commits[i];
					url = 'https://api.github.com/repos/krewenki/' + obj.repository.name + '/commits/' + commit.id;
					request({
						url: url,
						headers: {
							'User-Agent': 'roadtrip'
						}
					}, function (error, response, body) {
						var c = JSON.parse(body);
						var files = [],
							changed, removed, total_changed = 0,
							total_removed = 0,
							diff = '',
							lines, save;
						for (var i in c.files) {
							changed = 0;
							removed = 0;
							diff += 'Modified: ' + c.files[i].filename +
								"\n" + "============" + c.files[i].patch;
							lines = c.files[i].patch.split("\n");
							for (var n in lines) {
								if (lines[n].charAt(0) == '+')
									changed++;
								if (lines[n].charAt(0) == '-')
									removed++;
							}
							files.push({
								changed: changed,
								removed: removed,
								file: c.files[i].filename
							});
							total_changed += changed;
							total_removed += removed;
						}
						var tasks = c.commit.message.match(/(#[0-9.]*)/ig);
						var task_id = '';
						if (tasks && tasks.length > 0) {
							task_id = tasks[0].replace('#', '');
						}
						save = {
							revision: c.sha,
							repository: repo,
							author: ObjectId('56f3f7cb4b88de4618e306c0'), // Not always warren, but hardcode for laziness now
							//author: 'wck', Not wck,  why not point at the author, instead of
							datetime: new Date(c.commit.author.date).getTime(),
							diff: diff,
							diff_meta: files,
							changed: total_changed,
							removed: total_removed,
							log: c.commit.message,
							task_id: task_id
						};
						self.db.createRecord(save, 'revisions').then(function (record) {

							self.db.createRecord({
								revision: record._id,
								diff: diff
							}, 'diffs').then(function () {

							});

						}, function (error) {
							//res.send(error)
						});
					});
				}
			};
		}
	}
];

module.exports = routes;
