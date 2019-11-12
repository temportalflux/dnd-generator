export default function exec(match, data)
{
	const rangeParams = match.split(',').map((str) => parseInt(str, 10));
	return data !== undefined
		&& typeof data.value === 'number'
		&& rangeParams[0] <= data.value
		&& data.value <= rangeParams[1];
}