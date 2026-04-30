import { useSphere } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import type {
	AccelerationFloorConfig,
	PortalConfig,
} from "../constants/levels";
import { BALL_RADIUS } from "../constants/physics";
import { POCKET_Y_THRESHOLD } from "./billiardTable";
export type ShootFn = (power: number) => boolean;

const PORTAL_TELEPORT_COOLDOWN_MS = 350;
const PORTAL_WARP_SOUND_URL = "/portal_se.mp3";

type BallProps = {
	id: string;
	textureUrl: string;
	position: [number, number, number];
	velocity?: [number, number, number];
	respawnPosition?: [number, number, number];
	isVisible: boolean;
	onSelect?: (shoot: ShootFn) => void;
	onMovingChange?: (id: string, isMoving: boolean) => void;
	onPocket?: (id: string) => void;
	onPositionChange?: (id: string, position: [number, number, number]) => void;
	portal?: PortalConfig;
	accelerationFloors?: AccelerationFloorConfig[];
};

function isInsidePortal(
	position: [number, number, number],
	portalCenter: [number, number, number],
	radius: number,
) {
	const dx = position[0] - portalCenter[0];
	const dz = position[2] - portalCenter[2];
	return dx * dx + dz * dz <= radius * radius;
}

export function Ball({
	id,
	textureUrl,
	position,
	velocity,
	respawnPosition,
	isVisible,
	onSelect,
	onMovingChange,
	onPocket,
	onPositionChange,
	portal,
	accelerationFloors,
}: BallProps) {
	const texture = useTexture(textureUrl);

	const [ref, api] = useSphere(() => ({
		mass: 1, // ボールに質量を設定
		position, // 初期位置を設定 (プレイエリアの上)
		velocity: velocity ?? [0, 0, 0],
		args: [BALL_RADIUS], // ボールの半径
		type: "Dynamic",
		material: { friction: 0.1, restitution: 1 }, // 摩擦を0.1から0.5に増加
		linearDamping: 0.4, // 移動の減衰を追加
		angularDamping: 0.4, // 回転の減衰を追加
		userData: { type: "ball" },
		onCollide: (e) => {
			console.log(e);
			const audio1 = new Audio("/maou_se_sound_footstep02.mp3");
			const audio2 = new Audio("/collision_with_balls.mp3");
			audio1.volume = 1;
			audio2.volume = 0.2;
			if (e.body.userData.type === "cushion") audio1.play();
			if (e.body.userData.type === "ball") audio2.play();
		},
	}));

	const isMoving = useRef(false);
	const hasPocketed = useRef(false);
	const lastVelocityRef = useRef<[number, number, number]>([0, 0, 0]);
	const lastTeleportAtRef = useRef(0);
	const floorsOnRef = useRef<Set<number>>(new Set());
	const portalWarpAudioRef = useRef<HTMLAudioElement | null>(null);
	const dashAudioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		portalWarpAudioRef.current = new Audio(PORTAL_WARP_SOUND_URL);
		portalWarpAudioRef.current.volume = 0.35;

		// ダッシュ時の効果音として既存の衝突音などを流用するか、専用の音声をロードする
		dashAudioRef.current = new Audio("/collision_with_balls.mp3");
		dashAudioRef.current.volume = 0.5;

		return () => {
			portalWarpAudioRef.current = null;
			dashAudioRef.current = null;
		};
	}, []);

	// 物理エンジンの速度を監視して、移動中かどうかを判定し、低速時に強制停止させる
	useEffect(() => {
		let wasMoving = false;
		const unsubscribe = api.velocity.subscribe((v) => {
			lastVelocityRef.current = [v[0], v[1], v[2]];

			// 速度の2乗和で判定（計算負荷軽減のため。0.001は微小な振動を無視するための閾値）
			const speedSq = v[0] ** 2 + v[2] ** 2; //　y軸方向の速度を無視
			const moving = speedSq > 0.001;

			// 閾値を下回ったが、完全なゼロではない場合に強制的に停止させる
			if (!moving && (v[0] !== 0 || v[2] !== 0)) {
				api.velocity.set(0, 0, 0);
				api.angularVelocity.set(0, 0, 0);
			}

			isMoving.current = moving;

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

	useEffect(() => {
		const unsubscribe = api.position.subscribe((p) => {
			onPositionChange?.(id, [p[0], p[1], p[2]]);

			if (portal) {
				const now = Date.now();
				const radius = portal.radius ?? 0.12;
				const position: [number, number, number] = [p[0], p[1], p[2]];

				if (
					now - lastTeleportAtRef.current > PORTAL_TELEPORT_COOLDOWN_MS &&
					isInsidePortal(position, portal.entry, radius)
				) {
					lastTeleportAtRef.current = now;
					const velocity = lastVelocityRef.current;
					api.position.set(portal.exit[0], p[1], portal.exit[2]);
					api.velocity.set(velocity[0], velocity[1], velocity[2]);

					const portalWarpAudio = portalWarpAudioRef.current;
					if (portalWarpAudio) {
						portalWarpAudio.currentTime = 0;
						void portalWarpAudio.play();
					}
				}
			}

			if (accelerationFloors) {
				accelerationFloors.forEach((floor, idx) => {
					const dx = p[0] - floor.position[0];
					const dz = p[2] - floor.position[2];

					// directionベクトルの角度を計算
					const angle = Math.atan2(floor.direction[0], floor.direction[2]);

					// 逆回転させてローカル座標に変換
					const localX = dx * Math.cos(-angle) - dz * Math.sin(-angle);
					const localZ = dx * Math.sin(-angle) + dz * Math.cos(-angle);

					const halfWidth = floor.size[0] / 2;
					const halfLength = floor.size[1] / 2;

					const isInside =
						Math.abs(localX) <= halfWidth && Math.abs(localZ) <= halfLength;
					const wasInside = floorsOnRef.current.has(idx);

					if (isInside && !wasInside) {
						// 床に入った瞬間、速度とスピンを完全に上書きする
						// directionは正規化されている前提
						const dir = new THREE.Vector3(
							floor.direction[0],
							floor.direction[1],
							floor.direction[2],
						).normalize();

						// 速度（velocity）を強制上書き。strength を直接のスピードとして扱う
						api.velocity.set(dir.x * floor.strength, 0, dir.z * floor.strength);

						// 直進後に変なカーブを描かないように、ボールの回転（スピン）をリセット
						api.angularVelocity.set(0, 0, 0);
						floorsOnRef.current.add(idx);

						if (dashAudioRef.current) {
							dashAudioRef.current.currentTime = 0;
							void dashAudioRef.current.play();
						}
					} else if (!isInside && wasInside) {
						// 床から出た
						floorsOnRef.current.delete(idx);
					}
				});
			}

			if (hasPocketed.current) return;

			if (p[1] <= POCKET_Y_THRESHOLD) {
				hasPocketed.current = true;
				requestAnimationFrame(() => {
					onPocket?.(id);
				});
			}
		});

		return () => unsubscribe();
	}, [
		api.position,
		api.velocity,
		id,
		onPocket,
		onPositionChange,
		portal,
		accelerationFloors,
		api.angularVelocity,
	]);

	useEffect(() => {
		if (!respawnPosition) return;

		hasPocketed.current = false;
		api.position.set(...respawnPosition);
		api.velocity.set(0, 0, 0);
		api.angularVelocity.set(0, 0, 0);
	}, [
		respawnPosition,
		api.position.set,
		api.velocity.set,
		api.angularVelocity.set,
	]);

	const { camera } = useThree();

	const handleClick = useCallback(() => {
		if (!onSelect || isMoving.current) return;

		onSelect((power: number) => {
			if (!ref.current) return false;

			const ballPosition = new THREE.Vector3();
			ref.current.getWorldPosition(ballPosition);

			const direction = new THREE.Vector3().subVectors(
				ballPosition,
				camera.position,
			);
			direction.y = 0; // 水平方向のみにする

			// カメラが真上の場合など、XZ成分が0に近い場合はショットしない
			if (direction.lengthSq() < 1e-6) return false;

			direction.normalize();

			api.applyImpulse(
				[direction.x * power, 0.0, direction.z * power],
				[0, 0, 0], // ボール中心（相対座標）に力を加える
			);

			return true;
		});
	}, [onSelect, ref, camera, api]);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: mesh is a React Three Fiber 3D element, not an HTML element
		<mesh ref={ref} name={id} onClick={handleClick} visible={isVisible}>
			<sphereGeometry args={[BALL_RADIUS, 32, 32]} />
			<meshStandardMaterial map={texture} roughness={0.1} metalness={0.5} />
		</mesh>
	);
}
