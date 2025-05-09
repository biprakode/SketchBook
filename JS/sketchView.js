export default class SketchView {
    constructor(root, { onSketchSelect, onSketchAdd, onSketchEdit, onSketchDelete } = {}) {
        this.root = root;
        this.onSketchSelect = onSketchSelect;
        this.onSketchAdd = onSketchAdd;
        this.onSketchEdit = onSketchEdit;
        this.onSketchDelete = onSketchDelete

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
                            <option value="256x144">256x144</option>
                            <option value="640x480">640x480</option>
                            <option value="800x600">800x600</option>
                            <option value="1024x768">1024x768</option>
                            <option value="1920x1080">1920x1080</option>
                            <option value="custom">Custom</option>
                        </select>
                        <div id="customResolutionInputs" style="display: none;">
                            <label for="customWidth">Width:</label>
                            <input type="number" id="customWidth" min="1" placeholder="Width">
                            <label for="customHeight">Height:</label>
                            <input type="number" id="customHeight" min="1" placeholder="Height">
                        </div>
                        <button id="createCanvas">Create Canvas</button>
                    </div>
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
                if (!width || !height || width <= 0 || height <= 0) {
                    alert("Please enter valid width and height.");
                    return;
                }
            } else {
                [width, height] = resolutionSelect.value.split("x").map(Number);
            }
            this._createPixelCanvas(width, height);
            this.onSketchAdd(width, height);
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
        const canvasArea = this.root.querySelector(".canvasArea");
        canvasArea.innerHTML = `
            <div class="drawingModes">
                <select id="modeSelect">
                    <option value="draw">Draw</option>
                    <option value="erase">Erase</option>
                    <option value="fill">Fill</option>
                </select>
                <select id="colourSelect">
                    <option value="red">Red</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="black">Black</option>
                    <option value="yellow">Yellow</option>
                    <option value="orange">Orange</option>
                    <option value="purple">Purple</option>
                </select>
                <button id="clearCanvas">Clear</button>
                <button id="saveSketch">Download Sketch</button>
            </div>
            <div class="pixelCanvas" style="grid-template-columns: repeat(${width}, 1fr); grid-template-rows: repeat(${height}, 1fr);"></div>
        `;

        const pixelCanvas = canvasArea.querySelector(".pixelCanvas");
        for (let i = 0; i < width * height; i++) {
            const pixel = document.createElement("div");
            pixel.classList.add("pixel");
            pixelCanvas.appendChild(pixel);
        }

        this._initCanvasEvents(width, height);
    }

    _initCanvasEvents(width , height) {
        const modeSelect = this.root.querySelector("#modeSelect");
        const colourSelect = this.root.querySelector("#colourSelect");
        const clearBtn = this.root.querySelector("#clearCanvas");
        const saveBtn = this.root.querySelector("#saveSketch");
        const pixels = this.root.querySelectorAll(".pixel");

        let isDrawing = false;

        pixels.forEach(pixel => {
            pixel.addEventListener('mousedown' , () => {
                isDrawing = true;
                this._handlePixelInteract(pixel , modeSelect.value , colourSelect.value , pixels);
            });

            pixel.addEventListener('mousemove' , () => {
                if(isDrawing) {
                    this._handlePixelInteract(pixel , modeSelect.value , colourSelect.value , pixels);
                }
            });
            
            pixel.addEventListener('mouseup' , () => {
                isDrawing = false;
                this.onSketchEdit(); // add values later
            })

            pixel.addEventListener('mouseleave' , () => {
                if (isDrawing) {
                    isDrawing = false;
                    this.onSketchEdit(); // add values later
                }
            });
        });

        clearBtn.addEventListener('click' , () => {
            pixels.forEach(pixel => {
                pixel.style.backgroundColor = 'white';
            });
            this.onSketchEdit(); // add values later
        });

        //implement download sketch button later
    }

    _handlePixelInteract(pixel , mode , color , pixels) {
        if(mode === 'draw') {
            pixel.style.backgroundColor = color;
        }
        else if(mode === 'erase') {
            pixel.style.backgroundColor = 'white';
        }
        else if(mode === 'fill') {
            pixels.forEach(pixel => {pixel.style.backgroundColor = 'color'});
        }
    }

    _getPixelData(pixels){
        return Array.from(pixels).map(pixel => pixel.style.backgroundColor || 'white');
    }

    updateSketchList(sketches) {
        const sketchList = this.root.querySelector('.sketchList');
        sketchList.innerHTML = '';
        for(const sketch of sketches) {
            const html = this._createListItemHTML(sketch.id , sketch.title , new Date(sketch.updated))
            sketchList.insertAdjacentHTML('beforeend' , html);
        }

        sketchList.querySelectorAll('.sketchItem').forEach(sketch => {
            sketch.addEventListener('click' , () => {
                this.onSketchSelect(sketch.getAttribute('data-id'))
            });
        });
    }

    _createListItemHTML(id , title , updated) {
        return `<div class='sketchItem' data-id='${id}'>
        <div class='sketchTitle'>${title}</div>
        <div class="sketchUpdated">${updated.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}</div>
                <button class="deleteSketch">Delete</button>
            </div>`;
    }

    updateActiveSketch(sketch) {
        this.root.querySelectorAll(".sketchItem").forEach(item => {
            item.classList.remove("active");
            if (item.getAttribute("data-id") === String(sketch.id)) {
                item.classList.add("active");
            }
        });

        this._createPixelCanvas(sketch.width , sketch.height)
        const pixels = this.root.querySelectorAll('.pixel');
        sketch.pixels.forEach((color , index) => {
            pixels[index].style.backgroundColor = color
        });
    }

    updateSketchPreviewVisibility(visible) {
        this.root.querySelector(".canvasArea").style.display = visible ? "block" : "none";
    }
}