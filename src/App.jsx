import "./App.css";
import { Columns } from "@/components/columns";
import Messages from "@/components/messages";
import Library from "@/components/library";
import { ThemeProvider } from "@/components/theme-provider";
import { useStore } from "@/lib/store";
import ToolsBar from "@/components/toolsbar";
import { Modal } from "@/components/modal";
import DiceBoxComponent from "./components/dice";

function App() {
	const playMode = useStore((state) => state.playMode);
	return (
		<ThemeProvider defaultTheme="system">
			<ToolsBar />
			<Columns>
				<Messages />
				{!playMode && <Library />}
			</Columns>
			<DiceBoxComponent />
			<Modal />
		</ThemeProvider>
	);
}

export default App;
