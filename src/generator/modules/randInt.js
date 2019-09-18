export default function exec(match)
{
	const params = match[1].split(',').map(str => parseInt(str, 10));
	return require('../../lib/randInt')(params[0], params[1]);
}