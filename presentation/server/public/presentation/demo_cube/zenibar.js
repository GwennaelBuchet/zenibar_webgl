let drawMode = 4;
let gl;

function main() {
	const canvas = document.getElementById("scene");

	gl = canvas.getContext("webgl2");
	if (!gl) {
		canvas.style.display = "none";
		document.getElementById("noContextLayer").style.display = "block";
	}

	// let's initialize the shaders and the linked program
	const shaderProgram = initShaderProgram(gl, "vshader-simple", "fshader-simple");


	const shaderProgramParams = {
		program: shaderProgram,

		vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
		vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),

		projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
		modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
	};

	// set the geometry definition
	const buffers = initBuffers(gl);

	// let's render.
	// As it's now animated, we use the requestAnimationFrame function to smooth it up
	function render() {
		// gl.canvas = document.getElementById("scene");
		gl.canvas.clientWidth = 10;
		gl.canvas.clientHeight = 10;

		drawScene(gl, shaderProgramParams, buffers);

		requestAnimationFrame(render);
	}

	requestAnimationFrame(render);

	initEvents();
}

/**
 * Initialize mouse and keyboard events to move the scene view
 * @param canvas
 */
function initEvents(canvas) {
	document.addEventListener("keydown", handleKeyDown, true);
}

function handleKeyDown(event) {
	if (event.key.toUpperCase() === "W") {
		drawMode = gl.LINES;
	} else if (event.key.toUpperCase() === "T") {
		drawMode = gl.TRIANGLES;
	} else if (event.key.toUpperCase() === "P") {
		drawMode = gl.POINTS;
	}
}

/**
 * Initialize the buffers for the Cube we'll display
 * @param gl {WebGLRenderingContext}
 * @returns {{position: WebGLBuffer, color: WebGLBuffer, indices: WebGLBuffer}}
 */
function initBuffers(gl) {

	// Buffer for the cube's vertices positions.
	const positionsBuffer = gl.createBuffer();
	// Buffer for colors of each vertex of each face
	const colorsBuffer = gl.createBuffer();
	// Buffer to hold indices into the vertex array for each faces's vertices.
	const indicesBuffer = gl.createBuffer();


	// Positions
	{
		// Define the position for each vertex of each face
		const positions = [
			// Front
			-1.0, -1.0, 1.0, //x, y, z
			1.0, -1.0, 1.0,
			1.0, 1.0, 1.0,
			-1.0, 1.0, 1.0,

			// Back
			-1.0, -1.0, -1.0,
			-1.0, 1.0, -1.0,
			1.0, 1.0, -1.0,
			1.0, -1.0, -1.0,

			// Top
			-1.0, 1.0, -1.0,
			-1.0, 1.0, 1.0,
			1.0, 1.0, 1.0,
			1.0, 1.0, -1.0,

			// Bottom
			-1.0, -1.0, -1.0,
			1.0, -1.0, -1.0,
			1.0, -1.0, 1.0,
			-1.0, -1.0, 1.0,

			// Right
			1.0, -1.0, -1.0,
			1.0, 1.0, -1.0,
			1.0, 1.0, 1.0,
			1.0, -1.0, 1.0,

			// Left
			-1.0, -1.0, -1.0,
			-1.0, -1.0, 1.0,
			-1.0, 1.0, 1.0,
			-1.0, 1.0, -1.0
		];

		// Bind to the positionsBuffer
		gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
		// Fill the buffer with vertices positions
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	}


	// Colors
	{
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

		// Create a buffer for the cube's colors.
		gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	}

	// Indices
	{
		// indices of vertices for each face
		const indices = [
			0, 1, 2, 0, 2, 3,         // front
			4, 5, 6, 4, 6, 7,         // back
			8, 9, 10, 8, 10, 11,      // top
			12, 13, 14, 12, 14, 15,   // bottom
			16, 17, 18, 16, 18, 19,   // right
			20, 21, 22, 20, 22, 23,   // left
		];

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	}

	return {
		position: positionsBuffer,
		color: colorsBuffer,
		indices: indicesBuffer,
	};
}

/**
 * Render the scene
 * @param gl {WebGLRenderingContext}
 * @param shaderProgramParams {}
 * @param buffers {{position: WebGLBuffer, color: WebGLBuffer, indices: WebGLBuffer}}
 */
function drawScene(gl, shaderProgramParams, buffers) {

	// Clear the color buffer
	gl.clearColor(0.0, 0.0, 0.0, 1);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


	const fieldOfView = 45 * Math.PI / 180;   // in radians
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	//define the field of view deepness
	const zNear = 0.1;
	const zFar = 100.0;

	const projectionMatrix = mat4.create();
	mat4.perspective(projectionMatrix,
	                 fieldOfView,
	                 aspect,
	                 zNear,
	                 zFar);

	// let's move the scene to -8 along Z axis (as if we moved the camera to +10 on Z)
	let modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix,     // destination matrix
	               modelViewMatrix,     // matrix to translate
	               [-0.0, 0.0, -8.0]);  // amount to translate

	//let's rotate the global view
	mat4.rotate(modelViewMatrix,    // destination matrix
	            modelViewMatrix,    // matrix to rotate
	            -0.5,                // amount to rotate in radians
	            [-0.5, 1, 0]);         // axis to rotate around

	// Set the vertexPosition attribute of the shader
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
	gl.vertexAttribPointer(
		shaderProgramParams.vertexPosition,
		3,      // size
		gl.FLOAT,       // type
		false, // normalized
		0,      // stride
		0       // offset
	);
	gl.enableVertexAttribArray(shaderProgramParams.vertexPosition);

	// Set the vertexColor attribute of the shader
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
	gl.vertexAttribPointer(
		shaderProgramParams.vertexColor,
		4, // size
		gl.FLOAT, // type
		false, // normalized
		0, // stride
		0 // offset
	);
	gl.enableVertexAttribArray(shaderProgramParams.vertexColor);

	// Set indices to use to index the vertices
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

	// Set the shader program to use
	gl.useProgram(shaderProgramParams.program);

	// Set the shader uniforms
	gl.uniformMatrix4fv(
		shaderProgramParams.projectionMatrix,
		false, // transpose
		projectionMatrix);
	gl.uniformMatrix4fv(
		shaderProgramParams.modelViewMatrix,
		false, // transpose
		modelViewMatrix);

	// Let's render
	gl.drawElements(drawMode,
	                36, // count (number of vertices)
	                gl.UNSIGNED_SHORT, // type
	                0 // offset
	);
}


/**
 * Initialize Vertex and Fragment shaders + "linked" program
 * @param gl {WebGLRenderingContext}
 * @param vertexShaderSrcID {String}
 * @param fragmentShaderSrcID {String}
 * @returns {WebGLProgram}
 * */
function initShaderProgram(gl, vertexShaderSrcID, fragmentShaderSrcID) {
	let vertexShaderSource = document.getElementById(vertexShaderSrcID).text;
	let fragmentShaderSource = document.getElementById(fragmentShaderSrcID).text;

	let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	return createProgram(gl, vertexShader, fragmentShader);
}

/**
 * Load a "shader" script into a shader object (WebGLShader)
 * @param gl {WebGLRenderingContext}
 * @param type {number} gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param source {String} source code for the shader
 * @returns {WebGLShader}
 */
function createShader(gl, type, source) {
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
 * @param gl {WebGLRenderingContext}
 * @param vertexShader {WebGLShader}
 * @param fragmentShader {WebGLShader}
 * @returns {WebGLProgram}
 */
function createProgram(gl, vertexShader, fragmentShader) {
	let program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	let success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}

	console.log(gl.getprogramParamsLog(program));
	gl.deleteProgram(program);
}


main();
