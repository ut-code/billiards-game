type StartBannerProps = {
	shotCount: number;
	remainingBalls: number;
};

export function StartBanner({ shotCount, remainingBalls }: StartBannerProps) {
	return (
		<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden">
			{/* 背景のフレアエフェクト */}
			<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[800px] h-[300px] bg-red-600/20 blur-[120px] rounded-full animate-pulse" />

			<div className="relative flex flex-col items-center px-4">
				{/* 上部の装飾ライン */}
				<div className="w-[80%] max-w-64 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent mb-6 animate-in slide-in-from-left duration-700" />

				<h1
					className="text-6xl md:text-8xl font-black italic tracking-tight uppercase 
							bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-red-500 to-red-900
							drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]
							animate-in zoom-in-90 fade-in duration-300 ease-out
							py-4 px-6"
				>
					{shotCount === 0 ? "ラウンド開始" : "ショット開始"}
				</h1>

				{/* 下部の装飾ラインとサブテキスト */}
				<div className="w-[80%] max-w-64 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent mt-6 animate-in slide-in-from-right duration-700" />
				<p className="text-white text-base md:text-lg font-bold tracking-[0.3em] sm:tracking-[0.4em] md:tracking-[0.6em] mt-4 drop-shadow-md animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
					{`残り${remainingBalls}ボール`}
				</p>
			</div>
		</div>
	);
}
