import { useState, useEffect, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type {
	TrainingGroup,
	TrainingSession,
	SsfPlayer,
	EventData,
} from '../../admin/types';
import type { Language } from '../../shared/types';
import type { Translations } from '../../shared/translations';
import { getTranslation, toLanguage } from '../../shared/translations';
import { useLocale } from '../../shared/useLocale';
import TabBar from './TabBar';
import ParticipantsTab from './ParticipantsTab';
import SessionsTab from './SessionsTab';
import StandingsTab from './StandingsTab';

interface Props {
	groupId: number;
	clubId: string;
	locale: string;
}

export type Tab = 'participants' | 'sessions' | 'standings';

function extractTime( dateStr: string ): string {
	const match = dateStr.match( /(\d{2}):(\d{2})/ );
	return match ? `${ match[ 1 ] }:${ match[ 2 ] }` : '';
}

function formatSchedule(
	event: EventData,
	lang: Language,
	t: Translations[ 'training' ]
): string {
	const start = new Date( event.startDate );
	const loc = lang === 'sv' ? 'sv-SE' : 'en-US';
	const weekday = start.toLocaleDateString( loc, { weekday: 'long' } );

	const timeStart = extractTime( event.startDate );
	const timeEnd = extractTime( event.endDate );

	const prefix =
		event.recurrenceType === 'biweekly'
			? t.everyOtherWeek
			: event.isRecurring
			? t.everyWeek
			: '';

	const dayStr = prefix
		? `${ prefix } ${ weekday.toLowerCase() }`
		: weekday.charAt( 0 ).toUpperCase() + weekday.slice( 1 );

	const parts = [ `${ dayStr } ${ timeStart }–${ timeEnd }` ];
	if ( event.location ) {
		parts.push( event.location );
	}
	return parts.join( ', ' );
}

export default function TrainingGroupApp( { groupId, clubId, locale }: Props ) {
	const currentLocale = useLocale( locale );
	const lang = toLanguage( currentLocale );
	const t = getTranslation( lang );
	const [ group, setGroup ] = useState< TrainingGroup | null >( null );
	const [ sessions, setSessions ] = useState< TrainingSession[] >( [] );
	const [ ratings, setRatings ] = useState< Map< number, SsfPlayer > >(
		new Map()
	);
	const [ event, setEvent ] = useState< EventData | null >( null );
	const [ activeTab, setActiveTab ] = useState< Tab >( 'participants' );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		if ( ! groupId ) {
			setLoading( false );
			return;
		}

		const fetchData = async () => {
			try {
				const [ groupData, sessionData ] = await Promise.all( [
					apiFetch< TrainingGroup >( {
						path: `/rockaden/v1/training-groups/${ groupId }`,
					} ),
					apiFetch< TrainingSession[] >( {
						path: `/rockaden/v1/training-groups/${ groupId }/sessions`,
					} ),
				] );
				setGroup( groupData );
				setSessions( sessionData );

				if ( groupData.eventId ) {
					apiFetch< EventData >( {
						path: `/rockaden/v1/events/${ groupData.eventId }`,
					} )
						.then( ( ev ) => setEvent( ev ) )
						.catch( () => {} );
				}
			} catch {
				// Silently fail — the block shows empty state.
			} finally {
				setLoading( false );
			}
		};

		fetchData();
	}, [ groupId ] );

	// Default to sessions tab if participants are hidden.
	useEffect( () => {
		if (
			group &&
			! group.showParticipants &&
			activeTab === 'participants'
		) {
			setActiveTab( 'sessions' );
		}
	}, [ group ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Fetch SSF ratings if club ID is available.
	useEffect( () => {
		if ( ! clubId ) {
			return;
		}

		apiFetch< SsfPlayer[] >( {
			path: `/rockaden/v1/ssf/federation/player/club/${ clubId }`,
		} )
			.then( ( players ) => {
				const map = new Map< number, SsfPlayer >();
				for ( const player of players ) {
					map.set( player.id, player );
				}
				setRatings( map );
			} )
			.catch( () => {
				// Ratings are optional — ignore errors.
			} );
	}, [ clubId ] );

	const schedule = useMemo(
		() => ( event ? formatSchedule( event, lang, t.training ) : null ),
		[ event, lang, t.training ]
	);

	if ( loading ) {
		return <p className="rc-td__loading">{ t.common.loading }</p>;
	}

	if ( ! group ) {
		return null;
	}

	const hasInfo =
		group.trainers || group.contact || schedule || group.tournamentLink;

	// Read initial tab from URL hash.
	const initialSession =
		typeof window !== 'undefined'
			? window.location.hash.match( /^#session-(\d+)$/ )
			: null;

	return (
		<div className="rc-td">
			<h1 className="rc-td__title">{ group.title }</h1>
			{ group.description && (
				<p className="rc-td__description">{ group.description }</p>
			) }

			{ hasInfo && (
				<dl className="rc-td__info">
					{ schedule && (
						<div className="rc-td__info-item">
							<dt>{ t.training.schedule }</dt>
							<dd>{ schedule }</dd>
						</div>
					) }
					{ group.trainers && (
						<div className="rc-td__info-item">
							<dt>{ t.training.trainers }</dt>
							<dd>{ group.trainers }</dd>
						</div>
					) }
					{ group.contact && (
						<div className="rc-td__info-item">
							<dt>{ t.training.contact }</dt>
							<dd>{ group.contact }</dd>
						</div>
					) }
					{ group.tournamentLink && (
						<div className="rc-td__info-item">
							<dt>{ t.training.results }</dt>
							<dd>
								<a
									href={ group.tournamentLink }
									target="_blank"
									rel="noopener noreferrer"
									className="rc-td__info-link"
								>
									SSF { t.training.results } ↗
								</a>
							</dd>
						</div>
					) }
				</dl>
			) }

			<TabBar
				activeTab={ activeTab }
				hasTournament={ group.hasTournament }
				showParticipants={ group.showParticipants }
				showStandings={ group.showStandings }
				onChange={ setActiveTab }
				t={ t.training }
			/>

			{ activeTab === 'participants' && group.showParticipants && (
				<ParticipantsTab
					participants={ group.participants }
					ratings={ ratings }
					t={ t.training }
				/>
			) }

			{ activeTab === 'sessions' && (
				<SessionsTab
					sessions={ sessions }
					participants={ group.participants }
					initialSessionId={
						initialSession ? Number( initialSession[ 1 ] ) : null
					}
					t={ t.training }
				/>
			) }

			{ activeTab === 'standings' && group.showStandings && (
				<StandingsTab
					participants={ group.participants }
					rounds={ group.rounds }
					ratings={ ratings }
					t={ t.training }
				/>
			) }
		</div>
	);
}
