/*
 * A MIDI FX script for Logic Pro.
 *
 * A configurable probability based drummer.
 * You can configure the probability that any specified drum will hit on any given subdivision.
 * Default configuration: syncopation emphasis in four four (very jazzy!)
 *
 * Usage:
 * Prepare a MIDI region with hi-hat, snare, and kick events on every subdivision.
 * Then in MIDI FX > Scripter > Open Script in Editor, paste this code.
 * Modify the configuration section below to suit your production.
 *
 * Tip: to print the output to a MIDI region, see:
 * https://www.youtube.com/watch?v=-JOZCITL-Og
 */

// ==== CONFIGURATION ====

// MIDI event pitches
const SNARE = 38;
const RIMSHOT = 37;
const HIHAT = 42;
const HIHAT_OPEN = 46;
const KICK = 36;


// Time signature (I.e. intervals at which GetTimingInfo().blockStartBeat hits beat one)
var timeSignature = 4;
// How to subdivide time signature beats.
// Typically 2 = eight notes, 4 = 16th notes, etc.
var subdivision = 4;

// Compensates for GetTimingInfo().blockStartBeat's starting position (typically starts at 1).
var timeSignatureOffset = 1;


/*
 * The following three maps share the same structure, but their values differ:
 * Key: MIDI event pitch
 * Value: a 2D array:
 *     Outer array indices: beats
 *     Inner array indices: subdivisions
 * I.e. the 2D array elements in four four with subdivision = 4
 * can be represented as follows:
 *  [[1, e, and, a],
 *   [2, e, and, a],
 *   [3, e, and, a],
 *   [4, e, and, a]]
 */
 
// Values: probability out of 100 to send the note.
var probabilities = new Map();
// Values: minimum MIDI velocity
var minDynamic = new Map();
// Values: maximum MIDI velocity
var maxDynamic = new Map();


// Hi-hat probabilities of triggering:
probabilities.set(HIHAT, 
	[[100, 66, 90, 66],
	 [100, 66, 90, 66],
	 [100, 66, 90, 66],
	 [100, 66, 90, 66]]);
// Hi-hat minimum dynamics:
minDynamic.set(HIHAT,
	[[75, 55, 65, 55],
	 [75, 55, 65, 55],
	 [75, 55, 65, 55],
	 [75, 55, 65, 55]]);
// Hih-hat maximum dynamics:
maxDynamic.set(HIHAT,
	[[85, 65, 75, 65],
	 [85, 65, 75, 65],
	 [85, 65, 75, 65],
	 [85, 65, 75, 65]]);
// Probability out of 100 to play an open hi hat:
var hihatOpenProb = 10;
// When we toggle to an open hi-hat, this is added to the MIDI velocity
var hihatOpenDynamicModifier = 10;


// Snare:
// Default: emphasize off-beat 16ths ('e' and 'a')
probabilities.set(SNARE,
	[[20, 35, 10, 30],
	 [15, 35, 15, 30],
	 [20, 35, 15, 30],
	 [15, 35, 15, 35]]);
// Uncomment for beat 2 and 4 emphasis (I.e. a rock beat):
/* 
probabilities.set(SNARE, 
	[[20, 10, 20, 10],
	 [90, 10, 30, 10],
	 [50, 10, 30, 10],
	 [90, 10, 30, 20]]);
 */
minDynamic.set(SNARE,
	[[60, 80, 70, 90],
	 [60, 80, 70, 90],
	 [60, 80, 70, 90],
	 [60, 80, 70, 90]]);
maxDynamic.set(SNARE,
	[[85, 95, 85, 95],
	 [85, 95, 85, 95],
	 [85, 95, 85, 95],
	 [95, 95, 95, 95]]);
// Probability out of 100 to play a rimshot.
var rimshotProb = 30;
// When we toggle to a rimshot, this is added to the MIDI velocity
var rimshotDynamicModifier = -25;


// Kick:
probabilities.set(KICK,
	[[100, 1, 2.5, 1],
	 [12.5, 2.5, 5, 2.5],
	 [16.6, 2.5, 5, 2.5],
	 [12.5, 5, 7.5, 5]]);
minDynamic.set(KICK,
	[[90, 60, 70, 60],
	 [80, 60, 70, 60],
	 [80, 60, 70, 60],
	 [80, 60, 70, 60]]);
maxDynamic.set(KICK,
	[[100, 90, 90, 90],
	 [90, 80, 80, 80],
	 [90, 80, 80, 80],
	 [90, 80, 80, 80]]);

// ==== /CONFIGURATION ====

var NeedsTimingInfo = true;

function HandleMIDI(event)
{
	if (event instanceof NoteOn)
	{
		var info = GetTimingInfo();
		
		var beat = Math.round(info.blockStartBeat - timeSignatureOffset) % timeSignature;
		var beatPos = Math.round((info.blockStartBeat - timeSignatureOffset) * subdivision) % subdivision;
		
		var inputPitch = event.pitch;

		var probs = probabilities.get(inputPitch);
		if (probs) {
			if (100 * Math.random() > probs[beat][beatPos]) {
				// Skip!
				return;
			}
			
			// Toggle closed vs open hi hat / snare vs rimshot
			switch (inputPitch) {
				case HIHAT:
					if (100 * Math.random() < hihatOpenProb) {
						event.pitch = HIHAT_OPEN;
					}
					break;
				case SNARE:
					if (100 * Math.random() < rimshotProb) {
						event.pitch = RIMSHOT;
					}
				break;
				default:
			}
		}
		
		// Humanize dynamics
		var minArray = minDynamic.get(inputPitch);
		var maxArray = maxDynamic.get(inputPitch);
		if (minArray && maxArray) {
			var min = minArray[beat][beatPos];
			var max = maxArray[beat][beatPos];
			if (min && max) {
				event.velocity = min + Math.floor(Math.random() * (max - min));
			}
			
			// Modify velocity when we've toggled to a different pitch.
			switch (event.pitch) {
				case RIMSHOT:
					event.velocity += rimshotDynamicModifier;
					break;
				case HIHAT_OPEN:
					event.velocity += hihatOpenDynamicModifier;
					break;
				default:
			}
		}
	}
	else if (event instanceof NoteOff) {
		// Send NoteOffs corresponding to toggled pitches.
		switch (event.pitch) {
			case HIHAT:
				var hiHatOff = new NoteOff(event);
				hiHatOff.pitch = HIHAT_OPEN;
				hiHatOff.send();
				break;
			case SNARE:
				var snareOff = new NoteOff(event);
				snareOff.pitch = RIMSHOT;
				snareOff.send();
				break;
			default:
		}
	}
	
	event.send();
}
