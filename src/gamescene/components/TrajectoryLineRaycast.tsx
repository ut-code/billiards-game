import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BALL_RADIUS } from "../constants/physics";

const DOT_Y = 0.05;
const MAX_DISTANCE = 100;

const DOT_SPACING = 0.08;
const DOT_SIZE = 3;
const MAX_DOTS = 128;
const DOT_START_OFFSET = BALL_RADIUS * 1.5;

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

type VisibleCollider = { id: string; radius: number };

type TrajectoryLineRaycastProps = {
	ballPositionRef: React.RefObject<Record<string, [number, number, number]>>;
	cueBallId: string;
	visibleBalls: VisibleCollider[];
	visible: boolean;
};

export function TrajectoryLineRaycast({
	ballPositionRef,
	cueBallId,
	visibleBalls,
	visible,
}: TrajectoryLineRaycastProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const raycaster = useMemo(() => new THREE.Raycaster(), []);
	const workDirection = useMemo(() => new THREE.Vector3(), []);
	const workOrigin = useMemo(() => new THREE.Vector3(), []);

	const pointsObject = useMemo(() => {
		const geom = new THREE.BufferGeometry();
		const positions = new Float32Array(MAX_DOTS * 3);
		geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geom.setDrawRange(0, 0);
		const mat = new THREE.PointsMaterial({
			color: 0xffffff,
			size: DOT_SIZE,
			sizeAttenuation: false,
			transparent: true,
			opacity: 0.9,
		});
		const points = new THREE.Points(geom, mat);
		points.raycast = () => {};
		return points;
	}, []);

	useFrame(({ camera, scene }) => {
		const points = pointsRef.current;
		if (!points) return;

		if (!visible) {
			points.visible = false;
			return;
		}

		const ballPos = ballPositionRef.current?.[cueBallId];
		if (!ballPos) {
			points.visible = false;
			return;
		}

		const dirX = ballPos[0] - camera.position.x;
		const dirZ = ballPos[2] - camera.position.z;
		const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
		if (len < 1e-6) {
			points.visible = false;
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
		for (const ball of visibleBalls) {
			if (ball.id === cueBallId) continue;
			const pos = ballPositionRef.current?.[ball.id];
			if (!pos) continue;

			const collisionRadius = BALL_RADIUS + ball.radius;
			const t = rayCircleIntersect(
				workOrigin.x,
				workOrigin.z,
				dx,
				dz,
				pos[0],
				pos[2],
				collisionRadius,
			);
			if (t !== null && t < minDist) {
				minDist = t;
			}
		}

		// キュー球から衝突点まで等間隔にドットを配置
		const geom = pointsObject.geometry;
		const attr = geom.getAttribute("position");
		const arr = attr.array;

		let dotCount = 0;
		for (
			let d = DOT_START_OFFSET;
			d < minDist && dotCount < MAX_DOTS;
			d += DOT_SPACING
		) {
			const idx = dotCount * 3;
			arr[idx] = ballPos[0] + dx * d;
			arr[idx + 1] = DOT_Y;
			arr[idx + 2] = ballPos[2] + dz * d;
			dotCount++;
		}

		attr.needsUpdate = true;
		geom.setDrawRange(0, dotCount);
		points.visible = true;
	});

	return <primitive object={pointsObject} ref={pointsRef} />;
}
