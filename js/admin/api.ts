import apiFetch from '@wordpress/api-fetch';
import {
	RatingsService,
	ResultsService,
	TournamentService,
	RatingType,
	PlayerCategory,
	type PlayerInfoDto,
	type TournamentDto,
	type TournamentEndResultDto,
	type TournamentRoundResultDto,
} from '@msvens/schack-se-sdk';
import type {
	TrainingGroup,
	TrainingSession,
	CreateGroupData,
	StoredRound,
	EventData,
	CreateEventData,
	Tournament,
	CreateTournamentData,
	TournamentCategory,
	TournamentStatus,
} from './types';

const BASE = 'rockaden/v1';

// Groups
export function fetchGroups(): Promise< TrainingGroup[] > {
	return apiFetch( { path: `${ BASE }/training-groups` } );
}

export function fetchGroup( id: number ): Promise< TrainingGroup > {
	return apiFetch( { path: `${ BASE }/training-groups/${ id }` } );
}

export function createGroup( data: CreateGroupData ): Promise< TrainingGroup > {
	return apiFetch( {
		path: `${ BASE }/training-groups`,
		method: 'POST',
		data,
	} );
}

export function updateGroup(
	id: number,
	data: Partial< CreateGroupData > & { status?: string }
): Promise< TrainingGroup > {
	return apiFetch( {
		path: `${ BASE }/training-groups/${ id }`,
		method: 'PUT',
		data,
	} );
}

export function deleteGroup( id: number ): Promise< { deleted: boolean } > {
	return apiFetch( {
		path: `${ BASE }/training-groups/${ id }`,
		method: 'DELETE',
	} );
}

export function addParticipant(
	groupId: number,
	data: { id: string; name: string; ssfId: number | null }
): Promise< TrainingGroup > {
	return apiFetch( {
		path: `${ BASE }/training-groups/${ groupId }/participants`,
		method: 'POST',
		data,
	} );
}

export function removeParticipant(
	groupId: number,
	participantId: string
): Promise< TrainingGroup > {
	return apiFetch( {
		path: `${ BASE }/training-groups/${ groupId }/participants/${ participantId }`,
		method: 'DELETE',
	} );
}

// Sessions
export function fetchSessions( groupId: number ): Promise< TrainingSession[] > {
	return apiFetch( {
		path: `${ BASE }/training-groups/${ groupId }/sessions`,
	} );
}

export function createSession(
	groupId: number,
	date: string
): Promise< TrainingSession > {
	return apiFetch( {
		path: `${ BASE }/training-groups/${ groupId }/sessions`,
		method: 'POST',
		data: { date },
	} );
}

export function saveAttendance(
	sessionId: number,
	attendance: string[]
): Promise< TrainingSession > {
	return apiFetch( {
		path: `${ BASE }/training-sessions/${ sessionId }/attendance`,
		method: 'PUT',
		data: { attendance },
	} );
}

export function saveNotes(
	sessionId: number,
	notes: string
): Promise< TrainingSession > {
	return apiFetch( {
		path: `${ BASE }/training-sessions/${ sessionId }/notes`,
		method: 'PUT',
		data: { notes },
	} );
}

// Events
export function fetchEvents(): Promise< EventData[] > {
	return apiFetch( { path: `${ BASE }/events` } );
}

export function fetchEvent( id: number ): Promise< EventData > {
	return apiFetch( { path: `${ BASE }/events/${ id }` } );
}

export function createEvent( data: CreateEventData ): Promise< EventData > {
	return apiFetch( {
		path: `${ BASE }/events`,
		method: 'POST',
		data,
	} );
}

export function updateEvent(
	id: number,
	data: Partial< CreateEventData > & { excludedDates?: string[] }
): Promise< EventData > {
	return apiFetch( {
		path: `${ BASE }/events/${ id }`,
		method: 'PUT',
		data,
	} );
}

// Tournaments
export function fetchTournaments( filters?: {
	status?: TournamentStatus;
	category?: TournamentCategory;
} ): Promise< Tournament[] > {
	const params = new URLSearchParams();
	if ( filters?.status ) {
		params.set( 'status', filters.status );
	}
	if ( filters?.category ) {
		params.set( 'category', filters.category );
	}
	const qs = params.toString();
	return apiFetch( {
		path: `${ BASE }/tournaments${ qs ? `?${ qs }` : '' }`,
	} );
}

export function fetchTournament( id: number ): Promise< Tournament > {
	return apiFetch( { path: `${ BASE }/tournaments/${ id }` } );
}

export function createTournament(
	data: CreateTournamentData
): Promise< Tournament > {
	return apiFetch( {
		path: `${ BASE }/tournaments`,
		method: 'POST',
		data,
	} );
}

export function updateTournament(
	id: number,
	data: Partial< CreateTournamentData >
): Promise< Tournament > {
	return apiFetch( {
		path: `${ BASE }/tournaments/${ id }`,
		method: 'PUT',
		data,
	} );
}

export function deleteTournament(
	id: number
): Promise< { deleted: boolean } > {
	return apiFetch( {
		path: `${ BASE }/tournaments/${ id }`,
		method: 'DELETE',
	} );
}

export function addTournamentParticipant(
	tournamentId: number,
	data: { id: string; name: string; ssfId: number | null }
): Promise< Tournament > {
	return apiFetch( {
		path: `${ BASE }/tournaments/${ tournamentId }/participants`,
		method: 'POST',
		data,
	} );
}

export function removeTournamentParticipant(
	tournamentId: number,
	participantId: string
): Promise< Tournament > {
	return apiFetch( {
		path: `${ BASE }/tournaments/${ tournamentId }/participants/${ participantId }`,
		method: 'DELETE',
	} );
}

export function saveTournamentRounds(
	tournamentId: number,
	rounds: StoredRound[]
): Promise< Tournament > {
	return apiFetch( {
		path: `${ BASE }/tournaments/${ tournamentId }/rounds`,
		method: 'PUT',
		data: { rounds },
	} );
}

export function saveTournamentRoundResult(
	tournamentId: number,
	roundIdx: number,
	gameIdx: number,
	result: string | null
): Promise< Tournament > {
	return apiFetch( {
		path: `${ BASE }/tournaments/${ tournamentId }/rounds/${ roundIdx }/games/${ gameIdx }`,
		method: 'PUT',
		data: { result },
	} );
}

// SSF (via @msvens/schack-se-sdk, pointed at the WP proxy by configureSsf()).
// These wrappers throw on failure so the admin views' try/catch error states
// still fire (the SDK itself returns { data?, error, status } rather than
// throwing). Services are constructed lazily so they read the configured base.
async function ssfData< T >(
	res: { data?: T; error?: string },
	what: string
): Promise< T > {
	if ( res.data === undefined ) {
		throw new Error( res.error || `SSF request failed: ${ what }` );
	}
	return res.data;
}

export function fetchSsfTournamentResults(
	groupId: number
): Promise< TournamentEndResultDto[] > {
	return new ResultsService()
		.getTournamentResults( groupId )
		.then( ( res ) => ssfData( res, 'tournament results' ) );
}

export function fetchSsfRoundResults(
	groupId: number
): Promise< TournamentRoundResultDto[] > {
	return new ResultsService()
		.getTournamentRoundResults( groupId )
		.then( ( res ) => ssfData( res, 'round results' ) );
}

// getTournamentFromGroup returns the PARENT tournament (with
// rootClasses[].groups[], plus type/state). Use findTournamentGroup to get the
// specific group.
export function fetchSsfTournamentForGroup(
	groupId: number
): Promise< TournamentDto > {
	return new TournamentService()
		.getTournamentFromGroup( groupId )
		.then( ( res ) => ssfData( res, 'tournament' ) );
}

export function fetchClubRatings( clubId: string ): Promise< PlayerInfoDto[] > {
	return new RatingsService()
		.getClubRatingList(
			Number( clubId ),
			new Date(),
			RatingType.STANDARD,
			PlayerCategory.ALL
		)
		.then( ( res ) => res.data ?? [] );
}
