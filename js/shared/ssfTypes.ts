/**
 * TypeScript interfaces for SSF (Swedish Chess Federation) API responses.
 */

export interface SsfEloRating {
	rating: number;
	rapidRating: number;
	blitzRating: number;
	title: string;
}

export interface SsfPlayerInfo {
	id: number;
	firstName: string;
	lastName: string;
	elo: SsfEloRating | null;
}

export interface SsfEndResult {
	place: number;
	points: number;
	secPoints: number;
	wonGames: number;
	drawGames: number;
	lostGames: number;
	playerInfo: SsfPlayerInfo;
}

export interface SsfRoundResult {
	roundNr: number;
	board: number;
	homeId: number;
	homeResult: number; // 1, 0.5, 0
	awayId: number;
	awayResult: number;
	date: string;
}

export interface SsfLocalTime {
	hour: number;
	minute: number;
}

export interface SsfTournamentRound {
	roundNumber: number;
	roundDate: string;
}

export interface SsfTournamentGroup {
	id: number;
	name: string;
	start: string;
	end: string;
	nrofrounds: number;
	arenaStart: SsfLocalTime | null;
	arenaEnd: SsfLocalTime | null;
	cost: number;
	tournamentRounds: SsfTournamentRound[];
}

export interface SsfTournamentClass {
	classID: number;
	className: string;
	groups: SsfTournamentGroup[];
	subClasses: SsfTournamentClass[];
}

export interface SsfTournament {
	id: number;
	name: string;
	start: string;
	end: string;
	city: string;
	arena: string;
	invitationurl: string;
	rootClasses: SsfTournamentClass[];
}
