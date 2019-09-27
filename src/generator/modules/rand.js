export default function exec(match)
{
	return require('../../lib/rand')(match[1].split(','));
}