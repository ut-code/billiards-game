import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { PortalConfig } from "../constants/levels";

type PortalPairProps = {
	portal: PortalConfig;
};

type PortalDiskProps = {
	position: [number, number, number];
	radius: number;
	color: string;
};

function PortalDisk({ position, radius, color }: PortalDiskProps) {
	const yOffset = 0.004;

	const ringMaterial = useMemo(() => {
		return new THREE.MeshStandardMaterial({
			color,
			emissive: color,
			emissiveIntensity: 1.5,
			metalness: 0.15,
			roughness: 0.35,
			transparent: true,
			opacity: 0.95,
		});
	}, [color]);

	useEffect(() => {
		return () => {
			ringMaterial.dispose();
		};
	}, [ringMaterial]);

	return (
		<group position={[position[0], position[1] + yOffset, position[2]]}>
			<mesh rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[radius, 48]} />
				<meshBasicMaterial
					color={color}
					transparent
					opacity={0.3}
					side={THREE.DoubleSide}
				/>
			</mesh>
			<mesh rotation={[Math.PI / 2, 0, 0]} material={ringMaterial}>
				<torusGeometry args={[radius, 0.008, 24, 72]} />
			</mesh>
		</group>
	);
}

export function PortalPair({ portal }: PortalPairProps) {
	const radius = portal.radius ?? 0.12;

	return (
		<>
			<PortalDisk position={portal.entry} radius={radius} color="#1f8dff" />
			<PortalDisk position={portal.exit} radius={radius} color="#ff3d3d" />
		</>
	);
}
