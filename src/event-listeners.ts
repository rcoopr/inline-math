import debounce from 'lodash.debounce';
import { window, workspace } from 'vscode';
import { updateDecorations, updateDecorationsForAllVisibleEditors } from './decorations';
import { $config, Decorator } from './extension';

/**
 * Update listener for when active editor changes.
 */
export function updateChangedActiveTextEditorListener(): void {
  Decorator.onDidChangeActiveTextEditor?.dispose();

  Decorator.onDidChangeActiveTextEditor = window.onDidChangeActiveTextEditor((textEditor) => {
    if (textEditor) {
      updateDecorations(textEditor);
    }
  });
}

/**
 * Update listener for when visible editors change.
 */
export function updateChangeVisibleTextEditorsListener(): void {
  Decorator.onDidChangeVisibleTextEditors?.dispose();

  Decorator.onDidChangeVisibleTextEditors = window.onDidChangeVisibleTextEditors(
    updateDecorationsForAllVisibleEditors
  );
}

/**
 * Update listener for when active selection (cursor) moves.
 */
export function updateCursorChangeListener(): void {
  Decorator.onDidChangeCursor?.dispose();
  const debouncedUpdateDecorations = debounce(() => updateDecorations(), $config.delay);

  Decorator.onDidChangeCursor = window.onDidChangeTextEditorSelection(() => {
    debouncedUpdateDecorations();
  });
}

/**
 * Update listener for when active selection (cursor) moves.
 */
export function updateDocumentChangeListener(): void {
  Decorator.onDidChangeDocument?.dispose();
  const debouncedUpdateDecorations = debounce(() => updateDecorations(), $config.delay);

  Decorator.onDidChangeDocument = workspace.onDidChangeTextDocument((e) => {
    // const activeEditor = window.activeTextEditor;
    // if (e.document.uri === activeEditor?.document.uri) {
    debouncedUpdateDecorations();
    // }
  });
}
