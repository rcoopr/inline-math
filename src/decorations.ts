import { DecorationInstanceRenderOptions, DecorationOptions, DecorationRenderOptions, ExtensionContext, ThemableDecorationAttachmentRenderOptions, ThemeColor, window } from 'vscode';
import { getEvaluations } from './evaluateMathExpression';
import { $config, Globals } from './extension';
import { Constants, Evaluation } from './types';

/**
 * Update all decoration styles: editor, gutter, status bar
 */
export function setDecorationStyle(_extensionContext: ExtensionContext) {
    Globals.decorationType?.dispose();

    const background = new ThemeColor(`${Constants.SettingsPrefix}.background`);
    const foreground = new ThemeColor(`${Constants.SettingsPrefix}.foreground`);
    const backgroundLight = new ThemeColor(`${Constants.SettingsPrefix}.backgroundLight`);
    const foregroundLight = new ThemeColor(`${Constants.SettingsPrefix}.foregroundLight`);

    const onlyDigitsRegExp = /^\d+$/;
    const fontFamily = $config.fontFamily ? `font-family:${$config.fontFamily}` : '';
    const fontSize = $config.fontSize ? `font-size:${onlyDigitsRegExp.test($config.fontSize) ? `${$config.fontSize}px` : $config.fontSize}` : '';
    const marginLeft = onlyDigitsRegExp.test($config.margin) ? `${$config.margin}px` : $config.margin;
    const padding = $config.padding ? `padding:${onlyDigitsRegExp.test($config.padding) ? `${$config.padding}px` : $config.padding}` : '';
    const borderRadius = `border-radius: ${$config.borderRadius || '0'}`;

    const additionalStyles = [fontFamily, fontSize, padding, borderRadius].filter(content => content !== '').join(';');
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

    Globals.decorationType = window.createTextEditorDecorationType(decorationRenderOptions);
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
        editor.setDecorations(Globals.decorationType, []);
    }

    if (editor.viewColumn === undefined) {
        Globals.decorations = [];
        editor.setDecorations(Globals.decorationType, Globals.decorations);
        return;
    }

    const editorText = editor.document.getText();
    if (
        editorText.includes(Constants.MergeConflictSymbol1) ||
        editorText.includes(Constants.MergeConflictSymbol2) ||
        editorText.includes(Constants.MergeConflictSymbol3)
    ) {
        Globals.decorations = [];
        editor.setDecorations(Globals.decorationType, Globals.decorations);
        return;
    }

    const evaluations = getEvaluations(editor) ?? {};
    Globals.decorations = evaluations.map(evaluation => createDecorationOption(evaluation));
    editor.setDecorations(Globals.decorationType, Globals.decorations);
}

/**
 * Generate inline message from template.
 */
export function evaluationToInlineMessage(template: string, evaluation: Evaluation): string | undefined {
    if (evaluation.result === null || $config.messageMaxChars === 0) { return undefined; };
    let message = evaluation.result.toString();

    if (template === TemplateVars.result) {
        // When default template - no need to use RegExps or other stuff.
        return message;
    } else {
        // Message is always present.
        message = template.replace(TemplateVars.result, message);
        /**
         * Count, source & code can be absent.
         * If present - replace them as simple string.
         * If absent - replace by RegExp removing all adjacent non-whitespace symbols with them.
         */
        if (template.includes(TemplateVars.source)) {
            const messageWithSource = message.replace(TemplateVars.source, String(evaluation.source));
            if (messageWithSource.length <= $config.messageMaxChars) {
                message = messageWithSource;
            }
            // if (evaluation.source) {
            // } else {
            // 	result = result.replace(/(\s*?)?(\S*?)?(\$source)(\S*?)?(\s*?)?/, (match, g1: string | undefined, g2, g3, g4, g5: string | undefined) => (g1 || '') + (g5 || ''));
            // }
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

    return {
        range: evaluation.range,
        renderOptions: decorationInstanceRenderOptions,
    };
}

/**
 * Variables to replace inside the `messageTemplate` settings.
 */
const enum TemplateVars {
    result = '$result',
    source = '$source',
}