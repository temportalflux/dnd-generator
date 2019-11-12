import Execs from './index';
import {inlineEval} from './evalAtCtx';

export function createExecutor(macro)
{
	const regex = new RegExp(`^\\{(.*):(.*)\\}$`);
	const match = macro.match(regex);
	if (match && match.length >= 2)
	{
		const execFunc = match[1];
		const args = match[2];
		return (data) => Execs[execFunc](inlineEval(args, data), data);
	}
	return undefined;
}