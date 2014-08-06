
/*
	SQLite3 token session provider
	https://www.npmjs.org/package/sqlite3
	
	var sqlite3 = require('sqlite3').verbose();
	var db = new sqlite3.Database(':memory:');
*/

var DATABASE = ":memory:";

var sqlite3 = require('sqlite3').verbose();

TokensProvider = function(db) {
	console.log("serialization");
	db.serialize(function() {
		/*
		{
			id
			address: req.socket.remoteAddress,
			//port: req.socket.remotePort,
			token: token
		}
		*/
		var sql = "CREATE TABLE token (id UNSIGNED PRIMARY KEY, token TEXT, address TEXT, date_insert DATE)";
		console.log(sql);
		var ris = db.run(sql,function(err,row) {
			if(err)	console.log(err);
		});
		console.log(ris);
		
		/*
		var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
		for (var i = 0; i < 10; i++) {
			stmt.run("Ipsum " + i);
		}
		stmt.finalize();
		*/
		
		db.each("SELECT * FROM token", function(err, row) {
			console.log(err);
			console.log(row.id + ": " + row.info);
		});
		
	});
	this.db = db;
};

TokensProvider.prototype.getCollection = function(callback) {
	var sql = "SELECT * FROM token";
	//console.log(sql);
	/*var ris = this.db.each(sql, function(err, row) {
		console.log(err);
		console.log(row.id + ": " + row.info);
	});*/
	var ris = this.db.all(sql);
	console.log(ris);
	/*this.db.collection('tokens', function(error, tokens_collection) {
    if( error ) callback(error, false);
    else callback(null, tokens_collection);
  });*/
};

//find all tokens
TokensProvider.prototype.findAll = function(callback) {
	var sql = "SELECT * FROM token";
	//console.log(sql);
	/*var ris = this.db.each(sql, function(err, row) {
		console.log(err);
		console.log(row.id + ": " + row.info);
	});*/
	var ris = this.db.all(sql);
	console.log(ris);
	if(callback)	callback(null, ris);
	else	return ris;
};

//find one token
TokensProvider.prototype.findOne = function(searchTerm, callback) {
	var sql = "SELECT * FROM token WHERE 1 ";
	console.log(searchTerm);
	for(var prop in searchTerm) {
		sql = sql + "AND "+prop+" = '"+searchTerm[prop]+"' ";
	}
	console.log(sql);
	var ris = this.db.get(sql, function(err, row) {
		console.log(err);
		console.log(row.id + ": " + row.info);
		if(callback)	callback(null, ris);
		else	return ris;
	});
	console.log(ris);
	/*
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
	ris.toArray(function(error, results) {
		if( error ) callback(error);
		else callback(null, results);
	});
	*/
};

//save new token
TokensProvider.prototype.save = function(tokens, callback) {
	/*this.getCollection(function(error, tokens_collection) {
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
	});*/
};

exports.TokensProvider = TokensProvider;
