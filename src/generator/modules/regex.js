export default function exec(match, data)
{
	if (data === undefined) return false;
	const value = `${data.value}`;
	console.log(match, value);
	return new RegExp(match).test(value);
}