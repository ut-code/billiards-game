import poolballs0 from "@/assets/ballTexture/poolballs0.png";
import poolballs1 from "@/assets/ballTexture/poolballs1.png";
import poolballs2 from "@/assets/ballTexture/poolballs2.png";
import poolballs3 from "@/assets/ballTexture/poolballs3.png";
import poolballs4 from "@/assets/ballTexture/poolballs4.png";
import tableIce from "@/assets/tableTexture/tableIce.svg";
import {
	OFFSET_Y,
	PLAY_HEIGHT,
	PLAY_LENGTH,
} from "../components/billiardTable";
import { SWITCH_SIZE } from "../components/GateSwitch";

export type BallSpawnConfig = {
	id: string;
	textureUrl: string;
	position: [number, number, number];
	velocity?: [number, number, number];
	shootable?: boolean;
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

export type LevelConfig = {
	id: string;
	name: string;
	shotLimit: number;
	description: string;
	cueBallId: string;
	portal?: PortalConfig;
	table?: {
		clothTextureUrl?: string;
		floorFriction?: number;
		planeColor?: string;
	};
	gate?: GateConfig;
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
	{
		id: "level2",
		name: "Level 2",
		description: "3球を7打以内に落とす",
		shotLimit: 7,
		cueBallId: "poolballs0",
		portal: {
			entry: [-0.25, 0, -0.45],
			exit: [0.5, 0, 0.55],
			radius: 0.12,
		},
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
				position: [0.12, 0.2, 0],
			},
			{
				id: "poolballs2",
				textureUrl: poolballs2,
				position: [0.25, 0.2, 0],
			},
			{
				id: "poolballs3",
				textureUrl: poolballs3,
				position: [0.38, 0.2, 0],
			},
		],
	},
	{
		id: "level3",
		name: "Level 3 - Ice Floor",
		description: "氷の床で4球を8打以内に落とす",
		shotLimit: 8,
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
				position: [-0.8, 0.2, 0],
				shootable: true,
			},
			{
				id: "poolballs1",
				textureUrl: poolballs1,
				position: [0.15, 0.2, -0.2],
			},
			{
				id: "poolballs2",
				textureUrl: poolballs2,
				position: [0.32, 0.2, 0],
			},
			{
				id: "poolballs3",
				textureUrl: poolballs3,
				position: [0.15, 0.2, 0.2],
			},
			{
				id: "poolballs4",
				textureUrl: poolballs4,
				position: [0.52, 0.2, 0],
			},
		],
	},
	{
		id: "level4",
		name: "Level 4 - Switch Gate",
		description: "3球を10打以内に落とす",
		shotLimit: 10,
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
];

export function getLevelConfig(levelId?: string) {
	if (!levelId) return undefined;
	return LEVELS.find((level) => level.id === levelId);
}
