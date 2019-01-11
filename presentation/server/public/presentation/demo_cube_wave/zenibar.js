/**
 * idées d'animation :
 * - jeux : tunnel infini avec obstacles et verre/bouteille à faire bouger pour éviter les obstacles (1 verre offert tous les 15 obstacles)
 * - jeux : bouteilles qui tombent (système de particules), le joueur fait bouger un réceptacle (verre géant ?) pour les ramasser (1 verre offert toutes les 15 bouteilles)
 *
 *
 */

let gl;
let materials = {};
let meshes = [];
let camera = {};

let time = 0.0;
let isAnimated = true;
let useLight = true;
let lightPos = [-100.0, 200.0, 150.0];
let lightColor = [1.0, 1.0, 1.0];
let drawMode = 4;

let nbCubesPerLine = 20;
let w = 1.;
let space = 0.5;
let start = -(w + space / 3.) * nbCubesPerLine;

let projectionMatrix = mat4.create();
let globalSceneMatrix = mat4.create();

function main() {
	const canvas = document.getElementById("scene");
	initGL(canvas);
	initEvents(canvas);
	initCamera();
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
	let newRotationMatrix = mat4.create();
	mat4.identity(newRotationMatrix);
	mat4.rotate(newRotationMatrix, newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]);

	let deltaY = newY - lastMouseY;
	mat4.rotate(newRotationMatrix, newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);
	mat4.multiply(globalSceneMatrix, newRotationMatrix, globalSceneMatrix);

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

	else if (event.key.toUpperCase() === "ARROWUP") {
		camera.position[1] += 0.5; //Y axis
		mat4.targetTo(camera.matrix, camera.position, camera.target, camera.up);

	}
	else if (event.key.toUpperCase() === "ARROWDOWN") {
		camera.position[1] -= 0.5; //Y axis
		mat4.targetTo(camera.matrix, camera.position, camera.target, camera.up);
	}

	else if (event.key === " ") {
		isAnimated = !isAnimated;
	}

	event.preventDefault();
}

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

function initCamera() {
	camera = {
		position: [0, 20, 45],
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
		program: phongProgram,
		alpha: 1.0,
		ka: 1.0,
		kd: 1.0,
		ks: 1.0,
		shininess: 100,
		ambientColor: [0.1, 0.1, 0.1],
		diffuseColor: [0.357, 0.608, 0.835],
		specularColor: [1., 0., 0.],
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

}

function getGlobalsProgramParams(program) {
	return {
		vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
		vertexNormal: gl.getAttribLocation(program, 'aVertexNormal'),

		projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
		viewMatrix: gl.getUniformLocation(program, 'uViewMatrix'),
		normalMatrix: gl.getUniformLocation(program, 'uNormalMatrix'),
		worldMatrix: gl.getUniformLocation(program, 'uWorldMatrix'),
		cameraMatrix: gl.getUniformLocation(program, 'uCameraMatrix'),
		cameraPosition: gl.getUniformLocation(program, "uCameraPosition"),

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

function loadScene() {
	loadObjFile("../assets/cube.json", "json")
		.then(result => {
			      let cubeBuffer = createBufferFromData(result);
			      for (let x = 0; x < nbCubesPerLine; x++) {
				      for (let z = 0; z < nbCubesPerLine; z++) {
					      let eltBody = {
						      name: "cube_" + x + "_" + z,
						      mesh: cubeBuffer,
						      translation: [start + x * (w + 3. * space), 0, start + z * (w + 3. * space)],
						      rotation: [0, 0, 0],
						      scale: [1, 1, 1],
						      material: Object.assign({}, materials.phong)
					      };
					      eltBody.material.ambientColor = [0.1, 0.1, 0.1];
					      eltBody.material.diffuseColor = [0.267, 0.329, 0.415];
					      eltBody.material.specularColor = [1., 1., 1.];
					      meshes.push(eltBody);
				      }
			      }
		      }, error => alert(error)
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


	// Bind to the positionsBuffer
	gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
	// Fill the buffer with vertices positions
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);

	let normals = data.vertexNormals === undefined ? data.normals : data.vertexNormals;
	gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

	return {
		verticesBuffer: positionsBuffer,
		normalsBuffer: normalsBuffer,
		indicesBuffer: indicesBuffer,
		data: data
	};

}

function _getDistance(x, y, xC, yC) {
	return Math.sqrt((x + start + xC) * (x + start + xC) + (y + start + yC) * (y + start + yC));
}

function drawMesh(elt, x, z) {

	if (elt === undefined) {
		return;
	}

	let programParams = elt.material.programParams;

	// Set the shader program to use
	gl.useProgram(elt.material.program);

	// move object
	let viewMatrix = mat4.create();
	let worldMatrix = mat4.create();
	{
		//todo : calculer la distance entre le cube et celui du centre => sin de a distance (=vague depuis le centre)
		elt.translation[1] = 1.2 * Math.sin(time + _getDistance(x, z, nbCubesPerLine / 1.5, nbCubesPerLine / 1.5));
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

	let s = Math.sin(elt.translation[1]);
	let c = vec3.create();
	if (useLight) {
		vec3.lerp(c, [1., 1., 1.], [0.357, 0.608, 0.835], s);
	}
	else {
		vec3.lerp(c, [1., 1., 1.], [0.878, 0.592, 0.400], s);
	}
	gl.uniform3f(programParams.diffuseColor, c[0], c[1], c[2]);
	gl.uniform1f(programParams.globals.alpha, 1.);

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
	if (useLight) {
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	}
	else {
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.blendFunc(gl.ONE, gl.ONE);
	}
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	gl.depthMask(true);
	gl.enable(gl.BLEND);

	gl.cullFace(gl.FRONT);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mat4.perspective(projectionMatrix,
	                 45 * Math.PI / 180, // fieldOfView, in radians
	                 gl.canvas.clientWidth / gl.canvas.clientHeight, // aspect
	                 0.1, // zNear,
	                 300 //zFar
	);

	for (let i = 0; i < nbCubesPerLine; i++) {
		for (let j = 0; j < nbCubesPerLine; j++) {
			let elt = meshes[i * nbCubesPerLine + j];
			drawMesh(elt, i, j);
		}
	}

	time += isAnimated ? 0.1 : 0.0;

	requestAnimationFrame(drawScene);
}
