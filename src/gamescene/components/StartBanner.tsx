type StartBannerProps = {
	shotCount: number;
};

export function StartBanner({ shotCount }: StartBannerProps) {
	return (
		<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden">
			{/* 背景のフレアエフェクト */}
			<div className="absolute w-[800px] h-[300px] bg-red-600/20 blur-[120px] rounded-full animate-pulse" />

			<div className="relative flex flex-col items-center">
				{/* 上部の装飾ライン */}
				<div className="w-64 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent mb-6 animate-in slide-in-from-left duration-700" />

				<h1
					className="text-8xl font-black italic tracking-tighter uppercase 
							bg-clip-text text-transparent bg-gradient-to-b from-yellow-200 via-red-500 to-red-900
							drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]
							animate-in zoom-in-90 fade-in duration-300 ease-out"
				>
					{shotCount === 0 ? "Round Start" : "Shot Now"}
				</h1>

				{/* 下部の装飾ラインとサブテキスト */}
				<div className="w-64 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent mt-6 animate-in slide-in-from-right duration-700" />
				<p className="text-white text-lg font-bold tracking-[0.6em] mt-4 drop-shadow-md animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
					{shotCount === 0 ? "READY TO BREAK" : "MAKE THE SHOT"}
				</p>
			</div>
		</div>
	);
}
