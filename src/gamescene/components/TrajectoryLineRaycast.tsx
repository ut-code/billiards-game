import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BALL_RADIUS } from "../constants/physics";

const LINE_Y = 0.05;
const MAX_DISTANCE = 100;
const COLLISION_RADIUS = BALL_RADIUS * 2;

/**
 * レイ(origin, direction)と円(center, radius)の交差判定。
 * 交差する場合、最初の交差点までの距離tを返す。交差しない場合はnullを返す。
 */
function rayCircleIntersect(
	ox: number,
	oz: number,
	dx: number,
	dz: number,
	cx: number,
	cz: number,
	r: number,
): number | null {
	const lx = cx - ox;
	const lz = cz - oz;
	const tca = lx * dx + lz * dz;
	if (tca < 0) return null;

	const d2 = lx * lx + lz * lz - tca * tca;
	const r2 = r * r;
	if (d2 > r2) return null;

	const thc = Math.sqrt(r2 - d2);
	const t = tca - thc;
	return t > 1e-6 ? t : null;
}

type TrajectoryLineRaycastProps = {
	ballPositionRef: React.RefObject<Record<string, [number, number, number]>>;
	cueBallId: string;
	visibleBallIds: string[];
	visible: boolean;
};

export function TrajectoryLineRaycast({
	ballPositionRef,
	cueBallId,
	visibleBallIds,
	visible,
}: TrajectoryLineRaycastProps) {
	const lineRef = useRef<THREE.Line>(null);
	const raycaster = useMemo(() => new THREE.Raycaster(), []);
	const workDirection = useMemo(() => new THREE.Vector3(), []);
	const workOrigin = useMemo(() => new THREE.Vector3(), []);

	const lineObject = useMemo(() => {
		const geom = new THREE.BufferGeometry();
		const positions = new Float32Array(2 * 3);
		geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geom.setDrawRange(0, 0);
		const mat = new THREE.LineBasicMaterial({
			color: 0xffffff,
			linewidth: 2,
		});
		const line = new THREE.Line(geom, mat);
		line.raycast = () => {};
		return line;
	}, []);

	useFrame(({ camera, scene }) => {
		const line = lineRef.current;
		if (!line) return;

		if (!visible) {
			line.visible = false;
			return;
		}

		const ballPos = ballPositionRef.current?.[cueBallId];
		if (!ballPos) {
			line.visible = false;
			return;
		}

		const dirX = ballPos[0] - camera.position.x;
		const dirZ = ballPos[2] - camera.position.z;
		const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
		if (len < 1e-6) {
			line.visible = false;
			return;
		}

		const dx = dirX / len;
		const dz = dirZ / len;
		workDirection.set(dx, 0, dz);
		workOrigin.set(ballPos[0], ballPos[1], ballPos[2]);

		let minDist = MAX_DISTANCE;

		// 1. 壁・クッション・障害物はレイキャストで検出
		//    ヒット距離からBALL_RADIUSを引いて、キュー球の半径分を補正
		raycaster.set(workOrigin, workDirection);
		raycaster.far = MAX_DISTANCE;

		// 距離昇順でソート済み（Three.js仕様）の結果から、
		// ボール（SphereGeometry）をスキップして最初の壁・障害物を探す
		const intersects = raycaster.intersectObjects(scene.children, true);
		for (const hit of intersects) {
			if (hit.object.name === cueBallId) continue;
			if (
				hit.object instanceof THREE.Mesh &&
				hit.object.geometry instanceof THREE.SphereGeometry
			) {
				continue;
			}
			const adjusted = hit.distance - BALL_RADIUS;
			if (adjusted > 0 && adjusted < minDist) {
				minDist = adjusted;
			}
			break;
		}

		// 2. ボール同士の衝突はballPositionRefから直接判定
		for (const id of visibleBallIds) {
			if (id === cueBallId) continue;
			const pos = ballPositionRef.current?.[id];
			if (!pos) continue;

			const t = rayCircleIntersect(
				workOrigin.x,
				workOrigin.z,
				dx,
				dz,
				pos[0],
				pos[2],
				COLLISION_RADIUS,
			);
			if (t !== null && t < minDist) {
				minDist = t;
			}
		}

		// 始点(キュー球)→終点(最も近い衝突点)の2頂点でラインバッファを更新し、
		// needsUpdate で GPU への再アップロードを要求する
		const geom = lineObject.geometry;
		const attr = geom.getAttribute("position");
		const arr = attr.array;

		arr[0] = ballPos[0];
		arr[1] = LINE_Y;
		arr[2] = ballPos[2];
		arr[3] = ballPos[0] + dx * minDist;
		arr[4] = LINE_Y;
		arr[5] = ballPos[2] + dz * minDist;

		attr.needsUpdate = true;
		geom.setDrawRange(0, 2);
		line.visible = true;
	});

	return <primitive object={lineObject} ref={lineRef} />;
}
