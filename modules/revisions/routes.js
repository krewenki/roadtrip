var routes = [

	{
		"path": "/revisions/github",
		"method": "post",
		"handler": function (s) {
			var self = s;
			return function (req, res) {
				var request = require('request');
				var obj = req.body; // should be a JSON object

				var repos = {
					"highway": "572a3771b91539200973a1c1",
					"backbone.highway": "572a3781b91539200973a1c2"
				}
				var repo = repos[obj.repository.name];
				// https://api.github.com/repos/krewenki/ reponame /commits/:sha
				var commits = obj.commits,
					commit, url, req;
				for (var i in commits) {
					commit = commits[i];
					url = 'https://api.github.com/repos/krewenki/' + obj.repository.name + '/commits/' + commit.id;
					console.log('Fetching ', url);
					request({
						url: url,
						headers: {
							'User-Agent': 'roadtrip'
						}
					}, function (error, response, body) {
						var c = JSON.parse(body);
						console.log(c);
						var files = [],
							changed, removed, total_changed, total_removed, diff = '',
							lines, save;
						for (var i in c.files) {
							changed = 0;
							removed = 0;
							diff += c.files[i].patch;
							lines = c.files[i].patch.split("\n");
							for (var n in lines) {
								if (lines[n].charAt(0) == '+')
									changed++;
								if (lines[n].charAt(0) == '-')
									removed--;
							}
							files.push({
								changed: changed,
								removed: removed,
								file: c.files[i].filename
							})
							total_changed += changed;
							total_removed += removed;
						}
						save = {
							revision: commit.id,
							repository: repo,
							author: '56f3f7cb4b88de4618e306c0', // Not always warren, but hardcode for laziness now
							datetime: new Date(c.commit.author.date).getTime(), // change this to the actual commit time?
							log: c.commit.message,
							changed: total_changed,
							removed: total_removed,
							diff_meta: files
						}
						self.db.createRecord('revisions', save).then(function (record) {
							res.send(record);
						}, function (error) {
							res.send(error)
						})

					})
				}
			}
		}
	}

];

module.exports = routes;
