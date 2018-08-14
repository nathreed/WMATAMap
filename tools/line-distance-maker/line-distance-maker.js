let qs = require("querystring");
let fs = require("fs");

let apiKey = fs.readFileSync("../../data/WMATA_API_KEY.txt").toString();
let lineCodes = JSON.parse(fs.readFileSync("../../data/lineCodes.json").toString());


let CallManager = require("../../common/apiCallsManager.js");
let callManager = new CallManager();

main();

function main() {
    let linePromises = [];

    callManager.start();
    for(let i=0; i<lineCodes.length; i++) {
        let currentLineCode = lineCodes[i];

        let lineSeq = JSON.parse(fs.readFileSync("../../data/lines/line_"+currentLineCode+"_seq.json"));

        linePromises.push(fetchLineStationPaths(lineSeq));

    }

    Promise.all(linePromises).then(function() {
        callManager.stop();
        //Write file
        for(let i=0; i<lineCodes.length; i++) {
            fs.writeFile("../../data/lines/line_"+lineCodes[i]+"_dist.json", JSON.stringify(arguments[0][i]), function(err) {
                if(err) throw err;
                console.log("Written line " + lineCodes[i] + " distances to file.");
            })
        }
    });
}

function fetchLineStationPaths(lineSeq) {
    return new Promise(function(resolve, reject) {
        //So for the line sequence we have been given, we need to fetch the station-station infos of all the stations on the line
        let linePromises = [];
        let lineData = [];

        for(let i=0; i<lineSeq.length; i++) {
            let stationCode1 = lineSeq[i];
            let stationCode2 = lineSeq[i-1];

            //Setup a call to the API
            let apiDataObject = {
                url: "https://api.wmata.com/Rail.svc/json/jPath",
                params: {
                    FromStationCode: stationCode2,
                    ToStationCode: stationCode1,
                    api_key: apiKey
                }
            };
            let queryPart = qs.stringify(apiDataObject.params);
            let fullURL = apiDataObject.url + "?" + queryPart;

            linePromises.push(callManager.apiCall(fullURL));
        }
        //Now that all promises for the line have been constructed, start processing
        //And setup what happens when each request is done
        Promise.all(linePromises).then(function() {
            console.log("Finished fetching data for a line.");

            let results = arguments[0];
            //We have to do the following because results is an array of JSON strings. So we have to parse each string.
            let parsedData = [];
            for(let i=0; i<results.length; i++) {
                parsedData.push(JSON.parse(results[i]));
            }

            //First push in an initial obj for initial station
            let initialStationObj = {
                distanceToPrevious: 0,
                station: lineSeq[0]
            };
            lineData.push(initialStationObj);


            for(let i=1; i<parsedData.length; i++) {
                let processedDataObject = {
                    distanceToPrevious: parsedData[i]["Path"][1]["DistanceToPrev"],
                    station: parsedData[i]["Path"][1]["StationCode"]
                };
                lineData.push(processedDataObject);
            }

            resolve(lineData);

        });

    });
}
