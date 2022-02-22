import * as vscode from 'vscode';

import { COMMAND_STUDENT_ID } from './constants';
import { Monitor } from './monitor';

var monitor: Monitor;

export function activate(context: vscode.ExtensionContext) {
	
	monitor = new Monitor();

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND_STUDENT_ID, function () {
			monitor.initialize();
		})
	);

	context.subscriptions.push(monitor);
	
}

// this method is called when your extension is deactivated
export function deactivate() {
	monitor.dispose();
}
