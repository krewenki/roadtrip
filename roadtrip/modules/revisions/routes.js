var routes = [

	{
		"path": "/revisions/github",
		"method": "get",
		"handler": function (req, res) {
			var obj = req.body; // should be a JSON object
			var repos = {
				"highway": "572a3771b91539200973a1c1",
				"backbone.highway": "572a3781b91539200973a1c2"
			}
			var repo = repos[obj.repository.name];
			// https://api.github.com/repos/krewenki/ reponame /commits/:sha
			var commits = obj.commits,
				commit, url;
			for (var i in commits) {
				commit = commits[i];
				url = 'https://api.github.com/repos/krewenki/' + obj.repository.name + '/commits/' + commit.id;
				request.get(url, function (d) {
					console.log(d);
				})

			}
			// obj.commits = array of commits.  fetch each SHA
		}
	}

];

module.exports = routes;
