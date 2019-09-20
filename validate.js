const path = require('path');
const Ajv = require('ajv');
let ajv = new Ajv();
const fs = require('fs');
const lodash = require('lodash');

// TODO: This needs a rename
/**
	REcursively examines the contents of `entryPath` and return an object detailing all current files/contents of the item at path.
**/
function globData(entryPath)
{
	const stats = fs.statSync(entryPath);
	if (stats.isDirectory())
	{
		const dirContentObj = {
			type: "directory",
			contents: {}
		};
		const contents = fs.readdirSync(entryPath);
		for (item of contents)
		{
			const itemPath = path.join(entryPath, item);
			dirContentObj.contents[item] = globData(itemPath);
		}
		return dirContentObj;
	}
	else if (stats.isFile())
	{
		return {
			type: "file",
			contents: {
				key: "",
				type: ""
			}
		};
	}
}

function getFullPath(dataType, fileName)
{
	if (dataType) return path.join(__dirname, './src/data', dataType, fileName);
	else return path.join(__dirname, './src/data', fileName);
}

function validate(schema, dataType, fileName)
{
	const fullPath = getFullPath(dataType, fileName);
	const dataJson = require(fullPath);
	const valid = ajv.validate(schema, dataJson);
	if (valid)
	{
		console.log('PASSED:', fileName);
	}
	else
	{
		console.log('FAILED:', fileName, '\n', ajv.errorsText());
	}
	return dataJson;
}

function collapseTree(collapsed, globTree, keyPath, ignoreFiles = false)
{
	switch (globTree.type)
	{
		case 'directory':
			lodash.forOwn(globTree.contents, (value, key) =>
			{
				if (ignoreFiles && value.type == 'file') return;
				const keyNoExt = path.basename(key, path.extname(key));
				collapsed = collapseTree(collapsed, value, `${keyPath ? `${keyPath}.` : ''}${keyNoExt}`, false);
			});
			return collapsed;
		case 'file':
			console.log(keyPath);
			collapsed[keyPath] = globTree.contents;
			return collapsed;
	}
}

const validatorJson = require('./src/data/validator.json');
const dataFiles = globData('./src/data');
const collapsed = collapseTree({}, dataFiles, undefined, true);
lodash.forOwn(collapsed, (value, key) =>
{
	if (key.startsWith('tables.todo')) return;
	if (!lodash.has(validatorJson, key))
	{
		console.warn(`Key ${key} was not found in validator, adding now...`);
		validatorJson[key] = value;
		return;
	}
	if (!value.type)
	{
		console.warn(`Validator entry ${key} does not have a type. Expecting 'schema' or the output type for the table.`);
		return;
	}
	if (!value.key)
	{
		const baseWarning = `Validator entry ${key} does not have a key.`;
		switch (value.type)
		{
			case 'schema':
				console.warn(`${baseWarning} Expecting the key for the schema for tables to reference.`);
				return;
			default:
				console.warn(`${baseWarning} Expecing the schema key.`);
				return;
		}
	}
});

fs.writeFileSync('./src/data/validator.json', JSON.stringify(validatorJson, undefined, 2));

return;

//const validatorJson = validate(require('./src/data/validator-schema.json'), undefined, 'validator.json');

const dataToValidate = {};
for (entry of validatorJson)
{
	console.log("Adding schema", entry.key, entry.schema);
	const schemaJson = require(getFullPath('schema', entry.schema));
	ajv = ajv.addSchema(schemaJson, entry.key);

	dataToValidate[entry.key] = entry.data;
}

for (key of Object.keys(dataToValidate))
{
	for (dataFile of dataToValidate[key])
	{
		validate(key, 'tables', dataFile);
	}
}
