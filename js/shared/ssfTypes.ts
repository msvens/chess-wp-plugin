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
