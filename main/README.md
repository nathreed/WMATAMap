# Main server

## Setup

### Maps API Authorization
The webpage viewer uses Apple's MapKit JS because of the recent Google Maps API pricing changes. So you will need to obtain keys for that.
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
The server listens on port 9223. Make sure this is accessible from wherever you are accessing the webpage.

## Running
Simply run `node server.js` and leave it running. It will give informative output that you can mostly ignore. Then open the webpage to view it (`webpage/mapkit.html`).