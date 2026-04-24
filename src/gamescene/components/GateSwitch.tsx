import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { OFFSET_Y, PLAY_HEIGHT, PLAY_WIDTH } from "./billiardTable";
import { useBlock } from "./FillerContextProvider";

const SWITCH_SIZE: [number, number, number] = [
	PLAY_HEIGHT / 2,
	3 * PLAY_HEIGHT,
	PLAY_HEIGHT / 2,
];
const MOVE_RANGE = PLAY_WIDTH / 4; // 左右の移動幅
const MOVE_SPEED = 0.5; // 移動速度
const IMPACT_THRESHOLD = 2.0; // 発火に必要な最低速度
const RESET_DELAY = 60000; // 元に戻るまでの時間 (ms)

export function GateSwitch() {
	const { isAllHidden, hideAll, resetBlocks } = useBlock();
	const [isActive, setIsActive] = useState(false); // 見た目の変化用
	const isProcessingRef = useRef(false); // 連打防止用フラグ

	const [ref, api] = useBox(() => ({
		type: "Kinematic", // 質量を持たず、プログラムから制御する
		args: SWITCH_SIZE,
		position: [0, (PLAY_HEIGHT + SWITCH_SIZE[1]) / 2 - OFFSET_Y, 1],
		onCollide: (e) => {
			// すでに処理中、または速度が足りない場合は無視
			if (
				isProcessingRef.current ||
				e.contact.impactVelocity < IMPACT_THRESHOLD
			) {
				return;
			}

			handleTrigger();
		},
	}));

	const handleTrigger = () => {
		isProcessingRef.current = true;
		setIsActive(true);
		hideAll(); // ポケットを開ける

		// 一定時間後にリセット
		setTimeout(() => {
			resetBlocks();
			setIsActive(false);
			isProcessingRef.current = false;
		}, RESET_DELAY);
	};

	// Kinematic Body の移動処理
	useFrame((state) => {
		const t = state.clock.getElapsedTime();
		// X座標を Sine 波で計算 (左右に往復)
		const x = Math.sin(t * MOVE_SPEED) * MOVE_RANGE;

		// api.position.set を使い物理エンジンに現在の位置を教える
		// Kinematic なので、Dynamic なボールに「弾き飛ばされる」ことはないが
		// ボールを「押し退ける」力は働く
		api.position.set(x, (PLAY_HEIGHT + SWITCH_SIZE[1]) / 2 - OFFSET_Y, 1);
	});

	useEffect(() => {
		console.log("Switch State:", isAllHidden ? "OPEN" : "CLOSED");
	}, [isAllHidden]);

	return (
		<mesh ref={ref}>
			<boxGeometry args={SWITCH_SIZE} />
			<meshStandardMaterial
				color={isActive ? "#ff0000" : "#ffaa00"}
				emissive={isActive ? "#440000" : "#000000"}
			/>
		</mesh>
	);
}
