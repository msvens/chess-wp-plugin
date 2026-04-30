import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, SelectControl } from '@wordpress/components';

registerBlockType( 'rockaden/shop-grid', {
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
						<SelectControl
							label="Layout"
							value={ attributes.layout }
							options={ [
								{ label: 'Grid (multi-column)', value: 'grid' },
								{ label: 'Column (vertical)', value: 'column' },
							] }
							onChange={ ( val: string ) =>
								setAttributes( { layout: val } )
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
						[ Shop Items — { attributes.count || 4 } items,{ ' ' }
						{ attributes.layout || 'grid' } layout ]
					</p>
				</div>
			</>
		);
	},
	save() {
		return null;
	},
} );
