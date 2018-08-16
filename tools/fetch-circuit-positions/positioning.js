module.exports = {
    calculateCircuitPosition: calculateCircuitPosition
};

const Geography = require("./geography.js");
const CircuitSegmentTools = require("./circuitSegmentTools.js");
const Utility = require("../../common/utility.js");

/*
Calculates the position of a given circuit.
 */
function calculateCircuitPosition(circuitId, lineCode, trackCircuits, segCoordLines) {
    let circuitInfo = CircuitSegmentTools.findCircuit(circuitId, lineCode, trackCircuits);
    if(circuitInfo !== undefined) {
        //Will hold the circuit position
        let circuitPosition;

        //Find out info on the surrounding circuits/before+after stations/if it is on a station
        let surroundingCircuitInfo = CircuitSegmentTools.surroundingCircuitsInfo(circuitInfo, lineCode, trackCircuits);
        if(surroundingCircuitInfo.onStation !== undefined) {
            //It is on a station, we can just use the position of that station
            let stationList = Utility.parseStations2();
            circuitPosition = stationList[surroundingCircuitInfo.onStation]["coordinate"];
            return {position: circuitPosition};

        } else if (surroundingCircuitInfo["circuitsToBeforeStation"] === 1) {
            //Circuits right before and right after a station we are giving the station's position because WMATA says that trains may trigger occupancy on the circuit past a station
            let stationList = Utility.parseStations2();
            circuitPosition = stationList[surroundingCircuitInfo["beforeStation"]]["coordinate"];
            return {position: circuitPosition};
        } else if(surroundingCircuitInfo["circuitsToAfterStation"] === 1) {
            let stationList = Utility.parseStations2();
            circuitPosition = stationList[surroundingCircuitInfo["afterStation"]]["coordinate"];
            return {position: circuitPosition};
        } else {
            //Not on a station, we need to actually calculate position of the circuit
            //First get the total circuit count between the two stations, adding one for the circuit itself
            let totalCircuitsBetween = surroundingCircuitInfo["circuitsToBeforeStation"] + 1 + surroundingCircuitInfo["circuitsToAfterStation"];

            //Next find out the distance of this segment
            let circuitSegment = CircuitSegmentTools.findSegment(surroundingCircuitInfo["beforeStation"], surroundingCircuitInfo["afterStation"], lineCode, segCoordLines);
            if(circuitSegment === null) {
                //There was an error in locating the segment, return out of the positioning method with an error
                return {error: true};
            }
            //If it was not null, we can continue with the info from the segment
            let segmentDistance = circuitSegment["segmentMileage"];
            //This is an important number - miles of track per circuit on this segment
            let distancePerCircuit = segmentDistance / totalCircuitsBetween;
            //This is the miles it is into the segment
            let distanceIntoSegment = (surroundingCircuitInfo["circuitsToBeforeStation"] + 1) * distancePerCircuit;

            //This algorithm steps along the coordinate line, adding the next point until we overshoot
            //Then if we overshot by a lot it uses another algorithm to estimate a point not part of the coordinate line where the circuit is
            let reachedDistance = 0;
            let usedMidpointReduction = false;
            for(let i=0; i<circuitSegment["segmentLine"].length - 1; i++) {
                //Calculate the distance to the next point in the line, add it to reached, and see if we overshot
                let nextPointDistance = Geography.distanceBetweenPoints(circuitSegment["segmentLine"][i], circuitSegment["segmentLine"][i+1]);
                reachedDistance += nextPointDistance;

                if(reachedDistance >= distanceIntoSegment) {
                    let overshootAmount = reachedDistance - distanceIntoSegment;
                    if(overshootAmount > 0.085) {
                        //Too much overshoot for us, we need to use midpoint reduction algorithm
                        //First, get us back to where we were before we overshot
                        reachedDistance -= nextPointDistance;

                        let firstPoint = circuitSegment["segmentLine"][i];
                        let secondPoint = circuitSegment["segmentLine"][i+1];
                        circuitPosition = midpointReduction(firstPoint, secondPoint, reachedDistance, distanceIntoSegment);
                        usedMidpointReduction = true;

                        //Validate that midpoint reduction is working properly - we should not be getting variances above 0.085mi
                        reachedDistance += Geography.distanceBetweenPoints(firstPoint, circuitPosition);
                        let finalVariance = reachedDistance - distanceIntoSegment;
                        if(finalVariance > 0.085) {
                            console.log("ERROR: Midpoint reduction not working. Check midpoint reduction function.")
                        }


                    } else {
                        //We are within 0.085mi of where we wanted to be, that is close enough
                        //Take the midpoint of the last two points we were adding and call it done
                        circuitPosition = Geography.midpoint(circuitSegment["segmentLine"][i], circuitSegment["segmentLine"][i+1]);
                    }

                    //Return our position
                    return {position: circuitPosition}
                }
            }

            //If we get to the end of the for loop without reaching/overshooting the distance into the segment (which would result in a position being returned), something is wrong
            if(reachedDistance < distanceIntoSegment && !usedMidpointReduction) {
                console.log("ERROR! Distance into segment not reached, all coordinate points exhausted. Inspect data or check algorithm.");
                return {error: true};
            }

        }
    } else {
        console.log("ERROR! Circuit info was undefined!");
        return {error: true};
    }

}

/*
This algorithm determines a point that is not necessarily on the list of points making up the coordinate line
It's probably used when there are long straight segments and a train is somewhere in the middle of them.
*/
function midpointReduction(point1, point2, reachedDistance, desiredDistance) {
    let midpointOfPoints = Geography.midpoint(point1, point2);
    let distanceToMidpoint = Geography.distanceBetweenPoints(point1, midpointOfPoints);

    //This number is pretty much how much we are over or under the desired distance
    let differenceFactor = reachedDistance + distanceToMidpoint - desiredDistance;

    if(differenceFactor < -0.085) {
        //We didn't go far enough. Apply the algorithm on the line from the midpoint to the second point
        //Add in the distance to the midpoint to prevent infinite recursion in some cases
        reachedDistance += distanceToMidpoint;
        return midpointReduction(midpointOfPoints, point2, reachedDistance, desiredDistance);
    } else if(differenceFactor > 0.085) {
        //We went too far. Apply the algorithm on the line from the first point to the midpoint.
        return midpointReduction(point1, midpointOfPoints, reachedDistance, desiredDistance);
    } else {
        //The midpoint we just found is an acceptable distance from the desired distance
        return midpointOfPoints;
    }


}
