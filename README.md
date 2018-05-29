#WMATAMap

A set of tools to generate a live map of trains on the Washington Metro, using data from the WMATA API.
This project is a rewrite and cleanup of code that I wrote a long time ago in an effort to make it work with little to no manual intervention (and also generally clean it up)

##How to Use

### NOTE: This is very incomplete right now. You will probably not be able to follow these directions at the moment. Feel free to poke around. Some tools will be coming soon. 

Because I don't want to mess with copyright stuff by rehosting WMATA data, and because I want to provide a mechanism for updating the data should it change over time
(e.g. new stations, etc), there are a series of tools that must be run before you can get the live map working. These tools 
fetch some static data from the WMATA API and manipulate/combine/transform it into forms that are easier to deal with in the main code.
The following directions will help you configure and run the tools.

1. Obtain an API key from WMATA (free) and place it in the `data` directory in a file named `WMATA_API_KEY.txt`
1. If you just want to get up and running quickly, run the `autoconfigure.sh` script in the `tools` directory. This will run the necessary tools
(each tool does only one thing) and get the `data` directory properly configured.
1. If you'd like to obtain one of the intermediate data files, would like to fetch everything manually, or would like to update one, you can run the tools individually. Look at the README in each tool's directory
for more info on what it needs to run.
1. Obtain a Google Maps Javascript API key (free for what we are doing here) and place it in `webpage/MAPS_API_KEY.txt`

You do not need to do both step 2 and step 3 -- pick one or the other.

The location-finding code can run in one of two modes: using precomputed locations or computing the location for each track circuit on the fly.
There is no difference in accuracy between the two - the only drawback of using precomputed locations is that you will need to let the tool run for a little while
(a couple hours probably) to let trains run over every circuit in the WMATA system. You may also need to obtain locations manually (by running a tool) for a few circuits.

There is no significant performance difference between the two modes either, but computing the locations on the fly is wasteful in the long term
because the most accurate they can be is at the track circuit level, and, as of right now, computed circuit positions never change, so you might as well precompute and store them.

If you just want to get up and running and see a live-updating map of the trains, use the mode which calculates locations on the fly. If you'd like to run this for a longer time and you care
about saving a bunch of CPU effort (but not much of a performance increase), use the precomputed mode.

### On-the-fly
To launch the on-the-fly demonstration: `node main/fly.js`  
You will now be able to use one of the webpages in the `webpage` directory to view the map 

### Precomputed
To run the code that will compute and store locations as it sees trains: `node main/precompute.js`. Allow to run for 3-4 hours during WMATA hours of operation. 
Then, check if you're missing locations for any circuits with `node tools/precompute_circuitCheck.js`, and follow the instructions in the output
for manually obtaining the locations for these (hopefully few) circuits.


## License

MIT