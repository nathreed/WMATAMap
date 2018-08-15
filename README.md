# WMATAMap

A set of tools to generate a live map of trains on the Washington Metro, using data from the WMATA API.
This project is a rewrite and cleanup of code that I wrote a long time ago in an effort to make it work with little to no manual intervention (and also generally clean it up)

## How to Use

### Note: This is somewhat incomplete. Most of the tools are in place, but the main server remains to be cleaned up. You will be able
to derive all the necessary data but not do anything really fun with it yet.


Because I don't want to mess with copyright stuff by rehosting WMATA data, and because I want to provide a mechanism for updating the data should it change over time
(e.g. new stations, etc), there are a series of tools that must be run before you can get the live map working. These tools 
fetch some static data from the WMATA API and manipulate/combine/transform it into forms that are easier to deal with in the main code.
The following directions will help you configure and run the tools.

1. Obtain an API key from WMATA (free) and place it in the `data` directory in a file named `WMATA_API_KEY.txt`
1. If you just want to get up and running quickly, run the `autoconfigure.sh` script in the `tools` directory. This will run the necessary tools
(each tool does only one thing) and get the `data` directory properly configured. NOTE: You must run this script from inside the tools directory at the moment.
1. If you'd like to obtain one of the intermediate data files, would like to fetch everything manually, or would like to update one, you can run the tools individually. Look at the README in each tool's directory
for more info on what it needs to run.
1. Obtain a Google Maps Javascript API key (free for what we are doing here) and place it in `webpage/MAPS_API_KEY.txt`

You do not need to do both step 2 and step 3 -- pick one or the other.

You can then run the main positions server that obtains live positions from the WMATA API and processes them with the data derived from the tools
with `node main/server.js`. Then you can use one of the webpages in the `webpage` directory to view the positions. 


## License

MIT