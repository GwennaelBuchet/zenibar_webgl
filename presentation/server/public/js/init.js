function loadWS() {

	this.ws = new WebSocket("ws://" + window.location.hostname + ":8081");

	this.ws.onopen = function (event) {
		console.log("Websocket connection opened.");
	};
	this.ws.onmessage = function (event) {
		let msg = JSON.parse(event.data);

		let action = msg.action;

		if (action === "page") {
			let page = msg.page;
			if (msg.id !== undefined && msg.id !== null) {
				page += "?id=" + msg.id;
			}
			location.replace(page);
		}

		else if (action === "drink") {
			startAMug();
		}
	};
	this.ws.onerror = function (event) {
		console.log("Websocket connection error : " + event);
	};

	main();
}

function goToPage(pathname) {
	document.location.href = pathname;
}


const pages = [
	"/accueil/index.html",
	"/zenibar/index.html",
	"/archibar/index.html",
	"/bonsoir/index.html",
	"/demo_01_cube/0/index.html", 		// les 4 étapes principales
	"/demo_01_cube/1/index.html", 		// Initialiser le context WebGL2
	"/demo_01_cube/2/index.html", 		// Remplir le buffer des positions
	"/demo_01_cube/3/index.html", 		// Remplir le buffer des indices
	"/demo_01_cube/4/index.html", 		// Remplir le buffer des couleurs
	"/demo_01_cube/5/index.html", 		// Matrice de Projection et de Vue
	"/demo_01_cube/6/index.html", 		// Calculate Vertices Position
	"/demo_01_cube/7/index.html", 		// Calculate Fragments Position
	"/demo_01_cube/8/index.html", 		// La tuyauterie entre CPU et GPU
	"/demo_02_anime/0/index.html", 		// Modification de la matrice modelView
	"/demo_02_anime/1/index.html", 		// Boucle de rendu
	"/demo_03_light/0/index.html", 		// Définition des normals
	"/demo_03_light/1/index.html", 		// Interpolation des normals
	"/demo_03_light/2/index.html", 		// Phong Shading
	"/demo_03_obj/0/index.html",	 		// Chargement d'un OBJ
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

window.addEventListener('load', loadWS, false);