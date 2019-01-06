"use strict";

let express = require('express');
let app = express();
let http = require('http').Server(app);
let ws = require("nodejs-websocket");
let wss = null;


let bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

app.use(express.static('./public/'));
app.use(express.static('./public/0_accueil/'));
app.use(express.static('./public/game_accueil/'));
app.use(express.static('./public/game_play/'));
app.use(express.static('./node_modules/'));

app.get('/', function (req, res) {
	res.sendfile("public/0_accueil/index.html");
});

app.get('/pictures/:folder/:file', function (req, res) {
	let file = req.params.file;
	let folder = req.params.folder;
	res.sendFile('data/pictures/' + folder + "/" + file, {root: __dirname + "/../"});
});

app.post("/drink", function (req, res) {

	console.log("Drink");

	wss.sendText(JSON.stringify({"page": "/game_play/index.html"}));
});

app.post("/connect", function (req, res) {

	let id = req.body.id;


	console.log("connect : " + id);

	wss.sendText(JSON.stringify({"page": "/game_accueil/index.html", "id": id}));
});


/**
 * Server itself
 * @type {http.Server}
 */
let server = app.listen(8090, function () {
	//print few information about the server
	let host = server.address().address;
	let port = server.address().port;
	console.log("Server running and listening @ " + host + ":" + port);
});

let serverws = ws.createServer(function (conn) {
	console.log("New connection");

	wss = conn;

	conn.on("text", function (str) {
		console.log("Received " + str);
	});

	conn.on("close", function (code, reason) {
		console.log("Connection closed");
	})
}).listen(8081);
