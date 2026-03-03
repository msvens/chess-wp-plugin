const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		'admin/training-manager': path.resolve(
			__dirname,
			'js/admin/training-manager.tsx'
		),
		'admin/event-metabox': path.resolve(
			__dirname,
			'js/admin/event-metabox.ts'
		),
		'blocks/calendar/index': path.resolve(
			__dirname,
			'js/blocks/calendar/index.tsx'
		),
		'blocks/calendar/view': path.resolve(
			__dirname,
			'js/blocks/calendar/view.tsx'
		),
		'blocks/standings/index': path.resolve(
			__dirname,
			'js/blocks/standings/index.tsx'
		),
		'blocks/training-group/index': path.resolve(
			__dirname,
			'js/blocks/training-group/index.tsx'
		),
	},
};
