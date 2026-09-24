const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			// The Lichess packages ship ES modules with extension-less relative
			// imports, which webpack rejects for `"type": "module"` packages.
			{
				test: /\.js$/,
				include: /node_modules[\\/](@lichess-org|chessops)[\\/]/,
				resolve: { fullySpecified: false },
			},
		],
	},
	resolve: {
		...defaultConfig.resolve,
		alias: {
			...defaultConfig.resolve?.alias,
			// Both stylesheets are hidden by their package's `exports` map.
			'lichess-pgn-viewer.css': path.resolve(
				__dirname,
				'node_modules/@lichess-org/pgn-viewer/dist/lichess-pgn-viewer.css'
			),
			'chessground.brown.css': path.resolve(
				__dirname,
				'node_modules/@lichess-org/chessground/assets/chessground.brown.css'
			),
		},
	},
	entry: {
		'admin/training-manager': path.resolve(
			__dirname,
			'js/admin/training-manager.tsx'
		),
		'admin/tournament-manager': path.resolve(
			__dirname,
			'js/admin/tournament-manager.tsx'
		),
		'admin/event-metabox': path.resolve(
			__dirname,
			'js/admin/event-metabox.ts'
		),
		'blocks/documentation/index': path.resolve(
			__dirname,
			'js/blocks/documentation/index.tsx'
		),
		'blocks/calendar/index': path.resolve(
			__dirname,
			'js/blocks/calendar/index.tsx'
		),
		'blocks/calendar/view': path.resolve(
			__dirname,
			'js/blocks/calendar/view.tsx'
		),
		'blocks/training-groups/index': path.resolve(
			__dirname,
			'js/blocks/training-groups/index.tsx'
		),
		'blocks/training-groups/view': path.resolve(
			__dirname,
			'js/blocks/training-groups/view.tsx'
		),
		'blocks/tournaments/index': path.resolve(
			__dirname,
			'js/blocks/tournaments/index.tsx'
		),
		'blocks/tournaments/view': path.resolve(
			__dirname,
			'js/blocks/tournaments/view.tsx'
		),
		'blocks/training-group/index': path.resolve(
			__dirname,
			'js/blocks/training-group/index.tsx'
		),
		'blocks/training-group/view': path.resolve(
			__dirname,
			'js/blocks/training-group/view.tsx'
		),
		'blocks/tournament/index': path.resolve(
			__dirname,
			'js/blocks/tournament/index.tsx'
		),
		'blocks/tournament/view': path.resolve(
			__dirname,
			'js/blocks/tournament/view.tsx'
		),
		'blocks/standings/index': path.resolve(
			__dirname,
			'js/blocks/standings/index.tsx'
		),
		'blocks/standings/view': path.resolve(
			__dirname,
			'js/blocks/standings/view.tsx'
		),
		'blocks/carousel/index': path.resolve(
			__dirname,
			'js/blocks/carousel/index.tsx'
		),
		'blocks/carousel/view': path.resolve(
			__dirname,
			'js/blocks/carousel/view.tsx'
		),
		'blocks/ranking-list/index': path.resolve(
			__dirname,
			'js/blocks/ranking-list/index.tsx'
		),
		'blocks/ranking-list/view': path.resolve(
			__dirname,
			'js/blocks/ranking-list/view.tsx'
		),
		'blocks/chess-game/index': path.resolve(
			__dirname,
			'js/blocks/chess-game/index.tsx'
		),
		'blocks/chess-game/view': path.resolve(
			__dirname,
			'js/blocks/chess-game/view.ts'
		),
		'blocks/upcoming-events/index': path.resolve(
			__dirname,
			'js/blocks/upcoming-events/index.tsx'
		),
	},
};
