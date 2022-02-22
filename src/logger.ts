import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


// This class aims to log the user information into a json file
export class Logger {
    private studentID: string;
    private logFile: string;
    private homeDir: string;
    private loggerData: LoggerInfo;
    // information to get


    public initialize(studentIDInput: string): void {
        this.studentID = studentIDInput;
        this.homeDir = path.join(process.cwd(), "Monitor");
        this.logFile = path.join(this.homeDir, this.studentID + '.log');
        this.loggerData = new LoggerInfo;
        
        fs.appendFile(this.logFile, "", function (err) {
            if (err) {
                throw err;
            }
            console.log('File is created successfully.');
        });
    }

    public writeJSONtoFile(): void {
        // need to turn this.loggerData to JSON
        fs.appendFile(this.logFile, "", function (err) {
            if (err) {
                throw err;
            }
            console.log('File is writed successfully.');
        });
    }


}

class LoggerInfo {
    private file: string;
    private time: number;
    private selection: vscode.Position;
    private lines: number;
    private isWrite: boolean;

}