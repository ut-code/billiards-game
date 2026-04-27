import { useSphere } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { BALL_RADIUS } from "../constants/physics";
import { POCKET_Y_THRESHOLD } from "./billiardTable";

const BOMB_RADIUS = BALL_RADIUS * 1.5; // 通常ボールの1.5倍
const BOMB_TRIGGER_VELOCITY = 0.3;

type BombProps = {
	id: string;
	position: [number, number, number];
	isVisible: boolean;
	onExplode: (id: string) => void;
	onMovingChange?: (id: string, isMoving: boolean) => void;
	onPocket?: (id: string) => void;
	onPositionChange?: (id: string, position: [number, number, number]) => void;
};

export function Bomb({
	id,
	position,
	isVisible,
	onExplode,
	onMovingChange,
	onPocket,
	onPositionChange,
}: BombProps) {
	const hasExplodedRef = useRef(false);
	const hasPocketedRef = useRef(false);
	const emissiveRef = useRef<THREE.MeshStandardMaterial>(null);

	const [ref, api] = useSphere(() => ({
		mass: 1,
		position,
		args: [BOMB_RADIUS],
		type: "Dynamic",
		material: { friction: 0.1, restitution: 1 },
		linearDamping: 0.4,
		angularDamping: 0.4,
		userData: { type: "bomb" },
		onCollide: (e) => {
			if (e.body.userData.type !== "ball") return;
			if (e.contact.impactVelocity < BOMB_TRIGGER_VELOCITY) return;
			if (hasExplodedRef.current) return;
			hasExplodedRef.current = true;
			onExplode(id);
		},
	}));

	// 速度監視・停止強制・onMovingChange 通知（Ball.tsx と同じパターン）
	useEffect(() => {
		let wasMoving = false;
		const unsubscribe = api.velocity.subscribe((v) => {
			const speedSq = v[0] ** 2 + v[2] ** 2;
			const moving = speedSq > 0.001;

			if (!moving && (v[0] !== 0 || v[2] !== 0)) {
				api.velocity.set(0, 0, 0);
				api.angularVelocity.set(0, 0, 0);
			}

			if (moving !== wasMoving) {
				wasMoving = moving;
				onMovingChange?.(id, moving);
			}
		});

		return () => {
			unsubscribe();
			onMovingChange?.(id, false);
		};
	}, [api.velocity, api.angularVelocity, id, onMovingChange]);

	// ポジション変更通知・ポケット検出（Ball.tsx と同じパターン）
	useEffect(() => {
		const unsubscribe = api.position.subscribe((p) => {
			onPositionChange?.(id, [p[0], p[1], p[2]]);

			if (hasPocketedRef.current) return;
			if (p[1] <= POCKET_Y_THRESHOLD) {
				hasPocketedRef.current = true;
				requestAnimationFrame(() => {
					onPocket?.(id);
				});
			}
		});

		return () => unsubscribe();
	}, [api.position, id, onPocket, onPositionChange]);

	// 赤い発光のパルスアニメーション
	useFrame((state) => {
		if (!emissiveRef.current) return;
		const t = state.clock.getElapsedTime();
		emissiveRef.current.emissiveIntensity = 0.4 + Math.sin(t * 3) * 0.2;
	});

	return (
		<group ref={ref} visible={isVisible}>
			{/* 爆弾本体 */}
			<mesh>
				<sphereGeometry args={[BOMB_RADIUS, 32, 32]} />
				<meshStandardMaterial
					ref={emissiveRef}
					color="#111111"
					roughness={0.3}
					metalness={0.2}
					emissive="#ff2200"
					emissiveIntensity={0.6}
				/>
			</mesh>
			{/* 導火線 */}
			<mesh position={[0, BOMB_RADIUS * 1.1, 0]} rotation={[0.3, 0, 0]}>
				<cylinderGeometry args={[0.003, 0.003, BALL_RADIUS * 0.6, 8]} />
				<meshStandardMaterial color="#4a3000" />
			</mesh>
		</group>
	);
}
