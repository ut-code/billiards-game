import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export function CameraController({ isCharging }: { isCharging: boolean }) {
	const { scene } = useThree();
	const controlsRef = useRef<OrbitControlsImpl | null>(null);
	const targetVec = useMemo(() => new THREE.Vector3(), []);

	useFrame(() => {
		if (isCharging && controlsRef.current) {
			// idが"poolballs0"のオブジェクト（キューボール）をシーン内から探す
			const cueBall = scene.getObjectByName("poolballs0");
			if (cueBall) {
				// ローカル座標ではなく、ワールド座標（実際の移動後の位置）を取得
				cueBall.getWorldPosition(targetVec);

				// カメラのターゲット（焦点）を滑らかに追従させる
				controlsRef.current.target.lerp(targetVec, 0.1);
				controlsRef.current.update();
			}
		}
	});

	return <OrbitControls ref={controlsRef} />;
}
