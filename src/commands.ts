import { commands, env, ExtensionContext, window } from 'vscode';
import { $config, Decorator } from './extension';
import { updateGlobalSetting } from './settings';
import { CommandId, Constants } from './types';

export function registerAllCommands(extensionContext: ExtensionContext) {
  const disposableToggleInlineMath = commands.registerCommand(CommandId.toggle, () => {
    window.showInformationMessage(`Inline Math ${$config.enabled ? 'disabled' : 'enabled'}`);
    updateGlobalSetting(`${Constants.SettingsPrefix}.enabled`, !$config.enabled);
  });

  const disposableCopyResult = commands.registerTextEditorCommand(CommandId.copyResult, () => {
    if (!$config.enabled) {
      window.showInformationMessage('Inline Math is not enabled');
      return;
    }

    if (Decorator.decorations.length === 0) {
      window.showInformationMessage("There's no evaluations available.");
      return;
    }

    const decorations = Decorator.decorations.slice();
    const copyText = decorations
      .sort(
        (decorationA, decorationB) => decorationA.range.start.line - decorationB.range.start.line
      )
      .map((decoration) => decoration.renderOptions?.after?.contentText)
      .join('\n');

    env.clipboard.writeText(copyText);
  });

  extensionContext.subscriptions.push(disposableToggleInlineMath, disposableCopyResult);
}
