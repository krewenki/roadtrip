var config = {
	uri: '127.0.0.1',
	database: 'roadtrip',
	auth: [{
		defaultUser: '56fea5cc54d49c036c802e53',
		strategy: 'local',
		sessionLength: 60 * 60 * 24 * 365,
		forceRootAuth: false,
		routes: {
			login: '/#login',
			passwordReset: '/password-reset'
		}
	}],

	onComplete: function (self, _, ObjectId) {
		self.settings.http.get('*', function (req, res) {
			var fs = require('fs');
			var user_id = '56fea5cc54d49c036c802e53';
			if (req.session && req.session.passport && req.session.passport.user) {
				user_id = req.session.passport.user._id;
			}

			self.db.collection('users')
				.find({
					'_id': ObjectId(user_id)
				}, function (err, doc) {
					var out;
					if (err) {
						console.log('Error finding user: ', err);
						out = err;
					} else {
						out = _.template(fs.readFileSync('./templates/application.html', {
							encoding: 'utf8'
						}))({
							"user": doc[0]
						});
					}
					res.send(out);
				});

		});

		//self.settings.http.get('*', function(req, res){

		//});

	},
	hooks: {
		revisions: require('../modules/revisions/server.js')
	}
};

module.exports = config;
