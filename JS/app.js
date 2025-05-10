import SketchView from "./sketchView.js";
import SketchAPI from "./sketchAPI.js";

export default class App {
    constructor(root) {
        this.sketches = [];
        this.activeSketch = null;
        this.view = new SketchView(root, this._handlers());
        this._refreshSketches();
    }

    _refreshSketches() {
        const sketches = SketchAPI.getAllSketches();
        this._setSketches(sketches);
        if (sketches.length > 0) {
            this._setActiveSketch(sketches[0]);
            this.view.updateSketchPreviewVisibility(true);
        } else {
            this.view.updateSketchPreviewVisibility(false);
        }
    }

    _setSketches(sketches) {
        this.sketches = sketches;
        this.view.updateSketchList(sketches);
    }

    _setActiveSketch(sketch) {
        this.activeSketch = sketch;
        this.view.updateActiveSketch(sketch);
    }

    _handlers() {
        return {
            onSketchSelect: (sketchID) => {
                const selectedSketch = this.sketches.find(s => s.id === sketchID);
                if (selectedSketch) {
                    this._setActiveSketch(selectedSketch);
                }
            },

            onSketchAdd: () => {
                const newSketch = {
                    title: "Untitled Sketch",
                    width: 0, // Placeholder: no canvas yet
                    height: 0,
                    pixels: [],
                };
                SketchAPI.saveSketch(newSketch);
                this._refreshSketches();
                const latestSketch = SketchAPI.getAllSketches()[0];
                this._setActiveSketch(latestSketch);
            },

            onSketchEdit: (pixels, width, height, title) => {
                if (this.activeSketch) {
                    SketchAPI.saveSketch({
                        id: this.activeSketch.id,
                        title: title,
                        width: width,
                        height: height,
                        pixels: pixels,
                    });
                    this._refreshSketches();
                }
            },

            onSketchDelete: (sketchID) => {
                console.log("onSketchDelete called with ID:", sketchID); // Debug
                if (!this._refreshSketches) {
                    console.error("this._refreshSketches is undefined in onSketchDelete");
                    return;
                }
                SketchAPI.deleteSketch(sketchID);
                this._refreshSketches();
            },
        };
    }
}