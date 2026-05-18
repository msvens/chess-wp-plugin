import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';

registerBlockType( 'rockaden/tournament', {
	edit: function Edit() {
		const blockProps = useBlockProps();
		return (
			<div { ...blockProps }>
				<p
					style={ {
						padding: '2rem',
						background: '#f0f0f0',
						textAlign: 'center',
					} }
				>
					[Tournament Detail — rendered on frontend]
				</p>
			</div>
		);
	},
	save() {
		return null;
	},
} );
