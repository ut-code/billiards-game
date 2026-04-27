export const BALL_RADIUS = 0.06;

const STRIKE_DURATION_MIN = 0.1; // 最大パワー時（秒）
const STRIKE_DURATION_MAX = 0.4; // 最小パワー時（秒）

export function calcStrikeDuration(normalizedPower: number): number {
	return (
		STRIKE_DURATION_MIN +
		(1 - normalizedPower) * (STRIKE_DURATION_MAX - STRIKE_DURATION_MIN)
	);
}
