function Station(name, code, line, coordinate) {
	this.name = name;
	this.code = code;
	this.line = line;
	this.coordinate = coordinate;
	//This function will return whether the station is on the line with the given line code
	this.isOnLine = function(lineCode) {
		if(typeof(this.line) === "string") {

			//We only have one line that we are on so we can immediately check if its the one we are looking for
			return this.line === lineCode;

		} else if(typeof(this.line) === "object") {
			//We have an array of lines that we are on
			//Let us iterate through them to see which one we are on
			let matchFound = false;
			for(let i =0; i<this.line.length; i++) {
				//console.log("Checking index " + i + " for " + this.line[i])
				if(this.line[i] === lineCode) {
					return true;
				} else {
					matchFound = false;
				}
			}
			return matchFound;
		}
	};
	this.prettyInformation = function(shouldIncludeName, shouldIncludeCode, shouldIncludeLine, shouldIncludeCoordinate) {
		let infoString = "";
		if(shouldIncludeName === true) {
			infoString += this.name + " "
		}
		if(shouldIncludeCode === true) {
			infoString += this.code + " "
		}
		if(shouldIncludeLine === true) {
			infoString += this.line + " "
		}
		if(shouldIncludeCoordinate === true) {
			infoString += this.coordinate + " "
		}
		return infoString;
	}
}
module.exports = Station;