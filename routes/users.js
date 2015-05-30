var Bcrypt = require('bcrypt');
var Joi = require('joi');
var Auth = require('./auth');

exports.register = function(server, options, next) {

	server.route([
	
// ------------------------------------------------- Show all users
		
		{
			method: 'GET',
			path: '/users',
			handler: function(request, reply) {
				var db = request.server.plugins['hapi-mongodb'].db;

				Auth.authenticated(request, function(result) {

					if(result.authenticated) {
						db.collection('users').find().toArray(function(err, users) {
							if(err) { throw err; };
							reply(users);
						});
					}
					else {
						return reply(result);
					}

				}); 
			}
		},
		
// ------------------------------------------------- Show one user
		
		{
			method: 'GET',
			path: '/user',
			handler: function(request, reply) {
				var db = request.server.plugins['hapi-mongodb'].db;
				var session = request.session.get('bookend-session');
				var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
				
				Auth.authenticated(request, function(result) {

					if(result.authenticated) {
						
						db.collection('users').findOne( { _id: ObjectID(session.user_id) }, function(err, user) {

							if (err) { reply(Hapi.error.internal('Internal MongoDB Error', err)); }
              
              console.log(user.favourites)
							
							reply( user.favourites );

						});
						
					}
					else {
						return reply(result);
					}
					
				});
			}
		},

// ------------------------------------------------- Update one user
		
		{
			method: 'PUT',
			path: '/users/edit',
			handler: function(request, reply) {
				var db = request.server.plugins['hapi-mongodb'].db;
				var session = request.session.get('bookend-session');
				var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
				var book = request.payload.book;
				console.log(book);

				Auth.authenticated(request, function(result) {

					if(result.authenticated) {
						db.collection('users').update( { _id: ObjectID(session.user_id) }, { $push: { favourites: book } } );
						reply( { ok: true } );
					}
					else {
						return reply(result);
					}

				}); 
			}
		},

		
// ------------------------------------------------- Sign Up/Create new user
		
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
		},
		
	]);

	next();
};

// ------------------------------------------------- Give this file some attributes

exports.register.attributes = {
	name: 'users-route',
	version: '0.0.1'
};