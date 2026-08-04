(() => {
const THREE = window.THREE;
const viewport = document.getElementById("human-spectrum-language-viewport");

if (viewport && THREE) {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0xebe6dc);

	const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
	camera.up.set(0, 0, 1);
	camera.position.set(16.0, -18.0, 12.0);
	camera.lookAt(0, 0, 3.6); // Aim the camera above the origin to position the graph lower in view

	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	viewport.appendChild(renderer.domElement);

	const graph = new THREE.Group();
	scene.add(graph);

	// Create 3 custom grids for the 3 planes (XY, YZ, ZX)
	const colorGrid = 0xa99f91;

	// XY Grid (X: -10 to 10, Y: -10 to 10)
	graph.add(createGridLines('x', 'y', [-10, 10], [-10, 10], 10, 10, colorGrid));

	// YZ Grid (Y: -10 to 10, Z levels: 0 to 6)
	graph.add(createGridLines('y', 'z', [-10, 10], [0, 12], 10, 6, colorGrid));

	// ZX Grid (Z levels: 0 to 6, X: -10 to 10)
	graph.add(createGridLines('z', 'x', [0, 12], [-10, 10], 6, 10, colorGrid));

	graph.add(createAxis(new THREE.Vector3(-10.4, 0, 0), new THREE.Vector3(10.4, 0, 0), 0xd33f2f));
	graph.add(createAxis(new THREE.Vector3(0, -10.4, 0), new THREE.Vector3(0, 10.4, 0), 0x2f9e44));
	// Z-axis only has positive part and is scaled differently
	graph.add(createAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 12.4), 0x2f66d0, true));

	// Mark the graph origin with a small purple sphere
	const sphereGeometry = new THREE.SphereGeometry(0.1, 24, 16);
	const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xa62e96 });
	let activeSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	graph.add(activeSphere);

	graph.add(createLabel("mimetic", new THREE.Vector3(11.2, 0, 0), 0xd33f2f));
	graph.add(createLabel("abstracted", new THREE.Vector3(-11.4, 0, 0), 0xd33f2f));
	graph.add(createLabel("perceptual", new THREE.Vector3(0, 11.4, 0), 0x2f9e44));
	graph.add(createLabel("conceptual", new THREE.Vector3(0, -11.4, 0), 0x2f9e44));
	graph.add(createLabel("Data Structure", new THREE.Vector3(0, 0, 13.0), 0x2f66d0));

	// Add '0' at the origin in grey
	graph.add(createLabel("0", new THREE.Vector3(0, 0, -0.75), 0x666666, true));

	const controls = THREE.OrbitControls ? new THREE.OrbitControls(camera, renderer.domElement) : null;
	if (controls) {
		controls.mouseButtons = {
			LEFT: THREE.MOUSE.PAN,
			MIDDLE: THREE.MOUSE.DOLLY,
			RIGHT: THREE.MOUSE.ROTATE
		};
		controls.enablePan = true;
		controls.enableZoom = true;
		controls.enableRotate = true;
		controls.screenSpacePanning = true;
		controls.target.set(0, 0, 3.6);
		controls.addEventListener("change", render);
		controls.update();

		// Create Reset Button
		const resetBtn = document.createElement("button");
		resetBtn.innerText = "Reset View";
		resetBtn.style.position = "absolute";
		resetBtn.style.top = "1vh";
		resetBtn.style.right = "1vw";
		resetBtn.style.zIndex = "5";
		resetBtn.style.padding = "0.5vh 1vw";
		resetBtn.style.fontFamily = "inherit";
		resetBtn.style.fontWeight = "bold";
		resetBtn.style.background = "var(--background, #000)";
		resetBtn.style.color = "var(--foreground, #fff)";
		resetBtn.style.border = "0.1vw solid var(--rule, #333)";
		resetBtn.style.cursor = "pointer";
		
		resetBtn.addEventListener("mouseenter", () => {
			resetBtn.style.background = "var(--rule, #333)";
		});
		resetBtn.addEventListener("mouseleave", () => {
			resetBtn.style.background = "var(--background, #000)";
		});

		resetBtn.addEventListener("click", () => {
			camera.position.set(16.0, -18.0, 12.0);
			camera.up.set(0, 0, 1);
			controls.target.set(0, 0, 3.6);
			controls.update();
			render();
		});

		viewport.appendChild(resetBtn);
	}

	const resizeObserver = new ResizeObserver(resize);
	resizeObserver.observe(viewport);
	resize();
	render();

	function resize() {
		const width = viewport.clientWidth;
		const height = viewport.clientHeight;

		if (!width || !height) {
			return;
		}

		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		renderer.setSize(width, height, false);
		render();
	}

	function render() {
		renderer.render(scene, camera);
	}

	// Update the UI values when sliders move
	const axes = ['x', 'y', 'z', 'w'];
	const sliders = {};
	const valueBoxes = {};
	axes.forEach(axis => {
		const slider = document.getElementById(`slider-${axis}`);
		const valueBox = document.getElementById(`value-${axis}`);
		if (slider && valueBox) {
			sliders[axis] = slider;
			valueBoxes[axis] = valueBox;
			slider.addEventListener("input", () => {
				valueBox.textContent = slider.value;
				updateSpherePosition();
			});
		}
	});

	// Move the sphere live while retaining W for later game behavior
	function updateSpherePosition() {
		if (!axes.every(axis => sliders[axis])) {
			return;
		}

		const values = Object.fromEntries(
			axes.map(axis => [axis, Number(sliders[axis].value)])
		);

		activeSphere.position.set(values.x, values.y, values.z * 2);
		activeSphere.userData.languagePrecision = values.w;
		render();
	}

	// Commit the current sphere and reset a new active sphere at the origin
	const plotButton = document.querySelector(".game-ui .plot-btn");
	if (plotButton) {
		plotButton.addEventListener("click", () => {
			activeSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
			graph.add(activeSphere);

			axes.forEach(axis => {
				sliders[axis].value = "0";
				valueBoxes[axis].textContent = "0";
			});

			updateSpherePosition();
		});
	}

}

function createGridLines(axis1, axis2, range1, range2, divisions1, divisions2, color) {
	const points = [];
	
	// Lines along axis 1 (across range1) stepping along axis 2
	const step2 = (range2[1] - range2[0]) / divisions2;
	for (let i = 0; i <= divisions2; i++) {
		const val2 = range2[0] + i * step2;
		const ptA = new THREE.Vector3();
		const ptB = new THREE.Vector3();
		
		ptA[axis1] = range1[0]; ptA[axis2] = val2;
		ptB[axis1] = range1[1]; ptB[axis2] = val2;
		
		points.push(ptA, ptB);
	}
	
	// Lines along axis 2 (across range2) stepping along axis 1
	const step1 = (range1[1] - range1[0]) / divisions1;
	for (let i = 0; i <= divisions1; i++) {
		const val1 = range1[0] + i * step1;
		const ptA = new THREE.Vector3();
		const ptB = new THREE.Vector3();
		
		ptA[axis1] = val1; ptA[axis2] = range2[0];
		ptB[axis1] = val1; ptB[axis2] = range2[1];
		
		points.push(ptA, ptB);
	}

	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.42 });
	return new THREE.LineSegments(geometry, material);
}

function createAxis(start, end, color, isZAxis = false) {
	const direction = new THREE.Vector3().subVectors(end, start).normalize();
	const length = start.distanceTo(end);
	const group = new THREE.Group();
	const shaftLength = isZAxis ? length - 0.28 : length - 0.56;
	const shaftCenter = isZAxis
		? start.clone().add(direction.clone().multiplyScalar(shaftLength / 2))
		: new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
	const shaftGeometry = new THREE.CylinderGeometry(0.018, 0.018, shaftLength, 16);
	const shaftMaterial = new THREE.MeshBasicMaterial({ color });
	const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);

	shaft.position.copy(shaftCenter);
	shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
	group.add(shaft);

	// Add 10 ticks for positive and negative ends
	const tickGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.4, 8);
	const tickMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });

	// We'll place ticks at distance 1, 2, ..., 10 from origin in each direction
	const origin = new THREE.Vector3(0, 0, 0);
	
	// Create tick marks and number labels
	if (isZAxis) {
		for (let i = 1; i <= 6; i++) {
			const positionScale = i * 2;
			const tickPos = origin.clone().add(direction.clone().multiplyScalar(positionScale));
			const tick = new THREE.Mesh(tickGeometry, tickMaterial);
			tick.position.copy(tickPos);
			tick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
			group.add(tick);

			const labelOffset = new THREE.Vector3(-0.75, 0, 0);
			const numberLabel = createLabel(`${i}D`, tickPos.clone().add(labelOffset), color, true);
			group.add(numberLabel);
		}
	} else {
		for (let i = -10; i <= 10; i++) {
			if (i === 0) continue;
			
			const tickPos = origin.clone().add(direction.clone().multiplyScalar(i));
			const tick = new THREE.Mesh(tickGeometry, tickMaterial);
			tick.position.copy(tickPos);
			
			// Point the ticks downward along the Z-axis
			tick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1));
			
			// Offset the label text below the tick (in the -Z direction)
			const labelOffset = new THREE.Vector3(0, 0, -0.75); 
			
			group.add(tick);

			const numberLabel = createLabel(i.toString(), tickPos.clone().add(labelOffset), color, true);
			group.add(numberLabel);
		}
	}

	const arrowGeometry = new THREE.ConeGeometry(0.09, 0.28, 24);
	const arrowEnd = new THREE.Mesh(arrowGeometry, shaftMaterial);
	arrowEnd.position.copy(end.clone().add(direction.clone().multiplyScalar(-0.14)));
	arrowEnd.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
	group.add(arrowEnd);

	if (!isZAxis) {
		const arrowStart = new THREE.Mesh(arrowGeometry, shaftMaterial);
		arrowStart.position.copy(start.clone().add(direction.clone().multiplyScalar(0.14)));
		arrowStart.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().negate());
		group.add(arrowStart);
	}

	return group;
}

function createLabel(text, position, color, isSmall = false) {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	const font = "700 80px Courier New, monospace";
	const canvasHeight = 128;
	const horizontalPadding = isSmall ? 32 : 64;

	// Size the label canvas from its text so longer labels render without clipping
	context.font = font;
	canvas.width = Math.ceil(context.measureText(text).width + horizontalPadding);
	canvas.height = canvasHeight;

	context.clearRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
	context.font = font;
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(text, canvas.width / 2, canvas.height / 2);

	const texture = new THREE.CanvasTexture(canvas);
	const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
	const sprite = new THREE.Sprite(material);
	sprite.position.copy(position);

	const labelHeight = isSmall ? 0.55 : 0.7;
	sprite.scale.set(labelHeight * (canvas.width / canvas.height), labelHeight, labelHeight);

	return sprite;
}
})();
