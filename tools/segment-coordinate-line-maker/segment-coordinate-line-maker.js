let parseString = require("xml2js").parseString;
let fs = require("fs");

//Load the matchup file for matching station names to station codes when the actual name doesn't match
let matchupDict = require("../../data/kmlNameResolution.json");

let lineCodes = require("../../data/lineCodes.json");
const Utility = require("../../common/utility.js");

let stationList = [];

//Start the program
main();

function main() {
    stationList = Utility.parseStations();
    //Line names are in the same order as the lineCodes array for easy matchup
    let lineNames = ["Red", "Yellow", "Green", "Blue", "Orange", "Silver"];

    let lineParsePromises = [];
    for(let i=0; i<lineNames.length; i++) {
        lineParsePromises.push(parseKML(lineNames[i], lineCodes[i]));
    }

    Promise.all(lineParsePromises).then(function() {
        //All lines have been parsed and we are ready to write the file
        console.log("Segment coordinate lines parsed sucessfully, writing file...");
        //console.log(arguments[0][1]);

        //Create the final segment coordinate line object with all lines
        let segCoordLines = {};
        for(let i=0; i<lineNames.length; i++) {
            segCoordLines[lineCodes[i]] = arguments[0][i];
        }
        //console.log("completed seg coord lines:", segCoordLines);
        fs.writeFileSync("../../data/allLines_segCoord.json", JSON.stringify(segCoordLines));
        console.log("File written successfully.");
    });

    /*
    parseKML("Red", "RD").then(function() {
       console.log("promise complete");
       console.log(JSON.stringify(arguments)); //stub, expand here with writing files etc. Also will be parsing kml with all lines in promises
    }, function() {
        console.log("promise reject", arguments);
    });*/
}



//This function parses the KML file and extracts the information that we need
function parseKML(lineName, lineCode) {
    let kmlContents = fs.readFileSync("../../data/WMATA Lines.kml", "utf8");

    return new Promise(function(resolve, reject) {
        let lineData = [];
        parseString(kmlContents, function(err, result) {
            if(err) throw err;


            /*
            Our strategy for this is to go through the KML until we find all segments that exist for a given line
             */
            let placemarks = result["kml"]["Document"][0]["Folder"][0]["Placemark"];

            //Loop over the placemarks
            for(let i=0; i<placemarks.length; i++) {

                let placemarkData = placemarks[i]["ExtendedData"][0]["Data"];
                let placemarkLineName = placemarkData[2].value[0];
                if(placemarkLineName === lineName) {
                    let fromStationName = placemarkData[4].value[0];
                    let toStationName = placemarkData[5].value[0];

                    let coordinatePointsString = "";

                    //Check for LineString being undefined but MultiGeometry being defined
                    if(placemarks[i]["LineString"] === undefined) {
                        if(placemarks[i]["MultiGeometry"] !== undefined) {
                            //No LineString but there is a MultiGeometry, combine its constituent LineStrings into one
                            for(let z=0; z<placemarks[i]["MultiGeometry"][0]["LineString"].length; z++) {
                                //Check if this is the first coordinate string we are adding to coordinatePointsString
                                //If so, do not add a leading space, if not, add a leading space
                                if(coordinatePointsString !== "") {
                                    coordinatePointsString += " ";
                                }
                                coordinatePointsString += placemarks[i]["MultiGeometry"][0]["LineString"][z]["coordinates"];
                            }
                        } else {
                            //We have an issue, there was no MultiGeometry or LineString
                            console.log("Unable to find MultiGeometry or LineString!! placemark:", placemarks[i]);
                            //reject();
                            //return; //process no more!!
                            //continue;
                        }

                    }

                    if(coordinatePointsString === "") {
                        //LineString does exist, we can just use that
                        coordinatePointsString = placemarks[i]["LineString"][0]["coordinates"][0];
                    }

                    //Now that we have obtained a coordinatePointsString, it is time to process it
                    let lineCoordinatePoints = coordinatePointsString.split(" ");
                    coordinatePointsString = "";
                    for(let j=0; j<lineCoordinatePoints.length; j++) {
                        let latLongHeight = lineCoordinatePoints[j].split(",");
                        let lat = parseFloat(latLongHeight[1]);
                        let long = parseFloat(latLongHeight[0]);
                        if(isNaN(lat) || isNaN(long)) {
                            console.log("Encountered an error while parsing lat/long coordinates");
                            continue; //We just continue and do not process these coordinates further. We hope they weren't important...
                            //NOTE: LOOK HERE IF THERE ARE PROBLEMS IN THE FUTURE AND THEY ARE DIFFICULT TO EXPLAIN
                        }
                        lineCoordinatePoints[j] = [lat, long];
                    }

                    let fromStationCode = findStationCode(fromStationName, lineCode);
                    let toStationCode = findStationCode(toStationName, lineCode);

                    //Make object with data and add to "staging array"
                    //Array will be sorted appropriately later and more info added to each object
                    let segmentObject = {
                        fromStation: fromStationCode,
                        toStation: toStationCode,
                        segmentLine: lineCoordinatePoints
                    };

                    //Before we add it to the staging array, check for dupes
                    if(!lineData.includes(segmentObject)) {
                        lineData.push(segmentObject);
                    } else {
                        console.log("Duplicate found when pushing segment object into staging data.");
                    }
                }



            }

            //Now that all data has been processed and put in staging array, put in proper sequence and add mileage of segment
            let sequenceData = require("../../data/lines/line_"+lineCode+"_dist.json");
            for(let i=0; i<sequenceData.length; i++) {
                let checkingStationInfo = sequenceData[i];
                let nextStationInfo = sequenceData[i+1];

                for(let j=0; j<lineData.length; j++) {
                    let checkingSegment = lineData[j];

                    try {
                        if(checkingStationInfo["station"] === checkingSegment["fromStation"] && nextStationInfo["station"] === checkingSegment["toStation"]) {
                            //Endpoint case A: Same order as the sequence file
                            //Add the mileage to the segment we are checking
                            checkingSegment["segmentMileage"] = nextStationInfo["distanceToPrevious"] / 5280;
                        } else if(checkingStationInfo["station"] === checkingSegment["toStation"] && nextStationInfo["station"] === checkingSegment["fromStation"]) {
                            //Endpoint case B: Reverse order from sequence file, need to be reversed
                            checkingSegment["segmentLine"] = checkingSegment["segmentLine"].reverse();
                            checkingSegment["segmentMileage"] = nextStationInfo["distanceToPrevious"] / 5280;
                        }
                    } catch (e) {
                        if(e.name !== "TypeError") {
                            //If we are getting errors in here, we want to know about them but NOT crash on them so we can finish the rest of the array
                            //But only if they are not TypeErrors. A few will actually happen.
                            console.log("Caught thrown error in process of adding segmentMileage to segments");
                            console.log("error is", e);
                        }

                    }
                }
            }

            //Now validate the lineData before we return it - if there are any segments that don't have a mileage associated with them, we need to know about it
            for(let i=0; i<lineData.length; i++) {
                if(lineData[i]["segmentMileage"] === undefined) {
                    console.log("Found a segment with no mileage assigned!!", lineData[i]["fromStation"], lineData[i]["toStation"]);
                }
            }


            //Now we are done, resolve the promise with the data
            resolve(lineData);

        });

    });

}

/*
This function finds the station code from the given station name by referencing it with the known stations data (stations.json) and using the matchup file for cases where it differs.
 */
function findStationCode(stationName, stationLine) {
    let toReturn = "";
    for(let i=0; i<stationList.length; i++) {
        let checkingStation = stationList[i];
        if(checkingStation.name === stationName && checkingStation.isOnLine(stationLine)) {
            toReturn = checkingStation.code;
            break;
        }
    }

    //Check that we were able to find a return code
    if(toReturn === "") {
        //Read the matchupDict to get the station code
        toReturn = matchupDict[stationName];
    }

    if(!toReturn) {
        //if we were still unable to find a code to return, we have something wrong!! print something about it
        console.log("unable to resolve code for station", stationName);
    }

    return toReturn;
}