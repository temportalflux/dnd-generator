export default function exec(match)
{
	return {
		value: require('../../lib/rand')(match.split(','))
	};
}