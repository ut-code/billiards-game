import { X } from "lucide-react";
import poolballs0 from "@/assets/ballTexture/poolballs0.png";
import poolballs1 from "@/assets/ballTexture/poolballs1.png";
import poolballs2 from "@/assets/ballTexture/poolballs2.png";
import poolballs3 from "@/assets/ballTexture/poolballs3.png";
import poolballs4 from "@/assets/ballTexture/poolballs4.png";
import poolballs5 from "@/assets/ballTexture/poolballs5.png";
import poolballs6 from "@/assets/ballTexture/poolballs6.png";

const targetBalls = [
	poolballs1,
	poolballs2,
	poolballs3,
	poolballs4,
	poolballs5,
	poolballs6,
];

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
							キュー球（白い球）を打ち、ステージ上のすべての的球を6つのポケットのいずれかに落とすとクリアとなります。
							<span className="block mt-2 text-amber-300 font-bold">
								※各ステージには「打数制限（SHOT
								LIMIT）」があります。制限内に全てのボールを落としましょう。
							</span>
						</p>
						{/* Ball illustration */}
						<div className="mt-4 flex flex-col sm:flex-row gap-4">
							<div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center gap-3">
								<p className="text-xs text-amber-200/60 uppercase tracking-widest">
									Cue Ball
								</p>
								<img
									src={poolballs0}
									alt="キューボール"
									className="w-16 h-16 rounded-full object-cover "
								/>
								<p className="text-xs text-center text-amber-50/70">キュー球</p>
							</div>
							<div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center gap-3">
								<p className="text-xs text-amber-200/60 uppercase tracking-widest">
									Target Balls
								</p>
								<div className="grid grid-cols-3 gap-2">
									{targetBalls.map((src, i) => (
										<img
											key={src}
											src={src}
											alt={`的球 ${i + 1}`}
											className="w-10 h-10 rounded-full object-cover"
										/>
									))}
								</div>
								<p className="text-xs text-center text-amber-50/70">的球</p>
							</div>
						</div>
					</section>

					{/* Controls */}
					<section>
						<h3 className="text-sm font-bold tracking-[0.2em] text-amber-400 mb-3 uppercase">
							Controls
						</h3>
						{/* Shot steps */}
						<div className="mb-4 space-y-3">
							<div className="flex gap-3 items-start bg-white/5 rounded-xl p-3 border border-white/5">
								<span className="text-amber-400 font-black text-lg leading-none mt-0.5">
									①
								</span>
								<p className="text-sm">
									<span className="text-amber-200 font-bold">
										キュー球をクリック
									</span>
									<span className="text-amber-50/70">
										{" "}
										— キューが表示され、ゲージが動き始めます
									</span>
								</p>
							</div>
							<div className="flex gap-3 items-start bg-white/5 rounded-xl p-3 border border-white/5">
								<span className="text-amber-400 font-black text-lg leading-none mt-0.5">
									②
								</span>
								<div className="flex-1 space-y-2">
									<p className="text-sm">
										<span className="text-amber-200 font-bold">
											ゲージでパワーを調整
										</span>
										<span className="text-amber-50/70">
											{" "}
											— ゲージが自動で動きます
										</span>
									</p>
									<img
										src="/shot-illustration.png"
										alt="ショット操作の説明"
										className="rounded-lg w-full"
									/>
								</div>
							</div>
							<div className="flex gap-3 items-start bg-white/5 rounded-xl p-3 border border-white/5">
								<span className="text-amber-400 font-black text-lg leading-none mt-0.5">
									③
								</span>
								<p className="text-sm">
									<span className="text-amber-200 font-bold">
										Space または 「Shot!」 ボタンをクリック で発射{"　"}
									</span>
									<span className="text-white/40 text-xs">
										Esc でキャンセル
									</span>
								</p>
							</div>
						</div>
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
