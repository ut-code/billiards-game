import poolballs0 from "@/assets/ballTexture/poolballs0.png";
import poolballs1 from "@/assets/ballTexture/poolballs1.png";
import poolballs2 from "@/assets/ballTexture/poolballs2.png";

export type BallSpawnConfig = {
	id: string;
	textureUrl: string;
	position: [number, number, number];
	velocity?: [number, number, number];
	shootable?: boolean;
};

export type LevelConfig = {
	id: string;
	name: string;
	shotLimit: number;
	description: string;
	cueBallId: string;
	balls: BallSpawnConfig[];
};

export const LEVELS: LevelConfig[] = [
	{
		id: "level1",
		name: "Level 1",
		description: "2球を5打以内に落とす",
		shotLimit: 5,
		cueBallId: "poolballs0",
		balls: [
			{
				id: "poolballs0",
				textureUrl: poolballs0,
				position: [-0.6, 0.2, 0], //長辺がz軸、短辺がx軸
				shootable: true,
			},
			{
				id: "poolballs1",
				textureUrl: poolballs1,
				position: [0.12, 0.2, 0],
			},
			{
				id: "poolballs2",
				textureUrl: poolballs2,
				position: [0.25, 0.2, 0],
			},
		],
	},
];

export function getLevelConfig(levelId?: string) {
	if (!levelId) return undefined;
	return LEVELS.find((level) => level.id === levelId);
}
