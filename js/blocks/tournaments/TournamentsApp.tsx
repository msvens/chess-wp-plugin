import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { Tournament } from '../../admin/types';
import { getTranslation, toLanguage } from '../../shared/translations';
import { useLocale } from '../../shared/useLocale';
import TournamentCard from './TournamentCard';
import TournamentRow from './TournamentRow';
import type { Language } from '../../shared/types';

interface Props {
	locale: string;
	layout?: 'cards' | 'list';
}

const STATUS_ORDER: Record< Tournament[ 'status' ], number > = {
	active: 0,
	planned: 1,
	completed: 2,
};

function Section( {
	items,
	lang,
	showCards,
}: {
	items: Tournament[];
	lang: Language;
	showCards: boolean;
} ) {
	return (
		<>
			{ showCards && (
				<div className="rc-tn__grid">
					{ items.map( ( tournament ) => (
						<TournamentCard
							key={ tournament.id }
							tournament={ tournament }
							lang={ lang }
						/>
					) ) }
				</div>
			) }
			<ul className="rc-tn__list">
				{ items.map( ( tournament ) => (
					<li key={ tournament.id }>
						<TournamentRow
							tournament={ tournament }
							lang={ lang }
						/>
					</li>
				) ) }
			</ul>
		</>
	);
}

export default function TournamentsApp( { locale, layout = 'cards' }: Props ) {
	const currentLocale = useLocale( locale );
	const lang = toLanguage( currentLocale );
	const t = getTranslation( lang );
	const [ tournaments, setTournaments ] = useState< Tournament[] >( [] );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		apiFetch< Tournament[] >( { path: '/rockaden/v1/tournaments' } )
			.then( ( data ) => {
				const sorted = [ ...data ].sort( ( a, b ) => {
					const diff =
						STATUS_ORDER[ a.status ] - STATUS_ORDER[ b.status ];
					if ( diff !== 0 ) {
						return diff;
					}
					return a.title.localeCompare( b.title );
				} );
				setTournaments( sorted );
				setLoading( false );
			} )
			.catch( () => {
				setLoading( false );
			} );
	}, [] );

	const [ showPast, setShowPast ] = useState( false );

	if ( loading ) {
		return <p className="rc-tn__loading">{ t.common.loading }</p>;
	}

	if ( tournaments.length === 0 ) {
		return <p className="rc-tn__empty">{ t.tournament.noTournaments }</p>;
	}

	// Ongoing = planned + active; Past = completed (effective status from the API).
	const ongoing = tournaments.filter( ( tn ) => tn.status !== 'completed' );
	const past = tournaments.filter( ( tn ) => tn.status === 'completed' );
	// If there's nothing ongoing, reveal the past list so the block isn't empty.
	const pastVisible = showPast || ongoing.length === 0;
	const showCards = layout === 'cards';

	return (
		<div className={ `rc-tn is-${ layout }` }>
			{ ongoing.length > 0 && (
				<Section
					items={ ongoing }
					lang={ lang }
					showCards={ showCards }
				/>
			) }

			{ past.length > 0 && (
				<div className="rc-tn__past">
					<button
						type="button"
						className="rc-tn__past-toggle"
						aria-expanded={ pastVisible }
						onClick={ () => setShowPast( ( v ) => ! v ) }
					>
						{ pastVisible ? '▾' : '▸' }{ ' ' }
						{ t.tournament.pastTournaments } ({ past.length })
					</button>
					{ pastVisible && (
						<Section
							items={ past }
							lang={ lang }
							showCards={ showCards }
						/>
					) }
				</div>
			) }
		</div>
	);
}
