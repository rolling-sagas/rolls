import { useRef, useEffect } from "react";

import ace from "https://cdn.jsdelivr.net/npm/ace-builds@1.39.0/src-min-noconflict/ace/+esm";
ace.config.set(
	"basePath",
	"https://cdn.jsdelivr.net/npm/ace-builds@1.39.0/src-min-noconflict",
);

import { useTheme } from "@/components/theme-provider";

const Editor = ({ code, lang, onChange, onError, readOnly = false }) => {
	const { darkMode } = useTheme();
	const editorRef = useRef(null);
	const aceEditorRef = useRef(null);

	useEffect(() => {
		aceEditorRef.current = ace.edit(editorRef.current);
		const editor = aceEditorRef.current;
		// Editor options
		editor.setOptions({
			tabSize: 2,
			fontSize: 12,
			showGutter: true,
			highlightActiveLine: true,
			wrap: false, // Word wrap
			showPrintMargin: false,
		});

		editor.renderer.setPadding(4);
		editor.renderer.setScrollMargin(4);

		editor.session.on("change", () => {
			onChange?.(editor.session.getValue());
		});

		editor.session.on("changeAnnotation", () => {
			onError?.(editor.session.getAnnotations());
		});

		return () => {
			editor.destroy();
		};
	}, []);

	useEffect(() => {
		aceEditorRef.current.session.setMode(`ace/mode/${lang}`);
	}, [lang]);

	useEffect(() => {
		const editor = aceEditorRef.current;
		const session = editor.session;

		if (code !== session.getValue()) {
			const cursorPosition = editor.getCursorPosition();

			// Check if the session is empty
			if (session.getValue().trim() === "") {
				// For empty session, simply setValue to make it the initial history
				session.setValue(code, -1);
			} else {
				// For non-empty session, use replace with undo groups
				session.markUndoGroup();
				session.doc.replace(
					{
						start: { row: 0, column: 0 },
						end: {
							row: session.doc.getAllLines().length - 1,
							column: session.doc.getLine(session.doc.getAllLines().length - 1)
								.length,
						},
					},
					code,
				);
				session.markUndoGroup();
			}

			editor.moveCursorToPosition(cursorPosition);
			editor.renderer.scrollCursorIntoView();
		}
	}, [code]);

	useEffect(() => {
		aceEditorRef.current.setTheme(
			darkMode ? "ace/theme/github_dark" : "ace/theme/github_light_default",
		);
	}, [darkMode]);

	useEffect(() => {
		aceEditorRef.current.setReadOnly(readOnly);
	}, [readOnly]);

	return <div ref={editorRef} className="w-full h-full" />;

	//return (
	//	<AceEditor
	//		mode={lang}
	//		onChange={onChange}
	//		onValidate={onError}
	//		theme={darkMode ? "github_dark" : "github_light_default"}
	//		name="ace-editor"
	//		width="100%"
	//		height="100%"
	//		value={code}
	//		minLines={1}
	//		maxLines={readOnly ? 5 : undefined}
	//		wrapEnabled={false}
	//		showGutter={!readOnly}
	//		readOnly={readOnly}
	//		highlightActiveLine={!readOnly}
	//		onLoad={function (editor) {
	//			if (!readOnly) {
	//				editor.renderer.setPadding(8);
	//				editor.renderer.setScrollMargin(8);
	//			}
	//		}}
	//	/>
	//);
};

export default Editor;
