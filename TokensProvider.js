
// http://blog.ijasoneverett.com/2013/03/a-sample-app-with-node-js-express-and-mongodb-part-1/
// http://mongodb.github.io/node-mongodb-native/api-articles/nodekoarticle1.html
// https://groups.google.com/forum/#!topic/mongodb-user/j_CEdqu-dXs
/*
use admin
db.auth( '...' , '...' );

use PasswordCollector
db.addUser("PasswordCollectorUser","Password1234")

*/

var DATABASE = "mongodb://localhost:27017/PasswordCollector";

// http://mongodb.github.io/node-mongodb-native/api-generated/db.html
var mongo = require('mongodb'),
	Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    assert = require('assert');

TokensProvider = function() {
	// http://stackoverflow.com/questions/12846238/node-js-mongodb-set-default-safe-variable
	//mongo.Db('PasswordCollectorUser:Password1234@localhost/PasswordCollector?auto_reconnnect');
	var db = this.db = new Db("PasswordCollector", new Server("localhost", "27017", {}),{
		safe: false,
		auto_reconnect: true,
		fsync: true,
		w: 'majority',
		native_parser: false
	});
	db.open(function(err,db){
		console.log('db.open');
		assert.equal(null, err);
		
		/*
		// Add a user to the database
		db.addUser('PasswordCollectorUser', 'Password1234', function(err, result) {
			assert.equal(null, err);
			
			// Authenticate
			db.authenticate('PasswordCollectorUser', 'Password1234', function(err, result) {
				assert.equal(true, result);
				
				// Logout the db
				db.logout(function(err, result) {
					assert.equal(true, result);
					
					// Remove the user
					db.removeUser('user3', function(err, result) {
						assert.equal(true, result);
						
						db.close();
					});
					
				});
				
			});
		});
		*/
		
		//console.log(arguments);
		// http://stackoverflow.com/questions/4688693/how-do-i-connect-to-mongodb-with-node-js-and-authenticate
		db.authenticate("PasswordCollectorUser", "Password1234", function(err, res) {
			assert.equal(null, err);
			
			console.log('db.authenticate '+JSON.stringify(arguments));
		});
		
	});
};

TokensProvider.prototype.getCollection = function(callback) {
  this.db.collection('tokens', function(error, tokens_collection) {
    if( error ) callback(error, false);
    else callback(null, tokens_collection);
  });
};

//find all tokens
TokensProvider.prototype.findAll = function(callback) {
	this.getCollection(function(error, tokens_collection) {
		if( error ) {
			if(callback)	callback(error);
			else {
				console.log("findAll error: "+error);
			}
		} else {
			tokens_collection.find().toArray(function(error, results) {
				if( error ) {
					if(callback)	callback(error);
					else {
						console.log("findAll error: "+error);
					}
				} else {
					if(callback)	callback(null, results);
				}
			});
		}
	});
};

//find one token
TokensProvider.prototype.findOne = function(searchTerm, callback) {
	this.getCollection(function(error, tokens_collection) {
		if( error ) {
			callback(error);
		} else if(!tokens_collection) {
			callback("undefined collection");
		} else {
			//console.log('tokens.findOne('+JSON.stringify(searchTerm)+')');
			
			// http://stackoverflow.com/questions/5010288/how-to-make-a-function-wait-until-a-callback-has-been-called-using-node-js
			var ris = false;
			var uvrun = require("uvrun");
			
			tokens_collection.findOne(searchTerm, {}, function(err,r) {
				//console.log('callback '+r);
				ris = r;
			});
			
			while (!ris) {
				uvrun.runOnce();
			}
			
			//console.log('ris: '+JSON.stringify(ris));
			
			if(!ris) {
				//console.log('tokens.findOne result null');
				if(typeof(callback)=="function")	callback(null,[]);
				return false;
			} else {
				//console.log('tokens.findOne result '+JSON.stringify(ris));
				if(typeof(callback)=="function")	callback(null,ris);
				return ris;
				/*
				ris.toArray(function(error, results) {
					if( error ) callback(error);
					else callback(null, results);
				});
				*/
			}
		}
	});
};

//save new token
TokensProvider.prototype.save = function(tokens, callback) {
	this.getCollection(function(error, tokens_collection) {
		if( error ) {
			callback(error);
		} else if(!tokens_collection) {
			callback("undefined collection");
		} else {
			if( typeof(tokens.length)=="undefined") {
				tokens = [tokens];
			}
			for( var i=0; i < tokens.length; i++ ) {
				token = tokens[i];
				token.created_at = new Date();
			}
			console.log("save token: "+JSON.stringify(tokens));
			tokens_collection.insert(tokens, {w:1}, function(err, records) {
				//console.log(err);
				console.log("insert token callback: "+JSON.stringify(records));
				//callback(null, records);
			});
		}
	});
};

exports.TokensProvider = TokensProvider;
