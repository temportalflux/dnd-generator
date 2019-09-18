import parser from './parser';

const npc = require('../../data/data/npc.json');

export function generate(filter)
{
	//console.log(filter);
	console.log(filter, npc);
	const output = parser('{roll:pronouns}');
	return output;
}
