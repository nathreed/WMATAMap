//Imported modules we will need
let https = require("https");
let qs = require("querystring");
let fs = require("fs");

let apiKey = fs.readFileSync("../../data/WMATA_API_KEY.txt").toString();

main();

function main() {
    console.log("Fetching stations JSON info");
    fetchStationsInfo();
    console.log("Fetching station sequences");
    fetchStationSequence();
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

/*
This fetches *a* sequence, but I don't think it's the correct sequence. It probably needs reworking.
 */
function fetchStationSequence() {
    let lineCodes = JSON.parse(fs.readFileSync("../../data/lineCodes.json").toString());
    let stationInfo = {};
    let promises = [];
    for(let i=0; i < lineCodes.length; i++) {
        let code = lineCodes[i];

        //Setup a call to the API
        let apiDataObject = {
            url: "https://api.wmata.com/Rail.svc/json/jStations",
            params: {
                LineCode: code,
                api_key: apiKey
            }
        };
        let queryPart = qs.stringify(apiDataObject.params);
        let fullURL = apiDataObject.url + "?" + queryPart;
        promises.push(fetchWithPromise(fullURL));
        //console.log("PROMISES: ", promises);
    }

    Promise.all(promises).then(function() {
        let results = arguments[0];

        for(let i=0; i<lineCodes.length; i++) {

            let lineResults = JSON.parse(results[i])["Stations"];
            let code = lineCodes[i];

            let lineStations = [];
            for(let j=0; j<lineResults.length; j++) {
                lineStations.push(lineResults[j]["Code"]);
            }


            fs.writeFile("../../data/lines/line_"+code+"_seq.json", JSON.stringify(lineStations, null, 4), function(err) {
                if(err) throw err;
                console.log("Written line " + code + " sequence to file.");
            });
        }
    }, function(err) {
       console.log("Error ocurred with promises: " + err);
    });

}

/*
Used to return a promise from https.get
 */
function fetchWithPromise(url) {
    return new Promise(function(resolve, reject) {
        https.get(url, function(res) {
            if(res.statusCode < 200 || res.statusCode > 299) {
                reject(new Error("Failed to load data, code: " + res.statusCode));
            }

            // temporary data holder
            const body = [];
            // on every content chunk, push it to the data array
            res.on('data', (chunk) => body.push(chunk));
            // we are done, resolve promise with those joined chunks
            res.on('end', () => resolve(body.join('')));

            res.on('error', (err) => reject(err));

        });
    });
}