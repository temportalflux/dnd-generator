import React from 'react';
import { Menu } from 'semantic-ui-react';
import { Link } from 'raviger';

export function HeaderBarLink({ name, activeItem, path, onClick, children })
{
	return (
		<Menu.Item
				as={Link}
				name={name}
				active={activeItem === path}
				onClick={onClick}
				href={path}
			>
			{children}
		</Menu.Item>
	);
}