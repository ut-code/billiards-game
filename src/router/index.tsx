import { BrowserRouter, Route, Routes } from "react-router-dom";
import GameScene from "@/gamescene";

export const AppRouter = () => (
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<GameScene />} />
		</Routes>
	</BrowserRouter>
);
