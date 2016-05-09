module.exports = [{
		"path": "/repositories/:id/diff/:rev1/:rev2",
		"method": "get",
		"handler": function (self) {
			return function (req, res) {
				var id = req.params.id;
				var rev1 = req.params.rev1;
				var rev2 = req.params.rev2;

				var svn = require('svn-spawn');
				var c = new svn();
				c.cmd(['diff', 'svn://dev.telegauge.com/roadtrip@' + rev1, 'svn://dev.telegauge.com/roadtrip@' + rev2], function (err, data) {
					res.send(data);
				})
			}
		}
	}

];
