
var PORT = 9797;
var JSPORT = 9798;

var http = require('http');

var fs = require('fs');

// http://nodejs.org/api/path.html
var path = require('path');

// http://stackoverflow.com/questions/10645994/node-js-how-to-format-a-date-string-in-utc
// npm install dateformat
var dateformat = require('dateformat');

// https://gist.github.com/diorahman/1520485
var express = require('express');

// https://www.npmjs.org/package/rand-token
// Create a token generator with the default settings:
var randtoken = require('rand-token');

// http://stackoverflow.com/questions/6388842/nodejs-http-server-how-to-verify-clients-ip-and-login
// https://github.com/gevorg/http-auth
// sudo port install npm
// sudo npm install http-auth
// Authentication module.
// htpasswd users.htpasswd <USERNAME>
var auth = require('http-auth');
var basic = auth.basic({
    realm: "Exatel Private Area.",
    file: __dirname + "/users.htpasswd" // gevorg:gpass, Sarah:testpass ...
});

// http://stackoverflow.com/questions/14626636/how-do-i-shutdown-a-node-js-https-server-immediately/14636625#14636625
var sockets = [];

var allowedIps = ['127.0.0.1','::1'];

var plainFiles = ['favicon.ico','sansation_light.woff','style.css','add1.png','search1.png','jquery-1.11.1.min.js'];

// Generate mostly sequential tokens:
var suid = randtoken.suid;
//var token = suid(16);

var TokensProvider = require('./TokensProvider').TokensProvider;
var tokenprovider = new TokensProvider();

// http://www.phpied.com/sleep-in-javascript/
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

//sleep(3000);
//console.log("tokens: "+JSON.stringify(tokenprovider.findAll()));

var variables = {
	backend: 'http://localhost:'+JSPORT+'/endpoint/%token%'
};

// http://stackoverflow.com/questions/6388842/nodejs-http-server-how-to-verify-clients-ip-and-login
var http = require('http');
var server = http.createServer(basic, function (req, res) {
	
	//console.log(res.socket.remoteAddress);
	if( allowedIps.indexOf(res.socket.remoteAddress) == -1 ) {
		res.writeHead(403, {'Content-Type': 'text/plain'});
		res.end('Access denied');
		//res.socket.destroy();
		return;
	}
	
	//res.write("Welcome to private area - " + req.user + "! ip: "+req.connection.remoteAddress);
	console.log("port "+res.socket.localPort+" client "+res.socket.remoteAddress+" has requested "+req.url+"");
	// Client address in request -----^
	
	if(plainFiles.indexOf(path.basename(req.url))>-1) {
		fs.readFile('./'+path.basename(req.url), function (err, content) {
		    if (err) {
		        console.log(err); 
				res.writeHead(404, {'Content-Type': 'text/plain'});
				res.end();
		    } else {
				
				var header = {};
				
				if(path.extname(req.url)=='.ico') {
					header['Content-Type'] = 'image/x-icon';
				} else if(path.extname(req.url)=='.woff') {
					header['Content-Type'] = 'application/x-font-woff';
				} else if(path.extname(req.url)=='.css') {
					header['Content-Type'] = 'text/css';
				} else if(path.extname(req.url)=='.js') {
					header['Content-Type'] = 'application/javascript';
				}
				
				fs.stat( './'+path.basename(req.url), function(err, stats) {
					
					// http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html
					// http://stackoverflow.com/questions/7559555/last-modified-file-date-in-node-js
					//console.log(stats);
					if( stats && stats.mtime ) {
						// 'Wed, 15 Nov 1995 04:58:08 GMT'
						var date = new Date(stats.mtime);
						//console.log(date);
						// http://stackoverflow.com/questions/10645994/node-js-how-to-format-a-date-string-in-utc
						// https://github.com/felixge/node-dateformat
						var day = dateformat(date, "ddd, dd mmm yyyy HH:MM:ss Z");
						//console.log(dateformat.masks.default);
						//console.log(stats.mtime+' '+day);
						header['Last-Modified'] = day;
					}
					
					// http://stackoverflow.com/questions/8164802/serialize-javascript-object-into-a-json-string
					//console.log('answered 200 '+JSON.stringify(header));
					res.writeHead(200, header);
					res.end(content);
					
				});
				
		    }
		});
		return;
	}
	
	fs.readFile('./index.html', function (err, html) {
	    if (err) {
	        //throw err; 
			console.log(err);
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.end();
	    } else {
			
			var header = {};
			
			header['Content-Type'] = 'text/html';
			
			fs.stat( './'+path.basename(req.url), function(err, stats) {
				
				if( stats && stats.mtime ) {
					// 'Wed, 15 Nov 1995 04:58:08 GMT'
					var date = new Date(stats.mtime)
					var day = dateformat(date, "ddd, dd mmm yyyy HH:MM:ss Z");
					//console.log(dateformat.masks.default);
					//console.log(stats.mtime+' '+day);
					header['Last-Modified'] = day;
				}
				
				//console.log('answered 200 '+JSON.stringify(header));
				res.writeHead(200, header);
				
				// http://nodejs.org/api/buffer.html#buffer_buf_tostring_encoding_start_end
				html = html.toString();
				//console.log(html);
				
				for(var x in variables) {
					//console.log(x+' '+variables[x]);
					// http://stackoverflow.com/questions/13467981/string-replace-not-working-in-node-js-express-server
					// http://stackoverflow.com/questions/494035/how-do-you-pass-a-variable-to-a-regular-expression-javascript
					html = html.replace( new RegExp("%"+x+"%","gi"), variables[x]);
				}
				
				tokenprovider.findOne({
					address: req.socket.remoteAddress,
					//port: req.socket.remotePort,
					token: { $exists: 1 }
				},function(err,ris) {
					var token = ris && ris[0] ? ris[0] : false;
					if( !token ) {
						token = suid(16);
						tokenprovider.save({
							address: req.socket.remoteAddress,
							//port: req.socket.remotePort,
							token: token
						},function(err,ris){
							console.log('save callback');
							//console.log(err);
							//console.log(ris);
						});
					}
					html = html.replace( new RegExp("%token%","gi"), token);
				
					res.write(html);
					res.end();
				});
			});
			
	    }
	});
	
});

server.on('connection', function(socket) {
	console.log('Client connected from ' + socket.remoteAddress);
	// Client address at time of connection ----^
	sockets.push(socket);
	socket.setTimeout(4000);
	socket.once('close', function () {
		//console.log('socket closed');
		sockets.splice(sockets.indexOf(socket), 1);
	});
});

server.on('close',function() {
	/*
	server.close(function () {
		console.log('Server closed!');
	});
	*/
	for (var i = 0; i < sockets.length; i++) {
		console.log('socket #' + i + ' destroyed');
		sockets[i].destroy();
	}
});

server.listen(PORT);
console.log("listening on port "+PORT);

// https://gist.github.com/diorahman/1520485
var app = express();

// https://github.com/gevorg/http-auth
//app.use(auth.connect(basic));

app.get('*',function(req,res){
	//console.log('query: ' + JSON.stringify(req.query));
	//console.log((req.headers.host+"").replace(JSPORT,PORT));
	res.header('Access-Control-Allow-Origin','*');
	res.header('Location',"http://"+(req.headers.host+"").replace(JSPORT,PORT)+"/");
	res.writeHead(301, 'Moved Permanently');
	//console.log(req.headers.host);
	res.end();
});

app.post('/endpoint(|/*)', function(req, res) {
	
	//console.log(res.socket.remoteAddress);
	if( allowedIps.indexOf(res.socket.remoteAddress) == -1 ) {
		res.writeHead(403, {'Content-Type': 'text/plain'});
		res.end('Access denied');
		return;
	}
	
	if( req.params && req.params["1"] && req.params["1"].indexOf('/')>=0 ) {
		req.params = req.params["1"].split("/");
	}
	
	console.log("port "+res.socket.localPort+" client "+res.socket.remoteAddress+":"+res.socket.remotePort+" has requested "+JSON.stringify(req.params)+" "+JSON.stringify(req.query)+" "+JSON.stringify(req.body));
	
	// http://stackoverflow.com/questions/5010288/how-to-make-a-function-wait-until-a-callback-has-been-called-using-node-js
	var token = false;
	var uvrun = require("uvrun");
	
	tokenprovider.findOne({
		address: req.socket.remoteAddress,
		//port: req.socket.remotePort,
		//token: { $exists: 1 }
		token: req.params[0]
	}, function(err,ris) {
		//console.log('callback '+JSON.stringify(ris));
		token = ris;
	});
	
	while (!token) {
		uvrun.runOnce();
	}
	
	token = token ? token.token : false;
	
	console.log('params: ' + JSON.stringify(req.params));
	console.log('body: ' + JSON.stringify(req.body));
	console.log('query: ' + JSON.stringify(req.query));
	console.log('client token: '+ token);
	console.log('client tokens: '+ tokenprovider);
	
	if( token && req.params && req.params[0] && req.params[0] == token ) {
		
		res.header('Access-Control-Allow-Origin','*'); //"http://"+(req.headers.host+"").replace(JSPORT,PORT));
		res.header('Content-type','application/json');
		res.header('Charset','utf8');
		res.writeHead(200);
		
		/*
		res.header('Access-Control-Allow-Credentials', 'true');
		res.header('Access-Control-Allow-Methods', '*');
		*/
	
		var obj = {
			result: 1,
		};
		console.log('SENDING BACK');
		console.log(obj);
	
		res.send(obj);
		res.end();
		
	} else {
		res.writeHead(403, {'Content-Type': 'text/plain'});
		res.end('Access denied');
		return;
	}
	
});

app.post('*',function(req,res){
	res.header('Access-Control-Allow-Origin','*');
	res.header('Location',"http://"+(req.headers.host+"").replace(JSPORT,PORT)+"/");
	res.writeHead(301, 'Moved Permanently');
	res.end();
});
 

app.listen(JSPORT);
console.log("listening on port "+JSPORT+" for /endpoint");

