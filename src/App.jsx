import React from 'react';
import { Container } from "semantic-ui-react";
import Home from './pages/index';

async function performGitRequest(endpoint)
{
	return await fetch(`https://api.github.com${endpoint}`, {
		method: 'GET',
		mode: 'cors',
		cache: 'no-cache',
		credentials: 'same-origin',
		headers: {
			'Content-Type': 'application/vnd.github.v3+json'
		},
		redirect: 'follow',
		referrer: 'no-referrer'
	});
}

class App extends React.Component
{

	async componentDidMount()
	{
		// Can fetch all data here

		// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
		// https://developer.github.com/v3/#current-version
		const resultCommits = await performGitRequest('/repos/temportalflux/dnd-generator/commits');
		const commits = await resultCommits.json();
		console.log(commits);

		const resultLatestTree = await performGitRequest(`/repos/temportalflux/dnd-generator/git/trees/${commits[0].commit.tree.sha}`);
		const tree = await resultLatestTree.json();
		console.log(tree);
		

	}

	render()
	{
		return (
			<Container id={'App'} fluid>
				<Home/>
			</Container>
		);
	}

}

export default App;