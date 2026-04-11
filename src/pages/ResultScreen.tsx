import { useLocation, useNavigate } from "react-router-dom";

type ResultState = {
	levelId: string;
	levelName: string;
	shotLimit: number;
	shotsUsed: number;
	remainingBalls: number;
	success: boolean;
};

export function ResultScreen() {
	const navigate = useNavigate();
	const location = useLocation();
	const state = location.state as ResultState | undefined;

	if (!state) {
		return (
			<div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#2f1b17_0%,_#141414_45%,_#090909_100%)] text-white px-4 py-10 flex items-center justify-center">
				<div className="w-full max-w-xl rounded-2xl border border-white/20 bg-black/45 p-8 text-center">
					<p className="text-white/80">リザルト情報が見つかりませんでした。</p>
					<button
						type="button"
						onClick={() => navigate("/")}
						className="mt-6 inline-flex items-center justify-center rounded-xl bg-amber-300 text-stone-900 px-6 py-3 font-bold hover:bg-amber-200 transition-colors"
					>
						メニューへ戻る
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#2f1b17_0%,_#141414_45%,_#090909_100%)] text-white px-4 py-10 flex items-center justify-center">
			<div className="w-full max-w-2xl rounded-2xl border border-amber-100/30 bg-black/45 backdrop-blur-sm p-8 md:p-10 text-center">
				<p className="text-xs tracking-[0.35em] text-amber-300/90">RESULT</p>
				<h1 className="mt-3 text-4xl md:text-6xl font-black italic text-amber-100">
					{state.success ? "CLEAR" : "FAILED"}
				</h1>
				<p className="mt-2 text-amber-100/80">{state.levelName}</p>

				<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
					<div className="rounded-xl bg-white/5 border border-white/10 p-4">
						<p className="text-xs text-white/60">使用打数</p>
						<p className="mt-1 text-2xl font-bold">{state.shotsUsed}</p>
					</div>
					<div className="rounded-xl bg-white/5 border border-white/10 p-4">
						<p className="text-xs text-white/60">打数制限</p>
						<p className="mt-1 text-2xl font-bold">{state.shotLimit}</p>
					</div>
					<div className="rounded-xl bg-white/5 border border-white/10 p-4">
						<p className="text-xs text-white/60">残りボール</p>
						<p className="mt-1 text-2xl font-bold">{state.remainingBalls}</p>
					</div>
				</div>

				<div className="mt-8 flex flex-col md:flex-row gap-3 justify-center">
					<button
						type="button"
						onClick={() => navigate(`/play/${state.levelId}`)}
						className="rounded-xl bg-amber-300 text-stone-900 px-6 py-3 font-bold hover:bg-amber-200 transition-colors"
					>
						リトライ
					</button>
					<button
						type="button"
						onClick={() => navigate("/")}
						className="rounded-xl bg-white/15 text-white px-6 py-3 font-bold border border-white/20 hover:bg-white/25 transition-colors"
					>
						メニュー
					</button>
				</div>
			</div>
		</div>
	);
}
