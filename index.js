
var PORT = 9797;

// http://stackoverflow.com/questions/10645994/node-js-how-to-format-a-date-string-in-utc
// npm install dateformat

var http = require('http');
var fs = require('fs');
// http://nodejs.org/api/path.html
var path = require('path');
var dateformat = require('dateformat');

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
	console.log("client "+res.socket.remoteAddress+" has requested "+req.url);
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
					console.log('answered 200 '+JSON.stringify(header));
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
				
				console.log('answered 200 '+JSON.stringify(header));
				res.writeHead(200, header);
				res.write(html);
				res.end();
				
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
		console.log('socket closed');
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
