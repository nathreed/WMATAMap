# Main server

## Setup

### MapKit JS Authorization
The webpage viewer uses Apple's MapKit JS because of the recent Google Maps API pricing changes. You will need to obtain keys for that.
Place your private key in the `data` directory (so it's `data/AuthKey_XXXXXXX.p8`). Additionally, create a file in the `data` directory
called `jwtSigningInfo.json` with the following structure:

```$json
{
    "teamID": "your-apple-dev-team-id",
    "authKeyID": "mapkit-authkey-id (the XXXXXX part of the filename)"
}
```

The server will read from this file (which is ignored in git) to get the values it needs to properly sign web tokens.

### Port Setup
The server listens on port 9223. Make sure this is accessible from wherever you are accessing the webpage. Change the websocket URL in the webpage as appropriate.

### Dependencies
Run `npm install` in this directory to install the dependencies for the server.

## Running
Simply run `node server.js` and leave it running. It will give informative output that you can mostly ignore. Then open the webpage to view it (`webpage/mapkit.html`).
You could place this webpage and associated files in a web server directory or something if you would like a more permanent setup.