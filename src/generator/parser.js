import lodash from 'lodash';
import Execs from './modules/index';

console.log(Execs);

const ExecKeys = Object.keys(Execs);

export default function parseField(field, data)
{
	// TODO: tmp
	return field;

	if (typeof field === 'string')
	{
		for (let execKey of ExecKeys)
		{
			// TODO: Replace $(...) with evals for { ...data, value=generated value from roll}
			// https://stackoverflow.com/questions/8403108/calling-eval-in-particular-context
			// use gnome names as an example of complex rolls with field fetches
			const regex = new RegExp(`^\\{${execKey}:(.*)\\}$`);
			const match = field.match(regex);
			if (match)
			{
				console.log('Calculating value of field', field, 'using exec', execKey);
				const result = Execs[execKey](match, data);
				console.log('result:', result);
				return parseField(result, data);
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
