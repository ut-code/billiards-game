import { Physics } from "@react-three/cannon";
import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import billiardHallHdr from "../assets/backgroundHDR/billiard_hall_1k.hdr";
import poolballs0 from "../assets/ballTexture/poolballs0.png";
import poolballs1 from "../assets/ballTexture/poolballs1.png";
import poolballs2 from "../assets/ballTexture/poolballs2.png";
import poolballs3 from "../assets/ballTexture/poolballs3.png";
import poolballs4 from "../assets/ballTexture/poolballs4.png";
import poolballs5 from "../assets/ballTexture/poolballs5.png";
import poolballs6 from "../assets/ballTexture/poolballs6.png";
import { Ball, type ShootFn } from "./components/Ball";
import { BilliardTable } from "./components/billiardTable";
import { CameraController } from "./components/CameraController";
import { PowerGauge } from "./components/PowerGauge";
import { StartBanner } from "./components/StartBanner";
import { findCueRespawnPosition } from "./utils/cueRespawn";

type BallConfig = {
	id: string;
	textureUrl: string;
	position: [number, number, number];
	velocity?: [number, number, number];
	shootable?: boolean;
};

type BallState = {
	visible: boolean;
	pocketed: boolean;
	respawnNextRound: boolean;
	respawnVersion: number;
	spawnPosition: [number, number, number];
	respawnPosition?: [number, number, number];
};

const CUE_BALL_ID = "poolballs0";

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

const initialBallState = balls.reduce<Record<string, BallState>>(
	(acc, ball) => {
		acc[ball.id] = {
			visible: true,
			pocketed: false,
			respawnNextRound: false,
			respawnVersion: 0,
			spawnPosition: ball.position,
		};
		return acc;
	},
	{},
);

const targetBallIds = balls
	.filter((ball) => ball.id !== CUE_BALL_ID)
	.map((ball) => ball.id);

export default function GameScene() {
	const [isCharging, setIsCharging] = useState(false);
	const shootRef = useRef<ShootFn | null>(null);
	const [movingBalls, setMovingBalls] = useState<Record<string, boolean>>({});
	const [showRoundStart, setShowRoundStart] = useState(false);
	const [shotCount, setShotCount] = useState(0);
	const [ballStates, setBallStates] =
		useState<Record<string, BallState>>(initialBallState);
	const ballPositionsRef = useRef<Record<string, [number, number, number]>>(
		balls.reduce<Record<string, [number, number, number]>>((acc, ball) => {
			acc[ball.id] = ball.position;
			return acc;
		}, {}),
	);

	// いずれかのボールが動いているか判定
	const anyBallMoving = useMemo(
		() => Object.values(movingBalls).some((moving) => moving),
		[movingBalls],
	);

	const remainingTargetBalls = useMemo(
		() => targetBallIds.filter((id) => !ballStates[id]?.pocketed).length,
		[ballStates],
	);

	const cueRespawnPending = ballStates[CUE_BALL_ID]?.respawnNextRound ?? false;

	// 停止かつキュー球のリスポーン待ち状態でリスポーンを実行
	useEffect(() => {
		if (anyBallMoving || !cueRespawnPending) return;

		setBallStates((prev) => {
			const cueState = prev[CUE_BALL_ID];
			if (!cueState || !cueState.respawnNextRound) return prev;

			const activeBallPositions = Object.entries(prev)
				.filter(([id, state]) => id !== CUE_BALL_ID && state.visible)
				.map(([id]) => ballPositionsRef.current[id]);

			const respawnPosition = findCueRespawnPosition(
				cueState.spawnPosition,
				activeBallPositions,
			);

			ballPositionsRef.current[CUE_BALL_ID] = respawnPosition;

			return {
				...prev,
				[CUE_BALL_ID]: {
					...cueState,
					visible: true,
					respawnNextRound: false,
					respawnVersion: cueState.respawnVersion + 1,
					respawnPosition,
				},
			};
		});
	}, [anyBallMoving, cueRespawnPending]);

	// ボールが止まった瞬間にUIを表示する
	useEffect(() => {
		if (anyBallMoving) return;

		setShowRoundStart(true);
		const timer = setTimeout(() => {
			setShowRoundStart(false);
		}, 1000);
		return () => clearTimeout(timer);
	}, [anyBallMoving]);

	const handleMovingChange = useCallback((id: string, isMoving: boolean) => {
		setMovingBalls((prev) => {
			if (prev[id] === isMoving) return prev;
			return { ...prev, [id]: isMoving };
		});
	}, []);

	const handlePositionChange = useCallback(
		(id: string, position: [number, number, number]) => {
			ballPositionsRef.current[id] = position;
		},
		[],
	);

	const handlePocket = useCallback((id: string) => {
		setMovingBalls((prev) => ({ ...prev, [id]: false }));

		setBallStates((prev) => {
			const state = prev[id];
			if (!state || !state.visible) return prev;

			if (id === CUE_BALL_ID) {
				return {
					...prev,
					[id]: {
						...state,
						visible: false,
						respawnNextRound: true,
					},
				};
			}

			return {
				...prev,
				[id]: {
					...state,
					visible: false,
					pocketed: true,
				},
			};
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
				<Suspense>
					<Physics gravity={[0, -9.8, 0]}>
						<BilliardTable />
						{balls.map((ball) => {
							const state = ballStates[ball.id];

							const isRespawnedCueBall =
								ball.id === CUE_BALL_ID && state.respawnVersion > 0;

							return (
								<Ball
									key={ball.id}
									id={ball.id}
									textureUrl={ball.textureUrl}
									position={ballPositionsRef.current[ball.id]}
									velocity={isRespawnedCueBall ? [0, 0, 0] : ball.velocity}
									respawnPosition={
										ball.id === CUE_BALL_ID ? state.respawnPosition : undefined
									}
									isVisible={state.visible}
									onMovingChange={handleMovingChange}
									onPositionChange={handlePositionChange}
									onPocket={handlePocket}
									onSelect={
										ball.shootable && !isCharging && !anyBallMoving
											? handleBallSelect
											: undefined
									}
								/>
							);
						})}
					</Physics>
					<Environment files={billiardHallHdr} background />
				</Suspense>
				<CameraController isCharging={isCharging} />
			</Canvas>
			{showRoundStart && (
				<StartBanner
					shotCount={shotCount}
					remainingBalls={remainingTargetBalls}
				/>
			)}
			{isCharging && (
				<PowerGauge onConfirm={handleConfirm} onCancel={handleCancel} />
			)}
		</div>
	);
}
