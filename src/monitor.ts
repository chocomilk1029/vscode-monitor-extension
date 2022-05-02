import * as vscode from 'vscode';
import { Logger } from './logger';
import { WebviewPanel } from './webviewPanel';
import fetch from "node-fetch";

export class Monitor {
    private studentID: string = "";
    private courseID: string = "";
    public logger: Logger;
    public tempLogger: Logger; // it will empty after upload to database
    private uploading: boolean; // check the file going to upload or not since we need to reduce duplicate heartbeat

    private activeTime: number; //should round down to 5min based e.g. 15:01 -> 15:00, 15:07 -> 15:05
    
    private disposable: vscode.Disposable;
    private lastFile: string;
    private lastHeartbeat: number;
    public panel: WebviewPanel;


    constructor(private readonly _extensionUri: vscode.Uri) {
        this.panel = new WebviewPanel(_extensionUri);
    }

    public initialize(): void {
        this.studentID = process.env.USERNAME;
        
        console.log('"vscode-monitor-extension" is now active!');
        
        this.logger = new Logger();
        this.tempLogger = new Logger();
        this.uploading = false;

        this.logger.initialize(this.studentID);
        this.tempLogger.initialize(this.studentID);

        if (process.env.COURSE === undefined) //demo in local computer
        {
            this.courseID = "COMP0000";
            this.logger.courseID = "COMP0000";
        }
        else {
            this.courseID = process.env.COURSE;
            this.logger.courseID = process.env.COURSE;
        }

        this.lastHeartbeat = Date.now();
        this.activeTime = Math.floor(this.lastHeartbeat / (1000 * 60 * 5))*(1000 * 60 * 5);
        this.setupEventListeners();
        // this.setupDBConnection(); 
    }


    private setupEventListeners(): void {
        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(this.onEditor, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this.onEditor, this, subscriptions);
        vscode.workspace.onDidSaveTextDocument(this.onEditor, this, subscriptions);

        vscode.window.onDidChangeTerminalState(this.onTerminal, this, subscriptions);
        vscode.window.onDidChangeActiveTerminal(this.onTerminal, this, subscriptions);
        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    // public setupDBConnection(): void {
    //     this.con.connect(function(err) {
    //         if (err) {
    //             throw err;
    //         }
    //         console.log("DB Connected!");
    //     });
    // }

    private onEditor(): void {
        this.onEvent(true);
    }  

    private onTerminal(): void {
        this.onEvent(false);
    } 

    private idleCheck(time: number): boolean { // if idle for 10mins return true
        return this.lastHeartbeat + (1000 * 60 * 10) < time;
    }

    private uploadCheck(time: number): void { // upload every 3mins
        if (this.activeTime + (1000 * 60 * 3) < time){
            var id = this.tempLogger.studentID;
            var activeTime = this.activeTime;
            var course = this.courseID;
            var date = new Date(activeTime).toISOString().slice(0, 19).replace('T', ' ');

            // const newDate: Date = new Date(activeTime);
            // const insertTime = newDate.toISOString();

            var sql: string = "";
            const userAction = async (request: string) => {
                const response = await fetch('http://172.17.0.1:3005/', {
                        method: 'POST',
                        body: request // string or object
                    });
                    const myJson = await response.json(); //extract JSON from the http response
                    console.log(myJson);
                    // do something with myJson
                    vscode.window.showInformationMessage("Uploaded to database");
            }
            

            // editor
            if (this.tempLogger.editorData.length !== 0) {
                for (var i = 0; i < this.tempLogger.editorData.length; i++){
                    var fileName = this.tempLogger.editorData[i].file;
                    var codedTime = this.tempLogger.editorData[i].codedTime;
                    var fileLine = this.tempLogger.editorData[i].lines;
                    sql = `INSERT INTO EditorRecord (studentID, courseID, activeTime, fileName, codedTime, fileLine) 
                            VALUES ("${id}", "${course}", "${date}", "${fileName}", ${codedTime}, ${fileLine});`; // the sql to upload information
                    userAction(sql); //send request to server to insert record
                    
                    // insert each file as a record
                    // this.con.query(sql, function (err, result) {
                    //     if (err) throw err;
                    //     console.log("Inserted");
                    // });
                }
            }
            // terminal
            if (this.tempLogger.terminalData.length !== 0) {
                for (var i = 0; i < this.tempLogger.terminalData.length; i++){
                    var terminalName = this.tempLogger.terminalData[i].terminal;
                    sql = `INSERT INTO TerminalRecord (studentID, courseID, activeTime, terminalName) 
                            VALUE ("${id}", "${course}", "${date}", "${terminalName}");`; // the sql to upload information
                    // insert each file as a record
                    userAction(sql); //send request to server to insert record

                    // this.con.query(sql, function (err, result) {
                    //     if (err) throw err;
                    //     console.log("Inserted");
                    // });
                }
            }

            this.activeTime = this.activeTime + (1000 * 60 * 3); 
            // renew the logger
            this.tempLogger = new Logger();
            this.tempLogger.initialize(this.studentID);
        }
        // allow upload after handle all the things
        this.uploading = false;
    }

    private onEvent(editorOrTerminal: boolean): void {              
        let editor = vscode.window.activeTextEditor;
        let terminal = vscode.window.activeTerminal;
        let time: number = Date.now();
        
        if (this.idleCheck(time)) {
            // active while idle for long time ago(10mins) -> don't record the time and start counting again
            this.lastHeartbeat = time;
        } 
        else {
            // editorOrTerminal = true = editor side
            if (editorOrTerminal) {
                let doc = editor.document;
                if (doc) {
                    let file: string = doc.fileName;
                    if (file) {
                        if (this.lastFile !== file) {
                            // writing, changing the file to edit
                            // keep recording
                            if (this.lastFile === undefined || this.lastFile === "") {
                                this.lastFile = file;
                            }
                            this.sendEditorHeartbeat(file, time, editor.selection.start, doc.lineCount);
                            this.lastFile = file;
                            this.lastHeartbeat = time;
                            // vscode.window.showInformationMessage("Opening file: " + file);
                        }
                        else {
                            this.sendEditorHeartbeat(this.lastFile, time, editor.selection.start, doc.lineCount);
                            this.lastHeartbeat = time;
                        }
                    }
                }      
            }
            // editorOrTerminal = false = terminal side
            else {
                let terminalName = terminal.name;
                if (terminalName) {
                    this.sendTerminalHeartbeat(terminalName, time);
                    this.lastHeartbeat = time;
                    // vscode.window.showInformationMessage("Opening terminal: " + terminalName);
                }
            }
            this.panel.refresh(this.logger); 
        }
        // send data to database every 3min and update the activate time
        if (!this.uploading){
            this.uploading = true;
            this.uploadCheck(time);
        }
    }


    public sendEditorHeartbeat (
        file: string,
        time: number,
        selection: vscode.Position,
        lines: number
    ): void {
        // update logging information
        var addTime: number = time - this.lastHeartbeat; // in millsecond
        this.logger.updateEditorInfo(file, addTime/1000, lines);
        this.logger.writeInfotoFile();  

        this.tempLogger.updateEditorInfo(file, addTime/1000, lines);
    }

    public sendTerminalHeartbeat (
        file: string,
        time: number,
    ): void {
        // update logging information
        var addTime: number = time - this.lastHeartbeat; // in millsecond
        this.logger.updateTerminalInfo(file, addTime/1000);
        this.logger.writeInfotoFile();     

        this.tempLogger.updateTerminalInfo(file, addTime/1000);
    }

    // upload content to database when user close the vscode no matter the actived time
    public uploadContent(){
        this.activeTime = Math.floor(this.lastHeartbeat / (1000 * 60 * 5))*(1000 * 60 * 5); // change the activetime, upload in next open
        this.logger.writeInfotoFile(); 
        //this.con.end();   
    }

    public dispose() {
        this.disposable.dispose();
        //clearTimeout(this.getCodingActivityTimeout);
    }

}