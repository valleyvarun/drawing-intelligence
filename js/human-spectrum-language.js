(() => {

// BEFORE PUSHING TO GITHUB
// 1) COPY CORRECT CONTENT INTO x_cards_position.json
// 2) SET USE_X_CARD_POSITIONS TO true

// WHILE IN LOCAL DEV 
// 1) SET USE_X_CARD_POSITIONS TO false
// 2) ADD LATEST JSON FILE TO cards/json/ (e.g., 1_cards_position.json, 2_cards_position.json, etc.)
const USE_X_CARD_POSITIONS = false;
// DO NOT CHANGE THE ABOVE LINES 


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

	// Create a movable marker containing a sphere and its card
	const sphereGeometry = new THREE.SphereGeometry(0.1, 24, 16);
	const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xa62e96 });
	const CARD_COUNT = 20;
	const cardSources = Array.from({ length: CARD_COUNT }, (_, index) => `cards/${index + 1}.png`);
	const textureLoader = new THREE.TextureLoader();
	const cardTextures = cardSources.map(source => textureLoader.load(source, render));
	const selectableSpheres = [];

	function createMarker(cardIndex, isPlotted = false) {
		const marker = new THREE.Group();
		const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
		const card = new THREE.Sprite(new THREE.SpriteMaterial({
			map: cardTextures[cardIndex],
			transparent: true
		}));

		card.position.set(0, 0, 0.9);
		card.scale.set(0.8, 1.2, 1);
		marker.add(sphere, card);
		graph.add(marker);
		selectableSpheres.push(sphere);

		const markerState = { marker, sphere, card, cardIndex, isPlotted };
		sphere.userData.markerState = markerState;
		return markerState;
	}

	let activeMarker = createMarker(0);
	let draftMarker = activeMarker;
	let plottedCards = [];
	let availableCardIndexes = cardSources.map((_, index) => index);

	graph.add(createLabel("mimetic", new THREE.Vector3(11.2, 0, 0), 0xd33f2f));
	graph.add(createLabel("abstracted", new THREE.Vector3(-11.4, 0, 0), 0xd33f2f));
	graph.add(createLabel("perceptual", new THREE.Vector3(0, 11.4, 0), 0x2f9e44));
	graph.add(createLabel("conceptual", new THREE.Vector3(0, -11.4, 0), 0x2f9e44));
	graph.add(createLabel("Data Structure", new THREE.Vector3(0, 0, 13.0), 0x2f66d0));

	// Add '0' at the origin in grey
	graph.add(createLabel("0", new THREE.Vector3(0, 0, -0.75), 0x666666, true));

	let allValuesActive = false;
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

		// Toggle projection lines for every sphere in the viewport
		const allValuesBtn = document.createElement("button");
		allValuesBtn.innerText = "All Values";
		allValuesBtn.setAttribute("aria-pressed", "false");
		allValuesBtn.style.position = "absolute";
		allValuesBtn.style.top = "5vh";
		allValuesBtn.style.right = "1vw";
		allValuesBtn.style.zIndex = "5";
		allValuesBtn.style.padding = "0.5vh 1vw";
		allValuesBtn.style.fontFamily = "inherit";
		allValuesBtn.style.fontWeight = "bold";
		allValuesBtn.style.background = "var(--background, #000)";
		allValuesBtn.style.color = "var(--foreground, #fff)";
		allValuesBtn.style.border = "0.1vw solid var(--rule, #333)";
		allValuesBtn.style.cursor = "pointer";

		allValuesBtn.addEventListener("click", () => {
			allValuesActive = !allValuesActive;
			allValuesBtn.setAttribute("aria-pressed", String(allValuesActive));
			allValuesBtn.style.background = allValuesActive
				? "#a62e96"
				: "var(--background, #000)";
			allValuesBtn.style.borderColor = allValuesActive
				? "#a62e96"
				: "var(--rule, #333)";

			if (allValuesActive) {
				drawAllProjectionLines();
			} else {
				clearSphereSelection();
			}
		});

		viewport.appendChild(resetBtn);
		viewport.appendChild(allValuesBtn);
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

	// Select spheres with a click and show their X, Y, and Z axis projections
	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	const projectionLines = new THREE.Group();
	const projectionMaterials = [
		new THREE.LineBasicMaterial({ color: 0xd33f2f }),
		new THREE.LineBasicMaterial({ color: 0x2f9e44 }),
		new THREE.LineBasicMaterial({ color: 0x2f66d0 })
	];
	let selectedSphere = null;
	let pointerDownPosition = null;
	graph.add(projectionLines);

	function clearProjectionLines() {
		while (projectionLines.children.length) {
			const line = projectionLines.children[0];
			projectionLines.remove(line);
			line.geometry.dispose();
		}
	}

	function clearSphereSelection() {
		if (activeMarker?.isPlotted) {
			restorePlottedPosition(activeMarker);
			exitEditMode();
		}
		selectedSphere = null;
		clearProjectionLines();
		render();
	}

	function addProjectionLines(sphere) {
		const center = new THREE.Vector3();
		sphere.getWorldPosition(center);
		const axisPoints = [
			new THREE.Vector3(center.x, 0, 0),
			new THREE.Vector3(0, center.y, 0),
			new THREE.Vector3(0, 0, center.z)
		];

		axisPoints.forEach((axisPoint, index) => {
			const geometry = new THREE.BufferGeometry().setFromPoints([center, axisPoint]);
			projectionLines.add(new THREE.Line(geometry, projectionMaterials[index]));
		});
	}

	function drawProjectionLines(sphere) {
		clearProjectionLines();
		selectedSphere = sphere;
		addProjectionLines(sphere);
		render();
	}

	function drawAllProjectionLines() {
		selectedSphere = null;
		clearProjectionLines();
		selectableSpheres
			.filter(sphere => sphere.parent && sphere.parent.parent === graph)
			.forEach(addProjectionLines);
		render();
	}

	renderer.domElement.addEventListener("pointerdown", event => {
		pointerDownPosition = { x: event.clientX, y: event.clientY };
	});

	renderer.domElement.addEventListener("pointerup", event => {
		if (!pointerDownPosition) {
			return;
		}

		const movement = Math.hypot(
			event.clientX - pointerDownPosition.x,
			event.clientY - pointerDownPosition.y
		);
		pointerDownPosition = null;
		if (movement > 4) {
			return;
		}

		const bounds = renderer.domElement.getBoundingClientRect();
		pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
		pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
		raycaster.setFromCamera(pointer, camera);

		const spheresInGraph = selectableSpheres.filter(
			sphere => sphere.parent && sphere.parent.parent === graph
		);
		const intersection = raycaster.intersectObjects(spheresInGraph, false)[0];
		if (allValuesActive) {
			drawAllProjectionLines();
		} else if (intersection) {
			const markerState = intersection.object.userData.markerState;
			if (markerState?.isPlotted) {
				enterEditMode(markerState);
			}
			drawProjectionLines(intersection.object);
		} else {
			clearSphereSelection();
		}
	});

	// Cycle through the available game cards
	const cardImage = document.querySelector(".game-ui .card img");
	const cardNumber = document.querySelector(".game-ui .card-number");
	const previousCardButton = document.querySelector(".game-ui .card-prev");
	const nextCardButton = document.querySelector(".game-ui .card-next");
	const removeCardButton = document.querySelector(".game-ui .remove-card-btn");
	const plotButton = document.querySelector(".game-ui .plot-btn");
	let currentDeckPosition = 0;
	let currentCardIndex = 0;

	function showCard(deckPosition) {
		if (!availableCardIndexes.length || !activeMarker) {
			return;
		}

		currentDeckPosition = (
			deckPosition + availableCardIndexes.length
		) % availableCardIndexes.length;
		currentCardIndex = availableCardIndexes[currentDeckPosition];
		cardImage.src = cardSources[currentCardIndex];
		cardImage.alt = `Card ${currentCardIndex + 1}`;
		cardNumber.textContent = `Card ${currentCardIndex + 1}`;
		activeMarker.card.material.map = cardTextures[currentCardIndex];
		activeMarker.card.material.needsUpdate = true;
		resetSliders();
	}

	if (cardImage && previousCardButton && nextCardButton) {
		previousCardButton.addEventListener("click", () => showCard(currentDeckPosition - 1));
		nextCardButton.addEventListener("click", () => showCard(currentDeckPosition + 1));
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
		if (!activeMarker || !axes.every(axis => sliders[axis])) {
			return;
		}

		const values = getSliderValues();

		activeMarker.marker.position.set(values.x, values.y, values.z * 2);
		activeMarker.marker.userData.languagePrecision = values.w;
		if (allValuesActive) {
			drawAllProjectionLines();
		} else if (selectedSphere === activeMarker.sphere) {
			drawProjectionLines(selectedSphere);
		} else {
			render();
		}
	}

	function getSliderValues() {
		return Object.fromEntries(
			axes.map(axis => [axis, Number(sliders[axis].value)])
		);
	}

	function resetSliders() {
		axes.forEach(axis => {
			sliders[axis].value = "0";
			valueBoxes[axis].textContent = "0";
		});

		updateSpherePosition();
	}

	function setSliders(values) {
		axes.forEach(axis => {
			sliders[axis].value = String(values[axis]);
			valueBoxes[axis].textContent = String(values[axis]);
		});
	}

	function getPlottedCard(markerState) {
		return plottedCards.find(card => card.card === markerState.cardIndex + 1);
	}

	function restorePlottedPosition(markerState) {
		const cardPosition = getPlottedCard(markerState);
		if (!cardPosition) {
			return;
		}
		markerState.marker.position.set(cardPosition.x, cardPosition.y, cardPosition.z * 2);
		markerState.marker.userData.languagePrecision = cardPosition.w;
	}

	function enterEditMode(markerState) {
		if (activeMarker?.isPlotted && activeMarker !== markerState) {
			restorePlottedPosition(activeMarker);
		}
		if (draftMarker?.marker.parent === graph) {
			graph.remove(draftMarker.marker);
		}

		activeMarker = markerState;
		currentCardIndex = markerState.cardIndex;
		setDeckEnabled(true);
		const cardPosition = getPlottedCard(markerState);
		if (cardPosition) {
			setSliders(cardPosition);
		}
		cardImage.src = cardSources[currentCardIndex];
		cardImage.alt = `Card ${currentCardIndex + 1}`;
		cardNumber.textContent = `Card ${currentCardIndex + 1}`;
		previousCardButton.hidden = true;
		nextCardButton.hidden = true;
		removeCardButton.hidden = false;
		plotButton.disabled = false;
	}

	function exitEditMode() {
		if (!activeMarker?.isPlotted) {
			return;
		}

		previousCardButton.hidden = false;
		nextCardButton.hidden = false;
		removeCardButton.hidden = true;
		if (availableCardIndexes.length) {
			currentDeckPosition %= availableCardIndexes.length;
			currentCardIndex = availableCardIndexes[currentDeckPosition];
			if (!draftMarker) {
				draftMarker = createMarker(currentCardIndex);
			}
			activeMarker = draftMarker;
			if (draftMarker.marker.parent !== graph) {
				graph.add(draftMarker.marker);
			}
			setDeckEnabled(true);
			showCard(currentDeckPosition);
		} else {
			activeMarker = null;
			setDeckEnabled(false);
		}
	}

	function setDeckEnabled(enabled) {
		previousCardButton.disabled = !enabled;
		nextCardButton.disabled = !enabled;
		plotButton.disabled = !enabled;
		axes.forEach(axis => {
			sliders[axis].disabled = !enabled;
		});
		if (enabled) {
			cardImage.style.visibility = "visible";
			cardNumber.hidden = false;
			cardImage.src = cardSources[currentCardIndex];
			cardImage.alt = `Card ${currentCardIndex + 1}`;
			cardNumber.textContent = `Card ${currentCardIndex + 1}`;
		} else {
			cardImage.style.visibility = "hidden";
			cardNumber.hidden = true;
			cardImage.removeAttribute("src");
			cardImage.alt = "";
		}
	}

	function restorePlottedCard(cardPosition) {
		const cardIndex = cardPosition.card - 1;
		if (!cardTextures[cardIndex]) {
			return;
		}

		const restoredMarker = createMarker(cardIndex, true);
		restoredMarker.marker.position.set(cardPosition.x, cardPosition.y, cardPosition.z * 2);
		restoredMarker.marker.userData.languagePrecision = cardPosition.w;
	}

	let nextSnapshotNumber = Number(localStorage.getItem("nextCardSnapshotNumber")) || 1;

	async function loadLatestSnapshot() {
		try {
			let latestSnapshotNumber = null;
			let snapshotPath = "cards/json/x_cards_position.json";

			if (!USE_X_CARD_POSITIONS) {
				const directoryResponse = await fetch("cards/json/", { cache: "no-store" });
				if (!directoryResponse.ok) {
					return;
				}

				const directoryListing = await directoryResponse.text();
				const snapshotNumbers = Array.from(
					directoryListing.matchAll(/(?:href=["'][^"']*\/)?(\d+)_cards_position\.json/gi),
					match => Number(match[1])
				);
				if (!snapshotNumbers.length) {
					return;
				}

				latestSnapshotNumber = Math.max(...snapshotNumbers);
				snapshotPath = `cards/json/${latestSnapshotNumber}_cards_position.json`;
			}

			const snapshotResponse = await fetch(
				snapshotPath,
				{ cache: "no-store" }
			);
			if (!snapshotResponse.ok) {
				throw new Error(`Unable to load card positions (${snapshotResponse.status})`);
			}

			const latestSnapshot = await snapshotResponse.json();
			if (latestSnapshotNumber !== null) {
				nextSnapshotNumber = latestSnapshotNumber + 1;
				localStorage.setItem("nextCardSnapshotNumber", String(nextSnapshotNumber));
			}

			plottedCards = Array.isArray(latestSnapshot.cards) ? latestSnapshot.cards : [];
			plottedCards.forEach(restorePlottedCard);

			const plottedCardNumbers = new Set(plottedCards.map(card => card.card));
			availableCardIndexes = cardSources
				.map((_, index) => index)
				.filter(index => !plottedCardNumbers.has(index + 1));

			if (availableCardIndexes.length) {
				currentDeckPosition = 0;
				showCard(0);
			} else {
				graph.remove(activeMarker.marker);
				activeMarker = null;
				draftMarker = null;
				setDeckEnabled(false);
				render();
			}
		} catch (error) {
			console.error(error);
		}
	}

	async function saveSnapshot(cards) {
		const fileName = `${nextSnapshotNumber}_cards_position.json`;
		const file = new Blob([JSON.stringify({ cards }, null, 2)], {
			type: "application/json"
		});
		const downloadUrl = URL.createObjectURL(file);
		const downloadLink = document.createElement("a");
		downloadLink.href = downloadUrl;
		downloadLink.download = fileName;
		downloadLink.click();
		URL.revokeObjectURL(downloadUrl);

		nextSnapshotNumber++;
		localStorage.setItem("nextCardSnapshotNumber", String(nextSnapshotNumber));
	}

	removeCardButton?.addEventListener("click", async () => {
		if (!activeMarker?.isPlotted) {
			return;
		}

		const markerToRemove = activeMarker;
		const nextPlottedCards = plottedCards.filter(card => card.card !== markerToRemove.cardIndex + 1);
		removeCardButton.disabled = true;
		try {
			await saveSnapshot(nextPlottedCards);
			plottedCards = nextPlottedCards;
			graph.remove(markerToRemove.marker);
			const selectableIndex = selectableSpheres.indexOf(markerToRemove.sphere);
			if (selectableIndex !== -1) {
				selectableSpheres.splice(selectableIndex, 1);
			}
			availableCardIndexes.push(markerToRemove.cardIndex);
			availableCardIndexes.sort((first, second) => first - second);
			currentDeckPosition = availableCardIndexes.indexOf(markerToRemove.cardIndex);
			clearProjectionLines();
			selectedSphere = null;
			exitEditMode();
			render();
		} catch (error) {
			console.error(error);
			window.alert(error.message);
		} finally {
			removeCardButton.disabled = false;
		}
	});

	// Save a new marker or update the selected plotted marker
	if (plotButton) {
		plotButton.addEventListener("click", async () => {
			if (!activeMarker) {
				return;
			}

			const position = getSliderValues();
			const isEditing = activeMarker.isPlotted;
			const updatedCard = { card: currentCardIndex + 1, ...position };
			const nextPlottedCards = isEditing
				? plottedCards.map(card => card.card === updatedCard.card ? updatedCard : card)
				: [...plottedCards, updatedCard];

			plotButton.disabled = true;
			try {
				await saveSnapshot(nextPlottedCards);
				plottedCards = nextPlottedCards;
				if (isEditing) {
					clearProjectionLines();
					selectedSphere = null;
					exitEditMode();
					render();
					return;
				}

				activeMarker.isPlotted = true;
				availableCardIndexes.splice(currentDeckPosition, 1);

				if (!availableCardIndexes.length) {
					activeMarker = null;
					draftMarker = null;
					setDeckEnabled(false);
					render();
					return;
				}

				currentDeckPosition %= availableCardIndexes.length;
				currentCardIndex = availableCardIndexes[currentDeckPosition];
				activeMarker = createMarker(currentCardIndex);
				draftMarker = activeMarker;
				showCard(currentDeckPosition);
				plotButton.disabled = false;
			} catch (error) {
				console.error(error);
				window.alert(error.message);
				plotButton.disabled = false;
			}
		});
	}

	loadLatestSnapshot();

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
