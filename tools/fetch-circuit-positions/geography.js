//This file contains geography related methods
module.exports = {
    distanceBetweenPoints: distanceBetweenPoints,
    midpoint: midpoint
};
//This function is for determining the distance between two points.
//Adapted from http://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates-shows-wrong
//Answer by Derek
function distanceBetweenPoints(point1, point2) {
    //Converts degrees to radians.
    function toRad(Value) {
        return Value * Math.PI / 180;
    }

    //console.log("point1", point1)
    var lat1 = point1[0];
    var lon1 = point1[1];
    //console.log("lat, lon1", lat1, lon1)

    var lat2 = point2[0];
    var lon2 = point2[1];
    //console.log("lat, lon2", lat2, lon2)

    var R = 6371; // km
    //console.log("lat2,1", lat2, lat1)
    var dLat = toRad(lat2-lat1);
    var dLon = toRad(lon2-lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);
    //console.log("dLat", dLat)
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    //console.log("a", a)
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    //console.log("r,c", R, c)
    var d = R * c;

    //d is in km, let's convert to mi and return
    //console.log("d is", d)
    return d * 0.6214;

}
//Determines the midpoint of 2 geographic coordinates.
//Adapted from http://stackoverflow.com/questions/29019464/lat-long-equation-in-javascript
//Answer by CaddyShack edited by johnny
function midpoint(point1, point2) {
    let lat1 = point1[0];
    let lng1 = point1[1];

    let lat2 = point2[0];
    let lng2 = point2[1];

    Math.degrees = function(rad) {
        return rad * (180 / Math.PI);
    };
    Math.radians = function(deg) {
        return deg * (Math.PI / 180);
    };

    //Adapted by NHR from MDN page on Math.round()
    Math.decRound = function(number, precision) {
        let factor = Math.pow(10, precision);
        let tempNumber = number * factor;
        let roundedTempNumber = Math.round(tempNumber);
        return roundedTempNumber / factor;
    };
    lat1 = Math.radians(lat1);
    lng1 = Math.radians(lng1);
    lat2 = Math.radians(lat2);
    let lng = Math.radians(lng2);
    let bx = Math.cos(lat2) * Math.cos(lng - lng1);
    let by = Math.cos(lat2) * Math.sin(lng - lng1);
    let lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + bx) * (Math.cos(lat1) + bx) + Math.pow(by, 2)));
    let lon3 = lng1 + Math.atan2(by, Math.cos(lat1) + bx);
    return [Math.decRound(Math.degrees(lat3), 6), Math.decRound(Math.degrees(lon3), 6)]

}