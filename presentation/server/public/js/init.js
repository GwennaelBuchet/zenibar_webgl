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

function goToPage(pathname) {
	document.location.href = pathname;
}


const pages = [
	"/accueil/index.html",
	"/zenibar/index.html",
	"/archibar/index.html",
	"/bonsoir/index.html",
	"/demo_cube/0/index.html", // les 4 étapes principales
	"/demo_cube/1/index.html", // Initialiser le context WebGL2
	"/demo_cube/2/index.html", // Remplir le buffer des positions
	"/demo_cube/3/index.html", // Remplir le buffer des indices + Afficher
	"/demo_cube/4/index.html", // Matrice de Projection et de Vue
	"/demo_cube/5/index.html", // Calculate Vertices Position
	"/demo_cube/6/index.html", // Calculate Fragments Position
	"/demo_anime/0/index.html",
	"/demo_anime/1/index.html",
	"/demo_cube_wave/index.html",
	"/accueil/index.html", // <== For the last slide /!\ Take care: that makes a loop /!\
];
const currentPage = window.location.pathname;
const currentPageIndex = pages.indexOf(currentPage);

function nextPage() {
	if (currentPageIndex < pages.length - 1) {
		goToPage(pages[currentPageIndex + 1]);
	}
}

function previousPage() {
	if (currentPageIndex > 0) {
		goToPage(pages[currentPageIndex - 1]);
	}
}

function resize(canvas) {
	// Lookup the size the browser is displaying the canvas.
	let displayWidth = canvas.clientWidth;
	let displayHeight = canvas.clientHeight;

	// Check if the canvas is not the same size.
	if (canvas.width !== displayWidth ||
	    canvas.height !== displayHeight) {

		// Make the canvas the same size
		canvas.width = displayWidth;
		canvas.height = displayHeight;
	}
}