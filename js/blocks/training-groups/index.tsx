import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { getTranslation, toLanguage } from '../../shared/translations';
import type { TrainingGroupFields } from '../../shared/overviewFields';
import { TRAINING_GROUP_FIELD_DEFAULTS } from '../../shared/overviewFields';

const lang = toLanguage(
	( typeof document !== 'undefined' && document.documentElement.lang ) || 'sv'
);
const t = getTranslation( lang );

type Attributes = { layout: 'cards' | 'list' } & TrainingGroupFields;

interface EditProps {
	attributes: Attributes;
	setAttributes: ( attrs: Partial< Attributes > ) => void;
}

// Field order matches the order they render in, so the panel reads like the
// card. The participant count comes last because it sits in the card footer;
// it can only ever hide a count the group already makes public, never reveal
// one. Participant names are not offered at all — they belong to the group's
// own page, which this block does not render.
const FIELD_ORDER: Array< [ keyof TrainingGroupFields, () => string ] > = [
	[ 'showDescription', () => t.training.description ],
	[ 'showSchedule', () => t.training.schedule ],
	[ 'showLocation', () => t.training.location ],
	[ 'showTrainers', () => t.training.trainers ],
	[ 'showContact', () => t.training.contact ],
	[ 'showSemester', () => t.training.semester ],
	[ 'showStatus', () => t.tournament.status ],
	[ 'showParticipantCount', () => t.training.participantCount ],
];

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
					<PanelBody title={ t.common.fields }>
						{ FIELD_ORDER.map( ( [ key, label ] ) => (
							<ToggleControl
								key={ key }
								label={ label() }
								checked={
									attributes[ key ] ??
									TRAINING_GROUP_FIELD_DEFAULTS[ key ]
								}
								onChange={ ( value: boolean ) =>
									setAttributes( { [ key ]: value } )
								}
							/>
						) ) }
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
