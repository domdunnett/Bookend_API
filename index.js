var Path = require('path');
var Hapi = require('hapi');
var server = new Hapi.Server();

server.connection({
	host: '0.0.0.0',
	port: process.env.PORT || 8000,
	routes: {
		cors: {
			headers: ['Access-Control-Allow-Credentials'],
			credentials: true
		}
	}
});

var plugins = [
	{ register: require('./routes/users.js') },
	{ register: require('./routes/sessions.js')},
	{ register: require('./routes/reviews.js')},
	{ register: require('hapi-mongodb'),
		options: {
			url: "mongodb://heroku_app36557135:rolcc11toifn8hv2fckolairt5@ds031952.mongolab.com:31952/heroku_app36557135",
			settings: {
				db: {
					native_parser: false
				}
			}
		} 
	},
	{ 
		register: require('yar'),
		options: {
			cookieOptions: {
				password: 'password',
				isSecure: false
			}
		}
	}
];

server.register(plugins, function(err) {
	if (err) { throw err; }

	server.start(function() {
		console.log('info', 'Server running at: ' + server.info.uri);
	});
}); 