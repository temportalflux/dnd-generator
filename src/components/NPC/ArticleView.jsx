import React from 'react';
import { ViewContainer } from '../../view/ViewContainer';
import { MenuBar } from './MenuBar';
import { ArticleContent } from './ArticleContent';

export function ArticleView(props)
{
	return (
		<ViewContainer page={props.location.pathname}>
			<MenuBar
				switchDisplayMode={props.switchDisplayMode}
				displayMode={props.displayMode}
			/>
			<ArticleContent/>
		</ViewContainer>
	);
}
