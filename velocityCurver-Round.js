/*
 * A MIDI FX script for Logic Pro.
 *
 * Curves velocities in accordance with the equation:
 * v" = 127 - (127^c - v'^c)^(1/c)
 * where v" is the output velocity,
 * v' is the input velocity, and
 * c is a constant derived by a configured 'amplifier' parameter.
 *
 * This equation is derived from the circle equation: (x – x1)^2 + (y – y1)^2= r^2
 *
 * This curve guarantees that we can deliver the extreme velocities,
 * I.e. velocity 1 still outputs velocity 1, and velocity 127 still outputs velocity 127.
 *
 * The dynamic range can then be compressed to a velocity range and makeup.
 * E.g. range = 60; makeup = 20 results in velocities ranging from from 20 to 80.
 */

// ==== CONFIGURATION ====

/*
 * Amplifier's value is a percentage, bound between 50 and 200.
 * Values outside of this range can result in velocities outside the range 1 to 127.
 * amplifier = 100 => The velocity is unchanged.
 * amplifier = 50 => The velocity curve is softer, in the shape of a quarter circle.
 * amplifier = 200 => The velocity curve is louder, in the shape of a quarter circle.
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
 
// ==== /CONFIGURATION ====

var c = 100 / amplifier;

function debug(message) {
	if (doTrace) {
		Trace(message);
	}
}

function HandleMIDI(event)
{
	if (event instanceof NoteOn)
	{
		debug("Before: " + event.velocity);
		event.velocity = 127 - Math.pow(Math.pow(127, c)- Math.pow(event.velocity, c), 1/c);
		debug("Curved: " + event.velocity);
    
		event.velocity = event.velocity * range / 127 + makeup;
		debug("Compressed: " + event.velocity);
	}
	event.send();
}
