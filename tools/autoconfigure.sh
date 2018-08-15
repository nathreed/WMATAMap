#!/bin/bash


mkdir -p ../data/stations
mkdir -p ../data/lines

cd fetch-basic-data
echo "**RUNNING fetch-basic-data tool**"
node fetch-basic-data.js
echo "**DONE: fetch-basic-data"
cd ..

cd line-distance-maker
echo "**RUNNING line-distance-maker tool**"
node line-distance-maker.js
echo "**DONE: line-distance-maker"
cd ..

cd segment-coordinate-line-maker
echo "**RUNNING segment-coordinate-line-maker tool**"
node segment-coordinate-line-maker.js
echo "**DONE: segment-coordinate-line-maker"
cd ..

cd fetch-circuit-positions
echo "**RUNNING fetch-circuit-positions tool**"
node fetch-circuit-positions.js
echo "**DONE: fetch-circuit-positions"
cd ..