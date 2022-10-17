import { commands, env, ExtensionContext, window } from "vscode";
import { $config } from "./extension";
import { updateGlobalSetting } from "./settings";
import { CommandId } from "./types";

export function registerAllCommands(extensionContext: ExtensionContext) {
    const disposableToggleErrorLens = commands.registerCommand(CommandId.toggle, () => {
        updateGlobalSetting('inlineMath.enabled', !$config.enabled);
    });

    const disposableCopyProblemMessage = commands.registerTextEditorCommand(CommandId.copyResult, editor => {

        const activeLineNumber = editor.selection.active.line;

        // TODO: Get result at current line
        const activeLineResult = `TODO ${activeLineNumber}`;

        if (!activeLineResult) {
            window.showInformationMessage('There\'s no evaluation at the active line.');
            return;
        }

        env.clipboard.writeText(activeLineResult);
    });

    extensionContext.subscriptions.push(disposableToggleErrorLens, disposableCopyProblemMessage);
}