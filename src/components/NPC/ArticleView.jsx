import React from 'react';
import { MenuBar } from './MenuBar';
import { ArticleContent } from './ArticleContent';

export function ArticleView(props)
{
	return (
		<div>
			<MenuBar
				switchDisplayMode={props.switchDisplayMode}
				displayMode={props.displayMode}
			/>
			<ArticleContent/>
		</div>
	);
}
