import LRU from 'lru-cache';
import { evaluate } from 'mathjs';
import { Range, Selection, TextEditor } from 'vscode';
import { Evaluation } from './types';

const resultsCache = new LRU<string, { source: string; result: string }>({
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
  // console.log(`{ s: ${source} // r: ${result} // t: ${text} }`);

  if (result) {
    const evaluation: Evaluation = {
      result,
      source,
      range: new Range(start, line.end),
    };

    return evaluation;
  }
  return undefined;
}

function getResult(text: string): { result: string; source: string } {
  let evaluation = resultsCache.get(text);

  if (evaluation) {
    return evaluation;
  }

  if (!evaluation) {
    // generateSubselections provide subsets in size order, so we always get the largest subSelection
    for (const subSelection of generateSubselections(text)) {
      const source = subSelection.join(' ').trim();

      try {
        const raw = evaluate(source);
        const result = raw.toString();
        if (isDesirableResult(source, result)) {
          evaluation = { result, source };
          resultsCache.set(text, evaluation);

          // Early return once a result has been parsed
          return evaluation;
        }
      } catch (_) {
        // Error during evaluation - expected.
        // In this case, do not return - try the next subSelection
      }
    }
  }

  return {} as { result: string; source: string };
}

function isDesirableResult(source: string, result: string | undefined): result is string {
  const trimmed = source.trim();
  return (
    result !== undefined &&
    result !== trimmed &&
    // handles 'source' === result && "source" === result
    result !== trimmed.substring(1, source.length - 1) &&
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
