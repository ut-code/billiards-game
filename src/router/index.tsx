import { BrowserRouter, Route, Routes } from "react-router-dom";
import GameScene from "@/gamescene";
import { MenuScreen } from "@/pages/MenuScreen";
import { ResultScreen } from "@/pages/ResultScreen";

export const AppRouter = () => (
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<MenuScreen />} />
			<Route path="/play/:levelId" element={<GameScene />} />
			<Route path="/result" element={<ResultScreen />} />
		</Routes>
	</BrowserRouter>
);
