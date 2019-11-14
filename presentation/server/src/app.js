"use strict";

let express = require('express');
let app = express();
let http = require('http').Server(app);

const WebSocket = require('ws');
let wsc = null;

const wss = new WebSocket.Server({ port: 9898 });

wss.on('connection', function connection(ws) {
	wsc = ws;
	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
	});

	ws.send('something');
});

let bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

app.use(express.static('./public/'));
app.use(express.static('./public/assets/'));
app.use(express.static('./public/presentation/'));
app.use(express.static('./public/game/'));
app.use(express.static('./node_modules/'));

app.get('/', function (req, res) {
	res.sendFile("presentation/accueil/index.html", {root: "./public/"});
});

app.get('/pictures/:folder/:file', function (req, res) {
	let file = req.params.file;
	let folder = req.params.folder;
	res.sendFile('data/pictures/' + folder + "/" + file, {root: __dirname + "/../"});
});

app.post("/drink", function (req, res) {

	console.log("Drink");

	client.

	wss.sendText(JSON.stringify({"action":"drink", "page": "/game/play/index.html"}));
});

app.post("/connect", function (req, res) {

	let id = req.body.id;


	console.log("connect : " + id);

	wss.sendText(JSON.stringify({"action":"page", "page": "/game/accueil/index.html", "id": id}));
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
