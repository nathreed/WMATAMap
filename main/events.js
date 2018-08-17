module.exports = {
    determineEvents
};

const Utility = require("../common/utility.js");

/*
This function will return an array of all events given the previous data and the current data
Events are: train arrives at station, train departs station, train is created, train is destroyed
 */
function determineEvents(currentData, previousData) {
    console.log("events determination");
    let arrivalCreationEvents = trainArrivalsDepartures(currentData, previousData, false);
    let departureDestructionEvents = trainArrivalsDepartures(previousData, currentData, true);


    //Now just put the two arrays of events all together into one and we are done
    arrivalCreationEvents = arrivalCreationEvents.concat(departureDestructionEvents);
    return arrivalCreationEvents;
}

//This function checks for any trains that were not previously on a station but now they are
//It also checks for trains that have just now been created (come into service) because that's easy to do while we are at it
//The swapped parameter tells whether current and previous data are swapped (functionally it could also be called "are we doing departures instead of arrivals")
function trainArrivalsDepartures(currentData, previousData, swapped) {
    /*
    General algorithm:
    Check each train in the currentData list. Find the train in the previousData list that matches its ID, if any (if no id, that's an event too!).
    Check if the currentData position is on a station and if it differs from the previous data position
    If both those are true, the train has arrived at a station.
    Swapped parameter just changes stuff to departure/destruction events
     */
    let arrivalEvents = [];
    for(let i=0; i<currentData.length; i++) {
        //Find the corresponding train in the previousData list
        let foundTrain = false;
        for(let j=0; j<previousData.length; j++) {
            if(currentData[i].id === previousData[j].id) {
                //Found the train
                foundTrain = true;
                //Check if the positions differ
                if(JSON.stringify(currentData[i].position) !== JSON.stringify(previousData[j].position)) {
                    //They do differ, go ahead with the station check
                    let station = onStation(currentData[i].position);
                    let stationsList = Utility.parseStations2();
                    if(station) {
                        //The train was not previously on a station and is now, trigger an arrival event
                        if(swapped) {
                            let event = {
                                type: "departure",
                                trainId: currentData[i].id,
                                station: station,
                                stationName: stationsList[station].name
                            };
                            arrivalEvents.push(event);
                        } else {
                            let event = {
                                type: "arrival",
                                trainId: currentData[i].id,
                                station: station,
                                stationName: stationsList[station].name
                            };
                            arrivalEvents.push(event);
                        }

                    }
                }
            }
        }

        if(!foundTrain) {
            //Train ID is in the current data list but is not in the previous data list, trigger a train creation event
            if(swapped) {
                let event = {
                    type: "destruction",
                    trainId: currentData[i].id
                };
                arrivalEvents.push(event)
            } else {
                let event = {
                    type: "creation",
                    trainId: currentData[i].id
                };
                arrivalEvents.push(event)
            }

        }
    }
    return arrivalEvents;
}

/*
This function takes [lat, long] and returns either the station code that's at that position or null if no station is at that position
 */
function onStation(position) {
    let stationList = Utility.parseStations();
    for(let i=0; i<stationList.length; i++) {
        if(JSON.stringify(stationList[i]["coordinate"]) === JSON.stringify(position)) {
            return stationList[i]["code"];
        }
    }
    //If we get to the end of all the stations without returning, it is definitely not on a station
    return null;
}