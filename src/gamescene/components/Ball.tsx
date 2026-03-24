import { useSphere } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";

type BallProps = {
	id: string;
	textureUrl: string;
	position: [number, number, number];
	velocity?: [number, number, number];
};

export function Ball({ id, textureUrl, position, velocity }: BallProps) {
	const texture = useTexture(textureUrl);

	const [ref] = useSphere(() => ({
		mass: 1, // ボールに質量を設定
		position, // 初期位置を設定 (プレイエリアの上)
		velocity: velocity ?? [0, 0, 0],
		args: [0.04], // ボールの半径
		type: "Dynamic",
		material: { friction: 0.1, restitution: 0.9 }, // ボールの反発
	}));

	return (
		<mesh ref={ref} name={id}>
			<sphereGeometry args={[0.04, 32, 32]} />
			<meshStandardMaterial map={texture} roughness={0.1} metalness={0.5} />
		</mesh>
	);
}
