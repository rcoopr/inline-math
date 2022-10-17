import LRU from 'lru-cache';
import { evaluate } from 'mathjs';
import { TextEditor } from 'vscode';
import { AggregatedEvaluations, Evaluation } from './types';

function* generateSubselections(text: string) {
  const parts = text.split(' ');

  for (let size = parts.length; size > 0; size--) {
    for (let offset = 0; offset <= parts.length - size; offset++) {
      yield parts.slice(offset, size + offset);
    }
  }
}

const resultsCache = new LRU({
  max: 500
});

function getResult(text: string): { result: string, source: string } {
  for (const subSelection of generateSubselections(text)) {
    const source = subSelection.join(' ');
    let result: any = resultsCache.get(source);
    const e = evaluate;

    try {
      if (!result) {
        const raw = evaluate(source);
        result = raw.toString();
        resultsCache.set(source, result);
      }
      if (result) {
        return {
          result,
          source
        };
      }
    } catch (e) { }
  }

  return {} as { result: string, source: string };
}

export function getEvaluations(editor: TextEditor): AggregatedEvaluations {
  const evaluations: AggregatedEvaluations = {};

  for (const selection of editor.selections) {
    const start = selection.isReversed ? selection.active : selection.anchor;
    const line = editor.document.lineAt(start.line);

    const { result, source } = getResult(line.text);

    if (result === undefined) {
      continue;
    }

    const evaluation: Evaluation = {
      result: result,
      source: source,
      range: line.range,
    };

    evaluations[selection.start.line] = evaluation;
  }

  return evaluations;
}
