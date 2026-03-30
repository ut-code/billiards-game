import { useSphere } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";

export type ShootFn = (power: number) => void;

type BallProps = {
	id: string;
	textureUrl: string;
	position: [number, number, number];
	velocity?: [number, number, number];
	onSelect?: (shoot: ShootFn) => void;
	onMovingChange?: (id: string, isMoving: boolean) => void;
};

export function Ball({
	id,
	textureUrl,
	position,
	velocity,
	onSelect,
	onMovingChange,
}: BallProps) {
	const texture = useTexture(textureUrl);

	const [ref, api] = useSphere(() => ({
		mass: 1, // ボールに質量を設定
		position, // 初期位置を設定 (プレイエリアの上)
		velocity: velocity ?? [0, 0, 0],
		args: [0.04], // ボールの半径
		type: "Dynamic",
		material: { friction: 0.5, restitution: 0.9 }, // 摩擦を0.1から0.5に増加
		linearDamping: 0.4, // 移動の減衰を追加
		angularDamping: 0.4, // 回転の減衰を追加
	}));

	const isMoving = useRef(false);

	// 物理エンジンの速度を監視して、移動中かどうかを判定し、低速時に強制停止させる
	useEffect(() => {
		let wasMoving = false;
		const unsubscribe = api.velocity.subscribe((v) => {
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

		return () => unsubscribe();
	}, [api.velocity, api.angularVelocity, id, onMovingChange]);

	const { camera } = useThree();

	const handleClick = useCallback(() => {
		if (!onSelect || isMoving.current) return;

		onSelect((power: number) => {
			if (!ref.current) return;

			const ballPosition = new THREE.Vector3();
			ref.current.getWorldPosition(ballPosition);

			const direction = new THREE.Vector3().subVectors(
				ballPosition,
				camera.position,
			);
			direction.y = 0; // 水平方向のみにする

			// カメラが真上の場合など、XZ成分が0に近い場合はショットしない
			if (direction.lengthSq() < 1e-6) return;

			direction.normalize();

			api.applyImpulse(
				[direction.x * power, 0.0, direction.z * power],
				[ballPosition.x, ballPosition.y, ballPosition.z], // 力を加える位置（ボールの中心）
			);
		});
	}, [onSelect, ref, camera, api]);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: mesh is a React Three Fiber 3D element, not an HTML element
		<mesh ref={ref} name={id} onClick={handleClick}>
			<sphereGeometry args={[0.04, 32, 32]} />
			<meshStandardMaterial map={texture} roughness={0.1} metalness={0.5} />
		</mesh>
	);
}
