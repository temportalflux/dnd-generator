const path = require('path');
const Ajv = require('ajv');
let ajv = new Ajv();

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

const validatorJson = validate(require('./src/data/validator-schema.json'), undefined, 'validator.json');

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
