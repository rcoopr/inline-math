import { Range } from 'vscode';

interface ExtensionConfigType {
	/**
	 * If extension is enabled.
	 */
	enabled: boolean;
	/**
	 * Font family of inline message.
	 */
	fontFamily: string;
	/**
	 * Font weight of inline message.
	 */
	fontWeight: string;
	/**
	 * Font size of inline message.
	 */
	fontSize: string;
	/**
	 * When enabled - shows inline message in italic font style.
	 */
	fontStyleItalic: boolean;
	/**
	 * Distance between the last word on the line and the start of inline message.
	 */
	margin: string;
	/**
	 * Inner margin of the inline message.
	 */
	padding: string;
	/**
	 * Border radius of the inline message.
	 */
	borderRadius: string;
	/**
	 * Template used for all inline messages. Interpolates `$message`, `$source`, `$code`, `$count`, `$severity`.
	 */
	messageTemplate: string;
	/**
	 * Cut off inline message if it's longer than this value.
	 */
	messageMaxChars: number;
	/**
	 * Adds delay before showing diagnostic.
	 */
	delay?: number;
}

export type ExtensionConfig = Readonly<ExtensionConfigType>;

export type Evaluation = {
	result: string | null;
	source: string;
	range: Range;
};

export interface AggregatedEvaluations {
	[lineNumber: string]: Evaluation;
}

/**
 * All command ids contributed by this extensions.
 */
export const enum CommandId {
	toggle = 'inlineMath.toggle',
	copyResult = 'inlineMath.copyResult'
}

export const enum Constants {
	/**
	 * Prefix used for all settings of this extension.
	 */
	SettingsPrefix = 'inlineMath',
	MergeConflictSymbol1 = '<<<<<<<',
	MergeConflictSymbol2 = '=======',
	MergeConflictSymbol3 = '>>>>>>>',
}