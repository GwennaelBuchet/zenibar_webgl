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

let time = 0.0;
let isAnimated = true;
let useLight = true;
let lightPos = [10.0, 10.0, 10.0];
let lightColor = [1.0, 1.0, 1.0];
let drawMode = 4;

let texPath = "../../assets/";

let projectionMatrix = mat4.create();
let globalSceneMatrix = mat4.create();

function main() {
	const canvas = document.getElementById("scene");

	initGL(canvas);
	initEvents(canvas);
	initCamera();
	loadTextures();
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

	let deltaX = newX - lastMouseX;
	let deltaY = newY - lastMouseY;

	scene[0].rotation[1] += deltaX / 55.;


	/*let newRotationMatrix = mat4.create();
	mat4.identity(newRotationMatrix);
	mat4.rotate(newRotationMatrix, newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]);

	mat4.rotate(newRotationMatrix, newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);
	mat4.multiply(globalSceneMatrix, newRotationMatrix, globalSceneMatrix);*/

	lastMouseX = newX;
	lastMouseY = newY;

	return false;
}

function handleMouseWheel(event) {

	camera.position[0] += event.deltaX / 30.;
	camera.position[2] += event.deltaY / 30.;
	camera.target[0] += event.deltaX / 30.;
	camera.target[2] += event.deltaY / 30.;

	mat4.targetTo(camera.matrix, camera.position, camera.target, camera.up);

	event.preventDefault();

	return false;
}

function handleKeyDown(event) {
	if (event.key.toUpperCase() === "L") {
		useLight = !useLight;
	}
	else if (event.key.toUpperCase() === "W") {
		drawMode = gl.LINE_LOOP;
	}
	else if (event.key.toUpperCase() === "T") {
		drawMode = gl.TRIANGLES;
	}
	else if (event.key.toUpperCase() === "P") {
		drawMode = gl.POINTS;
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

function initCamera() {
	camera = {
		position: [0, 0, 20],
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

	let backgroundProgram = initShaderProgram("texture-vshader", "texture-fshader");
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

		alpha: gl.getUniformLocation(program, "uAlpha"),
		objectID: gl.getUniformLocation(program, "uObjectID"),
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

	textures.background = loadTexture2D(texPath + "negz.jpg");
	console.log(textures.background);
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

	//image is loaded asynchronously
	const image = new Image();
	image.onload = function () {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

		gl.generateMipmap(gl.TEXTURE_2D);
	};
	image.src = url;

	return texture;
}

function loadScene() {
	loadMeshes();

	let eltBack = {
		name: "background",
		mesh: meshes[0], // background mesh
		translation: [0, 0, -130],
		rotation: [0, 0, 0],
		scale: [1, 1, 1],
		material: Object.assign({}, materials.background),
		objectID: 1
	};
	eltBack.material.texture = textures.background;
	eltBack.material.useTexture = true;
	scene.push(eltBack);
}

/**
 * Load meshes into the "meshes" global array
 */
function loadMeshes() {
	meshes.push(initBackgroundBuffers());
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
 * Initialize the buffers for the background's square
 * @returns {{verticesBuffer, textureCoordsBuffer, colorsBuffer, normalsBuffer, indicesBuffer, data}}
 */
function initBackgroundBuffers() {

	let halfW = 60;
	let halfH = 50;
	let depth = -10;

	const positions = [
		-halfW, halfH, depth,
		halfW, halfH, depth,
		-halfW, -halfH, depth, //x, y, z
		halfW, -halfH, depth,
	];

	const textureCoordinates = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0,
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


function drawMesh(elt) {

	let programParams = elt.material.programParams;

	// Set the shader program to use
	gl.useProgram(elt.material.program);


	// move object
	let viewMatrix = mat4.create();
	let worldMatrix = mat4.create();
	{
		mat4.invert(viewMatrix, camera.matrix);

		mat4.multiply(worldMatrix, worldMatrix, globalSceneMatrix);

		// automatic rotation animation
		mat4.rotate(worldMatrix, worldMatrix, time, [0, 1, 0]);

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
	gl.bindBuffer(gl.ARRAY_BUFFER, elt.mesh.textureCoordsBuffer);
	gl.vertexAttribPointer(/*programParams.globals.textureCoord*/2, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(/*programParams.globals.textureCoord*/2);
	if (elt.material.texture !== null) {
		// Tell WebGL we want to affect texture unit 0
		gl.activeTexture(gl.TEXTURE0);
		// Bind the texture to texture unit 0
		gl.bindTexture(gl.TEXTURE_2D, elt.material.texture);
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
	gl.uniformMatrix4fv(programParams.globals.worldMatrix, false, worldMatrix);
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
	gl.clearColor(0.941, 0.941, 0.862, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	gl.depthMask(true);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mat4.perspective(projectionMatrix,
	                 45 * Math.PI / 180, // fieldOfView, in radians
	                 gl.canvas.clientWidth / gl.canvas.clientHeight, // aspect
	                 0.1, // zNear,
	                 300 //zFar
	);

	for (let elt of scene) {
		drawMesh(elt);
	}

	requestAnimationFrame(drawScene);
}



