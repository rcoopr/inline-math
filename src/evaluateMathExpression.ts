import LRU from 'lru-cache';
import { evaluate } from 'mathjs';
import { Range, TextEditor } from 'vscode';
import { Evaluation } from './types';

function* generateSubselections(text: string) {
  const parts = text.split(' ');

  for (let size = parts.length; size > 0; size--) {
    for (let offset = 0; offset <= parts.length - size; offset++) {
      yield parts.slice(offset, size + offset);
    }
  }
}

const resultsCache = new LRU({
  max: 500,
});

function getResult(text: string): { result: string; source: string } {
  for (const subSelection of generateSubselections(text)) {
    const source = subSelection.join(' ');
    let result: any = resultsCache.get(source);
    // let result: any;

    try {
      if (!result) {
        const raw = evaluate(source);
        result = raw.toString();
        resultsCache.set(source, result);
      }
      if (result) {
        return {
          result,
          source,
        };
      }
    } catch (e) {}
  }

  return {} as { result: string; source: string };
}

export function getEvaluations(editor: TextEditor): Evaluation[] {
  const evaluations: Evaluation[] = [];

  for (const selection of editor.selections) {
    let range: Range | undefined = undefined;
    const start = selection.isReversed ? selection.active : selection.anchor;

    if (selection.isEmpty) {
      range = editor.document.lineAt(start.line).range;
    } else {
      range = new Range(start, selection.isReversed ? selection.anchor : selection.active);
    }

    const text = editor.document.getText(range).replace(/([\r\n]|  )+(\/\/\s)?/g, ' ');

    if (text.length < 3) {
      continue;
    }

    const { result, source } = getResult(text);

    if (result === undefined) {
      continue;
    }

    const evaluation: Evaluation = {
      result,
      source,
      range,
    };

    evaluations.push(evaluation);
  }

  return evaluations;
}
