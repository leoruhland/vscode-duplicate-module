import * as fs from 'fs';
import * as path from 'path';

import { IPluginSettings } from '../types';

export function buildFilepath(oldPath: path.ParsedPath, oldStat: fs.Stats, newName: string, settings: IPluginSettings): string {
	const newPath = path.parse(newName);
	const needAddExtension = (settings.keepOriginalExtension && !newName.endsWith('!!ext')) || newName.endsWith('&&ext');
	let newStripedName = newName.replace(/(!!|&&)ext$/, '');
	if (oldStat.isFile() && newPath.ext === '' && needAddExtension) {
		newStripedName += oldPath.ext;
	}
	return path.join(oldPath.dir, newStripedName);
}