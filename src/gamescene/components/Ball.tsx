import { useSphere } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
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
const CUSHION_COLLISION_SOUND_URL = "/maou_se_sound_footstep02.mp3";
const BALL_COLLISION_SOUND_URL = "/collision_with_balls.mp3";
const CUSHION_COLLISION_VOLUME = 1;
const BALL_COLLISION_VOLUME = 0.2;
const COLLISION_AUDIO_POOL_SIZE = 6;

let collisionPoolsInitialized = false;
let cushionCollisionPool: HTMLAudioElement[] = [];
let ballCollisionPool: HTMLAudioElement[] = [];
let cushionCollisionCursor = 0;
let ballCollisionCursor = 0;
let collisionPrimed = false;
let collisionGestureListenerAttached = false;

function initCollisionAudioPools() {
	if (collisionPoolsInitialized) return;
	const createAudioPool = (url: string, volume: number, size: number) => {
		const pool: HTMLAudioElement[] = [];
		for (let i = 0; i < size; i += 1) {
			const audio = new Audio(url);
			audio.preload = "auto";
			audio.volume = volume;
			audio.load();
			pool.push(audio);
		}
		return pool;
	};

	cushionCollisionPool = createAudioPool(
		CUSHION_COLLISION_SOUND_URL,
		CUSHION_COLLISION_VOLUME,
		COLLISION_AUDIO_POOL_SIZE,
	);
	ballCollisionPool = createAudioPool(
		BALL_COLLISION_SOUND_URL,
		BALL_COLLISION_VOLUME,
		COLLISION_AUDIO_POOL_SIZE,
	);
	collisionPoolsInitialized = true;
}

function primeCollisionAudioPools() {
	if (collisionPrimed) return;
	if (cushionCollisionPool.length === 0 || ballCollisionPool.length === 0)
		return;
	collisionPrimed = true;

	const primeAudio = (audio: HTMLAudioElement | undefined, volume: number) => {
		if (!audio) return;
		const desiredVolume = volume;
		audio.volume = 0;
		const playPromise = audio.play();
		if (playPromise) {
			playPromise
				.then(() => {
					audio.pause();
					audio.currentTime = 0;
					audio.volume = desiredVolume;
				})
				.catch(() => {
					audio.volume = desiredVolume;
				});
		} else {
			audio.volume = desiredVolume;
		}
	};

	primeAudio(cushionCollisionPool[0], CUSHION_COLLISION_VOLUME);
	primeAudio(ballCollisionPool[0], BALL_COLLISION_VOLUME);
}

function attachCollisionPrimeOnFirstGesture() {
	if (collisionGestureListenerAttached) return;
	collisionGestureListenerAttached = true;
	window.addEventListener(
		"pointerdown",
		() => {
			primeCollisionAudioPools();
		},
		{ once: true },
	);
}

function playCollisionFromPool(pool: HTMLAudioElement[], cursor: number) {
	if (pool.length === 0) return cursor;
	const index = cursor % pool.length;
	const audio = pool[index];
	audio.currentTime = 0;
	const playPromise = audio.play();
	if (playPromise) {
		playPromise.catch(() => {});
	}
	return index + 1;
}

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
	portals?: PortalConfig[];
	allowMagnet?: boolean;
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
	portals,
	allowMagnet,
	accelerationFloors,
}: BallProps) {
	const texture = useTexture(textureUrl);

	const playCushionCollision = useCallback(() => {
		cushionCollisionCursor = playCollisionFromPool(
			cushionCollisionPool,
			cushionCollisionCursor,
		);
	}, []);

	const playBallCollision = useCallback(() => {
		ballCollisionCursor = playCollisionFromPool(
			ballCollisionPool,
			ballCollisionCursor,
		);
	}, []);

	const [ref, api] = useSphere(() => ({
		mass: 1, // ボールに質量を設定
		position, // 初期位置を設定 (プレイエリアの上)
		velocity: velocity ?? [0, 0, 0],
		args: [BALL_RADIUS], // ボールの半径
		type: "Dynamic",
		material: { friction: 0.1, restitution: 1 }, // 摩擦を0.1から0.5に増加
		linearDamping: 0.4, // 移動の減衰を追加
		angularDamping: 0.4, // 回転の減衰を追加
		userData: { type: "ball", id },
		onCollide: (e) => {
			console.log(e);
			const type = e.body?.userData?.type;
			if (type === "cushion") {
				playCushionCollision();
			}
			if (type === "ball") {
				const otherId = e.body?.userData?.id;
				if (typeof otherId === "string" && id < otherId) {
					playBallCollision();
				}
			}
		},
	}));

	const isMoving = useRef(false);
	const hasPocketed = useRef(false);
	const lastVelocityRef = useRef<[number, number, number]>([0, 0, 0]);
	const lastTeleportAtRef = useRef(0);
	const floorsOnRef = useRef<Set<string>>(new Set());
	const portalWarpAudioRef = useRef<HTMLAudioElement | null>(null);
	const keys = useRef<Record<string, boolean>>({});

	// マグネットコントロール用のキー入力監視
	useEffect(() => {
		if (!allowMagnet) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			keys.current[e.key.toLowerCase()] = true;
		};
		const handleKeyUp = (e: KeyboardEvent) => {
			keys.current[e.key.toLowerCase()] = false;
		};
		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [allowMagnet]);

	useFrame(() => {
		if (!allowMagnet || !isMoving.current || hasPocketed.current) return;

		const [vx, vy, vz] = lastVelocityRef.current;
		const speedSq = vx * vx + vz * vz;
		if (speedSq < 0.05) return; // ある程度の速度がある時のみ操作可能にする (0.05は調整可能)

		const left = keys.current.a || keys.current.arrowleft;
		const right = keys.current.d || keys.current.arrowright;

		if (left || right) {
			const speed = Math.sqrt(speedSq);
			const direction = new THREE.Vector3(vx, 0, vz).normalize();

			// 1. 速度依存の回転角 (速度が速いほど曲がりにくくする)
			// ベースの値を 0.015 に下げて効きを弱くし、さらに速度が速いほど角度を小さくします。
			const baseRotation = 0.03;
			const rotationAngle =
				(baseRotation / (1 + speed * 0.2)) * (left ? 1 : -1);

			// 2. 速度ベクトルの回転
			// Y軸を中心に回転させることで、水平方向の軌道を曲げます。
			direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationAngle);

			// 4. 物理エンジンへの反映 (Velocityを直接上書き)
			// applyForceではなく、直接速度を設定することで、より直接的な制御になります。
			api.velocity.set(
				direction.x * speed,
				vy, // Y軸方向の速度は維持
				direction.z * speed,
			);
		}
	});
	const dashAudioRef = useRef<HTMLAudioElement | null>(null);

	// 加速床の判定に必要な計算（角度、三角関数、半サイズ、正規化ベクトル）を事前計算
	const processedFloors = useMemo(() => {
		if (!accelerationFloors) return null;
		return accelerationFloors.map((floor) => {
			const angle = Math.atan2(floor.direction[0], floor.direction[2]);
			return {
				...floor,
				sinAngle: Math.sin(-angle),
				cosAngle: Math.cos(-angle),
				halfWidth: floor.size[0] / 2,
				halfLength: floor.size[1] / 2,
				normalizedDir: new THREE.Vector3(
					floor.direction[0],
					floor.direction[1],
					floor.direction[2],
				).normalize(),
			};
		});
	}, [accelerationFloors]);

	useEffect(() => {
		initCollisionAudioPools();
		attachCollisionPrimeOnFirstGesture();
	}, []);

	useEffect(() => {
		portalWarpAudioRef.current = new Audio(PORTAL_WARP_SOUND_URL);
		portalWarpAudioRef.current.volume = 0.35;
		portalWarpAudioRef.current.preload = "auto";
		portalWarpAudioRef.current.load();

		dashAudioRef.current = new Audio("/acceleration_floor_se.mp3");
		dashAudioRef.current.volume = 0.5;
		dashAudioRef.current.preload = "auto";
		dashAudioRef.current.load();

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
		// 物理サブスクリプションが再生成される（床などの環境が更新された）タイミングで
		// 過去に乗っていた床の履歴をクリアする
		floorsOnRef.current.clear();

		const unsubscribe = api.position.subscribe((p) => {
			onPositionChange?.(id, [p[0], p[1], p[2]]);

			const activePortals = portals ?? (portal ? [portal] : []);
			if (activePortals.length > 0) {
				const now = Date.now();
				const position: [number, number, number] = [p[0], p[1], p[2]];
				for (const portalConfig of activePortals) {
					const radius = portalConfig.radius ?? 0.12;
					if (
						now - lastTeleportAtRef.current > PORTAL_TELEPORT_COOLDOWN_MS &&
						isInsidePortal(position, portalConfig.entry, radius)
					) {
						lastTeleportAtRef.current = now;
						const velocity = lastVelocityRef.current;
						api.position.set(portalConfig.exit[0], p[1], portalConfig.exit[2]);
						api.velocity.set(velocity[0], velocity[1], velocity[2]);

						const portalWarpAudio = portalWarpAudioRef.current;
						if (portalWarpAudio) {
							portalWarpAudio.currentTime = 0;
							void portalWarpAudio.play();
						}
						break;
					}
				}
			}

			if (processedFloors) {
				processedFloors.forEach((floor) => {
					const dx = p[0] - floor.position[0];
					const dz = p[2] - floor.position[2];

					// 事前計算済みの値を使ってローカル座標に変換
					const localX = dx * floor.cosAngle - dz * floor.sinAngle;
					const localZ = dx * floor.sinAngle + dz * floor.cosAngle;

					const isInside =
						Math.abs(localX) <= floor.halfWidth &&
						Math.abs(localZ) <= floor.halfLength;
					const wasInside = floorsOnRef.current.has(floor.id);

					if (isInside && !wasInside) {
						// 床に入った瞬間、速度とスピンを完全に上書きする
						const dir = floor.normalizedDir;

						// 速度（velocity）を強制上書き。strength を直接のスピードとして扱う
						api.velocity.set(dir.x * floor.strength, 0, dir.z * floor.strength);

						// 直進後に変なカーブを描かないように、ボールの回転（スピン）をリセット
						api.angularVelocity.set(0, 0, 0);
						floorsOnRef.current.add(floor.id);

						if (dashAudioRef.current) {
							dashAudioRef.current.currentTime = 0;
							void dashAudioRef.current.play();
						}
					} else if (!isInside && wasInside) {
						// 床から出た
						floorsOnRef.current.delete(floor.id);
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
		portals,
		processedFloors,
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
