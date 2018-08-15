let fs = require("fs");
let CircuitSegmentTools = require("./circuitSegmentTools.js");
let Positioning = require("./positioning.js");

let lineCodes = JSON.parse(fs.readFileSync("../../data/lineCodes.json").toString());


//Global track circuits info - read/process once and pass to positioning function
let trackCircuits = {};
let segCoordLines = {};

//Start off the program
main();

function main() {
    setup();

    let processedCircuits = [];

    for(let i=0; i<lineCodes.length; i++) {
        //Look up the circuits for each line and track num
        for(let j=0; j<2; j++) {
            let lineCircuits = trackCircuits[lineCodes[i]][j]["circuits"];
            for(let k=0; k<lineCircuits.length; k++) {
                //We need to search processedCircuits to make sure it doesn't already contain a circuit with the circuit id we are working with
                //We can't just use the includes() method because we may have just now determined a new position for that circuit somehow
                //and the dispute resolution mechanism we want to use in that case is respecting the first position we calculated.
                let foundDupe = false;
                for(let j=0; j<processedCircuits.length; j++) {
                    if(processedCircuits[j]["circuit"] === lineCircuits[k]["circuit"]) {
                        //We found a duplicate, we don't need to log it or anything but it's there
                        foundDupe = true;
                        break;
                    }
                }
                if(foundDupe) {
                    continue; //don't bother looking up the position for this circuit, we already have one
                }

                let circuitPosition = Positioning.calculateCircuitPosition(lineCircuits[k]["circuit"], lineCodes[i], trackCircuits, segCoordLines);
                if(circuitPosition.error) {
                    //There was an error determining circuit position, log this and continue - no position for this circuit for now
                    console.log("Error finding position for circuit", lineCircuits[k]["circuit"]);
                    continue;
                }

                const processedCircuit = {
                    latitude: circuitPosition["position"][0],
                    longitude: circuitPosition["position"][1],
                    circuit: lineCircuits[k]["circuit"]
                };


                processedCircuits.push(processedCircuit);

            }
        }
    }

    console.log("All circuit positions determined, writing file...");
    //Write them to a file or something
    fs.writeFileSync("../../data/circuitPositions.json", JSON.stringify(processedCircuits));
    console.log("File written.");
}

function setup() {
    let trackCircuitsRaw = require("../../data/standardRoutesData.json")["StandardRoutes"];
    trackCircuits = CircuitSegmentTools.processCircuitInfo(trackCircuitsRaw);

    segCoordLines = require("../../data/allLines_segCoord.json");

}