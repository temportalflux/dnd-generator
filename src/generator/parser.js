import lodash from 'lodash';
import Execs from './modules/index';

console.log(Execs);

const ExecKeys = Object.keys(Execs);

export default function parseField(field, data)
{
	if (typeof field === 'string')
	{
		for (let execKey of ExecKeys)
		{
			const regex = new RegExp(`^\\{${execKey}:(.*)\\}$`);
			const match = field.match(regex);
			if (match)
			{
				console.log('Calculating value of field', field, 'using exec', execKey);
				return Execs[execKey](match, data);
			}
		}
		return field;
	}
	else if (Array.isArray(field))
	{
		return field.map((entry) => parseField(entry, data));
	}
	else if (typeof field === 'object')
	{
		return lodash.mapValues(field, (entry) => parseField(entry, data));
	}
	return field;
}
