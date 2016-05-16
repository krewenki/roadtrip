var config = {
	uri: 'roadtrip.telegauge.com',
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
	email: {
		transporter: 'smtps://krewenki%40gmail.com:rvbaveokrgpdfdda@smtp.gmail.com', // I guess we could use telegauge for now
		messages: {
			passwordReset: {
				subject: 'Reset your roadtrip password',
				template: __dirname + '/templates/email/password_reset.html', // pass a path, parse it when we need it
			}
		}
	},

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
					res.send(_.template(fs.readFileSync('./templates/application.html', {
						encoding: 'utf8'
					}))({
						"user": doc[0]
					}));
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
