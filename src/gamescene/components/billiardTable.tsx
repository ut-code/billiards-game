import { useBox } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import type * as THREE from "three";
import clothTexture from "@/assets/tableTexture/tableCloth.jpg";
import woodTexture from "@/assets/tableTexture/tableWood.jpg";

// 9フィートテーブルの定数 (メートル単位)

export const POCKET_Y_THRESHOLD = -0.2; // ポケットに入ったとみなすy座標の閾値
// スケーリング定数
const SCALE = 2;

// クッションに囲まれた台面の広さ
export const PLAY_WIDTH = 1.27 * SCALE;
export const PLAY_LENGTH = 2.54 * SCALE;
export const PLAY_HEIGHT = 0.1 * SCALE;

// 以下、台面の長い方に面する方をSIDE, 短い方に面する方をTOPとする。

// 台面を取り囲むクッション
const CUSHION_WIDTH = 0.04 * SCALE;
const SIDE_CUSHION_LENGTH = 1.12 * SCALE;
const TOP_CUSHION_LENGTH = 1.11 * SCALE;
const CUSHION_HEIGHT = 0.115 * SCALE;

// クッションの周りの囲い(レール)
const RAIL_WIDTH = 0.08 * SCALE;
const SIDE_RALE_LENGTH = 1.16 * SCALE;
const TOP_RAIL_LENGTH = 1.23 * SCALE;
const RAIL_HEIGHT = CUSHION_HEIGHT;

//　台全体の周りを取り囲む囲い
const OUTER_WIDTH = 0.02 * SCALE;
const OUTER_HEIGHT = PLAY_HEIGHT + RAIL_HEIGHT;
const TOP_OUTER_LENGTH =
	PLAY_WIDTH + (CUSHION_WIDTH + RAIL_WIDTH + OUTER_WIDTH) * 2;
const SIDE_OUTER_LENGTH =
	PLAY_LENGTH + (CUSHION_WIDTH + RAIL_WIDTH + OUTER_WIDTH) * 2;

export const SIDE_POCKET_SIZE = 0.14 * SCALE;

// クッションと囲いの下の隙間を埋める部分
export const TABLE_BOTTOM_WIDTH = CUSHION_WIDTH + RAIL_WIDTH;
export const TABLE_BOTTOM_HEIGHT = PLAY_HEIGHT;
const SIDE_TABLE_BOTTOM_LENGTH = (PLAY_LENGTH - SIDE_POCKET_SIZE) / 2;
const TOP_TABLE_BOTTOM_LENGTH = PLAY_WIDTH;

export const OFFSET_Y = PLAY_HEIGHT / 2; //高さ調整
const CUSHION_Y = (PLAY_HEIGHT + CUSHION_HEIGHT) / 2 - OFFSET_Y;
const RAIL_Y = (PLAY_HEIGHT + RAIL_HEIGHT) / 2 - OFFSET_Y;
const OUTER_Y = RAIL_HEIGHT / 2 - OFFSET_Y;

type Pos = { X: number; Y: number; Z: number };
type TableMaterialProps = { position: Pos; texture: THREE.Texture };
type PlaneProps = {
	texture: THREE.Texture;
	floorFriction: number;
	planeColor: string;
};

useTexture.preload(clothTexture);
useTexture.preload(woodTexture);

function Plane({ texture, floorFriction, planeColor }: PlaneProps) {
	// Planeは台面
	const [ref] = useBox(() => ({
		mass: 0, // 質量0にすることで、動かない固定された物体にする
		position: [0, -OFFSET_Y, 0], // 初期位置
		args: [PLAY_WIDTH, PLAY_HEIGHT, PLAY_LENGTH], // 幅、高さ、長さ
		type: "Static",
		material: { friction: floorFriction, restitution: 0 },
	}));

	return (
		<mesh ref={ref}>
			<boxGeometry args={[PLAY_WIDTH, PLAY_HEIGHT, PLAY_LENGTH]} />
			<meshStandardMaterial map={texture} color={planeColor} />
		</mesh>
	);
}

const SideCushionPos = [
	{
		X: (PLAY_WIDTH + CUSHION_WIDTH) / 2,
		Y: CUSHION_Y,
		Z: (SIDE_POCKET_SIZE + SIDE_CUSHION_LENGTH) / 2,
	},
	{
		X: -(PLAY_WIDTH + CUSHION_WIDTH) / 2,
		Y: CUSHION_Y,
		Z: (SIDE_POCKET_SIZE + SIDE_CUSHION_LENGTH) / 2,
	},
	{
		X: (PLAY_WIDTH + CUSHION_WIDTH) / 2,
		Y: CUSHION_Y,
		Z: -(SIDE_POCKET_SIZE + SIDE_CUSHION_LENGTH) / 2,
	},
	{
		X: -(PLAY_WIDTH + CUSHION_WIDTH) / 2,
		Y: CUSHION_Y,
		Z: -(SIDE_POCKET_SIZE + SIDE_CUSHION_LENGTH) / 2,
	},
];

function SideCushion({ position, texture }: TableMaterialProps) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [CUSHION_WIDTH, CUSHION_HEIGHT, SIDE_CUSHION_LENGTH],
		type: "Static",
		material: { friction: 0, restitution: 1 }, // 摩擦を0.1から0.5に増加
		userData: { type: "cushion" },
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry
				args={[CUSHION_WIDTH, CUSHION_HEIGHT, SIDE_CUSHION_LENGTH]}
			/>
			<meshStandardMaterial map={texture} color="#006633" />
		</mesh>
	);
}

const TopCushionPos = [
	{
		X: 0,
		Y: CUSHION_Y,
		Z: (PLAY_LENGTH + CUSHION_WIDTH) / 2,
	},
	{
		X: 0,
		Y: CUSHION_Y,
		Z: -(PLAY_LENGTH + CUSHION_WIDTH) / 2,
	},
];

function TopCushion({ position, texture }: TableMaterialProps) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [TOP_CUSHION_LENGTH, CUSHION_HEIGHT, CUSHION_WIDTH],
		type: "Static",
		material: { friction: 0, restitution: 1 }, // 摩擦を0.1から0.5に増加
		userData: { type: "cushion" },
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry args={[TOP_CUSHION_LENGTH, CUSHION_HEIGHT, CUSHION_WIDTH]} />
			<meshStandardMaterial map={texture} color="#006633" />
		</mesh>
	);
}

const SideRailPos = [
	{
		X: (PLAY_WIDTH + RAIL_WIDTH) / 2 + CUSHION_WIDTH,
		Y: RAIL_Y,
		Z: (SIDE_POCKET_SIZE + SIDE_RALE_LENGTH) / 2,
	},
	{
		X: -((PLAY_WIDTH + RAIL_WIDTH) / 2 + CUSHION_WIDTH),
		Y: RAIL_Y,
		Z: (SIDE_POCKET_SIZE + SIDE_RALE_LENGTH) / 2,
	},
	{
		X: (PLAY_WIDTH + RAIL_WIDTH) / 2 + CUSHION_WIDTH,
		Y: RAIL_Y,
		Z: -(SIDE_POCKET_SIZE + SIDE_RALE_LENGTH) / 2,
	},
	{
		X: -((PLAY_WIDTH + RAIL_WIDTH) / 2 + CUSHION_WIDTH),
		Y: RAIL_Y,
		Z: -(SIDE_POCKET_SIZE + SIDE_RALE_LENGTH) / 2,
	},
];

function SideRail({ position, texture }: TableMaterialProps) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [RAIL_WIDTH, RAIL_HEIGHT, SIDE_RALE_LENGTH],
		type: "Static",
		material: { friction: 0, restitution: 0.1 },
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry args={[RAIL_WIDTH, RAIL_HEIGHT, SIDE_RALE_LENGTH]} />
			<meshStandardMaterial map={texture} color="#4b2e1e" />
		</mesh>
	);
}

const TopRailPos = [
	{
		X: 0,
		Y: RAIL_Y,
		Z: (PLAY_LENGTH + RAIL_WIDTH) / 2 + CUSHION_WIDTH,
	},
	{
		X: 0,
		Y: RAIL_Y,
		Z: -(PLAY_LENGTH + RAIL_WIDTH) / 2 - CUSHION_WIDTH,
	},
];

function TopRail({ position, texture }: TableMaterialProps) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [TOP_RAIL_LENGTH, RAIL_HEIGHT, RAIL_WIDTH],
		type: "Static",
		material: { friction: 0, restitution: 0.1 },
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry args={[TOP_RAIL_LENGTH, RAIL_HEIGHT, RAIL_WIDTH]} />
			<meshStandardMaterial map={texture} color="#4b2e1e" />
		</mesh>
	);
}

const TopOuterPos = [
	{
		X: 0,
		Y: OUTER_Y,
		Z: PLAY_LENGTH / 2 + RAIL_WIDTH + CUSHION_WIDTH + OUTER_WIDTH / 2,
	},
	{
		X: 0,
		Y: OUTER_Y,
		Z: -(PLAY_LENGTH / 2 + RAIL_WIDTH + CUSHION_WIDTH + OUTER_WIDTH / 2),
	},
];

function TopOuter({ position, texture }: TableMaterialProps) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [TOP_OUTER_LENGTH, OUTER_HEIGHT, OUTER_WIDTH],
		type: "Static",
		material: { friction: 0, restitution: 0.1 },
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry args={[TOP_OUTER_LENGTH, OUTER_HEIGHT, OUTER_WIDTH]} />
			<meshStandardMaterial map={texture} color="#4b2e1e" />
		</mesh>
	);
}

const SideOuterPos = [
	{
		X: PLAY_WIDTH / 2 + RAIL_WIDTH + CUSHION_WIDTH + OUTER_WIDTH / 2,
		Y: OUTER_Y,
		Z: 0,
	},
	{
		X: -(PLAY_WIDTH / 2 + RAIL_WIDTH + CUSHION_WIDTH + OUTER_WIDTH / 2),
		Y: OUTER_Y,
		Z: 0,
	},
];

function SideOuter({ position, texture }: TableMaterialProps) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [OUTER_WIDTH, OUTER_HEIGHT, SIDE_OUTER_LENGTH],
		type: "Static",
		material: { friction: 0, restitution: 0.1 },
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry args={[OUTER_WIDTH, OUTER_HEIGHT, SIDE_OUTER_LENGTH]} />
			<meshStandardMaterial map={texture} color="#4b2e1e" />
		</mesh>
	);
}

const SideTableBottomPos = [
	{
		X: (PLAY_WIDTH + TABLE_BOTTOM_WIDTH) / 2,
		Y: -OFFSET_Y,
		Z: (SIDE_POCKET_SIZE + SIDE_TABLE_BOTTOM_LENGTH) / 2,
	},
	{
		X: -(PLAY_WIDTH + TABLE_BOTTOM_WIDTH) / 2,
		Y: -OFFSET_Y,
		Z: (SIDE_POCKET_SIZE + SIDE_TABLE_BOTTOM_LENGTH) / 2,
	},
	{
		X: (PLAY_WIDTH + TABLE_BOTTOM_WIDTH) / 2,
		Y: -OFFSET_Y,
		Z: -(SIDE_POCKET_SIZE + SIDE_TABLE_BOTTOM_LENGTH) / 2,
	},
	{
		X: -(PLAY_WIDTH + TABLE_BOTTOM_WIDTH) / 2,
		Y: -OFFSET_Y,
		Z: -(SIDE_POCKET_SIZE + SIDE_TABLE_BOTTOM_LENGTH) / 2,
	},
];

function SideTableBottom({ position, texture }: TableMaterialProps) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [TABLE_BOTTOM_WIDTH, TABLE_BOTTOM_HEIGHT, SIDE_TABLE_BOTTOM_LENGTH],
		type: "Static",
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry
				args={[
					TABLE_BOTTOM_WIDTH,
					TABLE_BOTTOM_HEIGHT,
					SIDE_TABLE_BOTTOM_LENGTH,
				]}
			/>
			<meshStandardMaterial map={texture} color="#006633" />
		</mesh>
	);
}

const TopTableBottomPos = [
	{
		X: 0,
		Y: -OFFSET_Y,
		Z: (PLAY_LENGTH + TABLE_BOTTOM_WIDTH) / 2,
	},
	{
		X: 0,
		Y: -OFFSET_Y,
		Z: -(PLAY_LENGTH + TABLE_BOTTOM_WIDTH) / 2,
	},
];

function TopTableBottom({ position, texture }: TableMaterialProps) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [TOP_TABLE_BOTTOM_LENGTH, TABLE_BOTTOM_HEIGHT, TABLE_BOTTOM_WIDTH],
		type: "Static",
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry
				args={[
					TOP_TABLE_BOTTOM_LENGTH,
					TABLE_BOTTOM_HEIGHT,
					TABLE_BOTTOM_WIDTH,
				]}
			/>
			<meshStandardMaterial map={texture} color="#006633" />
		</mesh>
	);
}

type BilliardTableProps = {
	surfaceTextureUrl?: string;
	floorFriction?: number;
	planeColor?: string;
};

export function BilliardTable({
	surfaceTextureUrl,
	floorFriction = 0.5,
	planeColor = "#006633",
}: BilliardTableProps) {
	const cloth = useTexture(surfaceTextureUrl ?? clothTexture);
	const wood = useTexture(woodTexture);
	return (
		<>
			<Plane
				texture={cloth}
				floorFriction={floorFriction}
				planeColor={planeColor}
			/>
			{SideCushionPos.map((pos) => {
				return (
					<SideCushion
						texture={cloth}
						key={crypto.randomUUID()}
						position={pos}
					/>
				);
			})}
			{TopCushionPos.map((pos) => {
				return (
					<TopCushion
						texture={cloth}
						key={crypto.randomUUID()}
						position={pos}
					/>
				);
			})}
			{SideRailPos.map((pos) => {
				return (
					<SideRail texture={wood} key={crypto.randomUUID()} position={pos} />
				);
			})}
			{TopRailPos.map((pos) => {
				return (
					<TopRail texture={wood} key={crypto.randomUUID()} position={pos} />
				);
			})}
			{TopOuterPos.map((pos) => {
				return (
					<TopOuter texture={wood} key={crypto.randomUUID()} position={pos} />
				);
			})}
			{SideOuterPos.map((pos) => {
				return (
					<SideOuter texture={wood} key={crypto.randomUUID()} position={pos} />
				);
			})}
			{SideTableBottomPos.map((pos) => {
				return (
					<SideTableBottom
						texture={cloth}
						key={crypto.randomUUID()}
						position={pos}
					/>
				);
			})}
			{TopTableBottomPos.map((pos) => {
				return (
					<TopTableBottom
						texture={cloth}
						key={crypto.randomUUID()}
						position={pos}
					/>
				);
			})}
		</>
	);
}
