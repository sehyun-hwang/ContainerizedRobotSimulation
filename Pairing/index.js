import shortestTotalDistancePairing from './shortestTotalDistancePairing.js';
import octTreePairing from './octTreePairing.js';

export default function (vertsA, vertsB, maxVertsForGreedyAlgorithm = 6) {
	if(vertsA.length <= maxVertsForGreedyAlgorithm) {
		shortestTotalDistancePairing(vertsA, vertsB);
	}
	else {
		octTreePairing(vertsA, vertsB);
	}
}
