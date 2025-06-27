import "./App.css";
import { useMemo } from "react";
import { Toaster } from "sonner";
import { Columns } from "@/components/columns";
import Messages from "@/components/messages";
import Library from "@/components/library";
import { ThemeProvider } from "@/components/theme-provider";
import { useStore } from "@/lib/store";
import ToolsBar from "@/components/toolsbar";
import { Modal } from "@/components/modal";
import DiceBoxComponent from "./components/dice";
import { useTheme } from "@/components/theme-provider";

const ToasterContainer = () => {
  const { darkMode } = useTheme();
  const theme = useMemo(() => (darkMode ? "dark" : "light"), [darkMode]);
  return <Toaster theme={theme} />;
};

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
      <ToasterContainer />
    </ThemeProvider>
  );
}

export default App;
