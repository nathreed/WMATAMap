module.exports = {
    parseStations
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

        stationList.push(new Station(station["Name"], station["Code"], stationLine));

    }

    return stationList;
}