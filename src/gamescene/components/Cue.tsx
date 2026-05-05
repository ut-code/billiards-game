import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BALL_RADIUS, calcStrikeDuration } from "../constants/physics";

const CUE_LENGTH = 2.9; // 実物1.45m × テーブルスケール2.0
const CUE_GAP = BALL_RADIUS * 1.2;
const INITIAL_PULLBACK = 0.1;
const TILT_ANGLE = (10 * Math.PI) / 180; // 手元が高く先端が低い傾き
const TILT_COS = Math.cos(TILT_ANGLE);
const TILT_SIN = Math.sin(TILT_ANGLE);

// 3パーツの寸法（Y+ = ボール側・先端、Y- = 手元側）
// チップ（革）
const TIP_LENGTH = CUE_LENGTH * 0.05;
const TIP_Y = CUE_LENGTH / 2 - TIP_LENGTH / 2;
const TIP_R_TOP = 0.012;
const TIP_R_BOTTOM = 0.013;
// シャフト（白木）
const SHAFT_LENGTH = CUE_LENGTH * 0.55;
const SHAFT_Y = TIP_Y - TIP_LENGTH / 2 - SHAFT_LENGTH / 2;
const SHAFT_R_TOP = 0.013;
const SHAFT_R_BOTTOM = 0.022;
// バット（茶木）
const BUTT_LENGTH = CUE_LENGTH * 0.4;
const BUTT_Y = SHAFT_Y - SHAFT_LENGTH / 2 - BUTT_LENGTH / 2;
const BUTT_R_TOP = 0.022;
const BUTT_R_BOTTOM = 0.03;

type StrikeState = {
	elapsed: number;
	duration: number;
	startOffset: number;
};

type CueProps = {
	ballPositionRef: React.RefObject<Record<string, [number, number, number]>>;
	cueBallId: string;
	visible: boolean;
	shotVersion: number;
	shotNormalizedPowerRef: React.RefObject<number>;
};

export function Cue({
	ballPositionRef,
	cueBallId,
	visible,
	shotVersion,
	shotNormalizedPowerRef,
}: CueProps) {
	const groupRef = useRef<THREE.Group>(null);
	const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
	const dir = useMemo(() => new THREE.Vector3(), []);
	const pos = useMemo(() => new THREE.Vector3(), []);

	const strikeRef = useRef<StrikeState | null>(null);
	const prevShotVersion = useRef(shotVersion);
	const currentOffsetRef = useRef(CUE_GAP + CUE_LENGTH / 2);

	useFrame(({ camera }, delta) => {
		const group = groupRef.current;
		if (!group) return;

		if (shotVersion !== prevShotVersion.current) {
			prevShotVersion.current = shotVersion;
			strikeRef.current = {
				elapsed: 0,
				duration: calcStrikeDuration(shotNormalizedPowerRef.current ?? 0),
				startOffset: currentOffsetRef.current,
			};
		}

		const isStriking = strikeRef.current !== null;

		if (!visible && !isStriking) {
			group.visible = false;
			return;
		}

		const ballPos = ballPositionRef.current?.[cueBallId];
		if (!ballPos) {
			group.visible = false;
			return;
		}

		// 水平方向を正規化してから傾きを適用
		const hx = ballPos[0] - camera.position.x;
		const hz = ballPos[2] - camera.position.z;
		const hLen = Math.sqrt(hx * hx + hz * hz);
		if (hLen < 1e-6) {
			group.visible = false;
			return;
		}
		// cos²θ + sin²θ = 1 なので normalize 不要
		dir.set((hx / hLen) * TILT_COS, -TILT_SIN, (hz / hLen) * TILT_COS);

		// オフセット計算（ボール中心からグループ中心までの距離）
		let offsetDist: number;
		if (isStriking && strikeRef.current) {
			strikeRef.current.elapsed += delta;
			const t = Math.min(
				strikeRef.current.elapsed / strikeRef.current.duration,
				1,
			);
			// easing（加速→減速）をかける
			const eased = 1 - (1 - t) ** 2;
			const endOffset = BALL_RADIUS + CUE_LENGTH / 2;
			offsetDist =
				strikeRef.current.startOffset +
				(endOffset - strikeRef.current.startOffset) * eased;
			if (t >= 1) {
				strikeRef.current = null;
			}
		} else {
			offsetDist = CUE_GAP + CUE_LENGTH / 2 + INITIAL_PULLBACK;
		}
		currentOffsetRef.current = offsetDist;

		pos.set(
			ballPos[0] - dir.x * offsetDist,
			ballPos[1] - dir.y * offsetDist, // 傾きに応じてグループ中心が上にずれる
			ballPos[2] - dir.z * offsetDist,
		);
		group.position.copy(pos);
		group.quaternion.setFromUnitVectors(up, dir);
		group.visible = true;
	});

	return (
		<group ref={groupRef}>
			{/* チップ（革） */}
			<mesh position={[0, TIP_Y, 0]}>
				<cylinderGeometry args={[TIP_R_TOP, TIP_R_BOTTOM, TIP_LENGTH, 12]} />
				<meshStandardMaterial color="#3D2218" roughness={0.9} metalness={0.0} />
			</mesh>
			{/* シャフト（白木） */}
			<mesh position={[0, SHAFT_Y, 0]}>
				<cylinderGeometry
					args={[SHAFT_R_TOP, SHAFT_R_BOTTOM, SHAFT_LENGTH, 12]}
				/>
				<meshStandardMaterial color="#EDD9A3" roughness={0.3} metalness={0.0} />
			</mesh>
			{/* バット（茶木） */}
			<mesh position={[0, BUTT_Y, 0]}>
				<cylinderGeometry args={[BUTT_R_TOP, BUTT_R_BOTTOM, BUTT_LENGTH, 12]} />
				<meshStandardMaterial
					color="#6B3A2A"
					roughness={0.4}
					metalness={0.05}
				/>
			</mesh>
		</group>
	);
}
