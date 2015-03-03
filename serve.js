var fs			= require('fs'),
	path		= require('path'),
	http		= require('http'),
	https		= require('https'),
	express		= require('express'),
	staticGzip	= require('connect-gzip-static'),
	livereload	= require('connect-livereload'),
	config		= require('./gulp/config'),
	paths		= require('./gulp/paths');

module.exports = function () {
	var app = express();

	// default index redirect
	app.use(function (req, res, next) {
		console.log('serve', req.url);
		if (req.url == '/')
			req.url = '/index.html';
		next();
	});

	// inject livereload
	app.use(livereload({
		port: config.livereloadListenPort
	}));

	// serve content, search for pre-compiled gzip with gracefully fallback to plaintext
	app.use(staticGzip(paths.output));

	var options = null;
	try {
		options = {
			key: fs.readFileSync('key.pem'),
			cert: fs.readFileSync('cert.pem')
		};
	} catch (err) {
		console.log('No certificate found - starting http mode...', err);
	}

	// woa!
	var server = options ? https.createServer(options, app) : http.Server(app);
	server.listen(config.listenPort, config.listenAddress);

	console.log('Serving content from ' + path.resolve(__dirname, paths.output));
	console.log('LISTENING ON ' + config.listenAddress + ':' + config.listenPort);
};