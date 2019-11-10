export function camelCaseToTitle(str)
{
	return str
		.split(/(?=[A-Z])/)
		.map(
			(word) => `${word[0].toUpperCase()}${word.substr(1).toLowerCase()}`
		).join(' ');
}