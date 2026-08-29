import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type {
	TrainingGroup,
	TrainingSession,
	SsfPlayer,
	EventData,
} from '../../admin/types';
import { getTranslation, toLanguage } from '../../shared/translations';
import ScheduleValue from '../../shared/ScheduleValue';
import { useLocale } from '../../shared/useLocale';
import { fetchClubPlayers } from '../../shared/ssf';
import Description from '../../shared/Description';
import { participantsVisible } from '../../shared/participantsVisible';
import TabBar from './TabBar';
import ParticipantsTab from './ParticipantsTab';
import SessionsTab from './SessionsTab';

interface Props {
	groupId: number;
	clubId: string;
	locale: string;
}

export type Tab = 'participants' | 'sessions';

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

	if ( loading ) {
		return <p className="rc-td__loading">{ t.common.loading }</p>;
	}

	if ( ! group ) {
		return null;
	}

	const hasInfo = group.trainers || group.contact || event;

	// Two different questions, deliberately kept apart:
	//
	//  - participantsPublic is the privacy toggle. It drives attendance names in
	//    the sessions tab, and must NOT go false just because the list happens to
	//    be empty right now — the group may gain participants mid-season.
	//  - showParticipantsTab additionally requires someone to actually be in the
	//    list, so an empty group doesn't offer a tab onto nothing.
	//
	// Sessions are always shown; their schedule and notes are useful publicly,
	// and attendance names are stripped server-side when participants are hidden.
	const participantsPublic = group.showParticipants ?? true;
	const showParticipantsTab = participantsVisible(
		group.showParticipants,
		group.participants.filter( ( p ) => p.active ).length
	);
	const availableTabs: Tab[] = [
		...( showParticipantsTab ? ( [ 'participants' ] as Tab[] ) : [] ),
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
				<Description
					text={ group.description }
					className="rc-td__description"
				/>
			) }

			{ hasInfo && (
				<dl className="rc-td__info">
					{ event && (
						<div className="rc-td__info-item">
							<dt>{ t.training.schedule }</dt>
							<dd>
								<ScheduleValue
									source={ event }
									lang={ lang }
									t={ t.training }
								/>
							</dd>
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
							showAttendance={ participantsPublic }
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
