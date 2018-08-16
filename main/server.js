const fs = require("fs");
const geoJSON = require("geojson");
const ws = require("nodejs-websocket");
const jwt = require("jsonwebtoken");

//For fetching data from WMATA API
const https = require("https");
const apiKey = fs.readFileSync("../data/WMATA_API_KEY.txt").toString();

//For signing MapKit JS Tokens
const mapkitKey = fs.readFileSync("../data/AuthKey_56HC6AY9JL.p8");
const jwtSigningInfo = require("../data/jwtSigningInfo.json");

//And import the stuff that we need from other code
const Utility = require("../common/utility.js");
//As well as all the precomputed circuit positions
const circuitPositions = JSON.parse(fs.readFileSync("../data/circuitPositions.json"));

//Train position objects - will be refreshed each cycle but needs to be at this scope
let trainPositionObjects = [];
//And the GeoJSON formatted data
let currentFormattedData = "";
let previousData = "";

//Set up the interval that will poll WMATA API
let timingInterval = setInterval(fetchPositionsAndUpdate, 1500);

//Websocket server setup - sends data out to clients
let wsServer = ws.createServer(function(conn) {
   console.log("New websocket connection");
   conn.sendText(JSON.stringify(currentFormattedData) || "");
   conn.on("error", function(err) {
      console.log("ERROR: Websocket error", err);
   });

   conn.on("text", function(str) {
      //Check if the text is a message from the client requesting a new MapKit JS token
      if(str === "request-token") {
          //It is, get a new token and get it to them
          //First setup the payload
          let payload = {
              iss: jwtSigningInfo.teamID,
              iat: new Date().getTime() / 1000,
              exp: (new Date().getTime() / 1000) + 1800
          };

          let header = {
              kid: jwtSigningInfo.authKeyID,
              typ: "JWT",
              alg: "ES256"
          };

          let options = {
              algorithm: "ES256",
              header: header
          };

          let token = jwt.sign(payload, mapkitKey, options);

          conn.sendText(JSON.stringify({type: "token", token: token}));
      }
   });
}).listen(9223);

function broadcast(server, message) {
    server.connections.forEach(function(conn) {
       conn.sendText(message);
    });
}

/*
Part 1 of 3 of the fetching process: get the data from WMATA API and do basic processing on it
This function also calls the other functions that are parts 2 and 3 of the process
It is called by the main interval function.
 */
function fetchPositionsAndUpdate() {
    //First, check the time
    //If we can guarantee that we are outside of Metro's hours of operation, we don't even need to bother wasting API calls
    //This is using the latest hours they're open, so we will waste some API calls but not as many as if we were running all night
    let hours = new Date().getHours();
    if(hours >= 0 && hours <= 4) {
        console.log(new Date(), "Skipping API call because Metro is not in service.");
        return -1; //Stop execution of this function
    }

    //If we make it here, we are going through with the API call, so set it up.
    let url = "https://api.wmata.com/TrainPositions/TrainPositions?contentType=json&api_key=" + apiKey;
    let fullData;
    try {
        let getReq = https.get(url, function(res) {
           res.on("data", function(data) {
              if(fullData === undefined) {
                  fullData = data;
              } else {
                  fullData += data;
              }
           });

           res.on("error", function(err) {
              console.log("Error with response:", err);
           });

           res.on("end", function() {
               //Parse out the train data and begin processing
               let trainData;
               try {
                   trainData = JSON.parse(fullData)["TrainPositions"];
               } catch(e) {
                   console.log("Error parsing the train data, skipping this iteration.");
                   return -1; //Skip remainder of iteration.
               }

               //We do have to use stringify here for some reason
               if(JSON.stringify(trainData) === JSON.stringify(previousData)) {
                   //Data did not change
                   console.log("No change in data.");
                   return -1;
               }

               console.log("Received new data. Running train tracking...");
               //Get steps 2 and 3 going
               previousData = trainData;
               //Step 2
               let positions = findTrainPositions(trainData);
               //Step 3
               output(positions);


           });
        });

        getReq.on("error", function(err) {
            console.log("Request encountered error:", err);
        });

    } catch (e) {
        console.log("There was an error fetching or processing the data:", e);
    }
}

function findTrainPositions(trainData) {
    let finishedPositions = [];
    let trainList = [];

    //Process trains into a nice list
    for(let i=0; i<trainData.length; i++) {
        //Some of the properties on the train object are currently unused but we
        let trainObject = {
            id: trainData[i]["TrainId"],
            cars: trainData[i]["CarCount"],
            circuit: trainData[i]["CircuitId"],
            line: trainData[i]["LineCode"],
            destination: trainData[i]["DestinationStationCode"],
            secondsAtLocation: trainData[i]["SecondsAtLocation"],
            serviceType: trainData[i]["ServiceType"]
        };

        //We are only tracking revenue trains
        if(trainObject.serviceType === "Normal") {
            trainList.push(trainObject);
        }
    }

    //Now that the train list has been constructed, iterate over it and retrieve the position for the circuit it is on
    for(let i=0; i<trainList.length; i++) {
        let position = positionForCircuit(trainList[i].circuit, circuitPositions);

        if(position === undefined || position === -1) {
            //There was either an error finding it or the train is on non-rev track. Skip the iteration.
            continue;
        }

        //If everything else checks out, add the position to the train and add it to the finished positions.
        trainList[i]["position"] = position;
        finishedPositions.push(trainList[i]);
    }

    //We have finished positions for the trains that we are getting positions for, so return them
    return finishedPositions;
}

function positionForCircuit(circuitId, circuitPositions) {
    for(let i=0; i<circuitPositions.length; i++) {
        if(circuitPositions[i] > circuitId) {
            console.log("There is an issue finding position for circuit!");
            return -1;
        } else if(circuitPositions[i].circuit === circuitId) {
            return [circuitPositions[i].latitude, circuitPositions[i].longitude]
        }
    }
    console.log("Got to end of position lookup without finding a position for the circuit. Likely non-rev. Circuit in question:", circuitId)

}

function output(positionData) {
    let formattedOutput = [];
    //First grab just the data we care about out of the position object.
    for(let i=0; i<positionData.length; i++) {
        let toAdd = {
            name: positionData[i].id,
            description: Utility.trainDescriptionString(positionData[i]),
            lat: positionData[i].position[0],
            lng: positionData[i].position[1]
        };
        formattedOutput.push(toAdd);
    }

    //Now make it GeoJSON to send to the webpage
    let gJSON = geoJSON.parse(formattedOutput, {Point: ["lat", "lng"]});

    //Construct object to send to webpage and send it
    let toSend = {
        type: "positions",
        positions: gJSON
    };

    currentFormattedData = toSend;
    broadcast(wsServer, JSON.stringify(toSend));
    console.log("Data broadcast to clients.");
}