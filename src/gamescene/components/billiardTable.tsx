import { useBox } from "@react-three/cannon";

// 9フィートテーブルの定数 (メートル単位)
const PLAY_WIDTH = 1.27;
const PLAY_LENGTH = 2.54;
const PLAY_HEIGHT = 0.1;

const CUSHION_WIDTH = 0.04;
const SIDE_CUSHION_LENGTH = 1.12;
const TOP_CUSHION_LENGTH = 1.11;
const CUSHION_HEIGHT = 0.115;

const RAIL_WIDTH = 0.08;
const SIDE_RALE_LENGTH = 1.16;
const TOP_RAIL_LENGTH = 1.23;
const RAIL_HEIGHT = CUSHION_HEIGHT;

const OUTER_WIDTH = 0.02;
const OUTER_HEIGHT = PLAY_HEIGHT + RAIL_HEIGHT;
const TOP_OUTER_LENGTH =
	PLAY_WIDTH + (CUSHION_WIDTH + RAIL_WIDTH + OUTER_WIDTH) * 2;
const SIDE_OUTER_LENGTH =
	PLAY_LENGTH + (CUSHION_WIDTH + RAIL_WIDTH + OUTER_WIDTH) * 2;

const SIDE_POCKET_SIZE = 0.14;

type Pos = { X: number; Y: number; Z: number };

function Plane() {
	// useBoxフックで物理演算を追加
	const [ref] = useBox(() => ({
		mass: 0, // 質量0にすることで、動かない固定された物体にする
		position: [0, 0, 0], // 初期位置
		args: [PLAY_WIDTH, PLAY_HEIGHT, PLAY_LENGTH], // 幅、高さ、長さ
	}));

	return (
		<mesh ref={ref}>
			<boxGeometry args={[PLAY_WIDTH, PLAY_HEIGHT, PLAY_LENGTH]} />
			<meshStandardMaterial color="lightblue" />
		</mesh>
	);
}

const SideCushionPos = [
	{
		X: (PLAY_WIDTH + CUSHION_WIDTH) / 2,
		Y: (PLAY_HEIGHT + CUSHION_HEIGHT) / 2,
		Z: (SIDE_POCKET_SIZE + SIDE_CUSHION_LENGTH) / 2,
	},
	{
		X: -(PLAY_WIDTH + CUSHION_WIDTH) / 2,
		Y: (PLAY_HEIGHT + CUSHION_HEIGHT) / 2,
		Z: (SIDE_POCKET_SIZE + SIDE_CUSHION_LENGTH) / 2,
	},
	{
		X: (PLAY_WIDTH + CUSHION_WIDTH) / 2,
		Y: (PLAY_HEIGHT + CUSHION_HEIGHT) / 2,
		Z: -(SIDE_POCKET_SIZE + SIDE_CUSHION_LENGTH) / 2,
	},
	{
		X: -(PLAY_WIDTH + CUSHION_WIDTH) / 2,
		Y: (PLAY_HEIGHT + CUSHION_HEIGHT) / 2,
		Z: -(SIDE_POCKET_SIZE + SIDE_CUSHION_LENGTH) / 2,
	},
];

function SideCushion({ position }: { position: Pos }) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [CUSHION_WIDTH, CUSHION_HEIGHT, SIDE_CUSHION_LENGTH],
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry
				args={[CUSHION_WIDTH, CUSHION_HEIGHT, SIDE_CUSHION_LENGTH]}
			/>
			<meshStandardMaterial color="green" />
		</mesh>
	);
}

const TopCushionPos = [
	{
		X: 0,
		Y: (PLAY_HEIGHT + CUSHION_HEIGHT) / 2,
		Z: (PLAY_LENGTH + CUSHION_WIDTH) / 2,
	},
	{
		X: 0,
		Y: (PLAY_HEIGHT + CUSHION_HEIGHT) / 2,
		Z: -(PLAY_LENGTH + CUSHION_WIDTH) / 2,
	},
];

function TopCushion({ position }: { position: Pos }) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [TOP_CUSHION_LENGTH, CUSHION_HEIGHT, CUSHION_WIDTH],
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry args={[TOP_CUSHION_LENGTH, CUSHION_HEIGHT, CUSHION_WIDTH]} />
			<meshStandardMaterial color="green" />
		</mesh>
	);
}

const SideRailPos = [
	{
		X: (PLAY_WIDTH + RAIL_WIDTH) / 2 + CUSHION_WIDTH,
		Y: (PLAY_HEIGHT + RAIL_HEIGHT) / 2,
		Z: (SIDE_POCKET_SIZE + SIDE_RALE_LENGTH) / 2,
	},
	{
		X: -((PLAY_WIDTH + RAIL_WIDTH) / 2 + CUSHION_WIDTH),
		Y: (PLAY_HEIGHT + RAIL_HEIGHT) / 2,
		Z: (SIDE_POCKET_SIZE + SIDE_RALE_LENGTH) / 2,
	},
	{
		X: (PLAY_WIDTH + RAIL_WIDTH) / 2 + CUSHION_WIDTH,
		Y: (PLAY_HEIGHT + RAIL_HEIGHT) / 2,
		Z: -(SIDE_POCKET_SIZE + SIDE_RALE_LENGTH) / 2,
	},
	{
		X: -((PLAY_WIDTH + RAIL_WIDTH) / 2 + CUSHION_WIDTH),
		Y: (PLAY_HEIGHT + RAIL_HEIGHT) / 2,
		Z: -(SIDE_POCKET_SIZE + SIDE_RALE_LENGTH) / 2,
	},
];

function SideRail({ position }: { position: Pos }) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [RAIL_WIDTH, RAIL_HEIGHT, SIDE_RALE_LENGTH],
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry args={[RAIL_WIDTH, RAIL_HEIGHT, SIDE_RALE_LENGTH]} />
			<meshStandardMaterial color="brown" />
		</mesh>
	);
}

const TopRailPos = [
	{
		X: 0,
		Y: (PLAY_HEIGHT + RAIL_HEIGHT) / 2,
		Z: (PLAY_LENGTH + RAIL_WIDTH) / 2 + CUSHION_WIDTH,
	},
	{
		X: 0,
		Y: (PLAY_HEIGHT + RAIL_HEIGHT) / 2,
		Z: -(PLAY_LENGTH + RAIL_WIDTH) / 2 - CUSHION_WIDTH,
	},
];

function TopRail({ position }: { position: Pos }) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [TOP_RAIL_LENGTH, RAIL_HEIGHT, RAIL_WIDTH],
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry args={[TOP_RAIL_LENGTH, RAIL_HEIGHT, RAIL_WIDTH]} />
			<meshStandardMaterial color="brown" />
		</mesh>
	);
}

const TopOuterPos = [
	{
		X: 0,
		Y: RAIL_HEIGHT / 2,
		Z: PLAY_LENGTH / 2 + RAIL_WIDTH + CUSHION_WIDTH + OUTER_WIDTH / 2,
	},
	{
		X: 0,
		Y: RAIL_HEIGHT / 2,
		Z: -(PLAY_LENGTH / 2 + RAIL_WIDTH + CUSHION_WIDTH + OUTER_WIDTH / 2),
	},
];

function TopOuter({ position }: { position: Pos }) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [TOP_OUTER_LENGTH, OUTER_HEIGHT, OUTER_WIDTH],
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry args={[TOP_OUTER_LENGTH, OUTER_HEIGHT, OUTER_WIDTH]} />
			<meshStandardMaterial color="black" />
		</mesh>
	);
}

const SideOuterPos = [
	{
		X: PLAY_WIDTH / 2 + RAIL_WIDTH + CUSHION_WIDTH + OUTER_WIDTH / 2,
		Y: RAIL_HEIGHT / 2,
		Z: 0,
	},
	{
		X: -(PLAY_WIDTH / 2 + RAIL_WIDTH + CUSHION_WIDTH + OUTER_WIDTH / 2),
		Y: RAIL_HEIGHT / 2,
		Z: 0,
	},
];

function SideOuter({ position }: { position: Pos }) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [OUTER_WIDTH, OUTER_HEIGHT, SIDE_OUTER_LENGTH],
	}));

	return (
		<mesh ref={ref} rotation={[0, 0, 0]}>
			<boxGeometry args={[OUTER_WIDTH, OUTER_HEIGHT, SIDE_OUTER_LENGTH]} />
			<meshStandardMaterial color="black" />
		</mesh>
	);
}

export default function BilliardTable() {
	return (
		<>
			<Plane />
			{SideCushionPos.map((pos) => {
				return <SideCushion key={crypto.randomUUID()} position={pos} />;
			})}
			{TopCushionPos.map((pos) => {
				return <TopCushion key={crypto.randomUUID()} position={pos} />;
			})}
			{SideRailPos.map((pos) => {
				return <SideRail key={crypto.randomUUID()} position={pos} />;
			})}
			{TopRailPos.map((pos) => {
				return <TopRail key={crypto.randomUUID()} position={pos} />;
			})}
			{TopOuterPos.map((pos) => {
				return <TopOuter key={crypto.randomUUID()} position={pos} />;
			})}
			{SideOuterPos.map((pos) => {
				return <SideOuter key={crypto.randomUUID()} position={pos} />;
			})}
		</>
	);
}
