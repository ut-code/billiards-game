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
import { useNavigate, useParams } from "react-router-dom";
import billiardHallHdr from "../assets/backgroundHDR/billiard_hall_1k.hdr";
import { Ball, type ShootFn } from "./components/Ball";
import { BilliardTable } from "./components/billiardTable";
import { CameraController } from "./components/CameraController";
import { PowerGauge } from "./components/PowerGauge";
import { StartBanner } from "./components/StartBanner";
import { getLevelConfig } from "./constants/levels";
import { findCueRespawnPosition } from "./utils/cueRespawn";

type BallState = {
	visible: boolean;
	pocketed: boolean;
	respawnNextRound: boolean;
	respawnVersion: number;
	spawnPosition: [number, number, number];
	respawnPosition?: [number, number, number];
};

export default function GameScene() {
	const navigate = useNavigate();
	const { levelId } = useParams();
	const level = useMemo(() => getLevelConfig(levelId), [levelId]);

	useEffect(() => {
		if (level) return;
		navigate("/", { replace: true });
	}, [level, navigate]);

	const balls = useMemo(() => level?.balls ?? [], [level]);
	const cueBallId = level?.cueBallId ?? "";
	const shotLimit = level?.shotLimit ?? 0;

	const initialBallState = useMemo(
		() =>
			balls.reduce<Record<string, BallState>>((acc, ball) => {
				acc[ball.id] = {
					visible: true,
					pocketed: false,
					respawnNextRound: false,
					respawnVersion: 0,
					spawnPosition: ball.position,
				};
				return acc;
			}, {}),
		[balls],
	);

	const targetBallIds = useMemo(
		() => balls.filter((ball) => ball.id !== cueBallId).map((ball) => ball.id),
		[balls, cueBallId],
	);

	const [isCharging, setIsCharging] = useState(false);
	const shootRef = useRef<ShootFn | null>(null);
	const [movingBalls, setMovingBalls] = useState<Record<string, boolean>>({});
	const [showRoundStart, setShowRoundStart] = useState(false);
	const [shotCount, setShotCount] = useState(0);
	const [pendingShotResolution, setPendingShotResolution] = useState(false);
	const [ballStates, setBallStates] = useState<Record<string, BallState>>({});
	const ballPositionsRef = useRef<Record<string, [number, number, number]>>({});
	const gameEndedRef = useRef(false);
	const hasSeenMovementSinceShotRef = useRef(false);

	useEffect(() => {
		setBallStates(initialBallState);
		setMovingBalls({});
		setIsCharging(false);
		setShowRoundStart(false);
		setShotCount(0);
		setPendingShotResolution(false);
		shootRef.current = null;
		gameEndedRef.current = false;
		hasSeenMovementSinceShotRef.current = false;
		ballPositionsRef.current = balls.reduce<
			Record<string, [number, number, number]>
		>((acc, ball) => {
			acc[ball.id] = ball.position;
			return acc;
		}, {});
	}, [balls, initialBallState]);

	// いずれかのボールが動いているか判定
	const anyBallMoving = useMemo(
		() => Object.values(movingBalls).some((moving) => moving),
		[movingBalls],
	);

	const remainingTargetBalls = useMemo(
		() => targetBallIds.filter((id) => !ballStates[id]?.pocketed).length,
		[ballStates, targetBallIds],
	);
	const remainingShots = Math.max(shotLimit - shotCount, 0);

	const cueRespawnPending = ballStates[cueBallId]?.respawnNextRound ?? false;
	const canJudgeResult =
		!anyBallMoving &&
		!isCharging &&
		!cueRespawnPending &&
		!pendingShotResolution;

	useEffect(() => {
		if (!pendingShotResolution) return;

		if (anyBallMoving) {
			hasSeenMovementSinceShotRef.current = true;
			return;
		}

		if (!hasSeenMovementSinceShotRef.current) return;

		hasSeenMovementSinceShotRef.current = false;
		setPendingShotResolution(false);
	}, [anyBallMoving, pendingShotResolution]);

	// 停止かつキュー球のリスポーン待ち状態でリスポーンを実行
	useEffect(() => {
		if (anyBallMoving || !cueRespawnPending) return;

		setBallStates((prev) => {
			const cueState = prev[cueBallId];
			if (!cueState || !cueState.respawnNextRound) return prev;

			const activeBallPositions = Object.entries(prev)
				.filter(([id, state]) => id !== cueBallId && state.visible)
				.map(([id]) => ballPositionsRef.current[id]);

			const respawnPosition = findCueRespawnPosition(
				cueState.spawnPosition,
				activeBallPositions,
			);

			ballPositionsRef.current[cueBallId] = respawnPosition;

			return {
				...prev,
				[cueBallId]: {
					...cueState,
					visible: true,
					respawnNextRound: false,
					respawnVersion: cueState.respawnVersion + 1,
					respawnPosition,
				},
			};
		});
	}, [anyBallMoving, cueBallId, cueRespawnPending]);

	// ボールが止まった瞬間にUIを表示する
	useEffect(() => {
		if (gameEndedRef.current) return;
		if (anyBallMoving) return;

		setShowRoundStart(true);
		const timer = setTimeout(() => {
			setShowRoundStart(false);
		}, 1000);
		return () => clearTimeout(timer);
	}, [anyBallMoving]);

	const finalizeGame = useCallback(
		(success: boolean) => {
			if (!level || gameEndedRef.current) return;

			gameEndedRef.current = true;
			shootRef.current = null;
			setIsCharging(false);
			setShowRoundStart(false);

			navigate("/result", {
				replace: true,
				state: {
					levelId: level.id,
					levelName: level.name,
					shotLimit: level.shotLimit,
					shotsUsed: shotCount,
					remainingBalls: remainingTargetBalls,
					success,
				},
			});
		},
		[level, navigate, remainingTargetBalls, shotCount],
	);

	useEffect(() => {
		if (!canJudgeResult) return;
		if (remainingTargetBalls !== 0) return;
		finalizeGame(true);
	}, [canJudgeResult, finalizeGame, remainingTargetBalls]);

	useEffect(() => {
		if (!canJudgeResult) return;
		if (remainingShots !== 0) return;
		if (remainingTargetBalls <= 0) return;
		finalizeGame(false);
	}, [canJudgeResult, finalizeGame, remainingShots, remainingTargetBalls]);

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

	const handlePocket = useCallback(
		(id: string) => {
			setMovingBalls((prev) => ({ ...prev, [id]: false }));

			setBallStates((prev) => {
				const state = prev[id];
				if (!state || !state.visible) return prev;

				if (id === cueBallId) {
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
		},
		[cueBallId],
	);

	const handleBallSelect = useCallback((shoot: ShootFn) => {
		shootRef.current = shoot;
		setIsCharging(true);
	}, []);

	const handleConfirm = useCallback(
		(power: number) => {
			if (shotCount >= shotLimit) return;
			const didShoot = shootRef.current?.(power) ?? false;
			shootRef.current = null;
			setIsCharging(false);
			if (!didShoot) return; // ショットが実行されなかった場合は打数を消費しない
			hasSeenMovementSinceShotRef.current = false;
			setPendingShotResolution(true);
			setShotCount((prev) => prev + 1);
		},
		[shotCount, shotLimit],
	);

	const handleCancel = useCallback(() => {
		shootRef.current = null;
		setIsCharging(false);
	}, []);

	if (!level) {
		return null;
	}

	return (
		<div className="relative h-screen w-screen">
			<div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-xl border border-white/20 bg-black/55 text-white px-4 py-2 backdrop-blur-sm">
				<p className="text-xs tracking-[0.2em] text-white/70">{level.name}</p>
				<p className="text-lg font-bold">残り打数 {remainingShots}</p>
			</div>
			<Canvas camera={{ position: [0, 5, 5], fov: 45 }} shadows>
				<ambientLight intensity={5} />
				<pointLight position={[10, 10, 10]} />
				<Suspense>
					<Physics gravity={[0, -9.8, 0]}>
						<BilliardTable />
						{balls.map((ball) => {
							const state = ballStates[ball.id];

							const isRespawnedCueBall =
								ball.id === cueBallId && (state?.respawnVersion ?? 0) > 0;

							return (
								<Ball
									key={ball.id}
									id={ball.id}
									textureUrl={ball.textureUrl}
									position={ballPositionsRef.current[ball.id]}
									velocity={isRespawnedCueBall ? [0, 0, 0] : ball.velocity}
									respawnPosition={
										ball.id === cueBallId ? state?.respawnPosition : undefined
									}
									isVisible={state?.visible ?? true}
									onMovingChange={handleMovingChange}
									onPositionChange={handlePositionChange}
									onPocket={handlePocket}
									onSelect={
										ball.shootable &&
										!isCharging &&
										!anyBallMoving &&
										shotCount < shotLimit
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
