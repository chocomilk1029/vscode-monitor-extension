import * as vscode from 'vscode';

import { LOG_FILE_NAME } from './constants';
// import { Logging } from './logging';

// var logger = new Logging();

export function activate(context: vscode.ExtensionContext) {
	
	console.log('"vscode-monitor-extension" is now active!');


	// context.subscriptions.push(
	// 	vscode.commands.registerCommand(LOG_FILE_NAME, function () {
	// 		logger.Recordlatest();
	// 	})
	// );

	let disposable = vscode.commands.registerCommand('vscode-monitor-extension.helloWorld', () => {
		vscode.window.showInformationMessage("Hello World!!!");
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
