import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';

registerBlockType( 'rockaden/training-groups', {
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
					[Training Groups Overview — rendered on frontend]
				</p>
			</div>
		);
	},
	save() {
		return null;
	},
} );
