import { Physics } from "@react-three/cannon";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Ball, BilliardTable } from "./components/billiardTable";

export default function GameScene() {
	return (
		<div className="relative h-screen w-screen">
			<Canvas camera={{ position: [0, 5, 5], fov: 45 }} shadows>
				<ambientLight intensity={5} />
				<pointLight position={[10, 10, 10]} />
				<Physics gravity={[0, -9.8, 0]}>
					<BilliardTable />
					<Ball />
				</Physics>
				<OrbitControls />
			</Canvas>
		</div>
	);
}
