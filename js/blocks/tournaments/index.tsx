import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';

registerBlockType( 'rockaden/tournaments', {
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
					[Tournaments Overview — rendered on frontend]
				</p>
			</div>
		);
	},
	save() {
		return null;
	},
} );
