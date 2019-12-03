export default function exec(match, {preset, ignore})
{
	if (preset !== undefined) return { value: preset };
	const randInt = require('../../lib/randInt');
	const params = match.split(',').map(str => parseInt(str, 10));
	let ret = undefined;
	do
	{
		ret = randInt(params[0], params[1]);
	} while (ignore !== undefined && ignore.includes(ret))
	return { value: ret };
}