import { useBox } from "@react-three/cannon";
import type { DividerConfig } from "../constants/levels";

type DividerWallProps = {
	config: DividerConfig;
};

export function DividerWall({ config }: DividerWallProps) {
	const [ref] = useBox(() => ({
		mass: 0,
		position: config.position,
		args: config.size,
		type: "Static",
		material: { friction: 0, restitution: 1 },
		userData: { type: "divider" },
	}));

	return (
		<mesh ref={ref}>
			<boxGeometry args={config.size} />
			<meshStandardMaterial color={config.color ?? "#3b3b3b"} />
		</mesh>
	);
}
