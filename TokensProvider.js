
// http://blog.ijasoneverett.com/2013/03/a-sample-app-with-node-js-express-and-mongodb-part-1/
// http://mongodb.github.io/node-mongodb-native/api-articles/nodekoarticle1.html
// https://groups.google.com/forum/#!topic/mongodb-user/j_CEdqu-dXs
/*
use admin
db.auth( '...' , '...' );
// http://docs.mongodb.org/v2.4/tutorial/add-user-to-database/
db.addUser( { user: "PasswordCollectorUser",
              pwd: "Password1234",
              role: [ { role: "userAdmin", db: "PasswordCollector" } ],
				roles: []
            } )
*/

var DATABASE = "mongodb://localhost:27017/PasswordCollector";

var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

TokensProvider = function() {
	// http://stackoverflow.com/questions/12846238/node-js-mongodb-set-default-safe-variable
	this.db = new Db("PasswordCollector", new Server("localhost", "27017", {}),{
		safe: true,
		auto_reconnect: true,
		fsync: true,
		w: 'majority'
	});
	this.db.open(function(){
		console.log('db.open '+JSON.stringify(arguments));
	});
	// http://stackoverflow.com/questions/4688693/how-do-i-connect-to-mongodb-with-node-js-and-authenticate
	this.db.authenticate("PasswordCollectorUser", "Password1234", function(err, res) {
		console.log('db.authenticate '+JSON.stringify(arguments));
	});
};

TokensProvider.prototype.getCollection = function(callback) {
  this.db.collection('tokens', function(error, tokens_collection) {
    if( error ) callback(error);
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
			var ris = tokens_collection.findOne(searchTerm);
			if(!ris) {
				callback(null,[]);
			} else {
				ris.toArray(function(error, results) {
					if( error ) callback(error);
					else callback(null, results);
				});
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
			console.log("save token: "+JSON.stringify(token));
			tokens_collection.insert(tokens, function() {
				console.log("insert token callback: "+JSON.stringify(arguments));
				callback(null, tokens);
			});
		}
	});
};

exports.TokensProvider = TokensProvider;
