var express = require('express');
var path = require('path');
var httpProxy = require('http-proxy');

var Highway = require('highway');

// We need to add a configuration to our proxy server,
// as we are now proxying outside localhost
var proxy = httpProxy.createProxyServer({
	changeOrigin: true
});
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


var isProduction = process.env.NODE_ENV === 'production';
var port = isProduction ? process.env.PORT : 3000;
var publicPath = path.resolve(__dirname, 'public');

app.use(express.static(publicPath));

if (!isProduction) {

	var bundle = require('./server/bundle.js');
	bundle();
	app.all('/build/*', function (req, res) {
		proxy.web(req, res, {
			target: 'http://localhost:8080'
		});
	});

}

proxy.on('error', function (e) {
	console.log('Could not connect to proxy, please try again...');
});

app.listen(port, function () {
	console.log('Server running on port ' + port);
});

app.get('/user/:id', function (req, res, next) {
	if (req.params.id === 'me') {
		res.json(req.user);
	} else {
		res.status(500).send({
			error: 'Invalid user id'
		});
	}
});

var hw = new Highway({
	uri: 'dev.telegauge.com',
	database: 'roadtrip',
	http: app,
	io: io,
	auth: [
		{
			defaultUser: '56fea5cc54d49c036c802e53',
			strategy: 'local',
			sessionLength: 60*60*24*365,
			forceRootAuth: false,
			routes : {
				login : '/#login'
			},
			homeCallback: function(req,res){
				if(!req.session || !req.session.passport.user){
					res.redirect('/login.html')
				} else {
					res.sendFile(path.resolve('public/index_template.html'));
				}
			}
		}
	]
})
