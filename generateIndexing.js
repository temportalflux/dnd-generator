const fs = require('fs');
const path = require('path');

const readDirectory = async (fullPath) => new Promise(
	(resolve, reject) => {
		fs.readdir(fullPath, {
			encoding: 'utf8',
			withFileTypes: true,
		}, (err, files) => {
			if (err) reject(err);
			else resolve(files);
		});
	}
);

const writeFile = async (fullPath, contents) => new Promise(
	(resolve, reject) => {
		fs.writeFile(fullPath, contents, (err) => {
			if (err) reject(err);
			else resolve();
		});
	}
);

const source = path.join(__dirname, './src/data/tables/');
const blacklist = [
	'npc.json'
];

async function generateIndexFor(pathDirectory)
{
	const files = await readDirectory(path.join(source, pathDirectory));
	const directoryContents = [];
	const subdirectories = [];
	for (dirent of files)
	{
		const extension = path.extname(dirent.name);
		const fileName = path.basename(dirent.name, extension);
		if (dirent.isFile() && extension === '.json')
		{
			if (fileName === 'index' || blacklist.includes(path.join(pathDirectory, dirent.name))) continue;
			directoryContents.push(fileName);
		}
		else if (dirent.isDirectory())
		{
			subdirectories.push(fileName);
		}
	}

	// Index subdirectories
	for (subdirectory of subdirectories)
	{
		const subindexPath = await generateIndexFor(path.join(pathDirectory, subdirectory));
		directoryContents.push(subindexPath);
	}

	// Write out contents to the index
	const pathIndex = path.join(pathDirectory, 'index.json');
	await writeFile(path.join(source, pathIndex), JSON.stringify(directoryContents, null, 2));
	return pathIndex.slice(0, -'.json'.length).replace(/\\/g, '/');
}

async function generateIndexes()
{
	console.log('Generating index files');
	await generateIndexFor('');
}

generateIndexes();