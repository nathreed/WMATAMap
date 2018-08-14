let fs = require("fs");
let Utility = require("../../common/utility.js");
let CircuitSegmentTools = require("./circuitSegmentTools.js");

//Global track circuits info - read/process once and pass to positioning function
let trackCircuits = {};

function main() {

}

function setup() {
    let trackCircuitsRaw = fs.readFileSync("../../data/standardRoutesData.json");
    trackCircuits = CircuitSegmentTools.processCircuitInfo(trackCircuitsRaw);
}