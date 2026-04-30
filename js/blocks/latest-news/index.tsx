import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';

registerBlockType( 'rockaden/latest-news', {
	edit: function Edit( { attributes, setAttributes }: any ) {
		const blockProps = useBlockProps();
		return (
			<>
				<InspectorControls>
					<PanelBody title="Settings">
						<TextControl
							label="Count"
							value={ String( attributes.count || '' ) }
							onChange={ ( val: string ) =>
								setAttributes( {
									count: Math.max( 1, Number( val ) || 1 ),
								} )
							}
						/>
						<TextControl
							label="Archive URL"
							value={ attributes.moreUrl }
							onChange={ ( val: string ) =>
								setAttributes( { moreUrl: val } )
							}
						/>
						<TextControl
							label="More link label"
							value={ attributes.moreLabel }
							onChange={ ( val: string ) =>
								setAttributes( { moreLabel: val } )
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
							borderRadius: '0.25rem',
							color: '#6b7280',
						} }
					>
						[ Latest News — { attributes.count || 3 } posts ]
					</p>
				</div>
			</>
		);
	},
	save() {
		return null;
	},
} );
