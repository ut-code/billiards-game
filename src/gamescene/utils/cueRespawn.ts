import { BALL_RADIUS } from "../constants/physics";

export const CUE_RESPAWN_MIN_DISTANCE = BALL_RADIUS * 2.2;

const DEFAULT_CUE_RESPAWN_OFFSET = 0.2;

export const cueRespawnOffsets: Array<[number, number, number]> = [
	[0, 0, 0],
	[0.07, 0, 0],
	[-0.07, 0, 0],
	[0, 0, 0.07],
	[0, 0, -0.07],
	[0.12, 0, 0.05],
	[-0.12, 0, 0.05],
	[0.12, 0, -0.05],
	[-0.12, 0, -0.05],
	[0.16, 0, 0],
	[-0.16, 0, 0],
];

function distanceSquaredXZ(
	a: [number, number, number],
	b: [number, number, number],
): number {
	const dx = a[0] - b[0];
	const dz = a[2] - b[2];
	return dx * dx + dz * dz;
}

export function findCueRespawnPosition(
	defaultPosition: [number, number, number],
	activeBallPositions: Array<[number, number, number]>,
): [number, number, number] {
	for (const offset of cueRespawnOffsets) {
		const candidate: [number, number, number] = [
			defaultPosition[0] + offset[0],
			defaultPosition[1],
			defaultPosition[2] + offset[2],
		];

		const overlaps = activeBallPositions.some(
			(position) =>
				distanceSquaredXZ(position, candidate) < CUE_RESPAWN_MIN_DISTANCE ** 2,
		);

		if (!overlaps) {
			return candidate;
		}
	}

	return [
		defaultPosition[0] + DEFAULT_CUE_RESPAWN_OFFSET,
		defaultPosition[1],
		defaultPosition[2],
	];
}
