export default function exec(match)
{
	return require('../../lib/rand')(match.split(','));
}