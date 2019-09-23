export default function exec(match, data, value)
{
	return new RegExp(match[1]).test(value);
}