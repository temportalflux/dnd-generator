export default function exec(match, data)
{
	if (data === undefined) return false;
	const value = `${data.value}`;
	return new RegExp(match).test(value);
}