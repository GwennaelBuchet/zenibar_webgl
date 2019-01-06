window.onload = function () {

	let self = this;
	this.ws = new WebSocket("ws://" + window.location.hostname + ":8081");

	this.ws.onopen = function (event) {
		console.log("Websocket connection opened.");
	};
	this.ws.onmessage = function (event) {
		let msg = JSON.parse(event.data);
		let page = msg.page;
		if (msg.id !== undefined && msg.id !== null) {
			page += "?id=" + msg.id;
		}
		location.replace(page);
	};
	this.ws.onerror = function (event) {
		console.log("Websocket connection error : " + event);
	};

	main();
};

function resize(canvas) {
	// Lookup the size the browser is displaying the canvas.
	let displayWidth  = canvas.clientWidth;
	let displayHeight = canvas.clientHeight;

	// Check if the canvas is not the same size.
	if (canvas.width  !== displayWidth ||
	    canvas.height !== displayHeight) {

		// Make the canvas the same size
		canvas.width  = displayWidth;
		canvas.height = displayHeight;
	}
}