import lodash from 'lodash';
//import fs from 'fs';
//import path from 'path';

const fs = require('fs');
const path = require('path');

function createGlobalPath(localPath)
{
	return path.join(__dirname, localPath);
}

let readDirectory = (dirPath, options={}) => new Promise((resolve, reject) => {
	fs.readdir(createGlobalPath(dirPath), options, (err, data) => {
		if(err) reject(err);
		else resolve(data);
	});
});

let readFile = (filePath) => new Promise((resolve, reject) => {
	fs.readFile(createGlobalPath(filePath), (err, data) => {
		if(err) reject(err);
		else resolve(data);
	});
});

async function getAllFilePathsInDirectory(dirPath)
{
	let subdirectoryPaths = [];
	let filePaths = [];

	console.log(lodash.cloneDeep(fs));

	const dir = await fs.promises.opendir(dirPath, {
		encoding: 'utf8'
	});
	for await (const entry of dir)
	{
		console.log(entry);
		const entryPath = path.join(dirPath, entry.name);
		if (entry.isDirectory())
		{
			subdirectoryPaths.push(entryPath);
		}
		else if (entry.isFile())
		{
			filePaths.push(entryPath);
		}
	}
	for (let subdirectoryPath in subdirectoryPaths)
	{
		let subdirectoryFilePaths = await getAllFilePathsInDirectory(subdirectoryPath);
		filePaths = filePaths.concat(subdirectoryFilePaths);
	}
	return filePaths;
}

export default class DataStorage
{

	async ayeep()
	{
		const filePaths = await getAllFilePathsInDirectory('./src/data/tables');
		console.log(filePaths);
	}

	async createTableFromFile()
	{
		
	}

}