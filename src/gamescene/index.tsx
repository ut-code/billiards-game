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
import { IoHome, IoInformationCircleOutline, IoRefresh } from "react-icons/io5";
import { PiMagnetFill } from "react-icons/pi";
import { useNavigate, useParams } from "react-router-dom";
import billiardHallHdr from "../assets/backgroundHDR/billiard_hall_1k.hdr";
import { AccelerationFloor } from "./components/AccelerationFloor";
import { Ball, type ShootFn } from "./components/Ball";
import { BOMB_RADIUS, Bomb } from "./components/Bomb";
import { BilliardTable } from "./components/billiardTable";
import { CameraController } from "./components/CameraController";
import { Cue } from "./components/Cue";
import { DividerWall } from "./components/DividerWall";
import { BlockProvider } from "./components/FillerContextProvider";
import { GateSwitch } from "./components/GateSwitch";
import { HoleFiller } from "./components/HoleFiller";
import { PortalPair } from "./components/PortalPair";
import { PowerGauge } from "./components/PowerGauge";
import { StartBanner } from "./components/StartBanner";
import { TrajectoryLineRaycast } from "./components/TrajectoryLineRaycast";
import { getLevelConfig } from "./constants/levels";
import { BALL_RADIUS, calcStrikeDuration } from "./constants/physics";
import { StartModal } from "./gimmicDocs/StartModal";
import { findCueRespawnPosition } from "./utils/cueRespawn";

type BallState = {
	visible: boolean;
	pocketed: boolean;
	respawnNextRound: boolean;
	respawnVersion: number;
	spawnPosition: [number, number, number];
	respawnPosition?: [number, number, number];
};

type BombState = {
	visible: boolean;
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
	const bombs = useMemo(() => level?.bombs ?? [], [level]);
	const portals = useMemo(() => level?.portals ?? [], [level]);
	const magnetEnabled = useMemo(() => level?.magnetEn ?? false, [level]);
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

	const initialBombState = useMemo(
		() =>
			bombs.reduce<Record<string, BombState>>((acc, bomb) => {
				acc[bomb.id] = { visible: true };
				return acc;
			}, {}),
		[bombs],
	);

	const targetBallIds = useMemo(
		() => balls.filter((ball) => ball.id !== cueBallId).map((ball) => ball.id),
		[balls, cueBallId],
	);

	const [sceneKey, setSceneKey] = useState(0);
	const [bombExploded, setBombExploded] = useState(false);
	const bombFinalizeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
	const [isCharging, setIsCharging] = useState(false);
	const shootRef = useRef<ShootFn | null>(null);
	const shotNormalizedPowerRef = useRef(0);
	const [strikeVersion, setStrikeVersion] = useState(0);
	const [isStrikeAnimating, setIsStrikeAnimating] = useState(false);
	const pendingStrikeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const [movingBalls, setMovingBalls] = useState<Record<string, boolean>>({});
	const [showRoundStart, setShowRoundStart] = useState(false);
	const [shotCount, setShotCount] = useState(0);
	const [pendingShotResolution, setPendingShotResolution] = useState(false);
	const [ballStates, setBallStates] = useState<Record<string, BallState>>({});
	const [bombStates, setBombStates] = useState<Record<string, BombState>>({});
	const [isStartModalOpen, setIsStartModalOpen] = useState(true);
	const [pressedKey, setPressedKey] = useState<string | null>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase();
			if (key === "a" || key === "d") {
				setPressedKey(key);
			}
		};
		const handleKeyUp = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase();
			if (key === "a" || key === "d") {
				setPressedKey(null);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	const ballPositionsRef = useRef<Record<string, [number, number, number]>>({});
	const gameEndedRef = useRef(false);
	const hasSeenMovementSinceShotRef = useRef(false);

	const resetGameState = useCallback(() => {
		if (pendingStrikeTimeoutRef.current !== null) {
			clearTimeout(pendingStrikeTimeoutRef.current);
			pendingStrikeTimeoutRef.current = null;
		}
		if (bombFinalizeTimeoutRef.current !== null) {
			clearTimeout(bombFinalizeTimeoutRef.current);
			bombFinalizeTimeoutRef.current = null;
		}
		gameEndedRef.current = false;
		hasSeenMovementSinceShotRef.current = false;
		shootRef.current = null;
		ballPositionsRef.current = [...balls, ...bombs].reduce<
			Record<string, [number, number, number]>
		>((acc, item) => {
			acc[item.id] = item.position;
			return acc;
		}, {});
		setBallStates(initialBallState);
		setBombStates(initialBombState);
		setMovingBalls({});
		setIsCharging(false);
		setIsStartModalOpen(true);
		setShowRoundStart(false);
		setShotCount(0);
		setStrikeVersion(0);
		setIsStrikeAnimating(false);
		setPendingShotResolution(false);
		setBombExploded(false);
	}, [balls, bombs, initialBallState, initialBombState]);

	useEffect(() => {
		resetGameState();
	}, [resetGameState]);

	useEffect(() => {
		return () => {
			if (pendingStrikeTimeoutRef.current !== null) {
				clearTimeout(pendingStrikeTimeoutRef.current);
			}
			if (bombFinalizeTimeoutRef.current !== null) {
				clearTimeout(bombFinalizeTimeoutRef.current);
			}
		};
	}, []);

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

	const handleBombPocket = useCallback((id: string) => {
		setMovingBalls((prev) => ({ ...prev, [id]: false }));
		setBombStates((prev) => {
			const state = prev[id];
			if (!state || !state.visible) return prev;
			return { ...prev, [id]: { visible: false } };
		});
	}, []);

	const handleBombExplode = useCallback(
		(id: string) => {
			setMovingBalls((prev) => ({ ...prev, [id]: false }));
			setBombStates((prev) => {
				const state = prev[id];
				if (!state || !state.visible) return prev;
				return { ...prev, [id]: { visible: false } };
			});
			setBombExploded(true);
			if (bombFinalizeTimeoutRef.current !== null) {
				clearTimeout(bombFinalizeTimeoutRef.current);
			}
			bombFinalizeTimeoutRef.current = setTimeout(() => {
				bombFinalizeTimeoutRef.current = null;
				finalizeGame(false);
			}, 2000);
		},
		[finalizeGame],
	);

	const handleBallSelect = useCallback((shoot: ShootFn) => {
		shootRef.current = shoot;
		setIsCharging(true);
	}, []);

	const handleConfirm = useCallback(
		(power: number, normalizedPower: number) => {
			if (shotCount >= shotLimit) return;
			shotNormalizedPowerRef.current = normalizedPower;
			// キューアニメーションを即時トリガー、PowerGaugeも即時非表示
			setStrikeVersion((prev) => prev + 1);
			setIsCharging(false);
			setIsStrikeAnimating(true);
			// インパルスと打数消費はアニメーション完了後
			pendingStrikeTimeoutRef.current = setTimeout(() => {
				pendingStrikeTimeoutRef.current = null;
				setIsStrikeAnimating(false);
				const didShoot = shootRef.current?.(power) ?? false;
				shootRef.current = null;
				if (!didShoot) return;
				hasSeenMovementSinceShotRef.current = false;
				setPendingShotResolution(true);
				setShotCount((prev) => prev + 1);
			}, calcStrikeDuration(normalizedPower) * 1000);
		},
		[shotCount, shotLimit],
	);

	const handleCancel = useCallback(() => {
		if (pendingStrikeTimeoutRef.current !== null) {
			clearTimeout(pendingStrikeTimeoutRef.current);
			pendingStrikeTimeoutRef.current = null;
			setIsStrikeAnimating(false);
		}
		shootRef.current = null;
		setIsCharging(false);
	}, []);

	const handleRestart = useCallback(() => {
		resetGameState();
		setSceneKey((prev) => prev + 1);
	}, [resetGameState]);

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
					<Physics key={sceneKey} gravity={[0, -9.8, 0]} stepSize={1 / 120}>
						<BilliardTable
							surfaceTextureUrl={level.table?.clothTextureUrl}
							floorFriction={level.table?.floorFriction}
							planeColor={level.table?.planeColor}
						/>
						{level.dividers?.map((divider) => (
							<DividerWall
								key={`${divider.position.join(",")}-${divider.size.join(",")}`}
								config={divider}
							/>
						))}
						{/* BlockProviderがあるとき、ポケットが埋まる */}
						{level.gate?.gateEn && (
							<BlockProvider>
								<HoleFiller />
								{level.gate.gatePos.map((pos) => (
									<GateSwitch pos={pos} key={`${pos[0]}-${pos[1]}-${pos[2]}`} />
								))}
							</BlockProvider>
						)}

						{balls.map((ball) => {
							const state = ballStates[ball.id];
							const isRespawnedCueBall =
								ball.id === cueBallId && (state?.respawnVersion ?? 0) > 0;

							return (
								<Ball
									key={ball.id}
									id={ball.id}
									textureUrl={ball.textureUrl}
									position={ballPositionsRef.current[ball.id] ?? ball.position}
									velocity={isRespawnedCueBall ? [0, 0, 0] : ball.velocity}
									portals={portals}
									accelerationFloors={level.accelerationFloors}
									respawnPosition={
										ball.id === cueBallId ? state?.respawnPosition : undefined
									}
									isVisible={state?.visible ?? true}
									onMovingChange={handleMovingChange}
									onPositionChange={handlePositionChange}
									onPocket={handlePocket}
									allowMagnet={ball.shootable && magnetEnabled}
									onSelect={
										ball.shootable &&
										!isStartModalOpen &&
										!isCharging &&
										!isStrikeAnimating &&
										!anyBallMoving &&
										shotCount < shotLimit
											? handleBallSelect
											: undefined
									}
								/>
							);
						})}

						{bombs.map((bomb) => (
							<Bomb
								key={bomb.id}
								id={bomb.id}
								position={ballPositionsRef.current[bomb.id] ?? bomb.position}
								isVisible={bombStates[bomb.id]?.visible ?? true}
								onExplode={handleBombExplode}
								onMovingChange={handleMovingChange}
								onPocket={handleBombPocket}
								onPositionChange={handlePositionChange}
							/>
						))}

						{portals.map((portal) => (
							<PortalPair
								portal={portal}
								key={`${portal.entry.join(",")}-${portal.exit.join(",")}`}
							/>
						))}
						{level.accelerationFloors?.map((floor) => (
							<AccelerationFloor
								key={`accel-floor-${floor.position.join("-")}`}
								config={floor}
							/>
						))}
					</Physics>
					<Environment files={billiardHallHdr} background />
				</Suspense>
				<CameraController isCharging={isCharging} />
				<Cue
					ballPositionRef={ballPositionsRef}
					cueBallId={cueBallId}
					visible={isCharging && (ballStates[cueBallId]?.visible ?? false)}
					shotVersion={strikeVersion}
					shotNormalizedPowerRef={shotNormalizedPowerRef}
				/>
				<TrajectoryLineRaycast
					ballPositionRef={ballPositionsRef}
					cueBallId={cueBallId}
					visibleBalls={[
						...balls
							.filter((b) => b.id !== cueBallId && ballStates[b.id]?.visible)
							.map((b) => ({ id: b.id, radius: BALL_RADIUS })),
						...bombs
							.filter((bomb) => bombStates[bomb.id]?.visible)
							.map((bomb) => ({ id: bomb.id, radius: BOMB_RADIUS })),
					]}
					visible={!anyBallMoving && (ballStates[cueBallId]?.visible ?? false)}
				/>
			</Canvas>
			{showRoundStart && (
				<StartBanner
					shotCount={shotCount}
					remainingBalls={remainingTargetBalls}
				/>
			)}
			{isStartModalOpen && (
				<StartModal
					title={level.name}
					description={
						level.gimmic ?? "全てのターゲットをポケットに落としてください。"
					}
					images={level.gimicImages}
					onClose={() => setIsStartModalOpen(false)}
				/>
			)}
			{!isStartModalOpen && (
				<div className="absolute bottom-8 left-8 z-10 flex gap-3">
					<button
						type="button"
						onClick={() => setIsStartModalOpen(true)}
						className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-gray-300/55 text-2xl shadow-lg backdrop-blur-sm transition-all hover:bg-white/70 hover:scale-110 active:scale-95"
						title="ミッション詳細を表示"
					>
						<IoInformationCircleOutline />
					</button>
					<button
						type="button"
						onClick={handleRestart}
						className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-gray-300/55 text-2xl shadow-lg backdrop-blur-sm transition-all hover:bg-white/70 hover:scale-110 active:scale-95"
						title="リトライ(はじめから)"
					>
						<IoRefresh />
					</button>
					<button
						type="button"
						onClick={() => navigate("/")}
						className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-gray-300/55 text-2xl shadow-lg backdrop-blur-sm transition-all hover:bg-white/70 hover:scale-110 active:scale-95"
						title="ホームに戻る"
					>
						<IoHome />
					</button>
				</div>
			)}
			{bombExploded && (
				<div className="bomb-flash absolute inset-0 z-20 flex items-center justify-center">
					<p className="bomb-text text-white text-6xl font-bold drop-shadow-[0_0_24px_rgba(255,120,0,1)]">
						💥 BOOM!
					</p>
				</div>
			)}
			{isCharging && (
				<PowerGauge onConfirm={handleConfirm} onCancel={handleCancel} />
			)}
			{magnetEnabled && (
				<div className="absolute bottom-8 right-8 z-10 flex items-center gap-3">
					<div
						className={`text-5xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-opacity duration-200 ${pressedKey === "a" && anyBallMoving ? "opacity-100" : "opacity-0"}`}
					>
						←
					</div>
					<div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-gray-300/55 text-3xl shadow-lg backdrop-blur-sm">
						<PiMagnetFill />
					</div>
					<div
						className={`text-5xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-opacity duration-200 ${pressedKey === "d" && anyBallMoving ? "opacity-100" : "opacity-0"}`}
					>
						→
					</div>
				</div>
			)}
		</div>
	);
}
