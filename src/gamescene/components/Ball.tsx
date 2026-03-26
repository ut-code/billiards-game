import { useSphere } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

type BallProps = {
	id: string;
	textureUrl: string;
	position: [number, number, number];
	velocity?: [number, number, number];
	onSelect?: () => void;
	shotPower?: number | null;
	onShotApplied?: () => void;
};

export function Ball({
	id,
	textureUrl,
	position,
	velocity,
	onSelect,
	shotPower,
	onShotApplied,
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

	useEffect(() => {
		if (shotPower == null || shotPower <= 0) return;
		if (!ref.current) return;

		const ballPosition = new THREE.Vector3();
		ref.current.getWorldPosition(ballPosition);

		const direction = ballPosition.sub(camera.position);
		direction.y = 0; // 水平方向のみにする
		direction.normalize();

		api.applyImpulse(
			[direction.x * shotPower, 0.0, direction.z * shotPower],
			[0, 0, 0], // 力を加える位置（ボールの中心）
		);
		onShotApplied?.();
	}, [shotPower, api, camera, ref, onShotApplied]);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: mesh is a React Three Fiber 3D element, not an HTML element
		<mesh ref={ref} name={id} onClick={onSelect}>
			<sphereGeometry args={[0.04, 32, 32]} />
			<meshStandardMaterial map={texture} roughness={0.1} metalness={0.5} />
		</mesh>
	);
}
