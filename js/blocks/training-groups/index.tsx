import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { getTranslation, toLanguage } from '../../shared/translations';

const lang = toLanguage(
	( typeof document !== 'undefined' && document.documentElement.lang ) || 'sv'
);
const t = getTranslation( lang );

interface EditProps {
	attributes: { layout: 'cards' | 'list' };
	setAttributes: ( attrs: Partial< { layout: 'cards' | 'list' } > ) => void;
}

registerBlockType( 'rockaden/training-groups', {
	edit: function Edit( { attributes, setAttributes }: EditProps ) {
		const blockProps = useBlockProps();
		const layout = attributes.layout || 'cards';
		return (
			<>
				<InspectorControls>
					<PanelBody title={ t.common.layout }>
						<SelectControl
							label={ t.common.layout }
							value={ layout }
							options={ [
								{ label: t.common.layoutCards, value: 'cards' },
								{ label: t.common.layoutList, value: 'list' },
							] }
							onChange={ ( v: string ) =>
								setAttributes( {
									layout: v === 'list' ? 'list' : 'cards',
								} )
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
						[Training Groups Overview — { layout } view — rendered
						on frontend]
					</p>
				</div>
			</>
		);
	},
	save() {
		return null;
	},
} );
