import * as vscode from 'vscode';
import { Logger } from './logger';


export class Monitor {
    private studentID: string;
    private logger: Logger;
    

    private disposable: vscode.Disposable;
    private lastFile: string;
    private lastHeartbeat: number;

    constructor() {
        
    }

    public initialize(): void {
        console.log('"vscode-monitor-extension" is now active!');
        let promptOptions = {
            prompt: 'WakaTime Api Key',
            placeHolder: 'Enter your student ID',
            value: "",
            ignoreFocusOut: true
        };
        vscode.window.showInputBox(promptOptions).then(id => {
            if (id !== undefined) {
                // add validation in future
                this.studentID = id;
                this.logger.initialize(this.studentID);
            }
            else {
                vscode.window.setStatusBarMessage('Student ID not provided');
            }
            }
        );
        this.logger = new Logger();
        this.setupEventListeners();
    }


    private setupEventListeners(): void {
        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(this.onChange, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this.onChange, this, subscriptions);
        vscode.workspace.onDidSaveTextDocument(this.onSave, this, subscriptions);

        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    private onChange(): void {
        this.onEvent(false);
    }

    private onSave(): void {
        this.onEvent(true);
      }

    private enoughTimePassed(time: number): boolean {
        return this.lastHeartbeat + 120000 < time;
    }

    private onEvent(isWrite: boolean): void {              
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            let doc = editor.document;
            if (doc) {
                let file: string = doc.fileName;
                if (file) {
                    let time: number = Date.now();
                    if (isWrite || this.enoughTimePassed(time) || this.lastFile !== file) {
                        // this.sendHeartbeat(file, time, editor.selection.start, doc.lineCount, isWrite);
                        this.lastFile = file;
                        this.lastHeartbeat = time;
                        vscode.window.showInformationMessage("Opening file: " + file);
                    }
                }
            }
        }
    }

    public dispose() {
        this.disposable.dispose();
        //clearTimeout(this.getCodingActivityTimeout);
    }

}