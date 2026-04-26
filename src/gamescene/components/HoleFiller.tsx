import { useBox } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import { useEffect } from "react";
import type * as THREE from "three";
import clothTexture from "@/assets/tableTexture/tableCloth.jpg";
import {
	OFFSET_Y,
	PLAY_LENGTH,
	PLAY_WIDTH,
	SIDE_POCKET_SIZE,
	TABLE_BOTTOM_HEIGHT,
	TABLE_BOTTOM_WIDTH,
} from "./billiardTable";
import { useBlock } from "./FillerContextProvider";

type Pos = { X: number; Y: number; Z: number };
type TableMaterialProps = { position: Pos; texture: THREE.Texture };

const SideHoleFillerPos = [
	{
		X: (PLAY_WIDTH + TABLE_BOTTOM_WIDTH) / 2,
		Y: -OFFSET_Y,
		Z: 0,
	},
	{
		X: -(PLAY_WIDTH + TABLE_BOTTOM_WIDTH) / 2,
		Y: -OFFSET_Y,
		Z: 0,
	},
];

function SideHoleFiller({ position, texture }: TableMaterialProps) {
	const { isAllHidden } = useBlock();
	const [ref, api] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [TABLE_BOTTOM_WIDTH, TABLE_BOTTOM_HEIGHT, SIDE_POCKET_SIZE],
		type: "Static",
		material: { friction: 0.5, restitution: 0 },
	}));

	useEffect(() => {
		api.collisionFilterMask.set(isAllHidden ? 0 : 1);
	}, [isAllHidden, api.collisionFilterMask.set]);

	return (
		<mesh ref={ref} rotation={[0, 0, 0]} visible={!isAllHidden}>
			<boxGeometry
				args={[TABLE_BOTTOM_WIDTH, TABLE_BOTTOM_HEIGHT, SIDE_POCKET_SIZE]}
			/>
			<meshStandardMaterial map={texture} color="#505a55" />
		</mesh>
	);
}

const CornerHoleFillerPos = [
	{
		X: (PLAY_WIDTH + TABLE_BOTTOM_WIDTH) / 2,
		Y: -OFFSET_Y,
		Z: (PLAY_LENGTH + TABLE_BOTTOM_WIDTH) / 2,
	},
	{
		X: (PLAY_WIDTH + TABLE_BOTTOM_WIDTH) / 2,
		Y: -OFFSET_Y,
		Z: -(PLAY_LENGTH + TABLE_BOTTOM_WIDTH) / 2,
	},
	{
		X: -(PLAY_WIDTH + TABLE_BOTTOM_WIDTH) / 2,
		Y: -OFFSET_Y,
		Z: (PLAY_LENGTH + TABLE_BOTTOM_WIDTH) / 2,
	},
	{
		X: -(PLAY_WIDTH + TABLE_BOTTOM_WIDTH) / 2,
		Y: -OFFSET_Y,
		Z: -(PLAY_LENGTH + TABLE_BOTTOM_WIDTH) / 2,
	},
];

function CornerHoleFiller({ position, texture }: TableMaterialProps) {
	const { isAllHidden } = useBlock();
	const [ref, api] = useBox(() => ({
		mass: 0,
		position: [position.X, position.Y, position.Z],
		args: [TABLE_BOTTOM_WIDTH, TABLE_BOTTOM_HEIGHT, TABLE_BOTTOM_WIDTH],
		type: "Static",
		material: { friction: 0.5, restitution: 0 },
	}));

	useEffect(() => {
		api.collisionFilterMask.set(isAllHidden ? 0 : 1);
	}, [isAllHidden, api.collisionFilterMask.set]);

	return (
		<mesh ref={ref} rotation={[0, 0, 0]} visible={!isAllHidden}>
			<boxGeometry
				args={[TABLE_BOTTOM_WIDTH, TABLE_BOTTOM_HEIGHT, TABLE_BOTTOM_WIDTH]}
			/>
			<meshStandardMaterial map={texture} color="#505a55" />
		</mesh>
	);
}

export function HoleFiller() {
	const cloth = useTexture(clothTexture);
	return (
		<>
			{SideHoleFillerPos.map((pos) => {
				return (
					<SideHoleFiller
						position={pos}
						texture={cloth}
						key={`${pos.X}-${pos.Y}-${pos.Z}`}
					/>
				);
			})}
			{CornerHoleFillerPos.map((pos) => {
				return (
					<CornerHoleFiller
						position={pos}
						texture={cloth}
						key={`${pos.X}-${pos.Y}-${pos.Z}`}
					/>
				);
			})}
		</>
	);
}
