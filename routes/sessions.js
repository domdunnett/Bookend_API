var Bcrypt = require('bcrypt');
var Auth = require('./auth');

exports.register = function(server, options, next) {

	server.route([

// ------------------------------------------------- sign in and create a session
		
		{
			method: 'POST',
			path: '/sessions',
			handler: function(request, reply)	{
				var db = request.server.plugins['hapi-mongodb'].db;
				var user = request.payload.user
				console.log(user);

				db.collection('users').findOne( { username: user.username }, function(err, userMongo) {
					if (err) { return reply('Internal MongoDB error', err); };

					if(userMongo === null) {
						return reply( { message: "User doesn't exist" } );
					}

					Bcrypt.compare(user.password, userMongo.password, function(err, match) {
						if (match) {

						  function randomKeyGenerator() {
    						return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
  						}
   
						  // Generate a random key
						  var randomKey = randomKeyGenerator() + randomKeyGenerator() + "-" + randomKeyGenerator() + "-4" + 
						  		randomKeyGenerator().substr(0,3) + "-" + randomKeyGenerator() + "-" + randomKeyGenerator() + 
						  		randomKeyGenerator() + randomKeyGenerator().toLowerCase();

							var newSession = {
								session_id: randomKey,
								user_id: userMongo._id
							};

							db.collection('sessions').insert(newSession, function(err, writeResult) {
								if(err) { return reply('Internal MongoDB error', err); }

								request.session.set('bookend-session', {
									session_key: randomKey,
									user_id: userMongo._id
								});

								return reply( { ok: true } );
							});

						}
						else { reply( err )}
					});

				});

			}		
		},
		
// ------------------------------------------------- check if the user is logged in/authenticated
		
		{
			method: 'GET',
			path: '/authenticated',
			handler: function(request, reply) {
				Auth.authenticated(request, function(result) {
					reply( { ok: true } );
				});
			}
		},
		
// ------------------------------------------------- log out/delete session
		
		{
			method: 'DELETE',
			path: '/sessions',
			handler: function(request, reply) {
				var session = request.session.get('bookend-session');
				var db = request.server.plugins['hapi-mongodb'].db;
				
				db.collection('sessions').remove({ session_id: session.session_key }, function(err, writeResult) {
					if (err) { return reply('Internal MongoDB error', err); }	
					reply( { ok: true } );

				});
			}
		}

	])

	next();

};

exports.register.attributes = {
	name: 'sessions-routes',
	version: '0.0.1'
};