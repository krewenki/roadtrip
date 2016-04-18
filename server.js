var express = require('express');
var path = require('path');
var httpProxy = require('http-proxy');

var Highway = require('highway');

// We need to add a configuration to our proxy server,
// as we are now proxying outside localhost
var proxy = httpProxy.createProxyServer({
	changeOrigin: true
});

var isProduction = process.env.NODE_ENV === 'production';
var port = isProduction ? process.env.PORT : 3000;
var publicPath = path.resolve(__dirname, 'public');


var app = express();
var http = require('http').Server(app);





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

app.set('host', isProduction ? process.env.HOST : 'localhost');
var server = app.listen(port, function () {
	console.log('Server running on port ' + port);
});
var io = require('socket.io').listen(server);
io.set('origins', 'http://localhost:3000');

app.get('/user/:id', function (req, res, next) {
	if (req.params.id === 'me') {
		res.json(req.user);
	} else {
		res.status(500).send({
			error: 'Invalid user id'
		});
	}
});

var config = require('./server/config.js');
config.http = app;
config.io = io;

var hw = new Highway(config)
