var Bcrypt = require('bcrypt');
var Joi = require('joi');

exports.register = function(server, options, next) {
	// Include routes
	server.route([
	{
		method: 'GET',
		path: '/users',
		handler: function(request, reply) {
			var db = request.server.plugins['hapi-mongodb'].db;

			db.collection('users').find().toArray(function(err, users) {
				if(err) { throw err; };
				reply(users);
			});
		}
	},
	{
		method: 'POST',
		path: '/users',
		config: {
			handler: function(request, reply) {
				var db = request.server.plugins['hapi-mongodb'].db;

				var newUser = request.payload.user;

				Bcrypt.genSalt(15, function(err, salt) {
					Bcrypt.hash(newUser.password, salt, function(err, hash) {
						newUser.password = hash;

						var uniqUserQuery = {
							$or: [
								{ username: newUser.username },
								{ email: newUser.email }
							]
						};

						db.collection('users').count(uniqUserQuery, function(err, userExist) {
							if(userExist) { return reply('Error: Username already exists', err); }
							
							db.collection('users').insert(newUser, function(err, writeResult) {
				          if (err) { reply(Hapi.error.internal('Internal MongoDB Error', err)); }
				          else { reply( { ok: true } ); }
				      });
						});

					});

				});
			},
			validate: {
				payload: {
					user: {
						username: Joi.string().min(3).max(20).required(),
						email: Joi.string().email().max(50).required(),
						password: Joi.string().min(5).max(20).required()
					}
				}
			}
		}
	}


	]);

	next();
};

// Give this file some attributes

exports.register.attributes = {
	name: 'users-route',
	version: '0.0.1'
};