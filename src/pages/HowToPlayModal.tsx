import { X } from "lucide-react";

type Props = {
	isOpen: boolean;
	onClose: () => void;
};

export function HowToPlayModal({ isOpen, onClose }: Props) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
			<div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-amber-200/20 bg-stone-900 text-amber-50 shadow-2xl">
				{/* Header */}
				<div className="border-b border-white/10 p-6 flex justify-between items-center bg-gradient-to-r from-stone-800 to-stone-900">
					<h2 className="text-2xl font-black italic tracking-wider text-amber-200">
						遊び方
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-white/10 rounded-full transition-colors"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 md:p-8 space-y-8 max-h-[70vh] overflow-y-auto">
					{/* Basic Rule */}
					<section>
						<h3 className="text-sm font-bold tracking-[0.2em] text-amber-400 mb-3 uppercase">
							Basic Rules
						</h3>
						<p className="leading-relaxed text-amber-50/90">
							白い球（キューボール）を打ち、ステージ上のすべての的球を6つのポケットのいずれかに落とすとクリアとなります。
							<span className="block mt-2 text-amber-300 font-bold">
								※各ステージには「打数制限（SHOT
								LIMIT）」があります。制限内に全てのボールを落としましょう。
							</span>
						</p>
					</section>

					{/* Controls */}
					<section>
						<h3 className="text-sm font-bold tracking-[0.2em] text-amber-400 mb-3 uppercase">
							Controls
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="bg-white/5 p-4 rounded-xl border border-white/5">
								<p className="text-xs text-amber-200/60 mb-2">
									視点操作 (Mouse)
								</p>
								<ul className="text-sm space-y-2">
									<li>
										<span className="text-amber-200 font-mono">
											右クリック + Drag:
										</span>{" "}
										平行移動
									</li>
									<li>
										<span className="text-amber-200 font-mono">
											左クリック + Drag:
										</span>{" "}
										視点回転
									</li>
									<li>
										<span className="text-amber-200 font-mono">Scroll:</span>{" "}
										拡大・縮小
									</li>
								</ul>
							</div>
							<div className="bg-white/5 p-4 rounded-xl border border-white/5">
								<p className="text-xs text-amber-200/60 mb-2">
									キュー注目時 (Keyboard)
								</p>
								<ul className="text-sm space-y-2">
									<li>
										<span className="text-amber-200 font-mono font-bold">
											W / S:
										</span>{" "}
										上下回転
									</li>
									<li>
										<span className="text-amber-200 font-mono font-bold">
											A / D:
										</span>{" "}
										左右回転
									</li>
									<li className="text-[10px] text-white/40 pt-1">
										※精密な角度調整が可能です
									</li>
								</ul>
							</div>
						</div>
					</section>

					{/* Gimmicks */}
					<section className="bg-amber-900/20 p-4 rounded-2xl border border-amber-500/20">
						<h3 className="text-sm font-bold tracking-[0.2em] text-amber-400 mb-2 uppercase">
							Gimmicks
						</h3>
						<p className="text-sm leading-relaxed">
							ステージによっては特殊なギミックが登場します。
							障害物の動きを見極め、反動や隙間を利用して戦略的にクリアを目指してください。
						</p>
					</section>
				</div>

				{/* Footer */}
				<div className="p-6 bg-stone-800/50 text-center">
					<button
						type="button"
						onClick={onClose}
						className="px-10 py-3 bg-amber-300 hover:bg-amber-200 text-stone-900 font-bold rounded-xl transition-all active:scale-95"
					>
						閉じる
					</button>
				</div>
			</div>
		</div>
	);
}
