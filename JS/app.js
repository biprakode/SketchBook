import SketchView from "./sketchView";
import SketchAPI from "./sketchAPI";

export default class App {
    constructor(root) {
        this.sketches = [];
        this.activeSketch = null;
        this.view = new SketchView(root , this._handlers());
        this._refreshSketches();
    }

    _refreshSketches() {
        const sketches = SketchAPI.getAllSketches();
        this.sketches = sketches;
        this.view.updateSketchList(sketches);
        if(sketches.length > 0) {
            this.activeSketch(sketches[0]);
            this.view.updateActiveSketch(sketches[0]);
            this.view.updateSketchPreviewVisibility(true);
        } else {
            this.view.updateSketchPreviewVisibility(false);
        }
    }

    _handlers() {
        return {
            
        }
    }
}