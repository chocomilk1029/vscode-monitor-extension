import * as vscode from 'vscode';
import { Monitor } from './monitor';
import { Logger } from './logger';

export class WebviewPanel implements vscode.WebviewViewProvider {

	public static readonly viewType = 'monitorPanel';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { 

	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, null);
	}

	public refresh(content: Logger) {
		if (this._view) {
			//this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			this._view.webview.html = this._getHtmlForWebview(this._view.webview, content);
		}
	}


	private _getHtmlForWebview(webview: vscode.Webview, content: Logger) {

		var result = "";
		var i = 0;
		if (content !== null) {
			result += "<b>Studnet: </b>" + content.studentID + "<br>";
			result += "<b>Course: </b>" + content.courseID + "<br>";
			result += "<b>File: </b>";
			if (content.editorData.length !== 0) {
				result += "<dl>";
				for (i = 0; i < content.editorData.length; i++){
					result += "<dt>" + content.editorData[i].file + "</dt>";
					result += "<dd>" + "Total Coded time: " + content.editorData[i].changeSecondToTime(); + "</dd>";
					result += "<dd>" + "Lines: " + content.editorData[i].lines + "</dd>";
				}
				result += "</dl><br>";
			}
			else {
				result += "no record found<br>";
			}
			// terminal data
			result += "<b>Terminal used: </b>";
			if (content.terminalData.length !== 0) {
				result += "<dl>";
				for (i = 0; i < content.terminalData.length; i++){
					result += "<dt>" + content.terminalData[i].terminal + "</dt>";
				}
				result += "</dl><br>";
			}
		}

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
					
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<style>
				dl {
					border: 1px solid black;
				}
				</style>

			</head>
			<body>
				<h4> Current Activity </h2>
				<br>
				${result}
				<br>
			</body>
			</html>`;
	}
}
