import apiFetch from '@wordpress/api-fetch';
import type {
	TrainingGroup,
	TrainingSession,
	SsfPlayer,
	Game,
	CreateGroupData,
	EventData,
	CreateEventData,
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

export function saveGameResult(
	sessionId: number,
	idx: number,
	game: Game
): Promise< TrainingSession > {
	return apiFetch( {
		path: `${ BASE }/training-sessions/${ sessionId }/games/${ idx }`,
		method: 'PUT',
		data: game,
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

// SSF Proxy
export function fetchClubRatings( clubId: string ): Promise< SsfPlayer[] > {
	const today = new Date().toISOString().split( 'T' )[ 0 ];
	return apiFetch( {
		path: `${ BASE }/ssf/ratinglist/club/${ clubId }/date/${ today }/ratingtype/1/category/0`,
	} );
}
