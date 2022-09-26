/*
 * A MIDI FX script for Logic Pro.
 *
 * Curves velocities in accordance with the equation:
 * v" = v' * (v'/127)^c
 * where v" is the output velocity,
 * v' is the input velocity, and
 * c is an exponent derived by a configured 'amplifier' parameter.
 * 
 * This exponential curve guarantees that we can deliver the extreme velocities,
 * I.e. velocity 127 still outputs velocity 127, and velocity 0 still outputs velocity 0.
 *
 * The dynamic range can then be compressed to a velocity range and makeup.
 * E.g. range = 60; makeup = 20 results in velocities ranging from from 20 to 80.
 */

// ==== CONFIGURATION ====
/*
 * Amplifier behaves as a percentage.
 * E.g.:
 * 100 = velocity is unchanged
 * 50 = softer
 * 200 = louder
 */
var amplifier = 75;

// Compresses dynamic range after velocity has been curved:
// Dynamic range (out of 127 velocities)
var range = 126;
// How much to boost after compressing the dynamic range.
// Recommend a minimum of 1, since a NoteOn with velocity = 0 is equivalent to a NoteOff (as per the MIDI spec).
var makeup = 1;

// Debug
var doTrace = false;

// ==== /CONGIFURATION ====


var exponent = 100 / amplifier - 1;

function debug(message) {
	if (doTrace) {
		Trace(message);
	}
}

function HandleMIDI(event)
{
	if (event instanceof NoteOn)
	{
		debug("In velocity: " + event.velocity);
		event.velocity = event.velocity * Math.pow(event.velocity / 127, exponent);
		debug("Curved: " + event.velocity);

		event.velocity = event.velocity * range / 127 + makeup;
		debug("Adjusted to range: " + event.velocity);

		if (doTrace) {
			event.trace();
		}
	}
	event.send();
}
