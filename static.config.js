import path from 'path'

export default {
  getRoutes: async ({ dev }) => [
		{
			path: 'npc',
			template: 'src/pages/index.js',
		},
	],
  plugins: [
    [
      require.resolve('react-static-plugin-source-filesystem'),
      {
        location: path.resolve('./src/pages'),
      },
    ],
    require.resolve('react-static-plugin-reach-router'),
    require.resolve('react-static-plugin-sitemap'),
  ],
}
