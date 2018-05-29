# `fetch-basic-data`

This tool fetches basic data needed for several other tools, like the list of all stations, detailed information
about stations, and more. To use it, the API key must be present in `data/WMATA_API_KEY.txt` as specified in the main README
for the project (the `data` directory being the `data` directory in the project root).

## Run
Run `autoconfigure.sh` or ensure that the `data/stations` directory exists before running.  
Then run `node fetch-basic-data.js`. You must run from inside this directory.