import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BALL_RADIUS, calcStrikeDuration } from "../constants/physics";

const CUE_LENGTH = 0.8;
const CUE_TIP_RADIUS = 0.012;
const CUE_BUTT_RADIUS = 0.03;
const CUE_GAP = BALL_RADIUS * 1.2;
const INITIAL_PULLBACK = 0.1;

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
	const meshRef = useRef<THREE.Mesh>(null);
	const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
	const dir = useMemo(() => new THREE.Vector3(), []);
	const pos = useMemo(() => new THREE.Vector3(), []);

	const strikeRef = useRef<StrikeState>(null);
	const prevShotVersion = useRef(shotVersion);
	const currentOffsetRef = useRef(CUE_GAP + CUE_LENGTH / 2);

	useFrame(({ camera }, delta) => {
		const mesh = meshRef.current;
		if (!mesh) return;

		// ショット検出 → 突きアニメーション開始
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
			mesh.visible = false;
			return;
		}

		const ballPos = ballPositionRef.current?.[cueBallId];
		if (!ballPos) {
			mesh.visible = false;
			return;
		}

		dir.set(ballPos[0] - camera.position.x, 0, ballPos[2] - camera.position.z);
		if (dir.lengthSq() < 1e-6) {
			mesh.visible = false;
			return;
		}
		dir.normalize();

		// オフセット計算（ボール中心からキュー中心までの距離）
		let offsetDist: number;
		if (isStriking && strikeRef.current) {
			strikeRef.current.elapsed += delta;
			const t = Math.min(
				strikeRef.current.elapsed / strikeRef.current.duration,
				1,
			);
			// ease-out: 突いてから止まる感じ
			const eased = 1 - (1 - t) ** 2;
			// 突き終わり: tip がボール表面に到達
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
			ballPos[1],
			ballPos[2] - dir.z * offsetDist,
		);
		mesh.position.copy(pos);
		mesh.quaternion.setFromUnitVectors(up, dir);
		mesh.visible = true;
	});

	return (
		<mesh ref={meshRef}>
			{/* radiusTop = Y+ 側（ボール方向・先端）、radiusBottom = Y- 側（手元・バット） */}
			<cylinderGeometry
				args={[CUE_TIP_RADIUS, CUE_BUTT_RADIUS, CUE_LENGTH, 12]}
			/>
			<meshStandardMaterial color="#6B3A2A" roughness={0.4} metalness={0.05} />
		</mesh>
	);
}
