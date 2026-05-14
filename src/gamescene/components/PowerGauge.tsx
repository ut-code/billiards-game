import { useCallback, useEffect, useRef, useState } from "react";

type PowerGaugeProps = {
	onConfirm: (power: number, normalizedPower: number) => void;
	onCancel: () => void;
	minForce?: number;
	maxForce?: number;
};

export function PowerGauge({
	onConfirm,
	onCancel,
	minForce = 1.0,
	maxForce = 10.0,
}: PowerGaugeProps) {
	const [power, setPower] = useState(0);
	const animationRef = useRef<number>(0);
	const powerRef = useRef(0);
	const directionRef = useRef(1);
	const prevTimeRef = useRef<number | null>(null);

	useEffect(() => {
		const speed = 1.5; // 1秒あたりの往復量（0→1に約0.67秒）
		const animate = (timestamp: number) => {
			if (prevTimeRef.current != null) {
				const delta = (timestamp - prevTimeRef.current) / 1000;
				powerRef.current += speed * delta * directionRef.current;
				if (powerRef.current >= 1) {
					powerRef.current = 1;
					directionRef.current = -1;
				} else if (powerRef.current <= 0) {
					powerRef.current = 0;
					directionRef.current = 1;
				}
				setPower(powerRef.current);
			}
			prevTimeRef.current = timestamp;
			animationRef.current = requestAnimationFrame(animate);
		};
		animationRef.current = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(animationRef.current);
	}, []);

	const handleConfirm = useCallback(() => {
		onConfirm(
			minForce + powerRef.current * (maxForce - minForce),
			powerRef.current,
		);
	}, [onConfirm, minForce, maxForce]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCancel();
			if (e.key === " ") {
				e.preventDefault();
				handleConfirm();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onCancel, handleConfirm]);

	const barColor = `hsl(${(1 - power) * 120}, 80%, 50%)`;
	const glowBlur = power * 18;

	return (
		<div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 bg-black/60 rounded-xl px-6 py-4 backdrop-blur-sm border border-white/15">
			<div className="flex items-center gap-3">
				<span className="text-xs tracking-[0.3em] text-white/60 font-bold">
					POWER
				</span>
				<span className="inline-block w-14 text-right text-lg font-black text-amber-100 tabular-nums">
					{Math.round(power * 100)}%
				</span>
			</div>
			<div className="relative w-72 h-8 bg-gray-800 rounded-full overflow-hidden border border-white/20">
				<div
					className="h-full rounded-full transition-none"
					style={{
						width: `${power * 100}%`,
						backgroundColor: barColor,
						boxShadow: `0 0 ${glowBlur}px ${barColor}`,
					}}
				/>
				<div className="absolute inset-y-0 left-1/4 w-px bg-white/25" />
				<div className="absolute inset-y-0 left-1/2 w-px bg-white/25" />
				<div className="absolute inset-y-0 left-3/4 w-px bg-white/25" />
			</div>
			<button
				type="button"
				onClick={handleConfirm}
				className="px-8 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-900 font-bold rounded-xl shadow-lg transition-all"
			>
				Shot!
			</button>
			<div className="text-white/40 text-xs tracking-wide">
				Space / Click でショット　・　Esc でキャンセル
			</div>
		</div>
	);
}
