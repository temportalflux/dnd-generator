const Execs = require('./modules/index');
const ExecKeys = Object.keys(Execs);

module.exports = function parseField(field)
{
	for (let execKey of ExecKeys)
	{
		const regex = new RegExp(`^\\{${execKey}:(.*)\\}$`);
		const match = field.match(regex);
		if (match)
		{
			return Execs[execKey](match);
		}
	}
	return field;
}
