const fs = require("fs");
const geoJSON = require("geojson");
const ws = require("nodejs-websocket");
const jwt = require("jsonwebtoken");

//For signing MapKit JS Tokens
const mapkitKey = fs.readFileSync("../../data/AuthKey_56HC6AY9JL.p8");
const jwtSigningInfo = require("../../data/jwtSigningInfo.json");

//And import the stuff that we need from other code
const Utility = require("../../common/utility.js");

const circuitPositions = JSON.parse(fs.readFileSync("../../data/circuitPositions.json"));

//Train position objects - will be refreshed each cycle but needs to be at this scope
let trainPositionObjects = [];
//And the GeoJSON formatted data
let currentFormattedData = "";

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

            //console.log("generated token:", token);
            conn.sendText(JSON.stringify({type: "token", token: token}));
        }
    });
}).listen(9223);

function broadcast(server, message) {
    server.connections.forEach(function(conn) {
        conn.sendText(message);
    });
}

//step through each circuit on the line, wait for the user to press enter in between for manual advance
const LINE_CODE = "RD";
function main() {
    //Get std routes for the line
    let standardRoutes = JSON.parse(fs.readFileSync("../../data/standardRoutesData.json"))["StandardRoutes"];
    let lineCircuits = [];
    for(let i=0; i<standardRoutes.length; i++) {
        if(standardRoutes[i]["LineCode"] === LINE_CODE && standardRoutes[i]["TrackNum"] === 2) {
            lineCircuits = standardRoutes[i]["TrackCircuits"];
        }
    }


    console.log("Press enter to begin progressing.");
    let stdin = process.openStdin();
    let current_pos = 0;
    stdin.addListener("data", function(data) {
        //They gave us something and pressed enter, advance to the next circuit for the line in question, calculate position, and output
        //Make fake train obj
        if(current_pos >= lineCircuits.length-1) {
            console.log("DONE!")
        } else {
            let trainObj = {
                TrainId: "999",
                CarCount: 8,
                CircuitId: lineCircuits[current_pos]["CircuitId"],
                LineCode: LINE_CODE,
                DestinationStationCode: "J03", //static destination for all trains, would use junk data but it would break the client
                SecondsAtLocation: 0,
                ServiceType: "Normal"

            };
            current_pos++;

            console.log("SeqNum:", lineCircuits[current_pos]["SeqNum"]);
            console.log("Circuit:", lineCircuits[current_pos]["CircuitId"]);
            console.log("Station:", lineCircuits[current_pos]["StationCode"]);
            console.log();



            let trainArr = [trainObj];
            let positions = findTrainPositions(trainArr);
            output(positions);
        }

    });

}

main();

/*
BELOW: CODE FOR FINDING AND OUTPUTTING TRAIN POSITIONS
 */
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


