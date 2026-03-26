import { useSphere } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useCallback } from "react";
import * as THREE from "three";

export type ShootFn = (power: number) => void;

type BallProps = {
	id: string;
	textureUrl: string;
	position: [number, number, number];
	velocity?: [number, number, number];
	onSelect?: (shoot: ShootFn) => void;
};

export function Ball({
	id,
	textureUrl,
	position,
	velocity,
	onSelect,
}: BallProps) {
	const texture = useTexture(textureUrl);

	const [ref, api] = useSphere(() => ({
		mass: 1, // ボールに質量を設定
		position, // 初期位置を設定 (プレイエリアの上)
		velocity: velocity ?? [0, 0, 0],
		args: [0.04], // ボールの半径
		type: "Dynamic",
		material: { friction: 0.1, restitution: 0.9 }, // ボールの反発
	}));

	const { camera } = useThree();

	const handleClick = useCallback(() => {
		if (!onSelect) return;

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
