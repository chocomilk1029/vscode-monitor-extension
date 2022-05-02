import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


// This class aims to log the user information into a json file
export class Logger {
    public studentID: string = "";
    public courseID: string = "";
    private logFile: string = "";
    private homeDir: string = "";
    public editorData: EditorData[] = [];
    public terminalData: TerminalData[] = [];
    private activeTime: number = 0;

    private tempLogger: TempLogger;
    // information to get

    
    public initialize(studentIDInput: string): void {
        this.studentID = studentIDInput;
        this.homeDir = path.join(process.cwd(), "Monitor");
        this.logFile = path.join(this.homeDir, this.studentID + '.json');
        this.activeTime = Date.now();
        this.tempLogger = new TempLogger();

        if (!fs.existsSync(this.homeDir)){
            fs.mkdirSync(this.homeDir, { recursive: true });
        }

        if (fs.existsSync(this.logFile)){ // read the previous info and turns json into object
            const data = fs.readFileSync(this.logFile); //Sync version of fs.readFile
            if (data.length !== 0) //handle empty json file
            {
                const obj = JSON.parse(data.toString());
                // update with the old one
                this.parseObject(obj);
            }  
        }
        else {
            //add read existing file
            fs.writeFile(this.logFile, "", function (err) {
                if (err) {
                    throw err;
                }
                else {
                    console.log('File is created successfully.');
                }
            });
        }

    }

    public async parseObject(obj: any){
        this.activeTime = obj.ActiveTime;
        if (obj.File.length !== 0) {
            for (var i = 0; i < obj.File.length; i++){
                var newRecord = new EditorData;
                newRecord.file = obj.File[i].file;
                newRecord.codedTime = obj.File[i].codedTime;
                newRecord.lines = obj.File[i].lines;
                // push existed record to the list
                this.editorData.push(newRecord);
            }
        }
        if (obj.Terminal.length !== 0) {
            for (var i = 0; i < obj.File.length; i++){
                var newTerRecord = new TerminalData;
                newTerRecord.terminal = obj.Terminal[i].file;
                // this.terminalData[i].codedTime += obj.Terminal[i].codedTime; // it will be always null
                // this.terminalData[i].lines += obj.Terminal[i].lines; // it will be always null

                // push existed record to the list
                this.terminalData.push(newTerRecord);
                // it will be always null
                
            }
        }
    }

    public extractInfotoStr(): string {
        // need to turn this.editorData to JSON
        var i: number;
        // var jsonData : string = "{\n" + "\t\"studentID\": " + this.studentID + ",\"\n\t\"File\": [\n\t\t";
        var jsonData : string = "{" + "\"studentID\": \"" + this.studentID + "\",\"ActiveTime\": " + this.activeTime + ",\"File\": [";
        // editor data
        if (this.editorData.length !== 0) {
            for (i = 0; i < this.editorData.length; i++){
                jsonData += this.editorData[i].infoToJSON() + ",";
            }
            jsonData = jsonData.slice(0, -1);
        }
        // terminal data
        jsonData += "], \"Terminal\": [";
        if (this.terminalData.length !== 0) {
            for (i = 0; i < this.terminalData.length; i++){
                jsonData += this.terminalData[i].infoToJSON() + ",";
            }
            jsonData = jsonData.slice(0, -1);
        }
        jsonData += "]}";

        return jsonData;
    }

    public writeInfotoFile(): void {
        var jsonString : string = "";
        jsonString = this.extractInfotoStr();

        // console.log(jsonString);
        jsonString = JSON.stringify(JSON.parse(jsonString), null, "\t");
        fs.writeFile(this.logFile, jsonString, function (err) {
            if (err) {
                throw err;
            }
            console.log('File is writed successfully.');
        });
        
    }
    
    public updateEditorInfo (
        file: string,
        time: number,
        lines: number,
    ): void {
        var i: number;
        var recorded: boolean = false;
        file = file.replace(/\\/g, "/");
        for(i = 0; i < this.editorData.length; i++) {
            // file already recorded
            if(this.editorData[i].file === file){
                this.editorData[i].codedTime += Math.round(time);
                this.editorData[i].lines = lines;
                recorded = true;
            }
        }
        // add new file record if it is new file record
        if (recorded === false) {
            var newRecord = new EditorData;
            newRecord.file = file;
            newRecord.codedTime = time;
            newRecord.lines = lines;
            // push new record to the list
            this.editorData.push(newRecord);
        }                
    }

    public updateTerminalInfo (
        terminalName: string,
        time: number,
    ): void {
        var i: number;
        var recorded: boolean = false;
        terminalName = terminalName.replace(/\\/g, "/");
        for(i = 0; i < this.terminalData.length; i++) {
            // file already recorded
            if(this.terminalData[i].terminal === terminalName){
                recorded = true;
            }
        }
        // add new file record if it is new file record
        if (recorded === false) {
            var newRecord = new TerminalData;
            newRecord.terminal = terminalName;
            // push new record to the list
            this.terminalData.push(newRecord);
        }                
    }

}

// file based
class EditorData {
    public file: string;
    public codedTime: number;
    public lines: number;

    public initialize(): void {
        this.file = "";
        this.codedTime = 0;
        this.lines = 0;
    }

    public infoToJSON(): string {
        var output : string = JSON.stringify(this, null, "\t");
        console.log(output);
        return output;
    }

    // for plugin panel show
    public changeSecondToTime(): string{
        var output: string = "";
        var totalTime = this.codedTime;
        // hour
        var hours = Math.floor(totalTime/3600);
        // min
        var mins = Math.floor((totalTime/60) % 60);
        // second
        var seconds = Math.floor(totalTime % 60);

        output = this.TwoDigit(hours) + ":" + this.TwoDigit(mins) + ":" + this.TwoDigit(seconds);
        return output;
    }

    private TwoDigit(digit: number): string {
        if (digit < 10){
            return "0" + digit.toString();
        }
        return digit.toString();
    }

}

// terminal based
// current not recording used time
class TerminalData {
    public terminal: string;
    public codedTime: number;
    public lines: number;

    public initialize(): void {
        this.terminal = "";
        this.codedTime = null;
        this.lines = null;
    }

    public infoToJSON(): string {
        var output : string = JSON.stringify(this, null, "\t");
        //console.log(output);
        return output;
    }

}


class TempLogger {
    public studentID: string = "";
    public activeTime: number = 0;
    public editorData: EditorData[] = [];
    public terminalData: TerminalData[] = [];

    public tempLoggerRecord(content: string) : TempLogger {
        const obj = JSON.parse(content);
        var tempLogger = new TempLogger;
        tempLogger.studentID = obj.studentID;
        tempLogger.activeTime = obj.ActiveTime;
        tempLogger.editorData = obj.File;
        tempLogger.terminalData = obj.Terminal;

        return tempLogger;
    }
}