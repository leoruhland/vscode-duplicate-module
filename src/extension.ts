'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from 'fs-extra';
import * as path from 'path';

import escapeRegExp = require('lodash.escaperegexp');
import * as vscode from 'vscode';

import * as filepaths from './managers/filepaths';
import * as promptUtils from './utils/prompt';

import * as changeCase from 'change-case';


import { IPluginSettings } from './types';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "duplicate-module" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json

    let replaceInFile = async (someFile: string, replace: string, replaceWith: string) => {
        let data = await fs.readFile(someFile, 'utf8');

        data = data
            .split(replace)
            .join(replaceWith)
            .split(
                changeCase.lowerCase(replace)
            ).join(
                changeCase.lowerCase(replaceWith)
            ).split(
                changeCase.camelCase(replace)
            ).join(
                changeCase.camelCase(replaceWith)
            ).split(
                changeCase.pascalCase(replace)
            ).join(
                changeCase.pascalCase(replaceWith)
            ).split(
                changeCase.paramCase(replace)
            ).join(
                changeCase.paramCase(replaceWith)
            ).split(
                changeCase.upperCaseFirst(replace)
            ).join(
                changeCase.upperCaseFirst(replaceWith)
            );

        return await fs.writeFile(someFile, data, 'utf8');
    }

    let renameFiles = async (newPath: string, file: string, replace: string, replaceWith: string) => {
        const filePath = newPath + '/' + file;

        const newFilename = file.split(replace)
            .join(replaceWith)
            .split(
                changeCase.lowerCase(replace)
            ).join(
                changeCase.lowerCase(replaceWith)
            ).split(
                changeCase.camelCase(replace)
            ).join(
                changeCase.camelCase(replaceWith)
            ).split(
                changeCase.pascalCase(replace)
            ).join(
                changeCase.pascalCase(replaceWith)
            ).split(
                changeCase.paramCase(replace)
            ).join(
                changeCase.paramCase(replaceWith)
            ).split(
                changeCase.upperCaseFirst(replace)
            ).join(
                changeCase.upperCaseFirst(replaceWith)
            );

        if (newFilename !== file) {
            return await fs.rename(filePath, newPath + '/' + newFilename)
        } else {
            return Promise.resolve();
        }

    }

    let disposable = vscode.commands.registerCommand('extension.duplicateModule', async (uri: vscode.Uri, settings: IPluginSettings) => {

        const oldPath = uri.fsPath;
        const oldPathParsed = path.parse(oldPath);
        const oldName = oldPathParsed.name;
        const oldPathStats = await fs.stat(oldPath);

        const newName = await promptUtils.name('');
        const oldSearch = await promptUtils.srcName(oldName);
        const newSearch = await promptUtils.destName(newName);

        if (!newName) {
            return;
        }
        const newPath = filepaths.buildFilepath(oldPathParsed, oldPathStats, newName, settings);
        if (uri.fsPath === newPath) {
            vscode.window.showErrorMessage('You can\'t copy a file or directory on the same path.');

            return;
        }
        const newPathExists = await fs.pathExists(newPath);
        if (newPathExists) {
            const userAnswer = await promptUtils.overwrite(newPath);
            if (!userAnswer) {
                return;
            }
        }
        try {
            await fs.copy(uri.fsPath, newPath);

            /*
            FS Version
            await fs.readdir(newPath, async (err, files) => {
                await files.forEach(async (file) => {
                    const filePath = newPath + '/' + file;
                    await replaceInFile(filePath, oldSearch, newSearch);

                    await renameFiles(newPath, file, oldSearch, newSearch);
                });
            })
            */

            var readdirp = require('readdirp');
            await readdirp({ root: newPath }).on('data', async (entry: any) => {
                const filePath = newPath + '/' + entry.path;
                await replaceInFile(filePath, oldSearch, newSearch);
                await renameFiles(newPath, entry.path, oldSearch, newSearch);
            });


            vscode.window.showInformationMessage('Duplicate Module duplicated ' + oldSearch + ' renamed/replaced to ' + newSearch + ' at ' + newName);

            if (settings.openFileAfterCopy && oldPathStats.isFile()) {
                return;
            }
        } catch (err) {
            const errMsgRegExp = new RegExp(escapeRegExp(oldPathParsed.dir), 'g');
            const errMsg = err.message
                .replace(errMsgRegExp, '')
                .replace(/[\\|\/]/g, '')
                .replace(/`|'/g, '**');

            vscode.window.showErrorMessage(`Error: ${errMsg}`);
        }
        return;
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}