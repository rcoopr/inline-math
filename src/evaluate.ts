import LRU from 'lru-cache';
import { evaluate } from 'mathjs';
import { performance } from 'perf_hooks';
import { Range, Selection, TextEditor } from 'vscode';
import { Evaluation } from './types';

type EvaluationResult = {
  source: string;
  result: string;
  desirable: boolean;
};

/**
 * Cache will contain:
 *  - [Entire line's text as string, { source: subselection, result } ]
 */
const resultCache = new LRU<string, EvaluationResult>({
  max: 300,
});

/**
 * Cache will contain:
 *  - [Subselection, result]
 */
const subselectionCache = new LRU<string, string | null>({
  max: 600,
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

  let res: EvaluationResult = {} as EvaluationResult;
  if (resultCache.has(text)) {
    console.log('cache hit');
    res = resultCache.get(text)!;
  } else {
    console.log('cache miss');
    res = getResult(text);
    resultCache.set(text, res);
  }

  const { result, source, desirable } = res;

  if (desirable) {
    const evaluation: Evaluation = {
      result,
      source,
      range: new Range(start, line.end),
    };

    return evaluation;
  }

  return undefined;
}

function getResult(text: string): EvaluationResult {
  // generateSubselections provide subsets in size order, so we always get the largest subSelection
  for (const subSelection of generateSubselections(text)) {
    const source = subSelection.join(' ').trim();
    if (subselectionCache.has(source)) {
      console.log('subcache hit');
      const result = subselectionCache.get(source);

      if (result) {
        return { result, source, desirable: isDesirableResult(source, result) };
      } else {
        return {} as EvaluationResult;
      }
    } else {
      console.log('subcache miss');
      try {
        // If the string is not calculable, this will throw
        const raw = evaluate(source);

        // So here, we have a result
        const result = raw.toString();
        subselectionCache.set(source, result);

        // Include `desirable` prop here so it is also cached - otherwise could simply add a check to parent function
        return { result, source, desirable: isDesirableResult(source, result) };
      } catch (_) {
        // Error during evaluation - expected.
        // In this case, do not return - try the next subSelection
        subselectionCache.set(source, null);
      }
    }
  }

  return {} as EvaluationResult;
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
