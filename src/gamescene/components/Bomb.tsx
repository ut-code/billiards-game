import { useSphere } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { BALL_RADIUS } from "../constants/physics";
import { POCKET_Y_THRESHOLD } from "./billiardTable";

export const BOMB_RADIUS = BALL_RADIUS * 1.5;
const BOMB_TRIGGER_VELOCITY = 0.3;
const PARTICLE_COUNT = 35;
const EXPLOSION_DURATION = 1.8; // seconds

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
	const onExplodeRef = useRef(onExplode);
	const lastPositionRef = useRef<[number, number, number]>([...position]);

	useEffect(() => {
		onExplodeRef.current = onExplode;
	}, [onExplode]);

	const [isExploding, setIsExploding] = useState(false);
	const explosionOriginRef = useRef<[number, number, number]>([...position]);
	const explosionStartRef = useRef(-1);

	// パーティクルのワールド座標・速度 (flat: x,y,z × PARTICLE_COUNT)
	const particlePositionsRef = useRef(new Float32Array(PARTICLE_COUNT * 3));
	const particleVelocitiesRef = useRef(new Float32Array(PARTICLE_COUNT * 3));
	const particleGeomRef = useRef<THREE.BufferGeometry>(null);
	const pointsRef = useRef<THREE.Points>(null);
	const smokeRef = useRef<THREE.Mesh>(null);
	const smokeMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
	const fireballRef = useRef<THREE.Mesh>(null);
	const fireballMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

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

			const origin = lastPositionRef.current;
			explosionOriginRef.current = [origin[0], origin[1], origin[2]];

			// パーティクル初期化：ランダムな半球状方向に放射
			for (let i = 0; i < PARTICLE_COUNT; i++) {
				const angle = Math.random() * Math.PI * 2;
				const upAngle = Math.random() * Math.PI * 0.6;
				const speed = 0.8 + Math.random() * 1.8;
				particlePositionsRef.current[i * 3] = origin[0];
				particlePositionsRef.current[i * 3 + 1] = origin[1];
				particlePositionsRef.current[i * 3 + 2] = origin[2];
				particleVelocitiesRef.current[i * 3] =
					Math.cos(angle) * Math.cos(upAngle) * speed;
				particleVelocitiesRef.current[i * 3 + 1] =
					Math.sin(upAngle) * speed + 0.3;
				particleVelocitiesRef.current[i * 3 + 2] =
					Math.sin(angle) * Math.cos(upAngle) * speed;
			}

			explosionStartRef.current = -1;
			setIsExploding(true);
			onExplodeRef.current(id);
		},
	}));

	// 爆発開始後、パーティクル geometry に position バッファを設定
	useEffect(() => {
		if (!isExploding || !particleGeomRef.current) return;
		const posAttr = new THREE.BufferAttribute(particlePositionsRef.current, 3);
		posAttr.usage = THREE.DynamicDrawUsage;
		particleGeomRef.current.setAttribute("position", posAttr);
		particleGeomRef.current.setDrawRange(0, PARTICLE_COUNT);
	}, [isExploding]);

	// 速度監視・停止強制・onMovingChange 通知 (Ball.tsx と同じパターン)
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

	// ポジション変更通知・ポケット検出 (Ball.tsx と同じパターン)
	useEffect(() => {
		const unsubscribe = api.position.subscribe((p) => {
			lastPositionRef.current = [p[0], p[1], p[2]];
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

	useFrame((state, delta) => {
		// 爆発前：赤い発光パルス
		if (!isExploding && emissiveRef.current) {
			const t = state.clock.getElapsedTime();
			emissiveRef.current.emissiveIntensity = 0.4 + Math.sin(t * 3) * 0.2;
		}

		if (!isExploding) return;

		// 最初のフレームで開始時刻を記録
		if (explosionStartRef.current < 0) {
			explosionStartRef.current = state.clock.getElapsedTime();
		}

		const elapsed = state.clock.getElapsedTime() - explosionStartRef.current;
		const progress = Math.min(elapsed / EXPLOSION_DURATION, 1);

		if (progress >= 1) {
			explosionStartRef.current = -1;
			setIsExploding(false);
			return;
		}

		// パーティクル位置更新（重力あり）
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			particleVelocitiesRef.current[i * 3 + 1] -= 5.0 * delta;
			particlePositionsRef.current[i * 3] +=
				particleVelocitiesRef.current[i * 3] * delta;
			particlePositionsRef.current[i * 3 + 1] +=
				particleVelocitiesRef.current[i * 3 + 1] * delta;
			particlePositionsRef.current[i * 3 + 2] +=
				particleVelocitiesRef.current[i * 3 + 2] * delta;
			// 空気抵抗（水平方向のみ）
			particleVelocitiesRef.current[i * 3] *= 0.98;
			particleVelocitiesRef.current[i * 3 + 2] *= 0.98;
		}
		if (particleGeomRef.current) {
			const attr = particleGeomRef.current.getAttribute(
				"position",
			) as THREE.BufferAttribute;
			if (attr) attr.needsUpdate = true;
		}

		// パーティクル透明度
		if (pointsRef.current) {
			const mat = pointsRef.current.material as THREE.PointsMaterial;
			mat.opacity = Math.max(0, 1 - progress * 1.2);
		}

		// 火球：素早く拡大してフェードアウト
		if (fireballRef.current && fireballMaterialRef.current) {
			const fireProgress = Math.min(elapsed / 0.35, 1);
			fireballRef.current.scale.setScalar(1 + fireProgress * 6);
			fireballMaterialRef.current.opacity = Math.max(
				0,
				0.85 * (1 - fireProgress),
			);
		}

		// 煙球：ゆっくり拡大してフェードアウト
		if (smokeRef.current && smokeMaterialRef.current) {
			smokeRef.current.scale.setScalar(1 + progress * 5);
			smokeMaterialRef.current.opacity = Math.max(0, 0.5 * (1 - progress));
		}
	});

	return (
		<>
			{/* 物理ボディに追従する爆弾メッシュ */}
			<group ref={ref} visible={isVisible && !isExploding}>
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
					<cylinderGeometry args={[0.003, 0.003, BOMB_RADIUS * 0.6, 8]} />
					<meshStandardMaterial color="#4a3000" />
				</mesh>
			</group>

			{/* 爆発エフェクト（物理なし・純粋なビジュアル） */}
			{isExploding && (
				<>
					{/* パーティクル（ワールド座標で動く） */}
					<points ref={pointsRef} raycast={() => {}}>
						<bufferGeometry ref={particleGeomRef} />
						<pointsMaterial
							color="#ff8800"
							size={BOMB_RADIUS * 0.35}
							sizeAttenuation
							transparent
							opacity={1}
							depthWrite={false}
						/>
					</points>

					{/* 火球：素早くフラッシュ */}
					<mesh ref={fireballRef} position={explosionOriginRef.current}>
						<sphereGeometry args={[BOMB_RADIUS, 16, 16]} />
						<meshStandardMaterial
							ref={fireballMaterialRef}
							color="#ff6600"
							emissive="#ff4400"
							emissiveIntensity={2}
							transparent
							opacity={0.85}
							depthWrite={false}
						/>
					</mesh>

					{/* 煙球：ゆっくり膨張 */}
					<mesh ref={smokeRef} position={explosionOriginRef.current}>
						<sphereGeometry args={[BOMB_RADIUS * 0.8, 16, 16]} />
						<meshStandardMaterial
							ref={smokeMaterialRef}
							color="#444444"
							transparent
							opacity={0.5}
							depthWrite={false}
						/>
					</mesh>
				</>
			)}
		</>
	);
}
