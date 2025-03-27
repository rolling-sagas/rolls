import { ExportButton } from "./export-button";
import { ImportButton } from "./import-button";
import { PlayModeButton } from "./playmode-button";
import { DarkModeSwitch } from "./darkmode-switch";
import { KeyInputButton } from "./keyinput-button";

const ToolsBar = () => {
	return (
		<div className="fixed left-0 top-0 bottom-0 w-fit p-2 flex flex-col">
			<div className="flex-grow flex flex-col gap-2">
				<ExportButton />
				<ImportButton />
				<PlayModeButton />
			</div>
			<div>
				<KeyInputButton />
				<DarkModeSwitch />
			</div>
		</div>
	);
};

export default ToolsBar;
