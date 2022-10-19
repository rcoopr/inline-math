import {
  DecorationInstanceRenderOptions,
  DecorationOptions,
  DecorationRenderOptions,
  ExtensionContext,
  MarkdownString,
  ThemableDecorationAttachmentRenderOptions,
  ThemeColor,
  window,
} from 'vscode';
import { getEvaluations } from './evaluate';
import { $config, Decorator } from './extension';
import { Constants, Evaluation } from './types';

/**
 * Update all decoration styles: editor, gutter, status bar
 */
export function setDecorationStyle(_extensionContext: ExtensionContext) {
  Decorator.decorationType?.dispose();

  const background = new ThemeColor(`${Constants.SettingsPrefix}.background`);
  const foreground = new ThemeColor(`${Constants.SettingsPrefix}.foreground`);
  const backgroundLight = new ThemeColor(`${Constants.SettingsPrefix}.backgroundLight`);
  const foregroundLight = new ThemeColor(`${Constants.SettingsPrefix}.foregroundLight`);

  const onlyDigitsRegExp = /^\d+$/;
  const fontFamily = $config.fontFamily ? `font-family:${$config.fontFamily}` : '';
  const fontSize = $config.fontSize
    ? `font-size:${
        onlyDigitsRegExp.test($config.fontSize) ? `${$config.fontSize}px` : $config.fontSize
      }`
    : '';
  const marginLeft = onlyDigitsRegExp.test($config.margin) ? `${$config.margin}px` : $config.margin;
  const padding = $config.padding
    ? `padding:${onlyDigitsRegExp.test($config.padding) ? `${$config.padding}px` : $config.padding}`
    : '';
  const borderRadius = `border-radius: ${$config.borderRadius || '0'}`;

  const additionalStyles = [fontFamily, fontSize, padding, borderRadius]
    .filter((content) => content !== '')
    .join(';');
  // const scrollbarHack = $config.scrollbarHackEnabled ? 'position:absolute;pointer-events:none;top:50%;transform:translateY(-50%);' : '';

  const afterProps: ThemableDecorationAttachmentRenderOptions = {
    fontStyle: $config.fontStyleItalic ? 'italic' : 'normal',
    fontWeight: $config.fontWeight,
    margin: `0 0 0 ${marginLeft}`,
    textDecoration: `none;${additionalStyles};`,
  };

  const decorationRenderOptions: DecorationRenderOptions = {
    after: {
      ...afterProps,
      backgroundColor: background,
      color: foreground,
    },
    light: {
      after: {
        backgroundColor: backgroundLight,
        color: foregroundLight,
      },
    },
  };

  Decorator.decorationType = window.createTextEditorDecorationType(decorationRenderOptions);
}

export function updateDecorationsForAllVisibleEditors() {
  for (const editor of window.visibleTextEditors) {
    updateDecorations(editor);
  }
}

/**
 * Update decorations for one editor.
 */
export function updateDecorations(editor = window.activeTextEditor) {
  if (!editor) {
    return;
  }

  if (!editor.document.uri.fsPath) {
    return;
  }

  // If editor is not active, remove all decorations without altering global store
  if (editor.document.uri !== window.activeTextEditor?.document.uri) {
    editor.setDecorations(Decorator.decorationType, []);
  }

  if (editor.viewColumn === undefined) {
    return Decorator.setDecorations(editor, []);
  }

  const decorations = (getEvaluations(editor) ?? []).map((evaluation) =>
    createDecorationOption(evaluation)
  );
  return Decorator.setDecorations(editor, decorations);
}

/**
 * Generate inline message from template.
 */
export function evaluationToInlineMessage(
  template: string,
  evaluation: Evaluation
): string | undefined {
  if (evaluation.result === null || $config.messageMaxChars === 0) {
    return undefined;
  }
  let message = evaluation.result;

  if (template === TemplateVars.result) {
    // When default template - no need to use RegExps or other stuff.
    return message;
  } else {
    // Message is always present.
    message = template.replace(TemplateVars.result, message);
    /**
     * Source can be absent.
     * If present - replace them as simple string.
     * If absent - replace by RegExp removing all adjacent non-whitespace symbols with them.
     */
    if (template.includes(TemplateVars.source)) {
      let sourceTruncated = evaluation.source;
      const sourceLength = evaluation.source.length;

      if (sourceLength > $config.messageMaxChars) {
        sourceTruncated = sourceTruncated.substring(0, sourceLength - 3) + '...';
      }

      message = message.replace(TemplateVars.source, sourceTruncated);
    }

    return message;
  }
}

/**
 * Utility to create a decoration given an evaluation
 */
function createDecorationOption(evaluation: Evaluation): DecorationOptions {
  const message = evaluationToInlineMessage($config.messageTemplate, evaluation);

  const decorationInstanceRenderOptions: DecorationInstanceRenderOptions = {
    after: {
      contentText: message,
    },
  };

  let hoverMessage: MarkdownString | undefined = undefined;

  if ($config.hoverMessage) {
    hoverMessage = new MarkdownString();

    (hoverMessage.supportHtml = true),
      hoverMessage.appendMarkdown(`
  <table>
  <tr align="left">
    <th>Source</th>
    <td>${evaluation.source}</td>
  </tr>
  <tr align="left">
    <th>Result</th>
    <td>${evaluation.result}</td>
  </tr>
</table>
`);
  }

  return {
    range: evaluation.range,
    renderOptions: decorationInstanceRenderOptions,
    hoverMessage: hoverMessage,
  };
}

/**
 * Variables to replace inside the `messageTemplate` settings.
 */
const enum TemplateVars {
  result = '$result',
  source = '$source',
}
