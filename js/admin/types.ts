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

export interface TrainingGroup {
	id: number;
	slug: string;
	title: string;
	description: string;
	status: string;
	semester: string;
	audience: TrainingAudience;
	eventId: number;
	linkedTournamentId: number;
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
	ssfGroupId: number;
	ssfTournamentId: number;
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
	eventId?: number;
	trainers?: string;
	contact?: string;
	linkedTournamentId?: number;
}

export type TournamentCategory =
	| 'junior'
	| 'youth'
	| 'adult'
	| 'senior'
	| 'mixed';

export type TournamentStatus = 'planned' | 'active' | 'completed';

export type TournamentFormat = 'round-robin';

export interface Tournament {
	id: number;
	slug: string;
	title: string;
	description: string;
	category: TournamentCategory;
	status: TournamentStatus;
	format: TournamentFormat;
	timeControl: string;
	participants: Participant[];
	rounds: StoredRound[];
	ssfGroupId: number;
	eventId: number;
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
	status?: TournamentStatus;
	format?: TournamentFormat;
	timeControl?: string;
	ssfGroupId?: number;
	eventId?: number;
	externalLink?: string;
	startDate?: string;
	endDate?: string;
	showParticipants?: boolean;
	showStandings?: boolean;
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
