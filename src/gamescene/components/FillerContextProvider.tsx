import { createContext, type ReactNode, useContext, useState } from "react";

type BlockContextType = {
	isAllHidden: boolean;
	hideAll: () => void;
	resetBlocks: () => void;
};

const BlockContext = createContext<BlockContextType | undefined>(undefined);

type Props = {
	children: ReactNode;
};

export const BlockProvider = ({ children }: Props) => {
	const [isAllHidden, setIsAllHidden] = useState(false);

	const hideAll = () => setIsAllHidden(true);
	const resetBlocks = () => setIsAllHidden(false);

	return (
		<BlockContext.Provider value={{ isAllHidden, hideAll, resetBlocks }}>
			{children}
		</BlockContext.Provider>
	);
};

export const useBlock = () => {
	const context = useContext(BlockContext);

	if (!context) {
		throw new Error("useBlock must be used within BlockProvider");
	}

	return context;
};
