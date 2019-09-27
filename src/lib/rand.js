module.exports = (values) =>
{
	return values[Math.floor(Math.random() * values.length)];
}