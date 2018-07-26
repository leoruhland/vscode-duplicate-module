import * as vscode from 'vscode';

export function name(filename: string): Promise<string> {
    return vscode.window.showInputBox({
        placeHolder: 'Enter the new name.',
        value: filename
    }) as Promise<string>;
}

export function srcName(filename: string): Promise<string> {
    return vscode.window.showInputBox({
        placeHolder: 'Enter the source name.',
        value: filename
    }) as Promise<string>;
}

export function destName(filename: string): Promise<string> {
    return vscode.window.showInputBox({
        placeHolder: 'Enter the destination name.',
        value: filename
    }) as Promise<string>;
}

export function overwrite(filepath: string): Promise<vscode.MessageItem | undefined> {
    const message = `The path **${filepath}** alredy exists. Do you want to overwrite the existing path?`;
    const action = {
        title: 'OK',
        isCloseAffordance: false
    };
    return vscode.window.showWarningMessage(message, action) as Promise<vscode.MessageItem | undefined>;
}