import lodash from 'lodash';

export function formatWithData(string, npcData)
{
	const variableRegex = new RegExp(`\\$\\((.*)\\)`, 'g');
	const variableMatch = string.matchAll(variableRegex);
	
	if (!variableMatch) return string;

	return [...variableMatch].reduce((formattedString, match) => {
		return formattedString.replace(match[0], lodash.get(npcData, match[1]));
	}, string);
}
