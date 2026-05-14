import poolballs0 from "@/assets/ballTexture/poolballs0.png";
import poolballs1 from "@/assets/ballTexture/poolballs1.png";
import poolballs2 from "@/assets/ballTexture/poolballs2.png";
import poolballs3 from "@/assets/ballTexture/poolballs3.png";
import poolballs4 from "@/assets/ballTexture/poolballs4.png";
import poolballs5 from "@/assets/ballTexture/poolballs5.png";
import poolballs6 from "@/assets/ballTexture/poolballs6.png";
import tableIce from "@/assets/tableTexture/tableIce.svg";
import {
	OFFSET_Y,
	PLAY_HEIGHT,
	PLAY_LENGTH,
	PLAY_WIDTH,
} from "../components/billiardTable";
import { SWITCH_SIZE } from "../components/GateSwitch";

export type BallSpawnConfig = {
	id: string;
	textureUrl: string;
	position: [number, number, number];
	velocity?: [number, number, number];
	shootable?: boolean;
};

export type BombSpawnConfig = {
	id: string;
	position: [number, number, number];
};

export type PortalConfig = {
	entry: [number, number, number];
	exit: [number, number, number];
	radius?: number;
};

export type GateConfig = {
	gateEn: boolean;
	gatePos: [number, number, number][];
};

export type DividerConfig = {
	position: [number, number, number];
	size: [number, number, number];
	color?: string;
};

export type AccelerationFloorConfig = {
	id: string;
	position: [number, number, number];
	size: [number, number];
	direction: [number, number, number]; // Y成分は無視され、XZ平面上の方向のみ有効
	strength: number;
};

export type LevelConfig = {
	id: string;
	name: string;
	shotLimit: number;
	description: string;
	gimmic?: string;
	gimicImages?: string[];
	cueBallId: string;
	portals?: PortalConfig[];
	table?: {
		clothTextureUrl?: string;
		floorFriction?: number;
		planeColor?: string;
	};
	gate?: GateConfig;
	dividers?: DividerConfig[];
	magnetEn?: boolean;
	bombs?: BombSpawnConfig[];
	accelerationFloors?: AccelerationFloorConfig[];
	balls: BallSpawnConfig[];
};

const DIVIDER_HEIGHT = PLAY_HEIGHT * 1.2;
const DIVIDER_THICKNESS = PLAY_HEIGHT * 0.6;
const DIVIDER_Y = (PLAY_HEIGHT + DIVIDER_HEIGHT) / 2 - OFFSET_Y;

const EX_STAGE_POCKETS: [number, number, number][] = [
	[PLAY_WIDTH / 2, 0, PLAY_LENGTH / 2],
	[-PLAY_WIDTH / 2, 0, PLAY_LENGTH / 2],
	[PLAY_WIDTH / 2, 0, -PLAY_LENGTH / 2],
	[-PLAY_WIDTH / 2, 0, -PLAY_LENGTH / 2],
	[PLAY_WIDTH / 2, 0, 0],
	[-PLAY_WIDTH / 2, 0, 0],
];

function directionToNearestPocket(
	position: [number, number, number],
): [number, number, number] {
	let best = EX_STAGE_POCKETS[0];
	let bestDist = Number.POSITIVE_INFINITY;
	for (const pocket of EX_STAGE_POCKETS) {
		const dx = pocket[0] - position[0];
		const dz = pocket[2] - position[2];
		const dist = dx * dx + dz * dz;
		if (dist < bestDist) {
			bestDist = dist;
			best = pocket;
		}
	}
	return [best[0] - position[0], 0, best[2] - position[2]];
}

const EX_STAGE_BALLS: BallSpawnConfig[] = (() => {
	const gridX = [-0.6, -0.36, -0.12, 0.12, 0.36, 0.6];
	const gridZ = [-0.8, -0.4, 0, 0.4, 0.8];
	const textures = [
		poolballs1,
		poolballs2,
		poolballs3,
		poolballs4,
		poolballs5,
		poolballs6,
	];
	const balls: BallSpawnConfig[] = [];
	let idx = 0;
	for (const z of gridZ) {
		for (const x of gridX) {
			if (idx === 0) {
				balls.push({
					id: "poolballs0",
					textureUrl: poolballs0,
					position: [x, 0.2, z],
					shootable: true,
				});
			} else {
				const textureUrl = textures[(idx - 1) % textures.length];
				balls.push({
					id: `exball-${idx}`,
					textureUrl,
					position: [x, 0.2, z],
				});
			}
			idx += 1;
		}
	}
	return balls;
})();

const EX_STAGE_ACCEL_FLOORS: AccelerationFloorConfig[] = (() => {
	const positions: [number, number, number][] = [
		[-0.9, 0, -1.6],
		[0, 0, -1.6],
		[0.9, 0, -1.6],
		[-0.9, 0, -1.2],
		[0, 0, -1.2],
		[0.9, 0, -1.2],
		[-0.9, 0, -0.6],
		[0, 0, -0.6],
		[0.9, 0, -0.6],
		[-0.9, 0, 0.6],
		[0, 0, 0.6],
		[0.9, 0, 0.6],
		[-0.9, 0, 1.2],
		[0, 0, 1.2],
		[0.9, 0, 1.2],
		[-0.9, 0, 1.6],
		[0, 0, 1.6],
		[0.9, 0, 1.6],
	];
	return positions.map((position, index) => ({
		id: `accel-ex-${index}`,
		position,
		size: [0.45, 0.3],
		direction: directionToNearestPocket(position),
		strength: 3.5,
	}));
})();

export const LEVELS: LevelConfig[] = [
	{
		id: "level1",
		name: "Level 1 - Normal stage 1",
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
	{
		id: "level2",
		name: "Level 2 - Normal stage 2",
		description: "5球を15打以内に落とす",
		shotLimit: 15,
		cueBallId: "poolballs0",
		balls: [
			{
				id: "poolballs0",
				textureUrl: poolballs0,
				position: [-0.6, 0.2, 0],
				shootable: true,
			},
			{
				id: "poolballs1",
				textureUrl: poolballs1,
				position: [0.25, 0.2, -0.1],
			},
			{
				id: "poolballs2",
				textureUrl: poolballs2,
				position: [0.25, 0.2, 0.1],
			},
			{
				id: "poolballs3",
				textureUrl: poolballs3,
				position: [0.38, 0.2, 0],
			},
			{
				id: "poolballs4",
				textureUrl: poolballs4,
				position: [0.5, 0.2, 0.5],
			},
			{
				id: "poolballs5",
				textureUrl: poolballs5,
				position: [0.5, 0.2, -0.5],
			},
		],
	},
	{
		id: "level3",
		name: "Level 3 - Ice Floor",
		description: "氷の床で6球を15打以内に落とす",
		gimmic:
			"氷の床のため摩擦がほとんどなく、ボールが止まりにくくなっています。\n丁寧なショットでコントロールしよう！",
		gimicImages: ["/stages/level3.png"],
		shotLimit: 15,
		cueBallId: "poolballs0",
		table: {
			clothTextureUrl: tableIce,
			floorFriction: 0.03,
			planeColor: "#83c8df",
		},
		balls: [
			{
				id: "poolballs0",
				textureUrl: poolballs0,
				position: [0, 0.2, 0],
				shootable: true,
			},
			{
				id: "poolballs1",
				textureUrl: poolballs1,
				position: [0.2, 0.2, -0.07],
			},
			{
				id: "poolballs2",
				textureUrl: poolballs2,
				position: [-0.2, 0.2, 0.07],
			},
			{
				id: "poolballs3",
				textureUrl: poolballs3,
				position: [0.2, 0.2, 0.07],
			},
			{
				id: "poolballs4",
				textureUrl: poolballs4,
				position: [-0.2, 0.2, -0.07],
			},
			{
				id: "poolballs5",
				textureUrl: poolballs5,
				position: [0.3, 0.2, 0],
			},
			{
				id: "poolballs6",
				textureUrl: poolballs6,
				position: [-0.3, 0.2, 0],
			},
		],
	},
	{
		id: "level4",
		name: "Level 4 - Switch Gate",
		description: "スイッチを起動させ3球を15打以内に落とす",
		gimmic:
			"動いているスイッチに球を強くぶつけると、\nポケットが1分間開きます。\n開いたすきを狙ってボールをすべて落とそう！",
		gimicImages: ["/stages/level4.png"],
		shotLimit: 15,
		cueBallId: "poolballs0",
		gate: {
			gateEn: true,
			gatePos: [
				[0, (PLAY_HEIGHT + SWITCH_SIZE[1]) / 2 - OFFSET_Y, PLAY_LENGTH / 4],
				[0, (PLAY_HEIGHT + SWITCH_SIZE[1]) / 2 - OFFSET_Y, -PLAY_LENGTH / 4],
			],
		},
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
				position: [0.4, 0.2, 0.4],
			},
			{
				id: "poolballs2",
				textureUrl: poolballs2,
				position: [-0.4, 0.2, 0.4],
			},
			{
				id: "poolballs3",
				textureUrl: poolballs3,
				position: [0, 0.2, -0.4],
			},
		],
	},
	{
		id: "level5",
		name: "Level 5 - Bomb!",
		description: "爆弾を避けて3球を20打以内に落とす",
		gimmic:
			"爆弾に触ると爆発してゲームオーバーになります。\n爆弾に触らないように気を付けよう!",
		gimicImages: ["/stages/level5.png"],
		shotLimit: 20,
		cueBallId: "poolballs0",
		bombs: [
			{ id: "bomb0", position: [0.0, 0.2, -1.2] },
			{ id: "bomb1", position: [-0.3, 0.2, -0.4] },
			{ id: "bomb2", position: [0.4, 0.2, 0.7] },
			{ id: "bomb3", position: [0.1, 0.2, 1.4] },
		],
		balls: [
			{
				id: "poolballs0",
				textureUrl: poolballs0,
				position: [-0.7, 0.2, 0],
				shootable: true,
			},
			{
				id: "poolballs1",
				textureUrl: poolballs1,
				position: [0.3, 0.2, -1.8],
			},
			{
				id: "poolballs2",
				textureUrl: poolballs2,
				position: [0.4, 0.2, 0.0],
			},
			{
				id: "poolballs3",
				textureUrl: poolballs3,
				position: [-0.1, 0.2, 1.8],
			},
		],
	},
	{
		id: "level6",
		name: "Level 6 - Warp Divide",
		description: "仕切りを越えるためにワープホールを使う",
		gimmic:
			"テーブルが2枚の仕切りで3つのエリアに分断されています。\nワープホールに入ると別のエリアへ移動できます。\nワープを活用して全エリアのボールをポケットに落とそう！",
		gimicImages: ["/stages/level6.png"],
		shotLimit: 9,
		cueBallId: "poolballs0",
		portals: [
			{
				entry: [-0.3, 0, -PLAY_LENGTH / 3 + 0.1],
				exit: [0.3, 0, -0.05],
				radius: 0.14,
			},
			{
				entry: [-0.3, 0, 0.05],
				exit: [0.3, 0, PLAY_LENGTH / 3 - 0.1],
				radius: 0.14,
			},
			{
				entry: [-0.3, 0, PLAY_LENGTH / 3 - 0.1],
				exit: [0.3, 0, -PLAY_LENGTH / 3 + 0.1],
				radius: 0.14,
			},
		],
		dividers: [
			{
				position: [0, DIVIDER_Y, -PLAY_LENGTH / 6],
				size: [PLAY_WIDTH, DIVIDER_HEIGHT, DIVIDER_THICKNESS],
				color: "#2b2b2b",
			},
			{
				position: [0, DIVIDER_Y, PLAY_LENGTH / 6],
				size: [PLAY_WIDTH, DIVIDER_HEIGHT, DIVIDER_THICKNESS],
				color: "#2b2b2b",
			},
		],
		balls: [
			{
				id: "poolballs0",
				textureUrl: poolballs0,
				position: [0, 0.2, -PLAY_LENGTH / 3 + 0.25],
				shootable: true,
			},

			{
				id: "poolballs1",
				textureUrl: poolballs1,
				position: [1, 0.2, 0],
			},
			{
				id: "poolballs2",
				textureUrl: poolballs2,
				position: [1, 0.2, -2],
			},
			{
				id: "poolballs3",
				textureUrl: poolballs3,
				position: [1, 0.2, -PLAY_LENGTH / 3 + 4.0],
			},
		],
	},
	{
		id: "level7",
		name: "Level 7 - Magnet Control",
		description: "ボールを曲げて加速床を避ける",
		gimmic:
			"磁石の力でボールの軌道を操作できます。\nショット中にA/Dキーを押すと左右に曲げられます。\n光る床（加速床）に乗ると弾き飛ばされるので、\nうまく避けてボールを落とそう！",
		gimicImages: ["/stages/level7-1.png", "/stages/level7-2.png"],
		shotLimit: 7,
		cueBallId: "poolballs0",
		magnetEn: true,
		accelerationFloors: [
			{
				id: "accel-l8-0",
				position: [0, 0, 2.4],
				size: [1, 0.3],
				direction: [0, 0, -1],
				strength: 2,
			},
			{
				id: "accel-l8-1",
				position: [0, 0, -2.4],
				size: [1, 0.3],
				direction: [0, 0, 1],
				strength: 2,
			},
			{
				id: "accel-l8-2",
				position: [0.5, 0, 1.5],
				size: [0.5, 0.3],
				direction: [-1, 0, -1],
				strength: 8,
			},
			{
				id: "accel-l8-3",
				position: [-0.5, 0, 1.5],
				size: [0.5, 0.3],
				direction: [1, 0, -1],
				strength: 8,
			},
			{
				id: "accel-l8-4",
				position: [0.5, 0, -1.5],
				size: [0.5, 0.3],
				direction: [-1, 0, 1],
				strength: 8,
			},
			{
				id: "accel-l8-5",
				position: [-0.5, 0, -1.5],
				size: [0.5, 0.3],
				direction: [1, 0, 1],
				strength: 8,
			},
			{
				id: "accel-l8-6",
				position: [0.75, 0, 0.5],
				size: [0.25, 0.25],
				direction: [1, 0, -1],
				strength: 8,
			},
			{
				id: "accel-l8-7",
				position: [0.75, 0, -0.5],
				size: [0.25, 0.25],
				direction: [1, 0, 1],
				strength: 8,
			},
			{
				id: "accel-l8-8",
				position: [-0.75, 0, 0.5],
				size: [0.25, 0.25],
				direction: [-1, 0, -1],
				strength: 8,
			},
			{
				id: "accel-l8-9",
				position: [-0.75, 0, -0.5],
				size: [0.25, 0.25],
				direction: [-1, 0, 1],
				strength: 8,
			},
			{
				id: "accel-l8-10",
				position: [-0.25, 0, 0.25],
				size: [0.1, 0.25],
				direction: [-1, 0, 2],
				strength: 4,
			},
			{
				id: "accel-l8-11",
				position: [-0.25, 0, -0.25],
				size: [0.1, 0.25],
				direction: [-1, 0, -2],
				strength: 4,
			},
			{
				id: "accel-l8-12",
				position: [0.25, 0, 0.25],
				size: [0.1, 0.25],
				direction: [1, 0, 2],
				strength: 4,
			},
			{
				id: "accel-l8-13",
				position: [0.25, 0, -0.25],
				size: [0.1, 0.25],
				direction: [1, 0, -2],
				strength: 4,
			},
		],
		balls: [
			{
				id: "poolballs0",
				textureUrl: poolballs0,
				position: [-0.9, 0.2, 0],
				shootable: true,
			},
			{
				id: "poolballs1",
				textureUrl: poolballs1,
				position: [0, 0.2, 0.5],
			},
			{
				id: "poolballs2",
				textureUrl: poolballs2,
				position: [0, 0.2, -0.5],
			},
			{
				id: "poolballs3",
				textureUrl: poolballs3,
				position: [0, 0.2, 1],
			},
			{
				id: "poolballs4",
				textureUrl: poolballs4,
				position: [0, 0.2, -1],
			},
		],
	},
	{
		id: "level8",
		name: "Level 8 - Bomb Trap",
		description: "加速床の罠を避けて3球を20打以内に落とす",
		gimmic:
			"爆弾の周囲に加速床が三角形に配置されており、\n乗ると爆弾へ向かって押し出されてしまいます。\n加速床を踏まないように気をつけよう！",
		shotLimit: 20,
		cueBallId: "poolballs0",
		bombs: [
			{ id: "bomb0", position: [0, 0.2, -1.1] },
			{ id: "bomb1", position: [0, 0.2, 1.1] },
		],
		accelerationFloors: [
			// 罠1: 爆弾(0, -1.1)を重心とする正三角形の各頂点に配置
			// 頂点1: テーブル中央側 (0, -0.6) → 爆弾へ [0, 0, -1]
			{
				id: "accel-l8-0",
				position: [0, 0, -0.6],
				size: [0.35, 0.3],
				direction: [0, 0, -1],
				strength: 8,
			},
			// 頂点2: 左奥 (-0.43, -1.35) → 爆弾へ [0.87, 0, 0.5]
			{
				id: "accel-l8-1",
				position: [-0.43, 0, -1.35],
				size: [0.35, 0.3],
				direction: [0.87, 0, 0.5],
				strength: 8,
			},
			// 頂点3: 右奥 (0.43, -1.35) → 爆弾へ [-0.87, 0, 0.5]
			{
				id: "accel-l8-2",
				position: [0.43, 0, -1.35],
				size: [0.35, 0.3],
				direction: [-0.87, 0, 0.5],
				strength: 8,
			},
			// 罠2: 爆弾(0, 1.1)を重心とする正三角形の各頂点に配置
			// 頂点1: テーブル中央側 (0, 0.6) → 爆弾へ [0, 0, 1]
			{
				id: "accel-l8-3",
				position: [0, 0, 0.6],
				size: [0.35, 0.3],
				direction: [0, 0, 1],
				strength: 8,
			},
			// 頂点2: 右奥 (0.43, 1.35) → 爆弾へ [-0.87, 0, -0.5]
			{
				id: "accel-l8-4",
				position: [0.43, 0, 1.35],
				size: [0.35, 0.3],
				direction: [-0.87, 0, -0.5],
				strength: 8,
			},
			// 頂点3: 左奥 (-0.43, 1.35) → 爆弾へ [0.87, 0, -0.5]
			{
				id: "accel-l8-5",
				position: [-0.43, 0, 1.35],
				size: [0.35, 0.3],
				direction: [0.87, 0, -0.5],
				strength: 8,
			},
		],
		balls: [
			{
				id: "poolballs0",
				textureUrl: poolballs0,
				position: [-0.9, 0.2, 0],
				shootable: true,
			},
			{
				id: "poolballs1",
				textureUrl: poolballs1,
				position: [0, 0.2, -2.0],
			},
			{
				id: "poolballs2",
				textureUrl: poolballs2,
				position: [0, 0.2, 2.0],
			},
		],
	},
	{
		id: "level-ex-30",
		name: "EX Stage - 30 Balls",
		description: "30球を制限打数内に落とす。",
		gimmic:
			"大量のボールが配置されているステージです。うまくボールを加速床に乗せて落とそう！",
		shotLimit: 10,
		cueBallId: "poolballs0",
		accelerationFloors: EX_STAGE_ACCEL_FLOORS,
		balls: EX_STAGE_BALLS,
	},
];

export function getLevelConfig(levelId?: string) {
	if (!levelId) return undefined;
	return LEVELS.find((level) => level.id === levelId);
}
