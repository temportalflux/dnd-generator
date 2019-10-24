import React from 'react';
import { Menu } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

export class HeaderBarLink extends React.Component
{

	render()
	{
		return (
			<Menu.Item
					as={Link}
          name={this.props.name}
          active={this.props.activeItem === this.props.path}
					onClick={this.props.onClick}
					to={this.props.path}
        >
				{this.props.children}
			</Menu.Item>
		);
	}
}