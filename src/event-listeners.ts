import { window, workspace } from 'vscode';
import { updateDecorationsForAllVisibleEditors, updateDecorationsForEditor } from './decorations';
import { Globals } from './extension';

/**
 * Update listener for when active editor changes.
 */
export function updateChangedActiveTextEditorListener(): void {
    Globals.onDidChangeActiveTextEditor?.dispose();

    Globals.onDidChangeActiveTextEditor = window.onDidChangeActiveTextEditor(textEditor => {
        if (textEditor) {
            updateDecorationsForEditor(textEditor);
        }
    });
}

/**
 * Update listener for when visible editors change.
 */
export function updateChangeVisibleTextEditorsListener(): void {
    Globals.onDidChangeVisibleTextEditors?.dispose();

    Globals.onDidChangeVisibleTextEditors = window.onDidChangeVisibleTextEditors(updateDecorationsForAllVisibleEditors);
}


/**
 * Update listener for when active selection (cursor) moves.
 */
export function updateCursorChangeListener(): void {
    Globals.onDidChangeCursor?.dispose();

    Globals.onDidChangeCursor = window.onDidChangeTextEditorSelection(e => {
        for (const selection of e.selections) {
            if (selection.isEmpty) {
                updateDecorationsForEditor(e.textEditor, selection);
            }
        }
    });
}

/**
 * Update listener for when active selection (cursor) moves.
 */
export function updateDocumentChangeListener(): void {
    Globals.onDidChangeDocument?.dispose();

    Globals.onDidChangeDocument = workspace.onDidChangeTextDocument(e => {
        const activeEditor = window.activeTextEditor;
        if (activeEditor && e.document.uri === activeEditor.document.uri) {
            for (const selection of activeEditor.selections) {
                if (selection.isEmpty) {
                    updateDecorationsForEditor(activeEditor, selection);
                }
            }
        }
    });
}