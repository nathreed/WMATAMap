/*
The callManager object is used as follows:
- the apiCall method is called with a url to call and it returns a promise that will be resolved when the data is available
- .stop() should be called when we are all done
- .start() should be called when calls should begin. Calls will be made at a certain interval as defined by the WMATA_API_CALLS_DELAY variable on line 16

URLs are processed in the order in which they were received, though the promises may be resolved out of order due to server latency
This is probably not likely but still possible.
 */
let https = require("https");

/*
This is the delay in ms that will be enforced between calls. Note that WMATA official rate limit is 10 calls/sec,
It's set to 200ms for a reasonable default, where the theoretical minimum would be 100ms.
 */
let WMATA_API_CALL_MS_DELAY = 200;


function CallManager() {
    this._internalCallQueue = [];
    this._internalApiCall = function(fullURL, cb) {
        this._internalCallQueue.push([fullURL, cb]);
    };
    this.apiCall = function(fullURL) {
        let mgrObj = this;
        return new Promise(function(resolve, reject) {
            mgrObj._internalApiCall(fullURL, function(data) {
                //console.log("promise complete, data=", data);
                resolve(data);
            })
        });
    };
    this.start = function() {
        let mgrObj = this;
        if(!this._internalInterval) {
            this._internalInterval = setInterval(function() {
                let urlObj = mgrObj._internalCallQueue.shift();
                //Call the associated callback function with the results from the promise fetch
                if(urlObj) {
                    //console.log("making call, time:", new Date());
                    mgrObj._internalMakeCall(urlObj[0]).then(function() {
                        urlObj[1](arguments[0]);
                    });
                }
            }, WMATA_API_CALL_MS_DELAY);
        }
    };
    this._internalMakeCall = function(url) {
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
    };
    this.stop = function() {
        clearInterval(this._internalInterval);
    };


}


module.exports = CallManager;