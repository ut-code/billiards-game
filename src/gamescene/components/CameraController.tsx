import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export function CameraController({ isCharging }: { isCharging: boolean }) {
	const { scene, camera } = useThree();
	const controlsRef = useRef<OrbitControlsImpl | null>(null);
	const targetVec = useMemo(() => new THREE.Vector3(), []);
	const keys = useRef<Record<string, boolean>>({});

	// キーボード入力の状態を管理
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			keys.current[e.key.toLowerCase()] = true;
		};
		const handleKeyUp = (e: KeyboardEvent) => {
			keys.current[e.key.toLowerCase()] = false;
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	useFrame((_, delta) => {
		if (controlsRef.current) {
			const cueBall = scene.getObjectByName("poolballs0");
			if (cueBall) {
				cueBall.getWorldPosition(targetVec);

				if (isCharging) {
					// ターゲットをキューボールに固定し、滑らかに追従させる
					controlsRef.current.target.lerp(targetVec, 0.1);

					// WASDによる視点回転ロジック
					// OrbitControlsの状態を維持しつつ、Cameraの座標を計算して移動させる
					const rotationSpeed = 0.5 * delta; // 秒間あたりの回転速度
					const offset = new THREE.Vector3().subVectors(
						camera.position,
						controlsRef.current.target,
					);
					let changed = false;

					// A/D キーで水平回転 (Y軸中心)
					if (keys.current.a) {
						offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationSpeed);
						changed = true;
					}
					if (keys.current.d) {
						offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotationSpeed);
						changed = true;
					}

					// W/S キーで垂直回転
					if (keys.current.w || keys.current.s) {
						const right = new THREE.Vector3()
							.crossVectors(offset, new THREE.Vector3(0, 1, 0))
							.normalize();
						const angle = keys.current.w ? rotationSpeed : -rotationSpeed;

						// 真上や真下での反転を防ぐための制限（内積を利用）
						const tempOffset = offset.clone().applyAxisAngle(right, angle);
						const upDot = tempOffset
							.clone()
							.normalize()
							.dot(new THREE.Vector3(0, 1, 0));
						if (Math.abs(upDot) < 0.98) {
							offset.copy(tempOffset);
							changed = true;
						}
					}

					if (changed) {
						camera.position.copy(controlsRef.current.target).add(offset);
					}
				}
				controlsRef.current.update();
			}
		}
	});

	return <OrbitControls ref={controlsRef} />;
}
