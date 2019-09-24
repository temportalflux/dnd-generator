import lodash from 'lodash';
import Execs from './modules/index';
import evalAtCtx from './modules/evalAtCtx';

console.log('Parser valid executors', Execs);

export default function parseField(field, data)
{
	if (Array.isArray(field))
	{
		return field.map((entry) => parseField(entry, data));
	}
	else if (typeof field === 'object')
	{
		return lodash.mapValues(field, (entry) => parseField(entry, data));
	}
	else if (typeof field === 'string')
	{
		for (let execKey of Object.keys(Execs))
		{
			// use gnome names as an example of complex rolls with field fetches
			const regex = new RegExp(`^\\{${execKey}:(.*)\\}$`);
			const match = field.match(regex);
			if (match)
			{
				const result = Execs[execKey](match, data);
				return parseField(result, data);
			}
		}
	}
	return field;
}
