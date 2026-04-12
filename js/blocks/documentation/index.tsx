import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';

function Edit() {
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<p
				style={ {
					padding: '2rem',
					background: '#f0f0f0',
					textAlign: 'center',
					borderRadius: '0.25rem',
					color: '#6b7280',
				} }
			>
				Documentation — rendered from bundled files on the frontend.
			</p>
		</div>
	);
}

registerBlockType( 'rockaden/documentation', {
	edit: Edit,
	save() {
		return null;
	},
} );
