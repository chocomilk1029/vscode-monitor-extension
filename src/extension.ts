import * as vscode from 'vscode';
import { WebviewPanel } from './webviewPanel';
import { COMMAND_STUDENT_ID, COMMAND_REFRESH} from './constants';
import { Monitor } from './monitor';

var monitor: Monitor;

export function activate(context: vscode.ExtensionContext) {
	
	monitor = new Monitor(context.extensionUri);
	monitor.initialize();

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(WebviewPanel.viewType, monitor.panel)
	);

	context.subscriptions.push(monitor);
	
}

// this method is called when your extension is deactivated
export function deactivate() {
	monitor.uploadContent();
	monitor.dispose();
}
