import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';

registerBlockType( 'rockaden/standings', {
	edit: function Edit( { attributes, setAttributes }: any ) {
		const blockProps = useBlockProps();
		return (
			<>
				<InspectorControls>
					<PanelBody title="Settings">
						<TextControl
							label="Training Group ID"
							value={ String( attributes.groupId || '' ) }
							onChange={ ( val: string ) =>
								setAttributes( { groupId: Number( val ) || 0 } )
							}
						/>
					</PanelBody>
				</InspectorControls>
				<div { ...blockProps }>
					<p
						style={ {
							padding: '2rem',
							background: '#f0f0f0',
							textAlign: 'center',
						} }
					>
						[Standings — Group #{ attributes.groupId || '?' }]
					</p>
				</div>
			</>
		);
	},
	save() {
		return null;
	},
} );
