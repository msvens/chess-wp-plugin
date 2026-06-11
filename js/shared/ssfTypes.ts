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
	// 1 = registration (not started), 2 = started, 3 = finished.
	state: number;
	// Tournament format; team formats per isSsfTeamType (e.g. 2 = Allsvenskan).
	type: number;
	rootClasses: SsfTournamentClass[];
}

// The endpoint /ssf/tournament/group/id/{gid} returns the PARENT tournament
// (with rootClasses[].groups[]), not a bare group — these helpers dig out the
// specific group and classify the format.

// Flatten every group across the class tree (rootClasses + nested subClasses).
export function ssfAllGroups( t: SsfTournament ): SsfTournamentGroup[] {
	const out: SsfTournamentGroup[] = [];
	const walk = ( classes: SsfTournamentClass[] ) => {
		for ( const c of classes ) {
			out.push( ...( c.groups ?? [] ) );
			if ( c.subClasses?.length ) {
				walk( c.subClasses );
			}
		}
	};
	walk( t.rootClasses ?? [] );
	return out;
}

export function ssfFindGroup(
	t: SsfTournament,
	groupId: number
): SsfTournamentGroup | undefined {
	return ssfAllGroups( t ).find( ( g ) => g.id === groupId );
}

// Team tournament formats (Allsvenskan, Svenska Cupen, Yes2Chess, Schackfyran).
// Their results come from different endpoints, so we link out instead of
// rendering them inline. Mirrors schack-se-sdk's isTeamTournament.
export function isSsfTeamType( type: number ): boolean {
	return type === 2 || type === 6 || type === 8 || type === 9;
}
