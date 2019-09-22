
// https://stackoverflow.com/questions/543533/restricting-eval-to-a-narrow-scope
function evalAtCtx(code, ctx)
{
	return (new Function(`with(this) { return ${code}; }`).call(ctx))
}

export default function exec(text, context)
{
	return text.replace(/\$\((.*?)\)/g, (match, group) => evalAtCtx(group, context));
}