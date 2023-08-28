const BODY_HTML = `
<div class="flex flex-col h-full">
  <div class="flex flex-row items-center justify-center gap-4 py-4 mx-2">
    <button id="sortButton" class="btn btn-sm">Sort</button>
    <button id="shuffleButton" class="btn btn-sm">Shuffle</button>
    <button id="stopButton" class="btn btn-sm">Stop</button>
    <input id="slider" type="range" min="6" max="200" value="30" class="range range-sm flex-grow w-32" step="1"/>
    <select id="algorithmSelect" class="select select-xs select-bordered max-w-xs">
      <optgroup id="quadGroup" label="Quadratic" />
      <optgroup id="logGroup" label="Logarithmic" />
    </select>
  </div>
  <canvas id="canvas" class="!flex !flex-1 !min-h-0 !w-full "/>
</div>

`;

let tailwindEl = document.createElement("script");
tailwindEl.setAttribute("src", "https://cdn.tailwindcss.com");

document.head.appendChild(tailwindEl);

document.documentElement.classList.add("h-full");
document.body.classList.add("h-full");

document.body.insertAdjacentHTML("afterbegin", BODY_HTML);
document.head.insertAdjacentHTML(
	"beforeend",
	`<link href="https://cdn.jsdelivr.net/npm/daisyui@3.6.2/dist/full.css" rel="stylesheet" type="text/css" />`
);

let DEFAULT_COLOR;
let RED_COLOR;
let GREEN_COLOR;
let BLUE_COLOR;

const SHUFFLE_DELAY = 2000;
const SORT_DELAY = 3000;

const FREQ_MIN = 200;
const FREQ_MAX = 600;

const NOTE_DURATION = 50;

const algorithms = {
	"Selection Sort": {
		type: "Quadratic",
		function: selectionSort,
	},
	"Insertion Sort": {
		type: "Quadratic",
		function: insertionSort,
	},
	"Bubble Sort": {
		type: "Quadratic",
		function: bubbleSort,
	},
	"Cocktail Shaker Sort": {
		type: "Quadratic",
		function: cocktailSort,
	},
	"Quick Sort": {
		type: "Logarithmic",
		function: quickSort,
	},
	"Merge Sort": {
		type: "Logarithmic",
		function: mergeSort,
	},
};

const canvas = document.getElementById("canvas");

let arr;
let sortButton;
let shuffleButton;
let elementsSlider;
let algorithmSelect;
let stopButton;
let stopController;
let running;

// let daisyUI = document.createElement("link");
// daisyUI.setAttribute("rel", "stylesheet");
// daisyUI.setAttribute("type", "text/css");
// daisyUI.setAttribute("href", "https://cdn.jsdelivr.net/npm/daisyui@3.6.2/dist/full.css");

// document.body.appendChild(tailwindEl);
// document.head.appendChild(daisyUI);

function setup() {
	createCanvas(canvas.clientWidth, canvas.clientHeight, canvas);

	window.onresize = () => resizeCanvas(canvas.clientWidth, canvas.clientHeight, canvas);

	DEFAULT_COLOR = color("hsl(220, 13%, 69%)");
	RED_COLOR = color("#ef4444"); // red-500
	GREEN_COLOR = color("#4ade80"); // green-400
	BLUE_COLOR = color("#2563eb"); // sky-400

	running = false;

	sortButton = select("#sortButton");
	sortButton.mousePressed(async () => {
		if (running) return;

		running = true;
		await algorithms[algorithmSelect.value()]["function"]();
		await sortedAnimation();
		running = false;
	});

	shuffleButton = select("#shuffleButton");
	shuffleButton.mousePressed(shuffleArr);

	stopButton = select("#stopButton");
	stopButton.mousePressed(stop);

	slider = select("#slider");

	algorithmSelect = select("#algorithmSelect");
	quadGroup = select("#quadGroup");
	logGroup = select("#logGroup");
	Object.entries(algorithms).forEach(([key, value]) => {
		let el = document.createElement("option");
		el.setAttribute("label", key);
		el.setAttribute("value", key);

		if (value["type"] == "Quadratic") {
			quadGroup.child(el);
		} else if (value["type"] == "Logarithmic") {
			logGroup.child(el);
		}
	});

	stopController = new AbortController();

	createArr();
	strokeWeight(0.5);
}

function createArr() {
	let length = slider.value();
	arr = new Array(length);

	for (let i = 0; i < length; i++) {
		arr[i] = { value: i + 1, color: DEFAULT_COLOR };
	}
}

async function sortedAnimation() {
	let delay = SHUFFLE_DELAY / 2 / arr.length;
	let anim_length = parseInt(arr.length / 6);

	for (let i = 0; i < arr.length + anim_length; i++) {
		if (!running) return;

		if (i < arr.length) {
			arr[i].color = GREEN_COLOR;
			playNote(((2 * arr[i].value) / arr.length) * (FREQ_MAX - FREQ_MIN) + FREQ_MIN, NOTE_DURATION);
		}

		if (i >= anim_length) {
			arr[i - anim_length].color = DEFAULT_COLOR;
		}

		await sleep(delay);
	}
}

async function mergeSort(low = 0, high = arr.length - 1) {
	if (low < high) {
		let mid = Math.floor((low + high) / 2);

		await mergeSort(low, mid);
		await mergeSort(mid + 1, high);

		let updateAndPlay = async (updatedObj, index) => {
			arr[index] = updatedObj;
			arr[index].color = RED_COLOR;
			playNote(((1.5 * arr[index].value) / arr.length) * (FREQ_MAX - FREQ_MIN) + FREQ_MIN, NOTE_DURATION);

			await sleep(SORT_DELAY / arr.length);

			arr[index].color = DEFAULT_COLOR;
		};

		let leftSize = mid - low + 1;
		let rightSize = high - mid;

		let leftArr = new Array(leftSize);
		let rightArr = new Array(rightSize);

		for (let i = 0; i < leftSize; i++) {
			leftArr[i] = Object.assign({}, arr[low + i]);
		}

		for (let j = 0; j < rightSize; j++) {
			rightArr[j] = Object.assign({}, arr[mid + 1 + j]);
		}

		let i = 0,
			j = 0,
			k = low;

		while (i < leftSize && j < rightSize) {
			if (!running) return;

			if (leftArr[i].value <= rightArr[j].value) {
				await updateAndPlay(leftArr[i], k);
				i++;
			} else {
				await updateAndPlay(rightArr[j], k);
				j++;
			}
			k++;
		}

		while (i < leftSize) {
			if (!running) return;

			await updateAndPlay(leftArr[i], k);
			i++;
			k++;
		}

		while (j < rightSize) {
			if (!running) return;

			await updateAndPlay(rightArr[j], k);
			j++;
			k++;
		}
	}
}

async function quickSort(low = 0, high = arr.length - 1) {
	if (low < high) {
		let pivot = low,
			i = low,
			j = high;

		arr[pivot].color = RED_COLOR;
		arr[j].color = BLUE_COLOR;

		while (i < j) {
			while (arr[i].value <= arr[pivot].value && i < j) {
				arr[i].color = DEFAULT_COLOR;
				i++;
				arr[i].color = GREEN_COLOR;
			}

			while (arr[j].value > arr[pivot].value) {
				arr[j].color = DEFAULT_COLOR;
				j--;
				arr[j].color = BLUE_COLOR;
			}

			arr[pivot].color = RED_COLOR;

			if (i < j) {
				await swap(i, j);
			}
		}

		await swap(pivot, j);

		arr[pivot].color = DEFAULT_COLOR;
		arr[i].color = DEFAULT_COLOR;
		arr[j].color = DEFAULT_COLOR;

		await quickSort(low, j - 1);
		await quickSort(j + 1, high);
	}
}

async function cocktailSort() {
	let isSorted = true;

	while (isSorted) {
		if (!running) return;

		for (let i = 0; i < arr.length - 1; i++) {
			if (!running) return;
			if (arr[i].value > arr[i + 1].value) {
				await swap(i, i + 1, SORT_DELAY / 3 / arr.length);
				isSorted = true;
			}
		}

		if (!isSorted) return;

		isSorted = false;
		for (let j = arr.length - 1; j > 0; j--) {
			if (!running) return;
			if (arr[j - 1].value > arr[j].value) {
				await swap(j, j - 1, SORT_DELAY / 3 / arr.length);
				isSorted = true;
			}
		}
	}
}

async function bubbleSort() {
	for (let i = 0; i < arr.length; i++) {
		for (let j = 0; j < arr.length - i - 1; j++) {
			if (arr[j].value > arr[j + 1].value) {
				if (!running) return;

				await swap(j, j + 1, SORT_DELAY / 3 / arr.length);
			}
		}
	}
}

async function insertionSort() {
	for (let i = 1; i < arr.length; i++) {
		let j = i - 1;

		while (j >= 0 && arr[j].value > arr[j + 1].value) {
			if (!running) return;

			await swap(j + 1, j, SORT_DELAY / 2 / arr.length);
			j--;
		}
	}
}

async function selectionSort() {
	for (let i = 0; i < arr.length; i++) {
		if (!running) return;

		let min = i;

		for (let j = i; j < arr.length; j++) {
			if (arr[j].value < arr[min].value) {
				min = j;
			}
		}

		await swap(i, min, (SORT_DELAY * 2) / arr.length);
	}
}

async function shuffleArr() {
	if (running) return;

	running = true;

	for (let i = 0; i < arr.length; i++) {
		if (!running) return;

		let random = Math.floor(Math.random() * arr.length);
		await swap(i, random, SHUFFLE_DELAY / arr.length);
	}

	running = false;
}

async function swap(a, b, delay = SORT_DELAY / arr.length) {
	let freq = ((arr[a].value + arr[b].value) / arr.length) * (FREQ_MAX - FREQ_MIN) + FREQ_MIN;

	playNote(freq, 50);

	let shouldHighlight = arr[a].color == DEFAULT_COLOR;

	if (shouldHighlight) arr[a].color = RED_COLOR;

	let temp = Object.assign({}, arr[a]);
	Object.assign(arr[a], arr[b]);
	Object.assign(arr[b], temp);

	await sleep(delay);

	arr[b].color = DEFAULT_COLOR;
}

function playNote(freq, duration) {
	let sound = new p5.Oscillator("square");
	sound.amp(0.01);
	sound.freq(freq);
	sound.start();
	sound.stop(duration / 1000);

	delete sound;
}

function stop() {
	stopController.abort();
	running = false;
	arr.forEach((val) => (val.color = DEFAULT_COLOR));
}

function sleep(delay) {
	return new Promise((res) => {
		const timeout = setTimeout(res, delay);

		stopController.signal.addEventListener("abort", () => {
			clearTimeout(timeout);
			res();
		});
	});
}

function draw() {
	clear();

	// if (canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight) {
	// 	resizeCanvas(canvas.clientWidth, canvas.clientHeight);
	// }

	if (slider.value() != arr.length) {
		stop();
		createArr();
	}

	arr.forEach((obj, index) => {
		push();
		fill(obj.color);
		// console.log(canvas.clientWidth, canvas.clientHeight, canvas.width, canvas.height);
		var width = canvas.clientWidth / arr.length;
		var height = ((canvas.clientHeight - 150) / arr.length) * obj.value;
		rect(index * width, canvas.clientHeight - height, width, height);
		pop();
	});
}
