module.exports = function exec(match)
{
	return require('../../lib/randInt')(match[1], match[2]);
}