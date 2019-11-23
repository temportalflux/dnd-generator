import React from 'react';
import { ViewContainer } from '../../view/ViewContainer';
import { MenuBar } from './MenuBar';
import { Dropdown } from 'semantic-ui-react';
import copyToClipboard from '../../lib/clipboard';
import { renderToString } from 'react-dom/server';
import { ArticleContent } from './ArticleContent';

export function ArticleView(props)
{
	const exportToClipboard = () => {
		copyToClipboard(renderToString(
			<ArticleContent usePlainText={true} />
		));
	};

	return (
		<ViewContainer page={props.location.pathname}>
			<MenuBar
				switchDisplayMode={props.switchDisplayMode}
				displayMode={props.displayMode}
				menuItemsRight={[
					(
						<Dropdown key='export' item text={'Export'}>
							<Dropdown.Menu>
								<Dropdown.Item text='Article' onClick={exportToClipboard} />
								{/*<Dropdown.Item text='JSON' />*/}
							</Dropdown.Menu>
						</Dropdown>
					)
				]}
			/>
			<ArticleContent/>
		</ViewContainer>
	);
}
