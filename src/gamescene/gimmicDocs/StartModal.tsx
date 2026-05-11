type Props = {
	title: string;
	description: string;
	onClose: () => void;
};

/**
 * ステージ開始時に表示されるギミック説明用のモーダル。
 * UIフレームは共通化し、内容はプロップスで受け取る。
 */
export function StartModal({ title, description, onClose }: Props) {
	return (
		<div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
			<div className="w-full max-w-md rounded-2xl border border-white/20 bg-zinc-900/90 p-8 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)]">
				<div className="mb-2 text-center text-[10px] font-bold tracking-[0.5em] text-blue-400">
					MISSION DETAILS
				</div>
				<h2 className="mb-6 text-center text-4xl font-black tracking-tighter text-white">
					{title}
				</h2>
				<div className="mb-10 min-h-[80px] text-center text-base font-medium leading-relaxed text-zinc-200">
					{description.split("\n").map((line, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: simple static text
						<p key={i} className="mb-1">
							{line}
						</p>
					))}
				</div>
				<button
					type="button"
					onClick={onClose}
					className="w-full rounded-lg bg-blue-600 py-4 font-black tracking-[0.2em] text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95"
				>
					OK
				</button>
			</div>
		</div>
	);
}
