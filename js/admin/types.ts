import type { Language } from '../shared';
import type { PlayerInfoDto } from '@msvens/schack-se-sdk';

export interface Participant {
	id: string;
	name: string;
	ssfId: number | null;
	active: boolean;
}

export interface StoredPairing {
	whiteId: string;
	blackId: string;
	result: '1-0' | '0.5-0.5' | '0-1' | null;
}

export interface StoredRound {
	round: number;
	pairings: StoredPairing[];
	bye?: string;
}

export type TrainingAudience = 'junior' | 'adult' | 'mixed';

// Effective status (what the API returns): 'draft' = hidden from the public.
export type TrainingStatus = 'planned' | 'active' | 'completed' | 'draft';

// Status as chosen in the editor: 'auto' derives from the linked event's dates.
export type TrainingStatusChoice = 'auto' | TrainingStatus;

export interface TrainingGroup {
	id: number;
	slug: string;
	title: string;
	description: string;
	status: TrainingStatus;
	statusIsAuto: boolean;
	semester: string;
	audience: TrainingAudience;
	eventId: number;
	participants: Participant[];
	trainers: string;
	contact: string;
	schedule: {
		startDate: string;
		endDate: string;
		isRecurring: boolean;
		recurrenceType: string;
		recurrenceEndDate: string;
		location: string;
	} | null;
	showParticipants?: boolean;
	createdBy: number;
}

export interface TrainingSession {
	id: number;
	groupId: number;
	sessionDate: string;
	notes: string;
	attendance: string[];
}

export interface SsfRatingInfo {
	rating: number;
	title: string;
	rapidRating: number;
	blitzRating: number;
}

// The SSF player shape now comes from the SDK (single source of truth for the
// schack.se API). Kept as a local alias so existing `SsfPlayer` references
// elsewhere in the plugin stay stable.
export type SsfPlayer = PlayerInfoDto;

export interface EventData {
	id: number;
	title: string;
	description: string;
	startDate: string;
	endDate: string;
	location: string;
	category: string;
	link: string;
	linkLabel: string;
	isRecurring: boolean;
	recurrenceType: 'weekly' | 'biweekly' | null;
	recurrenceEndDate: string;
	excludedDates: string[];
}

export interface CreateEventData {
	title: string;
	startDate: string;
	endDate: string;
	description?: string;
	location?: string;
	category?: string;
	isRecurring?: boolean;
	recurrenceType?: 'weekly' | 'biweekly';
	// Series end (date-only YYYY-MM-DD); empty = repeats with no end date.
	recurrenceEndDate?: string;
}

export interface CreateGroupData {
	title: string;
	description?: string;
	semester?: string;
	audience?: TrainingAudience;
	status?: TrainingStatusChoice;
	trainers?: string;
	contact?: string;
	showParticipants?: boolean;
	// Calendar projection: an object creates/updates the group-owned event from
	// these fields; null removes it; omitted leaves it untouched.
	calendarEvent?: CalendarEventPayload | null;
}

export type TournamentCategory =
	| 'junior'
	| 'youth'
	| 'adult'
	| 'senior'
	| 'mixed';

// Effective lifecycle status (what's displayed/sorted). 'auto' is only a stored
// mode, surfaced separately via statusIsAuto.
export type TournamentStatus = 'planned' | 'active' | 'completed';

// Status as chosen in the editor: 'auto' (derive from dates/results) or an explicit override.
export type TournamentStatusChoice = 'auto' | TournamentStatus;

export type TournamentFormat = 'round-robin';

export interface Tournament {
	id: number;
	slug: string;
	title: string;
	description: string;
	category: TournamentCategory;
	status: TournamentStatus;
	statusIsAuto: boolean;
	format: TournamentFormat;
	timeControl: string;
	participants: Participant[];
	rounds: StoredRound[];
	ssfGroupId: number;
	ssfTournamentId: number;
	ssfTournamentName: string;
	eventId: number;
	// The linked calendar event's fields (null if none), for the edit form.
	calendarEvent: CalendarEventPayload | null;
	externalLink: string;
	startDate: string;
	endDate: string;
	showParticipants: boolean;
	showStandings: boolean;
	createdBy: number;
}

export interface CreateTournamentData {
	title: string;
	description?: string;
	category?: TournamentCategory;
	status?: TournamentStatusChoice;
	format?: TournamentFormat;
	timeControl?: string;
	ssfGroupId?: number;
	ssfTournamentId?: number;
	ssfTournamentName?: string;
	eventId?: number;
	externalLink?: string;
	startDate?: string;
	endDate?: string;
	showParticipants?: boolean;
	showStandings?: boolean;
	ssfHasResults?: boolean;
	// Calendar projection: an object creates/updates the tournament-owned event
	// from these fields; null removes it; omitted leaves it untouched.
	calendarEvent?: CalendarEventPayload | null;
}

// The calendar-event fields authored from a tournament or training-group form
// (the event the owner projects onto the calendar). Title/owner come from the
// owning tournament or group.
export interface CalendarEventPayload {
	startDate: string;
	endDate: string;
	location: string;
	category: string;
	isRecurring: boolean;
	recurrenceType: 'weekly' | 'biweekly';
	// Series end (date-only YYYY-MM-DD); empty = repeats with no end date.
	recurrenceEndDate: string;
}

export type TournamentView =
	| { screen: 'list' }
	| { screen: 'detail'; tournamentId: number };

// Navigation state
export type View =
	| { screen: 'list' }
	| { screen: 'group'; groupId: number }
	| { screen: 'session'; groupId: number; sessionId: number };

export interface AppConfig {
	restUrl: string;
	nonce: string;
	locale: string;
	clubId: string;
	language: Language;
}
