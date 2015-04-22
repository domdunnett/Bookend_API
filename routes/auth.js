module.exports = {};

module.exports.authenticated = function(request, callback) {
	
	var session = request.session.get('bookend-session');
	var db = request.server.plugins['hapi-mongodb'].db;

	if(!session) {
		return callback({ 
			message: "Logged out.",
			authenticated: false
		}); 
	}

	db.collection('sessions').findOne({ session_id: session.session_key }, function(err, result) {
		if(result === null) {
			return callback({		
				message: "Logged out.",
				authenticated: false 
			});
		}
		else {
			return callback({		
				message: "Logged in.",
				authenticated: true 
			});
		}
	});

};

