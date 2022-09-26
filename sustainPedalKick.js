/**
 * A MIDI FX script for Logic Pro.
 *
 * Turns your sustain pedal into a kick drum.
 *
 * Usage:
 * On a drum track, go to MIDI FX > Scripter > Open Script in Editor,
 * then paste this code.
 *
 * Tip: to print the output to a MIDI region, see:
 * https://www.youtube.com/watch?v=-JOZCITL-Og
 */

// ==== CONFIGURATION ====

// Kick MIDI pitch
var kickPitch = 36;
// Kick velocity will be random within this range:
var minKickVelocity = 55;
var maxKickVelocity = 65;

// Determines whether to prevent sustain events from being sent. I.e. true = no sustain; events are fully converted to kick drum events.
var eliminateSustain = true;

// Debug
var doTrace = false;

// ==== /CONFIGURATION ====

const CC_SUSTAIN = 64;
const SUSTAIN_ON = 127;
const SUSTAIN_OFF = 0;

function send(event) {
	if (doTrace) {
		event.trace();
	}
	event.send()
}

function getRandomVelocity() {
	return minKickVelocity + Math.floor(Math.random() * (maxKickVelocity - minKickVelocity));
}


function HandleMIDI(event)
{
	if (event instanceof ControlChange && event.number == CC_SUSTAIN) {
		var kick;
		if (event.value == SUSTAIN_ON) {
			kick = new NoteOn();
			kick.velocity = getRandomVelocity();
		}
		else if (event.value == SUSTAIN_OFF) {
			kick = new NoteOff();
		}
		kick.pitch = kickPitch;
		send(kick);
		
		if (!eliminateSustain) {
			send(event);
		}
	} else {
		send(event);
	}
}
