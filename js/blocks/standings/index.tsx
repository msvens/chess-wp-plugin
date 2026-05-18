import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

interface TournamentEntity {
	id: number;
	title: { raw?: string; rendered: string };
}

registerBlockType( 'rockaden/standings', {
	edit: function Edit( { attributes, setAttributes }: any ) {
		const blockProps = useBlockProps();

		const tournaments = useSelect( ( select: any ) => {
			return select( coreStore ).getEntityRecords(
				'postType',
				'rc_tournament',
				{ per_page: 100, status: 'publish' }
			) as TournamentEntity[] | null;
		}, [] );

		const options = [
			{ label: '— Select tournament —', value: '' },
			...( tournaments || [] ).map( ( tournament ) => ( {
				label: tournament.title.raw || tournament.title.rendered,
				value: String( tournament.id ),
			} ) ),
		];

		return (
			<>
				<InspectorControls>
					<PanelBody title="Settings">
						<SelectControl
							label="Tournament"
							value={ String( attributes.tournamentId || '' ) }
							options={ options }
							onChange={ ( val: string ) =>
								setAttributes( {
									tournamentId: Number( val ) || 0,
								} )
							}
						/>
						<ToggleControl
							label="Show round results"
							checked={ attributes.showRounds }
							onChange={ ( val: boolean ) =>
								setAttributes( { showRounds: val } )
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
						[Standings — Tournament #
						{ attributes.tournamentId || '?' }]
						{ ! attributes.showRounds && ' (rounds hidden)' }
					</p>
				</div>
			</>
		);
	},
	save() {
		return null;
	},
} );
