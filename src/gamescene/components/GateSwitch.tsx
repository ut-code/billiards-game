import { useBox } from "@react-three/cannon";
import { useEffect } from "react";
import { OFFSET_Y, PLAY_HEIGHT } from "./billiardTable";
import { useBlock } from "./FillerContextProvider";

export function GateSwitch() {
	const { isAllHidden, hideAll } = useBlock();

	const [ref] = useBox(() => ({
		mass: 0,
		position: [1, (PLAY_HEIGHT + 1) / 2 - OFFSET_Y, 2],
		args: [1, 1, 1],
		type: "Static",
		onCollide: (e) => {
			console.log(e.contact.impactVelocity);

			const threshold = 2; // ← ここが閾値

			if (e.contact.impactVelocity > threshold) {
				hideAll();
			}
		},
	}));

	useEffect(() => {
		console.log("isAllHidden changed:", isAllHidden);
	}, [isAllHidden]);

	return (
		<mesh ref={ref}>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial color="orange" />
		</mesh>
	);
}
