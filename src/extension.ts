'use strict';

import * as fs from 'fs-extra';
import * as path from 'path';
import escapeRegExp = require('lodash.escaperegexp');
import * as vscode from 'vscode';
import * as filepaths from './managers/filepaths';
import * as promptUtils from './utils/prompt';
import * as changeCase from 'change-case';
import { IPluginSettings } from './types';

export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "duplicate-module" is now active!');

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
    };

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

    };

    let disposable = vscode.commands.registerCommand('extension.duplicateModule', async (uri: vscode.Uri, settings: IPluginSettings) => {

        const oldPath = uri.fsPath;
        const oldPathParsed = path.parse(oldPath);
        const oldName = oldPathParsed.name;
        const oldPathStats = await fs.stat(oldPath);
        const newName = await promptUtils.name('');
        if (!newName || newName === '') {
            return;
        }
        const oldSearch = await promptUtils.srcName(oldName);
        if (!oldSearch || oldSearch === '') {
            return;
        }
        const newSearch = await promptUtils.destName(newName);
        if (!newSearch || newSearch === '') {
            return;
        }

        const newPath = filepaths.buildFilepath(oldPathParsed, oldPathStats, newName, { keepOriginalExtension: true, openFileAfterCopy: false });
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

        if (oldPathStats.isFile()) {
            console.log(newPath);
            console.log(settings);
            console.log(oldPathParsed);
            console.log(oldPathStats);
            console.log(newName);
            await fs.copy(uri.fsPath, newPath);
            await replaceInFile(newPath, oldSearch, newSearch);
            vscode.window.showInformationMessage('Duplicate Module duplicated file with ' + oldSearch + ' renamed/replaced to ' + newSearch + ' at ' + newName);
        } else {
            try {
                await fs.copy(uri.fsPath, newPath);
                var readdirp = require('readdirp');
                await readdirp({ root: newPath }).on('data', async (entry: any) => {
                    const filePath = newPath + '/' + entry.path;
                    await replaceInFile(filePath, oldSearch, newSearch);
                    await renameFiles(newPath, entry.path, oldSearch, newSearch);
                });
                vscode.window.showInformationMessage('Duplicate Module duplicated folder with ' + oldSearch + ' renamed/replaced to ' + newSearch + ' at ' + newName);
            } catch (err) {
                const errMsgRegExp = new RegExp(escapeRegExp(oldPathParsed.dir), 'g');
                const errMsg = err.message
                    .replace(errMsgRegExp, '')
                    .replace(/[\\|\/]/g, '')
                    .replace(/`|'/g, '**');
                vscode.window.showErrorMessage(`Error: ${errMsg}`);
            }
        }
        return;
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}