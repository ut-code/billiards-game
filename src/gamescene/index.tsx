import { Physics } from "@react-three/cannon";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import poolballs0 from "../assets/ballTexture/poolballs0.png";
import poolballs1 from "../assets/ballTexture/poolballs1.png";
import poolballs2 from "../assets/ballTexture/poolballs2.png";
import poolballs3 from "../assets/ballTexture/poolballs3.png";
import poolballs4 from "../assets/ballTexture/poolballs4.png";
import poolballs5 from "../assets/ballTexture/poolballs5.png";
import poolballs6 from "../assets/ballTexture/poolballs6.png";
import { Ball, type ShootFn } from "./components/Ball";
import { BilliardTable } from "./components/billiardTable";
import { PowerGauge } from "./components/PowerGauge";

type BallConfig = {
	id: string;
	textureUrl: string;
	position: [number, number, number];
	velocity?: [number, number, number];
	shootable?: boolean;
};

const balls: BallConfig[] = [
	{
		id: "poolballs0",
		textureUrl: poolballs0,
		position: [-0.4, 0.2, 0.2],
		velocity: [0.6, 0, 0],
		shootable: true,
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
	const [isCharging, setIsCharging] = useState(false);
	const shootRef = useRef<ShootFn | null>(null);
	const [movingBalls, setMovingBalls] = useState<Record<string, boolean>>({});
	const [showRoundStart, setShowRoundStart] = useState(false);
	const [shotCount, setShotCount] = useState(0);

	// いずれかのボールが動いているか判定
	const anyBallMoving = useMemo(
		() => Object.values(movingBalls).some((moving) => moving),
		[movingBalls],
	);

	// ボールが止まった瞬間にUIを表示する
	useEffect(() => {
		if (!anyBallMoving) {
			setShowRoundStart(true);
			const timer = setTimeout(() => {
				setShowRoundStart(false);
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [anyBallMoving]);

	const handleMovingChange = useCallback((id: string, isMoving: boolean) => {
		setMovingBalls((prev) => {
			if (prev[id] === isMoving) return prev;
			return { ...prev, [id]: isMoving };
		});
	}, []);

	const handleBallSelect = useCallback((shoot: ShootFn) => {
		shootRef.current = shoot;
		setIsCharging(true);
	}, []);

	const handleConfirm = useCallback((power: number) => {
		shootRef.current?.(power);
		shootRef.current = null;
		setIsCharging(false);
		setShotCount((prev) => prev + 1);
	}, []);

	const handleCancel = useCallback(() => {
		shootRef.current = null;
		setIsCharging(false);
	}, []);

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
								onMovingChange={handleMovingChange}
								onSelect={
									ball.shootable && !isCharging && !anyBallMoving
										? handleBallSelect
										: undefined
								}
							/>
						))}
					</Suspense>
				</Physics>
				<OrbitControls />
			</Canvas>
			{showRoundStart && (
				<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden">
					{/* 背景のフレアエフェクト */}
					<div className="absolute w-[800px] h-[300px] bg-red-600/20 blur-[120px] rounded-full animate-pulse" />

					<div className="relative flex flex-col items-center">
						{/* 上部の装飾ライン */}
						<div className="w-64 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent mb-6 animate-in slide-in-from-left duration-700" />

						<h1
							className="text-8xl font-black italic tracking-tighter uppercase 
							bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-red-500 to-red-900
							drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]
							animate-in zoom-in-90 fade-in duration-300 ease-out"
						>
							{shotCount === 0 ? "Round Start" : "Shot Now"}
						</h1>

						{/* 下部の装飾ラインとサブテキスト */}
						<div className="w-64 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent mt-6 animate-in slide-in-from-right duration-700" />
						<p className="text-white text-lg font-bold tracking-[0.6em] mt-4 drop-shadow-md animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
							{shotCount === 0 ? "READY TO BREAK" : "MAKE THE SHOT"}
						</p>
					</div>
				</div>
			)}
			{isCharging && (
				<PowerGauge onConfirm={handleConfirm} onCancel={handleCancel} />
			)}
		</div>
	);
}
