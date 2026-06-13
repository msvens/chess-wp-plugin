import type { Language } from '../shared';

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

export interface SsfPlayer {
	id: number;
	firstName: string;
	lastName: string;
	club: string;
	clubId: number;
	elo: {
		rating: number;
		title: string;
		date: string;
		k: number;
		rapidRating: number;
		rapidk: number;
		blitzRating: number;
		blitzK: number;
	} | null;
}

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
}

export interface CreateGroupData {
	title: string;
	description?: string;
	semester?: string;
	audience?: TrainingAudience;
	status?: TrainingStatusChoice;
	eventId?: number;
	trainers?: string;
	contact?: string;
	showParticipants?: boolean;
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
	calendarEvent: TournamentCalendarEvent | null;
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
	calendarEvent?: TournamentCalendarEvent | null;
}

// The calendar-event fields authored from the tournament form (the event the
// tournament projects onto the calendar). Title/owner come from the tournament.
export interface TournamentCalendarEvent {
	startDate: string;
	endDate: string;
	location: string;
	category: string;
	isRecurring: boolean;
	recurrenceType: 'weekly' | 'biweekly';
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
