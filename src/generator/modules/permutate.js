export default function exec(match)
{
	const params = match[1].split(',');
	const result = [];
	while (params.length > 0)
	{
		// remove a random item from params, and add to the end of result
		result.push(params.splice(
			// index of the next value
			Math.floor(Math.random() * params.length),
			1
		)[0]);
	}
	console.log(result);
	return result;
}