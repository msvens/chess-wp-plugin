import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { getTranslation, toLanguage } from '../../shared/translations';
import type { TournamentFields } from '../../shared/overviewFields';
import { TOURNAMENT_FIELD_DEFAULTS } from '../../shared/overviewFields';

const lang = toLanguage(
	( typeof document !== 'undefined' && document.documentElement.lang ) || 'sv'
);
const t = getTranslation( lang );

type Attributes = { layout: 'cards' | 'list' } & TournamentFields;

interface EditProps {
	attributes: Attributes;
	setAttributes: ( attrs: Partial< Attributes > ) => void;
}

// Field order matches the order they render in. The participant count comes
// last because it sits in the card footer; it can only ever hide a count the
// tournament already makes public, never reveal one. Participant names are not
// offered at all — they belong to the tournament's own page, which this block
// does not render.
const FIELD_ORDER: Array< [ keyof TournamentFields, () => string ] > = [
	[ 'showDates', () => t.tournament.startDate ],
	[ 'showDescription', () => t.training.description ],
	[ 'showLocation', () => t.calendar.location ],
	[ 'showTimeControl', () => t.training.timeControl ],
	[ 'showStatus', () => t.tournament.status ],
	[ 'showCategory', () => t.tournament.category ],
	[ 'showSsfBadge', () => 'SSF' ],
	[ 'showParticipantCount', () => t.training.participantCount ],
];

registerBlockType( 'rockaden/tournaments', {
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
									TOURNAMENT_FIELD_DEFAULTS[ key ]
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
						[Tournaments Overview — { layout } view — rendered on
						frontend]
					</p>
				</div>
			</>
		);
	},
	save() {
		return null;
	},
} );
