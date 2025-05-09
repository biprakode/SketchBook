export default class SketchAPI {
    static getAllSketches() {
        const sketches = JSON.parse(localStorage.getItem('sketchApp')) || [];
        return sketches.sort((a , b) => new Date(a.updated) - new Date(b.updated))
    }

    static saveSketch(sketch) {
        const sketches = SketchAPI.getAllSketches();
        const existing = sketches.find(s => s.id === sketch.id);

        if(existing) {
            existing.title = sketchToSave.title;
            existing.width = sketchToSave.width;
            existing.height = sketchToSave.height;
            existing.pixels = sketchToSave.pixels;
            existing.updated = new Date().toISOString();
        }
        else {
            sketch.id = crypto.randomUUID();
            sketch.updated = new Date().toISOString();
            sketches.push(sketch);
        }
        
        localStorage.setItem('sketchApp' , JSON.stringify(sketches));
    }

    static deleteSketch(skid) {
        const sketches = SketchAPI.getAllSketches();
        const newSketches = sketches.filter(sketch => sketch.id !== sketchId);
        localStorage.setItem("sketchApp", JSON.stringify(newSketches));
    }
}