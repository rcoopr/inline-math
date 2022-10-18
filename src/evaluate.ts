import LRU from 'lru-cache';
import { evaluate } from 'mathjs';
import { Range, Selection, TextEditor } from 'vscode';
import { Evaluation } from './types';

const resultsCache = new LRU({
  max: 500,

  // maxSize: 240,
  // // @ts-expect-error we will only store strings
  // sizeCalculation: (s, k) => s.length,
});

export function getEvaluations(editor: TextEditor): Evaluation[] {
  const evaluations: Evaluation[] = [];

  for (const selection of editor.selections) {
    const evaluation = getEvaluation(editor, selection);

    if (evaluation) {
      evaluations.push(evaluation);
    }
  }

  return evaluations;
}

function getEvaluation(editor: TextEditor, selection: Selection) {
  const start = selection.isReversed ? selection.active : selection.anchor;
  const end = selection.isReversed ? selection.anchor : selection.active;
  const line = editor.document.lineAt(end.line).range;

  const range: Range = selection.isEmpty ? line : selection;
  const text = editor.document.getText(range).replace(/([\r\n]|  )+(\/\/\s)?/g, ' ');

  if (text.length < 3) {
    return undefined;
  }

  const { result, source } = getResult(text);

  if (result === undefined) {
    return undefined;
  }

  const evaluation: Evaluation = {
    result,
    source,
    range: new Range(start, line.end),
  };

  return evaluation;
}

function getResult(text: string): { result: string; source: string } {
  let result = resultsCache.get(text) as string | undefined;

  for (const subSelection of generateSubselections(text)) {
    const source = subSelection.join(' ').trim();

    if (!result) {
      try {
        const raw = evaluate(source);
        result = raw.toString();
        resultsCache.set(text, result);
      } catch (_) {
        // Error during evaluation - expected.
        // In this case, do not return - try the next subSelection
      }
    }

    if (isDesirableResult(source, result)) {
      return {
        result,
        source,
      };
    }
  }

  return {} as { result: string; source: string };
}

function isDesirableResult(source: string, result: string | undefined): result is string {
  return (
    result !== undefined &&
    result !== source &&
    source !== `'${result}'` &&
    !result.startsWith('function')
  );
}

function* generateSubselections(text: string) {
  const parts = text.split(' ');

  for (let size = parts.length; size > 0; size--) {
    for (let offset = 0; offset <= parts.length - size; offset++) {
      yield parts.slice(offset, size + offset);
    }
  }
}
