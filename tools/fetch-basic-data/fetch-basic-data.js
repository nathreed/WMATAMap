//Imported modules we will need
let https = require("https");
let qs = require("querystring");
let fs = require("fs");

let apiKey = fs.readFileSync("../../data/WMATA_API_KEY.txt").toString();

main();

function main() {
    console.log("Fetching stations JSON info");
    fetchStationsInfo();
    console.log("Fetching standard routes data");
    fetchStandardRoutesData().then(function() {
        let routesData = arguments[0];
        fs.writeFile("../../data/standardRoutesData.json", routesData, function(err) {
            if(err) throw err;
            console.log("Written standard routes data to file.");
            console.log("Making station sequence...");
            makeStationSequence(routesData);
        });
    });

}

function fetchStationsInfo() {
    //Setup the URL to get the info from
    let apiDataObject = {
        url: "https://api.wmata.com/Rail.svc/json/jStations",
        params: {
            api_key: apiKey
        }
    };
    let queryPart = qs.stringify(apiDataObject.params);
    let fullURL = apiDataObject.url + "?" + queryPart;
    https.get(fullURL, function(response) {
        let fullData;
        //Set up the data and end handlers

        //Add the data as it comes in
        response.on("data", function(data) {
            if(fullData === undefined) {
                fullData = data;
            } else {
                fullData += data;
            }
        });

        response.on("end", function() {
            //we are done, write the file
            fs.writeFile("../../data/stations/stations.json", fullData, function(err) {
                if(err) {
                    throw err;
                }
                console.log("Written stations info to file.");
            })
        });
    })

}

function fetchStandardRoutesData() {
    //Setup the URL to get the info from
    let apiDataObject = {
        url: "https://api.wmata.com/TrainPositions/StandardRoutes",
        params: {
            contentType: "json",
            api_key: apiKey
        }
    };
    let queryPart = qs.stringify(apiDataObject.params);
    let fullURL = apiDataObject.url + "?" + queryPart;


    return new Promise(function(resolve, reject) {
        https.get(fullURL, function(res) {
            if(res.statusCode < 200 || res.statusCode > 299) {
                reject(new Error("Failed to load data FSRD, code: " + res.statusCode));
            }

            // temporary data holder
            const body = [];
            // on every content chunk, push it to the data array
            res.on('data', (chunk) => body.push(chunk));
            // we are done, resolve promise with those joined chunks
            res.on('end', () => resolve(body.join('')));

            res.on('error', (err) => reject(err));

        });
    })
}


function makeStationSequence(standardRoutesData) {
    //Ok we have the standard routes data which is guaranteed to be in the right order, so we can get the stations for each line in order
    let data = JSON.parse(standardRoutesData)["StandardRoutes"];
    let linesToDo = JSON.parse(fs.readFileSync("../../data/lineCodes.json").toString());
    for(let i=0; i<data.length; i++) {
        if(linesToDo.includes(data[i]["LineCode"])) {
            let lineSeq = [];
            //We have not gotten info for that line yet
            let lineCircuits = data[i]["TrackCircuits"];
            for(let j=0; j<lineCircuits.length; j++) {
                if(lineCircuits[j]["StationCode"] != null) {
                    lineSeq.push(lineCircuits[j]["StationCode"]);
                }
            }
            //So we don't do the same line again in reverse
            let lineIndex = linesToDo.indexOf(data[i]["LineCode"]);
            linesToDo.splice(lineIndex, 1);

            //And finally write it to the file
            fs.writeFile("../../data/lines/line_"+data[i]["LineCode"]+"_seq.json", JSON.stringify(lineSeq, null, 4), function(err) {
                if(err) throw err;
                console.log("Written line " + data[i]["LineCode"] + " sequence to file.");
            });

        }
    }


}

