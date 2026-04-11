import { Link } from "react-router-dom";
import { LEVELS } from "@/gamescene/constants/levels";

export function MenuScreen() {
	return (
		<div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#2f1b17_0%,_#141414_45%,_#090909_100%)] text-white px-4 py-10 md:py-16">
			<div className="mx-auto max-w-4xl">
				<p className="text-sm tracking-[0.35em] text-amber-300/80 text-center md:text-left">
					SOLO CHALLENGE
				</p>
				<h1 className="mt-3 text-4xl md:text-6xl font-black italic text-amber-100 drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] text-center md:text-left">
					BILLIARDS
				</h1>
				<p className="mt-4 max-w-2xl text-amber-50/75 text-sm md:text-base text-center md:text-left">
					指定打数以内で全ての的球を落とすソロモードです。まずはLevel
					1に挑戦してください。
				</p>

				<div className="mt-10 grid gap-4">
					{LEVELS.map((level) => (
						<div
							key={level.id}
							className="rounded-2xl border border-amber-200/25 bg-black/35 backdrop-blur-sm p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
						>
							<div>
								<h2 className="text-2xl md:text-3xl font-bold text-amber-100">
									{level.name}
								</h2>
								<p className="mt-1 text-amber-100/80">{level.description}</p>
								<p className="mt-2 text-xs tracking-[0.2em] text-amber-300/80">
									SHOT LIMIT {level.shotLimit}
								</p>
							</div>

							<Link
								to={`/play/${level.id}`}
								className="inline-flex items-center justify-center rounded-xl bg-amber-300 text-stone-900 px-6 py-3 font-bold hover:bg-amber-200 transition-colors"
							>
								START
							</Link>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
