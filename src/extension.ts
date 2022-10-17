import { DecorationOptions, Disposable, ExtensionContext, TextEditorDecorationType, workspace } from 'vscode';
import { registerAllCommands } from './commands';
import { setDecorationStyle, updateDecorationsForAllVisibleEditors } from './decorations';
import { updateChangedActiveTextEditorListener, updateChangeVisibleTextEditorsListener, updateCursorChangeListener, updateDocumentChangeListener } from './event-listeners';
import { Constants, ExtensionConfig } from './types';

/**
 * All user settings.
 */
export let $config: ExtensionConfig;

export abstract class Globals {
	static decorations: DecorationOptions[];
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
export function refresh(context: ExtensionContext) {
	setDecorationStyle(context);

	updateCursorChangeListener();
	updateDocumentChangeListener();
	updateDecorationsForAllVisibleEditors();
	updateChangeVisibleTextEditorsListener();
	updateChangedActiveTextEditorListener();
}


/**
 * Dispose all known disposables (except `onDidChangeConfiguration`).
 */
export function dispose() {
	Globals.decorationType?.dispose();

	Globals.onDidChangeVisibleTextEditors?.dispose();
	Globals.onDidChangeActiveTextEditor?.dispose();
	Globals.onDidChangeCursor?.dispose();
}


export function activate(context: ExtensionContext) {
	function updateConfigAndEverything() {
		$config = workspace.getConfiguration().get(Constants.SettingsPrefix) as ExtensionConfig;
		dispose();
		if ($config.enabled) {
			refresh(context);
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
