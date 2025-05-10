export default class SketchView {
    constructor(root, { onSketchSelect, onSketchAdd, onSketchEdit, onSketchDelete } = {}) {
        this.root = root;
        this.onSketchSelect = onSketchSelect;
        this.onSketchAdd = onSketchAdd;
        this.onSketchEdit = onSketchEdit;
        this.onSketchDelete = onSketchDelete;
        this.mode = "draw"; // Default mode
        this.selectedColor = "black"; // Default color

        this.root.innerHTML = `
            <div class="sketchApp">
                <div class="sidebar">
                    <div class="addButton">
                        <button id="newSketch">Add New Sketch</button>
                    </div>
                    <div class="sketchList"></div>
                </div>
                <div class="canvasArea">
                    <div class="canvasCreator">
                        <label for="resolution">Select Resolution:</label>
                        <select id="resolution">
                            <option value="16x9">16x9</option>
                            <option value="32x18">32x18</option>
                            <option value="48x27">48x27</option>
                            <option value="64x36">64x36</option>
                            <option value="80x45">80x45</option>
                            <option value="96x54">96x54</option>
                            <option value="112x63">112x63</option>
                            <option value="128x72">128x72</option>
                            <option value="144x81">144x81</option>
                            <option value="160x90" selected>160x90</option>
                            <option value="176x99">176x99</option>
                            <option value="192x108">192x108</option>
                            <option value="208x117">208x117</option>
                            <option value="224x126">224x126</option>
                            <option value="240x135">240x135</option>
                            <option value="256x144">256x144</option>
                            <option value="custom">Custom</option>
                        </select>
                        <div id="customResolutionInputs" style="display: none;">
                            <label for="customWidth">Width:</label>
                            <input type="number" id="customWidth" min="1" max="426" placeholder="Width">
                            <label for="customHeight">Height:</label>
                            <input type="number" id="customHeight" min="1" max="240" placeholder="Height">
                        </div>
                        <button id="createCanvas">Create Canvas</button>
                    </div>
                    <div class="canvasContainer"></div>
                </div>
            </div>
        `;

        this._initEventListeners();
    }

    _initEventListeners() {
        const btnAddSketch = this.root.querySelector("#newSketch");
        const resolutionSelect = this.root.querySelector("#resolution");
        const customInputs = this.root.querySelector("#customResolutionInputs");
        const createCanvasBtn = this.root.querySelector("#createCanvas");

        // Hide custom inputs initially
        customInputs.style.display = "none";

        btnAddSketch.addEventListener("click", () => {
            this.onSketchAdd();
        });

        resolutionSelect.addEventListener("change", () => {
            customInputs.style.display = resolutionSelect.value === "custom" ? "block" : "none";
        });

        createCanvasBtn.addEventListener("click", () => {
            let width, height;
            if (resolutionSelect.value === "custom") {
                width = parseInt(this.root.querySelector("#customWidth").value);
                height = parseInt(this.root.querySelector("#customHeight").value);
                if (!width || !height || width <= 0 || height <= 0 || width > 426 || height > 240) {
                    alert("Please enter valid width (1-426) and height (1-240).");
                    return;
                }
            } else {
                [width, height] = resolutionSelect.value.split("x").map(Number);
            }
            // Create canvas and update active sketch
            this._createPixelCanvas(width, height);
            const pixels = Array(width * height).fill("white");
            this.onSketchEdit(pixels, width, height, this.root.querySelector("#sketchTitleInput")?.value.trim() || "Untitled Sketch");
        });

        this.root.querySelector(".sketchList").addEventListener("click", (event) => {
            const sketchItem = event.target.closest(".sketchItem");
            const deleteBtn = event.target.closest(".deleteSketch");
            if (deleteBtn && sketchItem) {
                const confirmDelete = confirm("Are you sure you want to delete this sketch?");
                if (confirmDelete) {
                    this.onSketchDelete(sketchItem.getAttribute("data-id"));
                }
            } else if (sketchItem) {
                this.onSketchSelect(sketchItem.getAttribute("data-id"));
            }
        });
    }

    _createPixelCanvas(width, height) {
        const canvasContainer = this.root.querySelector(".canvasContainer");
        const canvasCreator = this.root.querySelector(".canvasCreator");
            canvasCreator.style.display = "none";
        canvasContainer.innerHTML = `
            <div class="drawingModes">
                <input id="sketchTitleInput" type="text" placeholder="Enter sketch title" />
                <select id="modeSelect">
                    <option value="draw" ${this.mode === "draw" ? "selected" : ""}>Draw</option>
                    <option value="erase" ${this.mode === "erase" ? "selected" : ""}>Erase</option>
                    <option value="fill" ${this.mode === "fill" ? "selected" : ""}>Fill</option>
                </select>
                <div id="colourPicker" class="colourPicker">
                    <span class="colourSwatch" data-color="red" style="background-color: red;"></span>
                    <span class="colourSwatch" data-color="blue" style="background-color: blue;"></span>
                    <span class="colourSwatch" data-color="green" style="background-color: green;"></span>
                    <span class="colourSwatch" data-color="black" style="background-color: black;"></span>
                    <span class="colourSwatch" data-color="yellow" style="background-color: yellow;"></span>
                    <span class="colourSwatch" data-color="orange" style="background-color: orange;"></span>
                    <span class="colourSwatch" data-color="purple" style="background-color: purple;"></span>
                </div>
                <button id="clearCanvas">Clear</button>
                <button id="saveSketch">Download Sketch</button>
            </div>
            <div class="pixelCanvas" style="grid-template-columns: repeat(${width}, 1fr); grid-template-rows: repeat(${height}, 1fr);"></div>
        `;

        const pixelCanvas = canvasContainer.querySelector(".pixelCanvas");
        for (let i = 0; i < width * height; i++) {
            const pixel = document.createElement("div");
            pixel.classList.add("pixel");
            pixelCanvas.appendChild(pixel);
        }

        this._initCanvasEvents(width, height);
    }

    _initCanvasEvents(width, height) {
        const modeSelect = this.root.querySelector("#modeSelect");
        const colourPicker = this.root.querySelector("#colourPicker");
        const clearBtn = this.root.querySelector("#clearCanvas");
        const saveBtn = this.root.querySelector("#saveSketch");
        const titleInput = this.root.querySelector("#sketchTitleInput");
        const pixelCanvas = this.root.querySelector(".pixelCanvas");
        const pixels = this.root.querySelectorAll(".pixel");

        let isDrawing = false;

        // Initialize mode
        modeSelect.value = this.mode;
        modeSelect.addEventListener("change", () => {
            this.mode = modeSelect.value;
        });

        // Initialize color picker
        const swatches = colourPicker.querySelectorAll(".colourSwatch");
        swatches.forEach(swatch => {
            swatch.addEventListener("click", () => {
                swatches.forEach(s => s.classList.remove("selected"));
                swatch.classList.add("selected");
                this.selectedColor = swatch.getAttribute("data-color");
            });
            if (swatch.getAttribute("data-color") === this.selectedColor) {
                swatch.classList.add("selected");
            }
        });

        // Title input listener
        titleInput.addEventListener("blur", () => {
            const title = titleInput.value.trim() || "Untitled Sketch";
            this.onSketchEdit(this._getPixelData(pixels), width, height, title);
        });

        pixels.forEach(pixel => {
            pixel.addEventListener("mousedown", (event) => {
                event.preventDefault();
                isDrawing = true;
                this._handlePixelInteract(pixel, this.mode, this.selectedColor, pixels);
            });
        });

        pixelCanvas.addEventListener("mousemove", (event) => {
            if (isDrawing) {
                const pixel = event.target.closest(".pixel");
                if (pixel) {
                    this._handlePixelInteract(pixel, this.mode, this.selectedColor, pixels);
                }
            }
        });

        document.addEventListener("mouseup", () => {
            if (isDrawing) {
                isDrawing = false;
                this.onSketchEdit(this._getPixelData(pixels), width, height, titleInput.value.trim() || "Untitled Sketch");
            }
        });

        pixelCanvas.addEventListener("mouseleave", () => {
            if (isDrawing) {
                isDrawing = false;
                this.onSketchEdit(this._getPixelData(pixels), width, height, titleInput.value.trim() || "Untitled Sketch");
            }
        });

        clearBtn.addEventListener("click", () => {
            pixels.forEach(pixel => {
                pixel.style.backgroundColor = "white";
            });
            this.onSketchEdit(this._getPixelData(pixels), width, height, titleInput.value.trim() || "Untitled Sketch");
        });

        saveBtn.addEventListener("click", () => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            pixels.forEach((pixel, index) => {
                const x = index % width;
                const y = Math.floor(index / width);
                ctx.fillStyle = pixel.style.backgroundColor || "white";
                ctx.fillRect(x, y, 1, 1);
            });
            const link = document.createElement("a");
            link.download = "sketch.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        });
    }

    _handlePixelInteract(pixel, mode, color, pixels) {
        if (mode === "draw") {
            pixel.style.backgroundColor = color;
        } else if (mode === "erase") {
            pixel.style.backgroundColor = "white";
        } else if (mode === "fill") {
            pixels.forEach(pixel => {
                pixel.style.backgroundColor = color;
            });
        }
    }

    _getPixelData(pixels) {
        return Array.from(pixels).map(pixel => pixel.style.backgroundColor || "white");
    }

    updateSketchList(sketches) {
        const sketchList = this.root.querySelector(".sketchList");
        sketchList.innerHTML = "";
        for (const sketch of sketches) {
            const html = this._createListItemHTML(sketch.id, sketch.title, new Date(sketch.updated));
            sketchList.insertAdjacentHTML("beforeend", html);
        }

        sketchList.querySelectorAll(".sketchItem").forEach(sketch => {
            sketch.addEventListener("click", () => {
                this.onSketchSelect(sketch.getAttribute("data-id"));
            });
        });
    }

    _createListItemHTML(id, title, updated) {
        return `
            <div class="sketchItem" data-id="${id}">
                <div class="sketchTitle">${title}</div>
                <div class="sketchUpdated">${updated.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}</div>
                <button class="deleteSketch">Delete</button>
            </div>
        `;
    }

    updateActiveSketch(sketch) {
        this.root.querySelectorAll(".sketchItem").forEach(item => {
            item.classList.remove("active");
            if (item.getAttribute("data-id") === String(sketch.id)) {
                item.classList.add("active");
            }
        });

        const canvasCreator = this.root.querySelector(".canvasCreator");
        const canvasContainer = this.root.querySelector(".canvasContainer");

        // If sketch has no canvas (width/height = 0), show resolution menu
        if (!sketch.width || !sketch.height) {
            canvasCreator.style.display = "block";
            canvasContainer.innerHTML = "";
        } else {
            // Otherwise, show the canvas
            this._createPixelCanvas(sketch.width, sketch.height);
            const pixels = this.root.querySelectorAll(".pixel");
            const titleInput = this.root.querySelector("#sketchTitleInput");
            titleInput.value = sketch.title || "Untitled Sketch";
            sketch.pixels.forEach((color, index) => {
                pixels[index].style.backgroundColor = color;
            });
        }
    }

    updateSketchPreviewVisibility(visible) {
        this.root.querySelector(".canvasArea").style.display = visible ? "block" : "none";
    }
}