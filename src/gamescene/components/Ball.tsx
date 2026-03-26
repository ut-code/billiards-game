import { useSphere } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

type BallProps = {
	id: string;
	textureUrl: string;
	position: [number, number, number];
	velocity?: [number, number, number];
	enableClick?: boolean;
};

export function Ball({
	id,
	textureUrl,
	position,
	velocity,
	enableClick,
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

	const handleClick = () => {
		const ballPosition = new THREE.Vector3();
		if (!ref.current) {
			return;
		}
		ref.current.getWorldPosition(ballPosition);

		const direction = ballPosition.clone().sub(camera.position);

		direction.y = 0; // 水平方向のみにする
		direction.normalize();

		const force = 0.5;
		api.applyImpulse(
			[direction.x * force, 0.0, direction.z * force],
			[0, 0, 0], // 力を加える位置（ボールの中心）
		);
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: mesh is a React Three Fiber 3D element, not an HTML element
		<mesh ref={ref} name={id} onClick={enableClick ? handleClick : undefined}>
			<sphereGeometry args={[0.04, 32, 32]} />
			<meshStandardMaterial map={texture} roughness={0.1} metalness={0.5} />
		</mesh>
	);
}
