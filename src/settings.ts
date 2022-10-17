import { ConfigurationTarget, workspace } from 'vscode';

/**
 * Update global settings.json file with the new settign value.
 */
export function updateGlobalSetting(settingId: string, newValue: unknown): void {
	const config = workspace.getConfiguration();
	config.update(settingId, newValue, ConfigurationTarget.Global);
}