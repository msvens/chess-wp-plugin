import { useState } from '@wordpress/element';
import { getTranslation } from '../../../shared';
import type { TournamentView, AppConfig } from '../../types';
import { TournamentList } from './TournamentList';
import { TournamentDetail } from './TournamentDetail';

interface TournamentAppProps {
	config: AppConfig;
}

export function TournamentApp( { config }: TournamentAppProps ) {
	const [ view, setView ] = useState< TournamentView >( { screen: 'list' } );
	const t = getTranslation( config.language );

	switch ( view.screen ) {
		case 'list':
			return (
				<TournamentList
					t={ t }
					onSelect={ ( tournamentId ) =>
						setView( { screen: 'detail', tournamentId } )
					}
				/>
			);
		case 'detail':
			return (
				<TournamentDetail
					tournamentId={ view.tournamentId }
					clubId={ config.clubId }
					t={ t }
					onBack={ () => setView( { screen: 'list' } ) }
				/>
			);
	}
}
