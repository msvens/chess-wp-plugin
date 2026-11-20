import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';

registerBlockType( 'rockaden/tournament', {
	edit: function Edit( { attributes, setAttributes }: any ) {
		const blockProps = useBlockProps();
		return (
			<>
				<InspectorControls>
					<PanelBody title="Settings">
						<ToggleControl
							label="Link players to chess.msvens.com"
							help="Player names open their page on chess.msvens.com in a new tab."
							checked={ attributes.linkPlayers }
							onChange={ ( val: boolean ) =>
								setAttributes( { linkPlayers: val } )
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
						[Tournament Detail — rendered on frontend]
					</p>
				</div>
			</>
		);
	},
	save() {
		return null; // Dynamic block — rendered by render.php
	},
} );
