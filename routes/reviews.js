var Bcrypt = require('bcrypt');
var Joi = require('joi');
var Auth = require('./auth');

exports.register = function(server, options, next) {
	// Include routes
	server.route([ 

		//Get all reviews
		{
			method: 'GET',
			path: '/reviews',
			handler: function(request, reply) {
				var db = request.server.plugins['hapi-mongodb'].db;

				db.collection('reviews').find().toArray(function(err, reviews) {
					if(err) { throw err; };
					reply(reviews); 
				});

			}
		},
		
		
		//Get one tweet
		{
			method: 'GET',
			path: '/reviews/{id}',
			handler: function(request, reply) {
        var id = encodeURIComponent(request.params.id);
        var db = request.server.plugins['hapi-mongodb'].db;
        var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
        
        db.collection('reviews').findOne( {"_id": ObjectID(id)}, function(err, tweet) {
          if (err) { throw err; }
          reply(tweet);
        });
			}
		},
		
		
		//Get user reviews
		{
			method: 'GET',
			path: '/users/{username}/reviews',
			handler: function(request, reply) {
        var userQuery = encodeURIComponent(request.params.username);
        var db = request.server.plugins['hapi-mongodb'].db;
				var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
        
        db.collection('users').findOne( { 'username': userQuery }, function(err, user) {
          if (err) { throw err; }
					
					if (user == null) {
						return reply( { message: "User doesn't exist" } );
					}
					
          db.collection('reviews').find({ user_id: ObjectID(user._id) }).toArray(function(err, userReviews) {
          	if (err) { throw err; }
						
          	reply(userReviews);
          });
        });
			}
		},
		
		
		//Create a new Review
		{
			method: 'POST',
			path: '/reviews',
			handler: function(request, reply) {
				var db = request.server.plugins['hapi-mongodb'].db;
				var newReview = request.payload.review;
				var session = request.session.get('bookend-session');
				var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
				newReview['user_id'] = ObjectID(session.user_id);
				newReview['date'] = new Date;

				Auth.authenticated(request, function(result) {

					if(result.authenticated) {
						
						db.collection('users').findOne( { _id: ObjectID(session.user_id) }, function(err, user) {
							if (err) { reply(Hapi.error.internal('Internal MongoDB Error', err)); }
							
							newReview['username'] = user.username;
							
							db.collection('reviews').insert(newReview, function(err, writeResult) {
								if (err) { reply(Hapi.error.internal('Internal MongoDB Error', err)); }
								else { reply( { ok: true} ); }  
							});

						});
						
					}
					else {
						return reply(result);
					}

				});

			}
		},
		
		
		//Delete a Review
		{
			method: 'DELETE',
			path: '/reviews/{id}',
			handler: function(request, reply) {
				var db = request.server.plugins['hapi-mongodb'].db;
        var id = encodeURIComponent(request.params.id);
        var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
        
        db.collection('reviews').remove( {"_id": ObjectID(id)}, true );
        reply("Review with id " + id + " has been deleted.");
			}
		},
		
		
		//Search reviews
		{
			method: 'GET',
			path: '/reviews/search/{query}',
			handler: function(request, reply) {
        var query = encodeURIComponent(request.params.query);
        var db = request.server.plugins['hapi-mongodb'].db;
        
        db.collection('reviews').find( { $text: { $search: query } } ).toArray( function(err, searchResults) {
          if (err) { throw err; }
          reply(searchResults);
        });
			}
		}

	]);

	next();
};

// Give this file some attributes

exports.register.attributes = {
	name: 'reviews-route',
	version: '0.0.1'
};