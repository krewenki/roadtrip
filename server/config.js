var config = {
	uri: 'dev.telegauge.com',
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

	XonComplete: function() {
		this.http.get('/', function(req, res) {
			var _ = require('underscore');
			var fs = require('fs');
			res.send(_.template(fs.readFileSync('templates/application.html', {
				encoding: 'utf8'
			}))(req.session.passport));
		});
	}
};

module.exports = config;
