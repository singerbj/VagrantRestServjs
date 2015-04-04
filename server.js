var util= require('util');
var Runner = require('./runner');
var fs = require('fs');
var WebSocketServer = require('ws').Server;
var domain = require('domain');
var http = require('http');
var Router = require('node-simple-router');
var file = require('file');

    
d = domain.create();
d.on('error', function(err) {
    console.error(err);
})

var wss = new WebSocketServer({ port: 8081 });
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    var runner = new Runner();
    runner.run(message, ws, 60 * 20);
  });
  
  ws.on('close', function(){
    var i = wss.clients.indexOf(ws);
    if(wss.clients.indexOf(ws) > -1){
      delete wss.clients[i]; 
    }
  });

  ws.on('error', function(err){
    console.log(err);  
  });
});

var router = Router();
fs.readFile('./index.html', function (err, html) {
  if (err) {
    throw err; 
  }       
  router.get("/", function (request, response) {
    response.writeHeader(200, {"Content-Type": "text/html"});  
    response.write(html);  
    response.end();  
  });
});

router.post("/vagrant/search", function (request, response) {
  var vagrantPaths = [];
  file.walkSync(request.body.path, function(path, dirs, files){
    if(files){
      files.forEach(function(file){
        if(file.indexOf('Vagrantfile') > -1){
          vagrantPaths.push(path);
        }
      });
    }
  });

  response.writeHeader(200, {"Content-Type": "application/json"});  
  response.write(JSON.stringify({ paths: vagrantPaths }));  
  response.end();  
}); 

router.post("/vagrant/up", function (request, response) {
  

  response.writeHeader(200);  
  response.end();  
}); 
 
var server = http.createServer(router);
// Listen on port 8080 on localhost
server.listen(8080, "localhost");

console.log('server running on 8080')


