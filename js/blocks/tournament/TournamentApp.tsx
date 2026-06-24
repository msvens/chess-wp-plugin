import { useState, useEffect, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { Tournament, SsfPlayer, EventData } from '../../admin/types';
import { getTranslation, toLanguage } from '../../shared/translations';
import { formatSchedule } from '../../shared/formatSchedule';
import { useLocale } from '../../shared/useLocale';
import { fetchClubPlayers } from '../../shared/ssf';
import SsfResultsView from '../training-group/SsfResultsView';
import StandingsTab from './StandingsTab';

interface Props {
	tournamentId: number;
	clubId: string;
	locale: string;
}

export default function TournamentApp( {
	tournamentId,
	clubId,
	locale,
}: Props ) {
	const currentLocale = useLocale( locale );
	const lang = toLanguage( currentLocale );
	const t = getTranslation( lang );
	const [ tournament, setTournament ] = useState< Tournament | null >( null );
	const [ ratings, setRatings ] = useState< Map< number, SsfPlayer > >(
		new Map()
	);
	const [ event, setEvent ] = useState< EventData | null >( null );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		if ( ! tournamentId ) {
			setLoading( false );
			return;
		}

		apiFetch< Tournament >( {
			path: `/rockaden/v1/tournaments/${ tournamentId }`,
		} )
			.then( ( data ) => {
				setTournament( data );
				if ( data.eventId ) {
					apiFetch< EventData >( {
						path: `/rockaden/v1/events/${ data.eventId }`,
					} )
						.then( ( ev ) => setEvent( ev ) )
						.catch( () => {} );
				}
			} )
			.catch( () => {} )
			.finally( () => setLoading( false ) );
	}, [ tournamentId ] );

	useEffect( () => {
		if ( ! clubId ) {
			return;
		}

		let cancelled = false;
		fetchClubPlayers( clubId )
			.then( ( players ) => {
				if ( cancelled ) {
					return;
				}
				const map = new Map< number, SsfPlayer >();
				for ( const player of players ) {
					map.set( player.id, player );
				}
				setRatings( map );
			} )
			.catch( () => {} );
		return () => {
			cancelled = true;
		};
	}, [ clubId ] );

	const schedule = useMemo(
		() => ( event ? formatSchedule( event, lang, t.training ) : null ),
		[ event, lang, t.training ]
	);

	if ( loading ) {
		return <p className="rc-td__loading">{ t.common.loading }</p>;
	}

	if ( ! tournament ) {
		return null;
	}

	const isSsfBacked = tournament.ssfGroupId > 0;
	const hasInfo = schedule || tournament.externalLink;

	return (
		<div className="rc-td">
			<h1 className="rc-td__title">{ tournament.title }</h1>
			{ tournament.ssfTournamentName &&
				tournament.ssfTournamentName !== tournament.title && (
					<p className="rc-td__parent-tournament">
						{ t.tournament.ssfParentTournament }:{ ' ' }
						{ tournament.ssfTournamentName }
					</p>
				) }
			{ tournament.description && (
				<p className="rc-td__description">{ tournament.description }</p>
			) }

			{ hasInfo && (
				<dl className="rc-td__info">
					{ schedule && (
						<div className="rc-td__info-item">
							<dt>{ t.training.schedule }</dt>
							<dd>{ schedule }</dd>
						</div>
					) }
					{ tournament.externalLink && (
						<div className="rc-td__info-item">
							<dt>{ t.tournament.fullResults }</dt>
							<dd>
								<a
									href={ tournament.externalLink }
									target="_blank"
									rel="noopener noreferrer"
									className="rc-td__info-link"
								>
									{ t.common.here } ↗
								</a>
							</dd>
						</div>
					) }
				</dl>
			) }

			{ isSsfBacked ? (
				<SsfResultsView
					ssfGroupId={ tournament.ssfGroupId }
					t={ t.training }
				/>
			) : (
				<StandingsTab
					tournament={ tournament }
					ratings={ ratings }
					t={ t.training }
				/>
			) }
		</div>
	);
}
