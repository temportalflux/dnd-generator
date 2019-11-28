import React from 'react';
import { Menu } from 'semantic-ui-react';
import { View } from '../storage/Session';

export function HeaderBarLink({ path, children })
{
	return (
		<Menu.Item
			name={path}
			active={View.get() === path}
			onClick={() => {
				View.set(path);
			}}
		>
			{children}
		</Menu.Item>
	);
}