(() => {
const THREE = window.THREE;
const viewport = document.getElementById("human-spectrum-language-viewport");

if (viewport && THREE) {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0xebe6dc);

	const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
	camera.up.set(0, 0, 1);
	camera.position.set(5.8, -6.2, 4.6);
	camera.lookAt(0, 0, 0);

	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	viewport.appendChild(renderer.domElement);

	const graph = new THREE.Group();
	scene.add(graph);

	const grid = createCubeGrid(6, 6, 0xa99f91);
	graph.add(grid);

	graph.add(createAxis(new THREE.Vector3(-3.4, 0, 0), new THREE.Vector3(3.4, 0, 0), 0xd33f2f));
	graph.add(createAxis(new THREE.Vector3(0, -3.4, 0), new THREE.Vector3(0, 3.4, 0), 0x2f9e44));
	graph.add(createAxis(new THREE.Vector3(0, 0, -3.4), new THREE.Vector3(0, 0, 3.4), 0x2f66d0));

	graph.add(createLabel("X", new THREE.Vector3(3.75, 0, 0), 0xd33f2f));
	graph.add(createLabel("Y", new THREE.Vector3(0, 3.75, 0), 0x2f9e44));
	graph.add(createLabel("Z", new THREE.Vector3(0, 0, 3.75), 0x2f66d0));

	const controls = THREE.OrbitControls ? new THREE.OrbitControls(camera, renderer.domElement) : null;
	if (controls) {
		controls.enablePan = true;
		controls.enableZoom = true;
		controls.enableRotate = true;
		controls.screenSpacePanning = true;
		controls.target.set(0, 0, 0);
		controls.addEventListener("change", render);
		controls.update();
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
}

function createCubeGrid(size, divisions, color) {
	const halfSize = size / 2;
	const step = size / divisions;
	const points = [];

	for (let index = 0; index <= divisions; index += 1) {
		const position = -halfSize + index * step;

		points.push(new THREE.Vector3(position, -halfSize, -halfSize), new THREE.Vector3(position, halfSize, -halfSize));
		points.push(new THREE.Vector3(position, -halfSize, halfSize), new THREE.Vector3(position, halfSize, halfSize));
		points.push(new THREE.Vector3(position, -halfSize, -halfSize), new THREE.Vector3(position, -halfSize, halfSize));
		points.push(new THREE.Vector3(position, halfSize, -halfSize), new THREE.Vector3(position, halfSize, halfSize));

		points.push(new THREE.Vector3(-halfSize, position, -halfSize), new THREE.Vector3(halfSize, position, -halfSize));
		points.push(new THREE.Vector3(-halfSize, position, halfSize), new THREE.Vector3(halfSize, position, halfSize));
		points.push(new THREE.Vector3(-halfSize, position, -halfSize), new THREE.Vector3(-halfSize, position, halfSize));
		points.push(new THREE.Vector3(halfSize, position, -halfSize), new THREE.Vector3(halfSize, position, halfSize));

		points.push(new THREE.Vector3(-halfSize, -halfSize, position), new THREE.Vector3(halfSize, -halfSize, position));
		points.push(new THREE.Vector3(-halfSize, halfSize, position), new THREE.Vector3(halfSize, halfSize, position));
		points.push(new THREE.Vector3(-halfSize, -halfSize, position), new THREE.Vector3(-halfSize, halfSize, position));
		points.push(new THREE.Vector3(halfSize, -halfSize, position), new THREE.Vector3(halfSize, halfSize, position));
	}

	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.42 });
	return new THREE.LineSegments(geometry, material);
}

function createAxis(start, end, color) {
	const direction = new THREE.Vector3().subVectors(end, start).normalize();
	const length = start.distanceTo(end);
	const group = new THREE.Group();
	const shaftLength = length - 0.28;
	const shaftCenter = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5).add(direction.clone().multiplyScalar(-0.14));
	const shaftGeometry = new THREE.CylinderGeometry(0.018, 0.018, shaftLength, 16);
	const shaftMaterial = new THREE.MeshBasicMaterial({ color });
	const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);

	shaft.position.copy(shaftCenter);
	shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
	group.add(shaft);

	const arrowGeometry = new THREE.ConeGeometry(0.09, 0.28, 24);
	const arrow = new THREE.Mesh(arrowGeometry, shaftMaterial);
	arrow.position.copy(end.clone().add(direction.clone().multiplyScalar(-0.14)));
	arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
	group.add(arrow);

	return group;
}

function createLabel(text, position, color) {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");
	canvas.width = 128;
	canvas.height = 128;

	context.clearRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
	context.font = "700 64px Courier New, monospace";
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText(text, canvas.width / 2, canvas.height / 2);

	const texture = new THREE.CanvasTexture(canvas);
	const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
	const sprite = new THREE.Sprite(material);
	sprite.position.copy(position);
	sprite.scale.set(0.42, 0.42, 0.42);

	return sprite;
}
})();
