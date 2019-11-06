
export const DISPLAY_MODES = {
	Readable: 'Readable',
	Detailed: 'Detailed',
};

export function getDisplayIconForMode(displayMode)
{
	switch (displayMode)
	{
		case DISPLAY_MODES.Readable: return 'eye';
		case DISPLAY_MODES.Detailed: return 'archive';
		default: return 'question';
	}
}

export function getNextDisplayMode(displayMode)
{
	switch (displayMode)
	{
		case DISPLAY_MODES.Readable: return DISPLAY_MODES.Detailed;
		case DISPLAY_MODES.Detailed: return DISPLAY_MODES.Readable;
		default: return DISPLAY_MODES.Detailed;
	}
}

export function getDisplayModeSwitchLabel(displayMode)
{
	return `Switch to ${getNextDisplayMode(displayMode).toLowerCase()} mode`;
}
