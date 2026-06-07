import { useState, useEffect, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type {
	TrainingGroup,
	TrainingSession,
	SsfPlayer,
	EventData,
	Tournament,
} from '../../admin/types';
import type { Language } from '../../shared/types';
import type { Translations } from '../../shared/translations';
import { getTranslation, toLanguage } from '../../shared/translations';
import { useLocale } from '../../shared/useLocale';
import TabBar from './TabBar';
import ParticipantsTab from './ParticipantsTab';
import SessionsTab from './SessionsTab';

interface Props {
	groupId: number;
	clubId: string;
	canEdit: boolean;
	locale: string;
}

export type Tab = 'participants' | 'sessions';

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

export default function TrainingGroupApp( {
	groupId,
	clubId,
	canEdit,
	locale,
}: Props ) {
	const currentLocale = useLocale( locale );
	const lang = toLanguage( currentLocale );
	const t = getTranslation( lang );
	const [ group, setGroup ] = useState< TrainingGroup | null >( null );
	const [ sessions, setSessions ] = useState< TrainingSession[] >( [] );
	const [ ratings, setRatings ] = useState< Map< number, SsfPlayer > >(
		new Map()
	);
	const [ event, setEvent ] = useState< EventData | null >( null );
	const [ tournament, setTournament ] = useState< Tournament | null >( null );
	const [ activeTab, setActiveTab ] = useState< Tab >( 'participants' );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		if ( ! groupId ) {
			setLoading( false );
			return;
		}

		const fetchData = async () => {
			try {
				const groupData = await apiFetch< TrainingGroup >( {
					path: `/rockaden/v1/training-groups/${ groupId }`,
				} );
				setGroup( groupData );

				const sessionData = await apiFetch< TrainingSession[] >( {
					path: `/rockaden/v1/training-groups/${ groupId }/sessions`,
				} );
				setSessions( sessionData );

				if ( groupData.eventId ) {
					apiFetch< EventData >( {
						path: `/rockaden/v1/events/${ groupData.eventId }`,
					} )
						.then( ( ev ) => setEvent( ev ) )
						.catch( () => {} );
				}

				if ( groupData.linkedTournamentId ) {
					apiFetch< Tournament >( {
						path: `/rockaden/v1/tournaments/${ groupData.linkedTournamentId }`,
					} )
						.then( ( tn ) => setTournament( tn ) )
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
			.catch( () => {} );
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

	const hasInfo = group.trainers || group.contact || schedule || tournament;

	// Editors always see the participant list; the public respects the toggle.
	// Sessions are always shown (the schedule/notes are useful publicly); when
	// participants are hidden, attendance names are stripped server-side.
	const showParticipants = canEdit || ( group.showParticipants ?? true );
	const availableTabs: Tab[] = [
		...( showParticipants ? ( [ 'participants' ] as Tab[] ) : [] ),
		'sessions',
	];
	const effectiveTab: Tab | null = availableTabs.includes( activeTab )
		? activeTab
		: availableTabs[ 0 ] ?? null;

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
					{ tournament && (
						<div className="rc-td__info-item">
							<dt>{ t.tournament.linkedTournament }</dt>
							<dd>
								<a
									href={ `/tournaments/${ tournament.slug }/` }
									className="rc-td__info-link"
								>
									{ tournament.title } ↗
								</a>
							</dd>
						</div>
					) }
				</dl>
			) }

			{ availableTabs.length > 0 && effectiveTab && (
				<>
					<TabBar
						tabs={ availableTabs }
						activeTab={ effectiveTab }
						onChange={ setActiveTab }
						t={ t.training }
					/>

					{ effectiveTab === 'participants' && (
						<ParticipantsTab
							participants={ group.participants }
							ratings={ ratings }
							t={ t.training }
						/>
					) }

					{ effectiveTab === 'sessions' && (
						<SessionsTab
							sessions={ sessions }
							participants={ group.participants }
							showAttendance={ showParticipants }
							initialSessionId={
								initialSession
									? Number( initialSession[ 1 ] )
									: null
							}
							t={ t.training }
						/>
					) }
				</>
			) }
		</div>
	);
}
