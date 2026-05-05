import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { AccelerationFloorConfig } from "../constants/levels";

type AccelerationFloorProps = {
	config: AccelerationFloorConfig;
};

export function AccelerationFloor({ config }: AccelerationFloorProps) {
	// 矢印の流れるテクスチャを Canvas API で生成
	const texture = useMemo(() => {
		const canvas = document.createElement("canvas");
		canvas.width = 256;
		canvas.height = 256;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			// 背景を少し暗く
			ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
			ctx.fillRect(0, 0, 256, 256);

			// 矢印の描画設定
			ctx.strokeStyle = "#ffaa00";
			ctx.lineWidth = 20;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";

			// 矢印を描画
			const drawArrow = (yOffset: number) => {
				ctx.beginPath();
				ctx.moveTo(16, yOffset + 112);
				ctx.lineTo(128, yOffset);
				ctx.lineTo(240, yOffset + 112);
				ctx.stroke();
			};

			// y軸マイナス方向が進行方向になるように描画
			// 切れ目なくループするように配置 (16と144でちょうど128px間隔)
			drawArrow(16);
			drawArrow(144);
		}

		const tex = new THREE.CanvasTexture(canvas);
		tex.wrapS = THREE.RepeatWrapping;
		tex.wrapT = THREE.RepeatWrapping;
		// 幅に対して1回、高さはアスペクト比を維持してリピート
		tex.repeat.set(1, config.size[1] / config.size[0]);
		return tex;
	}, [config.size]);

	// メモリリークを防ぐため、コンポーネントのアンマウント時またはテクスチャ再生成時に古いテクスチャを破棄
	useEffect(() => {
		return () => {
			texture.dispose();
		};
	}, [texture]);

	const materialRef = useRef<THREE.MeshStandardMaterial>(null);

	// 毎フレーム、テクスチャをずらして流れるアニメーションを実現
	useFrame((_, delta) => {
		const map = materialRef.current?.map;
		if (map) {
			// テクスチャを上方向（V軸マイナス方向）へスクロールして、矢印の向きに流れるようにする
			// RepeatWrapping を使っているため、オフセットは 0..1 の範囲に正規化して精度低下を防ぐ
			map.offset.y = (((map.offset.y - delta * 2.5) % 1) + 1) % 1;
		}
	});

	// direction ベクトルからY軸の回転角度を計算
	// Z軸(0, 0, 1) を基準とした角度
	const angle = Math.atan2(config.direction[0], config.direction[2]);
	// 矢印（テクスチャの上部）が指定された方向を向くように補正 (+ Math.PI)
	const visualAngle = angle + Math.PI;

	return (
		<group position={config.position} rotation={[0, visualAngle, 0]}>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
				<planeGeometry args={[config.size[0], config.size[1]]} />
				<meshStandardMaterial
					ref={materialRef}
					map={texture}
					transparent
					opacity={0.8}
					emissive="#ffaa00"
					emissiveIntensity={0.2}
				/>
			</mesh>
		</group>
	);
}
