/**
 * idées d'animation :
 * - jeux : tunnel infini avec obstacles et verre/bouteille à faire bouger pour éviter les obstacles (1 verre offert tous les 15 obstacles)
 * - jeux : bouteilles qui tombent (système de particules), le joueur fait bouger un réceptacle (verre géant ?) pour les ramasser (1 verre offert toutes les 15 bouteilles)
 *
 *
 */

let gl;
let meshes = [];
let textures = {};
let materials = {};
let scene = [];
let camera = {};
let beerGlass = null;
let beerMugs = [];
let beerMugMesh = null;
const NB_MUGS = 10;
let mirrorTable = null; //used for the reflection of the scene on the table
let frameBuffer = null;

const mirrorTextureWidth = 512;
const mirrorTextureHeight = 512; //Math.floor(mirrorTextureWidth / 5.6);

let score = 0;
let globalAcceleration = 0.;
let accelerationFactor = 0.01;
let maxSpeed = 0.3;

let time = 0.0;
let isAnimated = true;

let useLight = true;
let lightPos = [40.0, 40.0, 40.0];
let lightColor = [1.0, 1.0, 1.0];
let drawMode = 4;

let projectionMatrix = mat4.create();
let globalSceneMatrix = mat4.create();


function main() {
	const canvas = document.getElementById("scene");
	initGL(canvas);
	initEvents(canvas);
	initCamera();
	loadTextures();
	createMirrorTexture();
	initMaterials();
	loadScene();

	drawScene();
}

/**
 * Initialize the WebGL2 context into the main "gl" variable
 * @param canvas {HTMLElement}
 */
function initGL(canvas) {
	gl = canvas.getContext("webgl2");

	if (!gl) {
		canvas.style.display = "none";
		document.getElementById("noContextLayer").style.display = "block";
	}
	else {
		drawMode = gl.TRIANGLES;
	}
}

/**
 * Initialize mouse and keyboard events to move the scene view
 * @param canvas
 */
function initEvents(canvas) {
	// Mouse interaction
	canvas.addEventListener("mousedown", handleMouseDown, false);
	canvas.addEventListener("mouseup", handleMouseUp, false);
	canvas.addEventListener("mouseout", handleMouseUp, false);
	canvas.addEventListener("mousemove", handleMouseMove, false);
	canvas.addEventListener("mousewheel", handleMouseWheel, false);
	canvas.addEventListener("DOMMouseScroll", handleMouseWheel, false);

	document.addEventListener("keydown", handleKeyDown, true);
}

let mouseDown = false;
let lastMouseX = null;
let lastMouseY = null;

function handleMouseDown(event) {
	mouseDown = true;
	lastMouseX = event.clientX;
	lastMouseY = event.clientY;

	return false;
}

function handleMouseUp(event) {
	mouseDown = false;
}

function handleMouseMove(event) {
	if (!mouseDown) {
		return;
	}
	let newX = event.clientX;
	let newY = event.clientY;

	let deltaX = (newX - lastMouseX) / 35.;
	let deltaZ = (newY - lastMouseY) / 35.;

	moveGlass(deltaX, deltaZ);

	lastMouseX = newX;
	lastMouseY = newY;

	return false;
}

function handleMouseWheel(event) {

	/*camera.position[0] += event.deltaX / 30.;
	camera.position[2] += event.deltaY / 30.;
	camera.target[0] += event.deltaX / 30.;
	camera.target[2] += event.deltaY / 30.;

	mat4.targetTo(camera.matrix, camera.position, camera.target, camera.up);

	event.preventDefault();*/

	return false;
}

function handleKeyDown(event) {

	//console.log(event.key);

	if (event.key.toUpperCase() === "L") {
		useLight = !useLight;
	}

	else if (event.key.toUpperCase() === "W") {
		drawMode = gl.LINES;
	}
	else if (event.key.toUpperCase() === "T") {
		drawMode = gl.TRIANGLES;
	}
	else if (event.key.toUpperCase() === "P") {
		drawMode = gl.POINTS;
	}

	else if (event.key.toUpperCase() === "M") {
		startAMug();
	}

	else if (event.key.toUpperCase() === "B") {
		displayBBox(beerGlass);
	}

	else if (event.key.toUpperCase() === "ARROWUP") {
		camera.position[1] += 0.1; //Y axis
		mat4.targetTo(camera.matrix, camera.position, camera.target, camera.up);
	}
	else if (event.key.toUpperCase() === "ARROWDOWN") {
		camera.position[1] -= 0.1; //Y axis
		mat4.targetTo(camera.matrix, camera.position, camera.target, camera.up);
	}

	else if (event.key === " ") {
		isAnimated = !isAnimated;
	}

}

function moveGlass(deltaX, deltaZ) {
	if (beerGlass !== null && isAnimated) {
		let nextX = beerGlass.translation[0] + deltaX;
		let nextZ = beerGlass.translation[2] + deltaZ;
		if (nextX <= 12.4 && nextX >= -11.5) {
			beerGlass.translation[0] = nextX;
		}
		if (nextZ <= 0.9 && nextZ >= -3.4) {
			beerGlass.translation[2] = nextZ;
		}

	}
}

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

function initCamera() {
	camera = {
		position: [0, 2, 20],
		target: [0, 0, 0],
		up: [0, 1, 0],

		matrix: mat4.create()
	};

	mat4.targetTo(camera.matrix, camera.position, camera.target, camera.up);
}

/**
 * Create a list of materials to be used by the meshes
 */
function initMaterials() {

	let phongProgram = initShaderProgram("phong-vshader", "phong-fshader");
	materials.phong = {
		name: "phong",
		useTexture: true,
		textureType: gl.TEXTURE_2D,
		texture: textures.bar,
		program: phongProgram,
		alpha: 1.0,
		ka: 1.0,
		kd: 1.0,
		ks: 1.0,
		shininess: 90,
		ambientColor: [0.1, 0.1, 0.1],
		diffuseColor: [0.267, 0.329, 0.415],
		specularColor: [1., 1., 1.],
		programParams: {
			globals: getGlobalsProgramParams(phongProgram),

			ka: gl.getUniformLocation(phongProgram, "uKa"),
			kd: gl.getUniformLocation(phongProgram, "uKd"),
			ks: gl.getUniformLocation(phongProgram, "uKs"),
			shininess: gl.getUniformLocation(phongProgram, "uShininess"),
			ambientColor: gl.getUniformLocation(phongProgram, "uAmbientColor"),
			diffuseColor: gl.getUniformLocation(phongProgram, "uDiffuseColor"),
			specularColor: gl.getUniformLocation(phongProgram, "uSpecularColor")
		}
	};

	let toonProgram = initShaderProgram("toon-vshader", "toon-fshader");
	materials.toon = {
		name: "toon",
		useTexture: false,
		textureType: gl.TEXTURE_2D,
		texture: textures.bar,
		program: toonProgram,
		alpha: 1.0,
		ka: 1.0,
		kd: 1.0,
		ks: 1.0,
		shininess: 250,
		ambientColor: [0.1, 0.1, 0.1],
		diffuseColor: [0.267, 0.329, 0.415],
		specularColor: [0.0, 0.0, 0.0],
		programParams: {
			globals: getGlobalsProgramParams(toonProgram),

			ka: gl.getUniformLocation(toonProgram, "uKa"),
			kd: gl.getUniformLocation(toonProgram, "uKd"),
			ks: gl.getUniformLocation(toonProgram, "uKs"),
			shininess: gl.getUniformLocation(toonProgram, "uShininess"),
			ambientColor: gl.getUniformLocation(toonProgram, "uAmbientColor"),
			diffuseColor: gl.getUniformLocation(toonProgram, "uDiffuseColor"),
			specularColor: gl.getUniformLocation(toonProgram, "uSpecularColor")
		}
	};

	let reflectProgram = initShaderProgram("reflect-vshader", "reflect-fshader");
	materials.reflect = {
		name: "reflect",
		useTexture: true,
		textureType: gl.TEXTURE_CUBE_MAP,
		texture: textures.cubemap,
		program: reflectProgram,
		alpha: 1.0,
		programParams: {
			globals: getGlobalsProgramParams(reflectProgram)
		}
	};

	let refractProgram = initShaderProgram("refract-vshader", "refract-fshader");
	materials.refract = {
		name: "refract",
		useTexture: true,
		textureType: gl.TEXTURE_CUBE_MAP,
		texture: textures.cubemap,
		program: refractProgram,
		alpha: 1.0,
		programParams: {
			globals: getGlobalsProgramParams(refractProgram)
		}
	};

	let backgroundProgram = initShaderProgram("background-vshader", "background-fshader");
	materials.background = {
		name: "background",
		useTexture: true,
		textureType: gl.TEXTURE_2D,
		texture: textures.background,
		program: backgroundProgram,
		alpha: 1.0,
		programParams: {
			globals: getGlobalsProgramParams(backgroundProgram)
		}
	};

	let mirrorProgram = initShaderProgram("mirror-vshader", "mirror-fshader");
	materials.mirror = {
		name: "mirror",
		useTexture: true,
		textureType: gl.TEXTURE_2D,
		texture: textures.mirror,
		program: mirrorProgram,
		alpha: 1.0,
		programParams: {
			globals: getGlobalsProgramParams(mirrorProgram)
		}
	};

}

function getGlobalsProgramParams(program) {
	return {
		vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
		textureCoord: gl.getAttribLocation(program, 'aTextureCoord'),
		vertexNormal: gl.getAttribLocation(program, 'aVertexNormal'),

		projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
		viewMatrix: gl.getUniformLocation(program, 'uViewMatrix'),
		normalMatrix: gl.getUniformLocation(program, 'uNormalMatrix'),
		worldMatrix: gl.getUniformLocation(program, 'uWorldMatrix'),
		cameraMatrix: gl.getUniformLocation(program, 'uCameraMatrix'),
		cameraPosition: gl.getUniformLocation(program, "uCameraPosition"),

		useTexture: gl.getUniformLocation(program, "uUseTexture"),
		uSampler: gl.getUniformLocation(program, 'uSampler'),

		useLight: gl.getUniformLocation(program, "uUseLight"),
		lightPos: gl.getUniformLocation(program, "uLightPos"),
		lightColor: gl.getUniformLocation(program, "uLightColor"),

		alpha: gl.getUniformLocation(program, "uAlpha")
	}
}

/**
 * Initialize Vertex and Fragment shaders + "linked" program
 * @param vertexShaderSrcID {String}
 * @param fragmentShaderSrcID {String}
 * @returns {WebGLProgram}
 * */
function initShaderProgram(vertexShaderSrcID, fragmentShaderSrcID) {
	let vertexShaderSource = document.getElementById(vertexShaderSrcID).text;
	let fragmentShaderSource = document.getElementById(fragmentShaderSrcID).text;

	let vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
	let fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

	return createProgram(vertexShader, fragmentShader);
}

/**
 * Load a "shader" script into a shader object (WebGLShader)
 * @param type {number} gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param source {String} source code for the shader
 * @returns {WebGLShader}
 */
function createShader(type, source) {
	let shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}

	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

/**
 * Link both Vertex and Fragment shaders into a "Program" (WebGLProgram)
 * @param vertexShader {WebGLShader}
 * @param fragmentShader {WebGLShader}
 * @returns {WebGLProgram}
 */
function createProgram(vertexShader, fragmentShader) {
	let program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	let success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}

	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}


function loadTextures() {

	textures.cubemap = loadTextureCubeMap();

	textures.background = loadTexture2D("../assets/bar.jpg");
}

function loadTextureCubeMap() {
	let texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

	let texPath = "../assets/bar_map/";

	const faceInfos = [
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
			url: texPath + "posx.jpg"
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
			url: texPath + "negx.jpg"
		},
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
			url: texPath + "posy.jpg"
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
			url: texPath + "negy.jpg"
		},
		{
			target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
			url: texPath + "posz.jpg"
		},
		{
			target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
			url: texPath + "negz.jpg"
		}
	];
	faceInfos.forEach((faceInfo) => {
		const {target, url} = faceInfo;

		// Upload the canvas to the cubemap face.
		const level = 0;
		const internalFormat = gl.RGBA;
		const width = 2048;
		const height = 2048;
		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;

		// setup each face so it's immediately renderable
		gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

		// Asynchronously load an image
		const image = new Image();
		image.src = url;
		image.addEventListener('load', function () {
			// Now that the image has loaded make copy it to the texture.
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
			gl.texImage2D(target, level, internalFormat, format, type, image);
			gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
		});
	});
	gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

	return texture;
}

/**
 *
 * @param url {String}
 * @returns {WebGLTexture}
 */
function loadTexture2D(url) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	const level = 0;
	const internalFormat = gl.RGBA;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	gl.texImage2D(gl.TEXTURE_2D,
	              level, // level
	              internalFormat, // internalFormat
	              1, // width
	              1, // height
	              0, // border
	              srcFormat,
	              srcType,
	              new Uint8Array([255, 0, 0, 255]) // default color value
	);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

	//image is loaded asynchronously
	const image = new Image();
	image.onload = function () {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);


		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);
	};
	image.src = url;

	return texture;
}

function createMirrorTexture() {
	// create to render to
	textures.mirrorTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, textures.mirrorTexture);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
	              mirrorTextureWidth, mirrorTextureHeight,
	              0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	// set the filtering so we don't need mips
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function loadScene() {
	loadMeshes();

	//background
	let back = loadSquare(80, 50, -100, 1.);
	let eltBack = {
		name: "background",
		mesh: back, // background mesh
		translation: [0, 0, 0],
		rotation: [0, 0, 0],
		scale: [1, 1, 1],
		material: Object.assign({}, materials.background)
	};
	eltBack.material.texture = textures.background;
	eltBack.material.useTexture = true;
	scene.push(eltBack);

	//mirror table
	let tableMesh = loadSquare(14, 5., 0, 0.65);
	mirrorTable = {
		name: "mirror",
		mesh: tableMesh,
		translation: [0, -4.5, -1.2],
		rotation: [Math.PI / 2.0, 0, 0],
		//translation: [0, -4.5, -1.2],
		//rotation: [0, 0, 0],
		scale: [1, 1, 1],
		material: Object.assign({}, materials.mirror)
	};
	mirrorTable.material.texture = textures.mirrorTexture;
	mirrorTable.material.useTexture = true;
	mirrorTable.material.alpha = 0.2;
	scene.push(mirrorTable);

	// Create and bind the framebuffer
	frameBuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

	// attach the texture as the first color attachment
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures.mirrorTexture, 0);
}

/**
 * Load meshes into the "meshes" global array
 */
function loadMeshes() {

	loadObjFile("../assets/Mug.obj", "obj")
		.then(result => {
			      beerMugMesh = createBufferFromData(result);
			      meshes.push(beerMugMesh);
			      for (let i = 0; i < NB_MUGS; i++) {
				      loadMug();
			      }


			      loadObjFile("../assets/beerglass.obj", "obj")
				      .then(result => {
					            let beerGlassMesh = createBufferFromData(result);
					            meshes.push(beerGlassMesh);
					            beerGlass = {
						            name: "beerGlass",
						            mesh: beerGlassMesh,
						            translation: [0, -4.5, 0],
						            //rotation: [0, Math.PI, 0],
						            rotation: [0, 0, 0],
						            scale: [0.006, 0.006, 0.006],
						            material: Object.assign({}, materials.reflect)
					            };
					            beerGlass.material.useTexture = false;
					            beerGlass.material.texture = textures.cubemap;
					            beerGlass.material.alpha = 0.7;

					            scene.push(beerGlass);
				            }, error => alert(error)
				      );
		      }, error => alert(error)
		);
}

function loadMug() {

	const faceColors = [
		[0.933, 0.737, 0.204],    // yellow
		[0.357, 0.608, 0.835],    // blue
		[0.588, 0.722, 0.482],    // green
		[0.878, 0.592, 0.400],    // orange
		[0.760, 0.494, 0.815],    // violet
		[0.267, 0.329, 0.415]     // gray
	];


	let beerMug = {
		name: "opener",
		mesh: beerMugMesh,
		material: Object.assign({}, materials.toon),

		reset: function () {
			this.translation = [-16. + Math.random(), -4.5, -3. + Math.random() * 4.];
			this.rotation = [0, Math.random(), 0];
			this.scale = [0.25, 0.25, 0.25];
			this.translationSpeed = Math.min(0.04 + Math.random() / 30. + globalAcceleration, maxSpeed);
			this.rotationSpeed = Math.min(-0.01 + Math.random() / 40. + globalAcceleration, maxSpeed);
			this.isAnimated = false;

			let color = faceColors [Math.floor(Math.random() * Math.floor(faceColors.length + 1))];
			beerMug.material.ambientColor = color; //[0.3, 0.3, 0.3];
			beerMug.material.diffuseColor = color;
		}
	};
	beerMug.material.specularColor = [1., 1., 1.];
	beerMug.material.shininess = .7;
	beerMug.material.useTexture = false;
	beerMug.material.texture = null;
	beerMug.reset();

	scene.push(beerMug);

	beerMugs.push(beerMug);
}

/**
 * Initialize the buffers for the background's square
 * @returns {{verticesBuffer, textureCoordsBuffer, colorsBuffer, normalsBuffer, indicesBuffer, data}}
 */
function loadSquare(halfW, halfH, depth, texFactore) {

	const positions = [
		-halfW, halfH, depth,
		halfW, halfH, depth,
		-halfW, -halfH, depth, //x, y, z
		halfW, -halfH, depth,
	];

	const textureCoordinates = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, texFactore,
		1.0, texFactore,
	];

	const normals = [
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0
	];

	const indices = [
		0, 2, 3, 0, 3, 1
	];

	return createBufferFromData({
		                            vertices: positions,
		                            textures: textureCoordinates,
		                            vertexNormals: normals,
		                            indices: indices
	                            }
	);
}

/**
 * Load external Obj file
 * @param url {String}
 * @param type {String} "obj" | "json"
 * @returns {Promise<any>}
 */
function loadObjFile(url, type) {

	return new Promise((resolve, reject) => {

		fetch(url)
			.then(resp => {
				return resp.text();
			})
			.then(data => {
				let mesh;
				if (type === "obj") {
					mesh = new OBJ.Mesh(data);
				}
				else {
					mesh = JSON.parse(data);
				}
				resolve(mesh);
			})
			.catch(function (error) {
				reject(JSON.stringify(error));
			});
	});
}

function createBufferFromData(data) {

	// Buffer for the cube's vertices positions.
	const positionsBuffer = gl.createBuffer();
	// Buffer to hold indices into the vertex array for each faces's vertices.
	const indicesBuffer = gl.createBuffer();
	// Buffer for normals
	const normalsBuffer = gl.createBuffer();
	// Buffer for texture coordinates
	let textureCoordsBuffer = gl.createBuffer();


	// Bind to the positionsBuffer
	gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
	// Fill the buffer with vertices positions
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);

	if (data.textures !== undefined && data.textures !== null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.textures), gl.STATIC_DRAW);
	}

	let normals = data.vertexNormals === undefined ? data.normals : data.vertexNormals;
	gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

	return {
		verticesBuffer: positionsBuffer,
		textureCoordsBuffer: textureCoordsBuffer,
		normalsBuffer: normalsBuffer,
		indicesBuffer: indicesBuffer,
		data: data
	};

}

/**
 * Initialize the buffers for the Cube we'll display
 * @returns {{verticesBuffer, textureCoordsBuffer, colorsBuffer, normalsBuffer, indicesBuffer, data}}
 */
function initCubeBuffers(minx, miny, minz, maxx, maxy, maxz) {

	// Define the position for each vertex of each face
	const positions = [
		// Front
		minx, miny, maxz, //x, y, z
		maxx, miny, maxz,
		maxx, maxy, maxz,
		minx, maxy, maxz,

		// Back
		minx, miny, minz,
		minx, maxy, minz,
		maxx, maxy, minz,
		maxx, miny, minz,

		// Top
		minx, maxy, minz,
		minx, maxy, maxz,
		maxx, maxy, maxz,
		maxx, maxy, minz,

		// Bottom
		minx, miny, minz,
		maxx, miny, minz,
		maxx, miny, maxz,
		minx, miny, maxz,

		// Right
		maxx, miny, minz,
		maxx, maxy, minz,
		maxx, maxy, maxz,
		maxx, miny, maxz,

		// Left
		minx, miny, minz,
		minx, miny, maxz,
		minx, maxy, maxz,
		minx, maxy, minz
	];

	// Texture coordinates
	const textureCoordinates = [
		// Front
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		// Back
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		// Top
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		// Bottom
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		// Right
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		// Left
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
	];

	const faceColors = [
		[0.933, 0.737, 0.204, 1.0],    // Front: yellow
		[0.357, 0.608, 0.835, 1.0],    // Back: blue
		[0.588, 0.722, 0.482, 1.0],    // Top: green
		[0.878, 0.592, 0.400, 1.0],    // Bottom: orange
		[0.760, 0.494, 0.815, 1.0],    // Right: violet
		[0.267, 0.329, 0.415, 1.0]     // Left: gray
	];
	// Let's create an array with 4 colors per face (1 per vertex, same color for the 4 vertices of a face)
	let colors = [];
	for (let j = 0; j < faceColors.length; ++j) {
		const c = faceColors[j];
		colors = colors.concat(c, c, c, c);

	}

	const normals = [
		// Front
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,

		// Back
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,

		// Top
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,

		// Bottom
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,

		// Right
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,

		// Left
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0
	];

	// indices of vertices for each face
	const indices = [
		0, 1, 2, 0, 2, 3,         // front
		4, 5, 6, 4, 6, 7,         // back
		8, 9, 10, 8, 10, 11,      // top
		12, 13, 14, 12, 14, 15,   // bottom
		16, 17, 18, 16, 18, 19,   // right
		20, 21, 22, 20, 22, 23,   // left
	];

	return createBufferFromData({
		                            vertices: positions,
		                            textures: textureCoordinates,
		                            colors: colors,
		                            vertexNormals: normals,
		                            indices: indices,
		                            bbox: {
			                            minx: minx,
			                            miny: miny,
			                            minz: minz,
			                            maxx: maxx,
			                            maxy: maxy,
			                            maxz: maxz
		                            }
	                            }
	);
}

function displayBBox(mesh) {
	let bboxGlass = applyTransfoToBbox(mesh);
	let mGlass = initCubeBuffers(bboxGlass.minx, bboxGlass.miny, bboxGlass.minz, bboxGlass.maxx, bboxGlass.maxy,
	                             bboxGlass.maxz);
	meshes.push(mGlass);
	let oGlass = {
		name: "bboxGlass",
		mesh: mGlass,
		translation: [0, 0, 0],
		rotation: [0, 0, 0],
		scale: [1, 1, 1],
		material: Object.assign({}, materials.phong)
	};
	oGlass.material.alpha = 0.5;
	oGlass.material.ambientColor = [0.1, 0.1, 0.1];
	oGlass.material.diffuseColor = [1, 1, 1];
	oGlass.material.specularColor = [1., 1., 1.];
	oGlass.material.useTexture = false;
	oGlass.material.texture = null;
	scene.push(oGlass);
}

function startAMug() {
	//find the first of the list which is not animated
	for (let mug of beerMugs) {
		if (!mug.isAnimated) {
			mug.isAnimated = true;
			break;
		}
	}
}

function updateScoreDisplay() {
	document.getElementById("score").innerText = "Score: " + score;
}

function resetGame() {
	for (let mug of beerMugs) {
		mug.reset();
		mug.isAnimated = false;

		score = 0;
		updateScoreDisplay();

		isAnimated = true;
	}

	beerGlass.translation = [0, -4.5, 0];
}

function isColliding(mesh1, mesh2) {
	let bbox1 = applyTransfoToBbox(mesh1);
	let bbox2 = applyTransfoToBbox(mesh2);

	let d = 0;

	return (bbox1.minx <= bbox2.maxx + d && bbox1.maxx >= bbox2.minx + d) &&
	       (bbox1.miny <= bbox2.maxy + d && bbox1.maxy >= bbox2.miny + d) &&
	       (bbox1.minz <= bbox2.maxz + d && bbox1.maxz >= bbox2.minz + d);
}

function applyTransfoToBbox(mesh) {
	let bbox = Object.assign({}, mesh.mesh.data.bbox);

	tmp = mat4.create();
	mat4.translate(tmp, tmp, mesh.translation);
	mat4.rotateX(tmp, tmp, mesh.rotation[0]);
	mat4.rotateY(tmp, tmp, mesh.rotation[1]);
	mat4.rotateZ(tmp, tmp, mesh.rotation[2]);
	mat4.scale(tmp, tmp, mesh.scale);

	bmin = vec3.fromValues(bbox.minx, bbox.miny, bbox.minz);
	bmax = vec3.fromValues(bbox.maxx, bbox.maxy, bbox.maxz);
	vec3.transformMat4(bmin, bmin, tmp);
	vec3.transformMat4(bmax, bmax, tmp);

	bbox.minx = bmin[0];
	bbox.miny = bmin[1];
	bbox.minz = bmin[2];
	bbox.maxx = bmax[0];
	bbox.maxy = bmax[1];
	bbox.maxz = bmax[2];


	/*bbox.minx *= mesh.scale[0];
	bbox.miny *= mesh.scale[1];
	bbox.minz *= mesh.scale[2];
	bbox.maxx *= mesh.scale[0];
	bbox.maxy *= mesh.scale[1];
	bbox.maxz *= mesh.scale[2];

	bbox.minx += mesh.translation[0];
	bbox.miny += mesh.translation[1];
	bbox.minz += mesh.translation[2];
	bbox.maxx += mesh.translation[0];
	bbox.maxy += mesh.translation[1];
	bbox.maxz += mesh.translation[2];*/

	return bbox;
}

function drawMesh(elt, displayAspect) {

	let programParams = elt.material.programParams;

	// Set the shader program to use
	gl.useProgram(elt.material.program);

	mat4.perspective(projectionMatrix,
	                 45 * Math.PI / 180, // fieldOfView, in radians
	                 displayAspect, // aspect
	                 0.1, // zNear,
	                 300 //zFar
	);

	// move object
	let viewMatrix = mat4.create();
	let worldMatrix = mat4.create();
	{
		mat4.invert(viewMatrix, camera.matrix);

		mat4.multiply(worldMatrix, worldMatrix, globalSceneMatrix);

		mat4.translate(worldMatrix, worldMatrix, elt.translation);

		mat4.rotate(worldMatrix, worldMatrix, elt.rotation[0], [1, 0, 0]); // X
		mat4.rotate(worldMatrix, worldMatrix, elt.rotation[1], [0, 1, 0]); // Y
		mat4.rotate(worldMatrix, worldMatrix, elt.rotation[2], [0, 0, 1]); // Z

		mat4.scale(worldMatrix, worldMatrix, elt.scale);
	}

	const normalMatrix = mat4.create();
	mat4.invert(normalMatrix, viewMatrix);
	mat4.transpose(normalMatrix, normalMatrix);

	// Set the vertexPosition attribute of the shader
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, elt.mesh.verticesBuffer);
		gl.vertexAttribPointer(/*programParams.globals.vertexPosition*/0, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(/*programParams.globals.vertexPosition*/0);
	}

	//Set the texture coordinates
	//if (elt.material.texture !== null && elt.material.useTexture === true)
	if (elt.material.textureType === gl.TEXTURE_2D) {
		gl.bindBuffer(gl.ARRAY_BUFFER, elt.mesh.textureCoordsBuffer);
		gl.vertexAttribPointer(/*programParams.globals.textureCoord*/2, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(/*programParams.globals.textureCoord*/2);
		if (elt.material.texture !== null) {
			// Tell WebGL we want to affect texture unit 0
			gl.activeTexture(gl.TEXTURE0);
			// Bind the texture to texture unit 0
			gl.bindTexture(gl.TEXTURE_2D, elt.material.texture);
		}
	}
	else if (elt.material.textureType === gl.TEXTURE_CUBE_MAP) {
		gl.uniform1i(programParams.globals.uSampler, elt.material.texture);
	}

	// Normals
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, elt.mesh.normalsBuffer);
		gl.vertexAttribPointer(/*programParams.globals.vertexNormal*/1, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(/*programParams.globals.vertexNormal*/1);
	}

	// Set indices to use to index the vertices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elt.mesh.indicesBuffer);


	// Set the globals shader uniforms
	gl.uniformMatrix4fv(programParams.globals.projectionMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(programParams.globals.viewMatrix, false, viewMatrix);
	gl.uniformMatrix4fv(programParams.globals.normalMatrix, false, normalMatrix);
	gl.uniformMatrix4fv(programParams.globals.worldMatrix, false, worldMatrix);
	gl.uniformMatrix4fv(programParams.globals.cameraMatrix, false, camera.matrix);
	gl.uniform3fv(programParams.globals.cameraPosition, camera.position);
	gl.uniform1i(programParams.globals.useTexture, elt.material.useTexture);
	gl.uniform1f(programParams.globals.alpha, elt.material.alpha);

	gl.uniform1i(programParams.globals.useLight, useLight);
	gl.uniform3fv(programParams.globals.lightPos, lightPos);
	gl.uniform3fv(programParams.globals.lightColor, lightColor);

	//set specific shader uniforms
	for (const key in programParams) {
		if (key !== "globals" && programParams.hasOwnProperty(key)) {

			let value = elt.material[key];
			let type = typeof (value);

			if (type === "number") {
				gl.uniform1f(programParams[key], elt.material[key]);
			}
			else if (type === "boolean") {
				gl.uniform1i(programParams[key], elt.material[key]);
			}
			else if (type === "object") {
				if (Array.isArray(value)) {
					if (value.length === 2) {
						gl.uniform2fv(programParams[key], elt.material[key]);
					}
					else if (value.length === 3) {
						gl.uniform3fv(programParams[key], elt.material[key]);
					}
					else if (value.length === 4) {
						gl.uniform4fv(programParams[key], elt.material[key]);
					}
				}
			}
		}
	}

	// Let's render
	gl.drawElements(drawMode,
	                elt.mesh.data.indices.length, // count (number of indices)
	                gl.UNSIGNED_SHORT, // type
	                0 // offset
	);

}

/**
 * Render the scene
 */
function drawScene() {

	// Clear the color buffer
	gl.clearDepth(1.0);
	gl.depthFunc(gl.LEQUAL);

	gl.depthMask(true);
	gl.enable(gl.BLEND);


	if (isAnimated) {
		for (let mug of beerMugs) {
			if (mug.isAnimated) {
				mug.translation[0] += mug.translationSpeed;
				mug.rotation[1] += mug.rotationSpeed;

				if (mug.translation[0] > 14.) {
					globalAcceleration += accelerationFactor;

					mug.reset();
					mug.isAnimated = true;

					score++;
					updateScoreDisplay();
				}
			}
		}
	}

	//first, render onto the mirror texture
	{
		// render to our targetTexture by binding the framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

		// Tell WebGL how to convert from clip space to pixels
		gl.viewport(0, 0, mirrorTextureWidth, mirrorTextureHeight);

		gl.clearColor(0., 0., 0., 0.);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);

		gl.depthMask(true);
		gl.enable(gl.BLEND);

		//gl.blendEquationSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


		//const aspect = mirrorTextureWidth / mirrorTextureHeight;
		const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		for (let elt of scene) {
			//we only need to render the glass and mugs on the mirror
			if (elt.name !== "mirror" && elt.name !== "background") {
				drawMesh(elt, aspect);
			}
		}
	}

	//second, render onto the canvas
	{
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		for (let elt of scene) {
			drawMesh(elt, aspect);
		}
	}

	if (beerGlass !== null && isAnimated) {
		for (let i = 0, len = beerMugs.length; i < len; i++) {
			let beerMug = beerMugs[i];
			let collide = isColliding(beerGlass, beerMug);

			if (collide) {
				isAnimated = false;

				overlayOn();

				setPlayerScore(score);
				savePlayersData();

				//displayBBox(beerMug);
				//displayBBox(beerGlass);
			}
		}
	}

	requestAnimationFrame(drawScene);
}
