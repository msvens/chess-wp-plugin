import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type {
	TrainingGroup,
	TrainingSession,
	SsfPlayer,
} from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';
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

function toLanguage( locale: string ): Language {
	return locale.startsWith( 'sv' ) ? 'sv' : 'en';
}

export default function TrainingGroupApp( { groupId, clubId, locale }: Props ) {
	const lang = toLanguage( locale );
	const t = getTranslation( lang );
	const [ group, setGroup ] = useState< TrainingGroup | null >( null );
	const [ sessions, setSessions ] = useState< TrainingSession[] >( [] );
	const [ ratings, setRatings ] = useState< Map< number, SsfPlayer > >(
		new Map()
	);
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
			} catch {
				// Silently fail — the block shows empty state.
			} finally {
				setLoading( false );
			}
		};

		fetchData();
	}, [ groupId ] );

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

	if ( loading ) {
		return <p className="rc-td__loading">{ t.common.loading }</p>;
	}

	if ( ! group ) {
		return null;
	}

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

			<TabBar
				activeTab={ activeTab }
				hasTournament={ group.hasTournament }
				onChange={ setActiveTab }
				t={ t.training }
			/>

			{ activeTab === 'participants' && (
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

			{ activeTab === 'standings' && (
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
