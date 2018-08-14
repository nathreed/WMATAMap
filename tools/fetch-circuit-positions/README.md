# `fetch-circuit-positions`

This tool represents the last step in the process before you can get train positions up and running with live WMATA
data. It calculates the geographical coordinates of every circuit in the WMATA system and stores them in a file so that 
the program that is receiving live train data can be simpler (and because there are not currently any complicated/adapting position calculation algorithms - calculated positions never change).

## Note
Because WMATA does not give lengths or positions for the circuits (in fact, it somewhat discourages the use of the data for live positioning),
this tool provides an approximation of the locations, but it's a pretty good approximation and it's about the best you can get. 

## Running

This tool requires the circuit data be fetched and stored in `data/standardRoutesData.json`. This can be accomplished with the 
`fetch-basic-data` tool. Then simply run with `node fetch-circuit-positions.js`.