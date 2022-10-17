import { commands, env, ExtensionContext, window } from "vscode";
import { $config, Globals } from "./extension";
import { updateGlobalSetting } from "./settings";
import { CommandId, Constants } from "./types";

export function registerAllCommands(extensionContext: ExtensionContext) {
    const disposableToggleInlineMath = commands.registerCommand(CommandId.toggle, () => {
        updateGlobalSetting(`${Constants.SettingsPrefix}.enabled`, !$config.enabled);
    });

    const disposableCopyResult = commands.registerTextEditorCommand(CommandId.copyResult, editor => {
        if (!$config.enabled) {
            window.showInformationMessage('Inline Math is not enabled');
            return;
        }

        if (Globals.decorations.length === 0) {
            window.showInformationMessage('There\'s no evaluations available.');
            return;
        }

        const decorations = Globals.decorations.slice();
        const copyText = decorations.sort((decorationA, decorationB) => decorationA.range.start.line - decorationB.range.start.line).map(decoration => decoration.renderOptions?.after?.contentText).join('\n');

        env.clipboard.writeText(copyText);
    });

    extensionContext.subscriptions.push(disposableToggleInlineMath, disposableCopyResult);
}