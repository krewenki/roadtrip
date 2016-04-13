// example: http://www.christianalfoni.com/articles/2015_04_19_The-ultimate-webpack-setup

var Webpack = require('webpack');
var path = require('path');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');
var buildPath = path.resolve(__dirname, 'public', 'build');
var mainPath = path.resolve(__dirname, 'app', 'main.js');

var marked = require("marked");
var mdrenderer = new marked.Renderer();

var WebpackNotifierPlugin = require('webpack-notifier');


var config = {
	resolve: {
		extensions: ["", ".js", ".jsx", ".node", ".webpack-loader.js", ".web-loader.js", ".loader.js"]
	},
	node: {
		fs: "empty",
		net: "empty",
		tls: "empty"
	},
	output: {

		// We need to give Webpack a path. It does not actually need it,
		// because files are kept in memory in webpack-dev-server, but an
		// error will occur if nothing is specified. We use the buildPath
		// as that points to where the files will eventually be bundled
		// in production
		path: buildPath,
		filename: 'bundle.js',

		// Everything related to Webpack should go through a build path,
		// localhost:3000/build. That makes proxying easier to handle
		publicPath: '/build/'
	},
	module: {
		loaders: [{
			test: /\.js$/,
			loader: 'babel',
			exclude: [nodeModulesPath],
			query: {
				presets: ['es2015']
			}
		}, {
			test: /\.(otf|eot|png|ico|svg|ttf|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
			loader: 'url?limit=8192'
		}, {
			test: /\.css$/,
			loader: 'style!css'
		}, {
			test: /\.html$/,
			loader: "underscore-template-loader"
		}, {
			test: /\.less$/,
			loader: "style!css!less"
		}, {
			test: /\.scss$/,
			loader: 'style!css!sass'
		}, {
			test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
			loader: "file"
		}, {
			test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
			loader: "url?limit=10000&mimetype=image/svg+xml"
		}, {
			test: /\.md$/,
			loader: "html!markdown"
		}, {
			test: /\.node$/,
			loader: "node-loader"
		}]
	},

	// We have to manually add the Hot Replacement plugin when running
	// from Node
	plugins: []
};


if (process.env.NODE_ENV == 'production') {
	//    config.output.path = __dirname + '/dist';
	config.entry = [mainPath];
	config.plugins.push(new Webpack.optimize.UglifyJsPlugin({
		sourceMap: false,
		mangle: {
			minimize: true,
			eval: true,
			toplevel: true,
			compress: {
				warnings: false
			},
			except: ['$', 'module', 'require', 'exports', '__webpack_require__']
		}
	}));
} else {
	config.plugins.push(new Webpack.HotModuleReplacementPlugin());
	config.plugins.push(new WebpackNotifierPlugin());
	// Makes sure errors in console map to the correct file
	// and line number
	config.devtool = 'source-map';
	config.entry = [
		// For hot style updates
		'webpack/hot/dev-server',
		// The script refreshing the browser on none hot updates
		'webpack-dev-server/client?http://localhost:8080',
		// Our application
		mainPath
	];

}



module.exports = config;
