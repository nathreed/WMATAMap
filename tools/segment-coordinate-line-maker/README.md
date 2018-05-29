# `segment-coordinate-line-maker`

This tool generates the data files used by the tool that obtains positions from live train data. It requires:

- Output of the Station List API endpoint in `data/stations.json` (`https://api.wmata.com/Rail.svc/json/jStations`) (you can get this with the `fetch-basic-data` tool)
- WMATA Lines KML file (included in `data` folder)
- Line distance files, created from `line-distance-maker`
