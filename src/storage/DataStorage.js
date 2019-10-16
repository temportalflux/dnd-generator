import lodash from 'lodash';

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

export default class DataStorage
{

	async getAllFilePathsInDirectory(dirPath)
	{
		const entries = await readDirectory(dirPath, {
			withFileTypes: true,
			encoding: 'utf8',
		});
		let subdirectoryPaths = [];
		let filePaths = [];
		for (let entry in entries)
		{
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
			let subdirectoryFilePaths = await this.getAllFilePathsInDirectory(subdirectoryPath);
			filePaths = filePaths.concat(subdirectoryFilePaths);
		}
		return filePaths;
	}

	async ayeep()
	{
		const filePaths = await this.getAllFilePathsInDirectory('./src/data/tables');
		console.log(filePaths);
	}

	async createTableFromFile()
	{
		
	}

}