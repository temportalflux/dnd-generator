import Execs from './index';
import {inlineEval} from './evalAtCtx';

export function parseMacro(macro)
{
	const regex = new RegExp(`^\\{(.*):(.*)\\}$`);
	const match = macro.match(regex);
	if (match && match.length >= 2)
	{
		return {
			execFunc: match[1],
			args: match[2],
		};
	}
	return undefined;
}

export function createExecutor(macro)
{
	const executor = parseMacro(macro);
	if (executor)
	{
		return (data) => Execs[executor.execFunc](inlineEval(executor.args, data), data);
	}
	return undefined;
}