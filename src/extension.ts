import { Disposable, ExtensionContext, TextEditorDecorationType, workspace } from 'vscode';
import { registerAllCommands } from './commands';
import { setDecorationStyle } from './decorations';
import { updateCursorChangeListener } from './event-listeners';
import { Constants, Evaluation, ExtensionConfig } from './types';

/**
 * All user settings.
 */
export let $config: ExtensionConfig;

export abstract class Globals {
	static decorations: {
		[lineNumber: number]: Evaluation
	};
	static decorationType: TextEditorDecorationType;

	static onDidChangeActiveTextEditor: Disposable | undefined;
	static onDidChangeVisibleTextEditors: Disposable | undefined;
	static onDidChangeCursor: Disposable | undefined;
	static onDidChangeDocument: Disposable | undefined;
}



/**
 * - Update all global variables
 * - Update all decoration styles
 * - Update decorations for all visible editors
 * - Update all event listeners
 */
export function updateEverything(context: ExtensionContext) {
	setDecorationStyle(context);
	// updateDecorationsForAllVisibleEditors();

	// updateChangeVisibleTextEditorsListener();
	updateCursorChangeListener();
	// updateDocumentChangeListener();
	// updateChangedActiveTextEditorListener();
}


/**
 * Dispose all known disposables (except `onDidChangeConfiguration`).
 */
export function disposeEverything() {
	Globals.decorationType?.dispose();

	Globals.onDidChangeVisibleTextEditors?.dispose();
	Globals.onDidChangeActiveTextEditor?.dispose();
	Globals.onDidChangeCursor?.dispose();
}


export function activate(context: ExtensionContext) {
	function updateConfigAndEverything() {
		$config = workspace.getConfiguration().get(Constants.SettingsPrefix) as ExtensionConfig;
		disposeEverything();
		if ($config.enabled) {
			updateEverything(context);
		}
	}

	updateConfigAndEverything();
	registerAllCommands(context);

	context.subscriptions.push(workspace.onDidChangeConfiguration(configurationChangeEvent => {
		if (configurationChangeEvent.affectsConfiguration(Constants.SettingsPrefix)) {
			updateConfigAndEverything();
		}
	}));
}

export function deactivate() { }
