import { DecorationInstanceRenderOptions, DecorationOptions, DecorationRenderOptions, ExtensionContext, Range, TextEditor, ThemableDecorationAttachmentRenderOptions, ThemeColor, window } from 'vscode';
import { getEvaluations } from './evaluateMathExpression';
import { $config, Globals } from './extension';
import { AggregatedEvaluations, Constants, Evaluation } from './types';

/**
 * Update all decoration styles: editor, gutter, status bar
 */
export function setDecorationStyle(_extensionContext: ExtensionContext) {
    Globals.decorationType?.dispose();

    const background = new ThemeColor('inlineMath.background');
    const foreground = new ThemeColor('inlineMath.foreground');
    const backgroundLight = new ThemeColor('inlineMath.backgroundLight');
    const foregroundLight = new ThemeColor('inlineMath.foregroundLight');

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

let previousLineNumber = 9999999;
/**
 * Actually apply decorations for editor.
 * @param range Only allow decorating lines in this range.
 */
export function performUpdateDecorations(editor: TextEditor, aggregatedEvaluations: AggregatedEvaluations, range?: Range) {
    const decorationOptions: DecorationOptions[] = [];

    const activeLine = editor.selection.start.line;
    if (activeLine !== previousLineNumber) {
        editor.setDecorations(Globals.decorationType, []);
        previousLineNumber = activeLine;
    }

    const activeLineEvaluation = aggregatedEvaluations[activeLine];

    if (activeLineEvaluation) {
        decorationOptions.push(createDecorationOption(activeLineEvaluation));
    }

    editor.setDecorations(Globals.decorationType, decorationOptions);
}

export function updateDecorationsForAllVisibleEditors() {
    for (const editor of window.visibleTextEditors) {
        updateDecorationsForEditor(editor);
    }
}

/**
 * Update decorations for one editor.
 */
export function updateDecorationsForEditor(editor = window.activeTextEditor, range?: Range) {
    if (!editor) {
        return;
    }

    if (!editor.document.uri.fsPath) {
        return;
    }

    if (editor.viewColumn === undefined) {
        performUpdateDecorations(editor, {});
        return;
    }

    const editorText = editor.document.getText();
    if (
        editorText.includes(Constants.MergeConflictSymbol1) ||
        editorText.includes(Constants.MergeConflictSymbol2) ||
        editorText.includes(Constants.MergeConflictSymbol3)
    ) {
        performUpdateDecorations(editor, {});
        return;
    }

    const aggregatedEvaluations = getEvaluations(editor) ?? {};
    performUpdateDecorations(editor, aggregatedEvaluations, range);
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
 * Variables to replace inside the `messageTemplate` settings.
 */
const enum TemplateVars {
    result = '$result',
    source = '$source',
}