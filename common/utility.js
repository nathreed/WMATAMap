module.exports = {
    parseStations, parseStations2, trainDescriptionString
};

function parseStations() {
    let Station = require("./station.js");
    let stationsJSON = require("../data/stations/stations.json");
    let stationList = [];
    for(let i=0; i<stationsJSON.Stations.length; i++) {
        let station = stationsJSON.Stations[i];

        //Push the line codes from the station object into stationLine until we find one that is null
        let stationLine = [];
        for(let j=1; j<=4; j++) {
            if(station["LineCode"+j] != null) {
                stationLine.push(station["LineCode"+j]);
            } else {
                break;
            }
        }

        //Calculate the coordinate of the station, this is needed in the parseStations2 method though it's not used anywhere else
        const stationLat = station["Lat"];
        const stationLong = station["Lon"];
        const stationCoord = [stationLat, stationLong];

        stationList.push(new Station(station["Name"], station["Code"], stationLine, stationCoord));

    }

    return stationList;
}

//This function also parses the stations into an object, but it's in a different format because the positioning code needs
//it as a dictionary keyed with the station codes to work well
function parseStations2() {
    //We start as a base with the regular stations list
    let baseList = parseStations();
    let finalStations = {};
    for(let i=0; i<baseList.length; i++) {
        finalStations[baseList[i].code] = baseList[i];
    }
    return finalStations;
}

//This function takes a train object and returns a description string for the same
function trainDescriptionString(train) {
    let stationsList = parseStations2();
    let trainDestinationName = stationsList[train.destination].name;
    return train.id + " " + train.line + " " + trainDestinationName;
}