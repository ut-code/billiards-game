import { useCallback, useEffect, useRef, useState } from "react";

type PowerGaugeProps = {
	onConfirm: (power: number) => void;
	onCancel: () => void;
	minForce?: number;
	maxForce?: number;
};

export function PowerGauge({
	onConfirm,
	onCancel,
	minForce = 1.0,
	maxForce = 5.0,
}: PowerGaugeProps) {
	const [power, setPower] = useState(0);
	const animationRef = useRef<number>(0);
	const powerRef = useRef(0);

	const directionRef = useRef(1);

	useEffect(() => {
		const speed = 0.02;
		const animate = () => {
			powerRef.current += speed * directionRef.current;
			if (powerRef.current >= 1) {
				powerRef.current = 1;
				directionRef.current = -1;
			} else if (powerRef.current <= 0) {
				powerRef.current = 0;
				directionRef.current = 1;
			}
			setPower(powerRef.current);
			animationRef.current = requestAnimationFrame(animate);
		};
		animationRef.current = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(animationRef.current);
	}, []);

	const handleConfirm = useCallback(() => {
		onConfirm(minForce + powerRef.current * (maxForce - minForce));
	}, [onConfirm, minForce, maxForce]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCancel();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onCancel]);

	return (
		<div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
			<div className="text-white text-sm">
				Power: {Math.round(power * 100)}%
			</div>
			<div className="w-64 h-8 bg-gray-700 rounded-full overflow-hidden border-2 border-white/30">
				<div
					className="h-full rounded-full transition-none"
					style={{
						width: `${power * 100}%`,
						backgroundColor: `hsl(${(1 - power) * 120}, 80%, 50%)`,
					}}
				/>
			</div>
			<button
				type="button"
				onClick={handleConfirm}
				className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm border border-white/30"
			>
				Shot!
			</button>
			<div className="text-white/50 text-xs">Escでキャンセル</div>
		</div>
	);
}
