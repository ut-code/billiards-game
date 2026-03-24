import { Physics } from "@react-three/cannon";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import poolballs0 from "../assets/ballTexture/poolballs0.png";
import poolballs1 from "../assets/ballTexture/poolballs1.png";
import poolballs2 from "../assets/ballTexture/poolballs2.png";
import poolballs3 from "../assets/ballTexture/poolballs3.png";
import poolballs4 from "../assets/ballTexture/poolballs4.png";
import poolballs5 from "../assets/ballTexture/poolballs5.png";
import poolballs6 from "../assets/ballTexture/poolballs6.png";
import { Ball } from "./components/Ball";
import { BilliardTable } from "./components/billiardTable";

type BallConfig = {
	id: string;
	textureUrl: string;
	position: [number, number, number];
	velocity?: [number, number, number];
};

const balls: BallConfig[] = [
	{
		id: "poolballs0",
		textureUrl: poolballs0,
		position: [-0.4, 0.2, 0.2],
		velocity: [0.6, 0, 0],
	},
	{
		id: "poolballs1",
		textureUrl: poolballs1,
		position: [-0.1, 0.2, 0.2],
	},
	{
		id: "poolballs2",
		textureUrl: poolballs2,
		position: [0.2, 0.2, 0.2],
	},
	{
		id: "poolballs3",
		textureUrl: poolballs3,
		position: [-0.25, 0.2, -0.1],
	},
	{
		id: "poolballs4",
		textureUrl: poolballs4,
		position: [0.05, 0.2, -0.1],
	},
	{
		id: "poolballs5",
		textureUrl: poolballs5,
		position: [-0.1, 0.2, -0.35],
	},
	{
		id: "poolballs6",
		textureUrl: poolballs6,
		position: [0.2, 0.2, -0.35],
	},
];

export default function GameScene() {
	return (
		<div className="relative h-screen w-screen">
			<Canvas camera={{ position: [0, 5, 5], fov: 45 }} shadows>
				<ambientLight intensity={5} />
				<pointLight position={[10, 10, 10]} />
				<Physics gravity={[0, -9.8, 0]}>
					<Suspense>
						<BilliardTable />
						{balls.map((ball) => (
							<Ball
								key={ball.id}
								id={ball.id}
								textureUrl={ball.textureUrl}
								position={ball.position}
								velocity={ball.velocity}
							/>
						))}
					</Suspense>
				</Physics>
				<OrbitControls />
			</Canvas>
		</div>
	);
}
