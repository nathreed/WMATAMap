# `line-distance-maker`

This tool generates files for each line that contain an array of the stations on the line and, for each station,
the distance in feet to the previous station. These files are used by `segment-coordinate-line-maker` to put the 
mileage of each track segment in with the geographical data for each segment (a segment goes between two stations)

## Running

You should have run the `fetch-basic-data` tool prior to running this tool, as it needs the line sequence files produced
by that tool. 

Once you have satisfied these conditions, run with `node line-distance-maker.js`.

The tool takes some time to run, as it has to make a lot of calls to the WMATA API and it enforces a 200ms delay between calls
to avoid hitting the rate limit. 