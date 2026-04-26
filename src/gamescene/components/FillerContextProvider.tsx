import { createContext, type ReactNode, useContext, useState } from "react";

type BlockContextType = {
	isAllHidden: boolean;
	hideAll: () => void;
	resetBlocks: () => void;
	isProcessing: boolean;
	startProcessing: () => void;
	stopProcessing: () => void;
};

const BlockContext = createContext<BlockContextType | undefined>(undefined);

type Props = {
	children: ReactNode;
};

export const BlockProvider = ({ children }: Props) => {
	const [isAllHidden, setIsAllHidden] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	const hideAll = () => setIsAllHidden(true);
	const resetBlocks = () => setIsAllHidden(false);
	const startProcessing = () => setIsProcessing(true);
	const stopProcessing = () => setIsProcessing(false);

	return (
		<BlockContext.Provider
			value={{
				isAllHidden,
				hideAll,
				resetBlocks,
				isProcessing,
				startProcessing,
				stopProcessing,
			}}
		>
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
