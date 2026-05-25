const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
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
		'blocks/latest-news/index': path.resolve(
			__dirname,
			'js/blocks/latest-news/index.tsx'
		),
		'blocks/upcoming-events/index': path.resolve(
			__dirname,
			'js/blocks/upcoming-events/index.tsx'
		),
	},
};
