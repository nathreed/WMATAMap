# `testing-server`

This is a stripped-down version of the main server that is used for testing the consistency of the underlying
data. It is designed to feed positions one at a time to the client along the length of a line. This is useful because
it can help pinpoint errors with individual circuits (e.g. sections of the line are reversed) and can indicate manual correction
of the source data.

## How to Use
Run `testing-server.js` with the normal webpage viewer open in another window. Press enter in the console
of `testing-server` to advance the fake train by 1 track circuit. You can hold enter and the train will
move as fast as it can. You can observe any jerks in its motion that might indicate reversed segments of track, missing
segments, or some other data consistency issues.