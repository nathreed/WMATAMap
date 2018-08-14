module.exports = {
    processCircuitInfo,
    findCircuit,
    surroundingCircuitsInfo,
    findSegment
};



function processCircuitInfo(trackCircuitsRaw) {
    //Do some work on the train circuits data to get what we need out of it
    const neededLines = ["RD", "SV", "OR", "BL", "YL", "GR", "YLRP"]; //Just to iterate over all the line codes
    let trackCircuits = {}; //The transformed data that we are going to use in the rest of the tracking process
    for(let i=0; i<neededLines.length; i++) {
        //This for loop makes sure that we process all the lines
        let lineCircuitsObj = [];
        for(let j=1; j<3; j++) {
            //This for loop is pretty much so that we run the code twice, once for track #1 and once for track #2, in order to get all the circuits
            let trackNumCircuitsObj = {
                trackNum: j,
                circuits: []
            };
            for(let k=0; k<trackCircuitsRaw.length; k++) {
                const checkingLineObj = trackCircuitsRaw[k];
                //This for loop checks all the circuits in the file and, for any circuits whose track number and line code match what we are looking for, processes them
                if(checkingLineObj.LineCode === neededLines[i] && checkingLineObj["TrackNum"] === j) {
                    //This for loop does the actual processing - it grabs the relevant information out of each circuit in the line-tracknumber and puts it in the final output.
                    for(let l=0; l<checkingLineObj["TrackCircuits"].length; l++) {
                        let newCircuitObj = {};
                        const workingCircuit = checkingLineObj["TrackCircuits"][l];

                        newCircuitObj.sequence = workingCircuit["SeqNum"];
                        newCircuitObj.circuit = workingCircuit["CircuitId"];
                        newCircuitObj.station = workingCircuit["StationCode"];

                        trackNumCircuitsObj.circuits.push(newCircuitObj)
                    }
                }
            }
            lineCircuitsObj.push(trackNumCircuitsObj)
        }
        const neededLineCode = neededLines[i];
        trackCircuits[neededLineCode] = lineCircuitsObj
    }
    return trackCircuits
}

function findCircuit(circuitId, lineCode, trackCircuits) {
    let lineCircuits = [trackCircuits[lineCode][0].circuits, trackCircuits[lineCode][1].circuits];

    let foundCircuitInfo = {};
    //Use this for loop to go over the circuits for each track, so this loop only runs twice
    for(let i=0; i<2; i++) {
        //This loop checks all the circuits in the track num
        for(let j=0; j<lineCircuits[i].length; j++) {
            if(lineCircuits[i][j].circuit === circuitId) {
                //We found the matching circuit, set the info
                foundCircuitInfo["index"] = j;
                foundCircuitInfo["trackNum"] = i+1;
                foundCircuitInfo["line"] = lineCode;
                break;
            }

        }
    }

    //Now the search is complete, check if we found the circuit or not
    if(foundCircuitInfo["index"] !== undefined) {
        //It is not empty, just return it
        return foundCircuitInfo;
    } else {
        console.log("Issue finding circuit.");
        if(lineCode === "YL") {
            console.log("Searching YLRP circuits...");
            return findCircuit(circuitId, "YLRP", trackCircuits);
        } else {
            console.log("No other ways to find circuit, returning undefined...");
            return undefined;
        }

    }
}

//This function returns an object with info about the stations before and after the given circuit as well as the total number of circuits between those stations.
function surroundingCircuitsInfo(circuitInfo, trackCircuits) {
    //Get the circuits list for the track number that the circuit in question is on
    let circuitsList = trackCircuits[line][circuitInfo.trackNum - 1].circuits;

    //First check if we are on a station right away
    if(circuitsList[circuitInfo.index].station != null) {
        //We are sitting right on a station. Return a special object.
        return {
            onStation: circuitsList[circuitInfo.index].station
        };

    }

    //To determine the circuits to the first station before the circuit we are on, we start at the circuit index and work backwards
    let circuitsToBeforeStation = -1;
    let beforeStation;
    for(let i=circuitInfo.index; i>=0; i--) {
        if(circuitsList[i].station !== null) {
            //We found the first circuit before the checking circuit with a station on it
            beforeStation = circuitsList[i].station;
            circuitsToBeforeStation = circuitInfo.index - i; //We started at the index, so subtract the current value of i
            break;
        }
    }

    //The process for determining circuits to the first station after the circuit we are on is similar, except we work forwards
    let circuitsToAfterStation = -1;
    let afterStation;
    for(let i=circuitInfo.index; i<circuitsList.length; i++) {
        if(circuitsList[i].station !== null) {
            //We found the first circuit after the checking circuit with a station on it
            afterStation = circuitsList[i].station;
            circuitsToAfterStation = i - circuitInfo.index;
            break;
        }
    }

    //Now that we have found the before/after stations and the number of circuits, set up the return data and then validate
    let returnData = {
        beforeStation: beforeStation,
        afterStation: afterStation,
        circuitsToBeforeStation: circuitsToBeforeStation,
        circuitsToAfterStation: circuitsToAfterStation
    };

    //Validation
    //If they are stopped right before or right after a station, put them on the station
    //WMATA says that trains can read as being on the circuit immediately before or after a station when they are really on the station, so this will lead to better accuracy
    if(returnData.circuitsToAfterStation === 1) {
        returnData = {
            onStation: returnData.afterStation
        };
    } else if(returnData.circuitsToBeforeStation === 1) {
        returnData = {
            onStation: returnData.beforeStation
        };
    }

    //If they are at the end of a line, move them to be on the station that's at the end of that line
    if(returnData.afterStation === undefined && returnData.circuitsToBeforeStation === 1) {
        returnData = {
            onStation: returnData.beforeStation
        };
    } else if(returnData.beforeStation === undefined && returnData.circuitsToAfterStation === 1) {
        returnData = {
            onStation: returnData.afterStation
        };
    }

    //Validation complete, return the data
    return returnData;

}

function findSegment(startStation, endStation, lineCode, segCoordLines) {
    //The specific segments for the line in question
    let lineSegments = segCoordLines[lineCode];

    for (let i = 0; i < lineSegments.length; i++) {
        if (lineSegments[i]["fromStation"] === startStation && lineSegments[i]["toStation"] === endStation) {
            //We found the segment
            return lineSegments[i];
        } else if (lineSegments[i]["fromStation"] === endStation && lineSegments[i]["toStation"] === startStation) {
            //This should never happen
            console.log("ERROR: SEGMENT DETECTED IN REVERSE!!");
            //Return null so that we know there is an error afoot
            return null;
        }
    }
}

