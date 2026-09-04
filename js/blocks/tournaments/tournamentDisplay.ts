/**
 * Display helpers shared by TournamentCard and TournamentRow.
 *
 * Both components are always mounted — CSS decides which one is visible, and
 * the row is also the mobile layout — so anything either of them renders has to
 * behave identically in both. These two were duplicated verbatim, which is how
 * that guarantee quietly stops being true.
 */
import type { Tournament } from '../../admin/types';
import type { Language } from '../../shared/types';
import { participantsVisible } from '../../shared/participantsVisible';

/**
 * A tournament date in the reader's language, e.g. "3 sep. 2026".
 *
 * @param value Raw date string from the API.
 * @param lang  UI language.
 * @return The formatted date, or the input unchanged if it cannot be parsed.
 */
export function formatDate( value: string, lang: Language ): string {
	if ( ! value ) {
		return '';
	}
	const d = new Date( value );
	if ( isNaN( d.getTime() ) ) {
		return value;
	}
	return d.toLocaleDateString( lang === 'sv' ? 'sv-SE' : 'en-GB', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	} );
}

/**
 * The participant count to display, or null when it must not be shown.
 *
 * Deliberately not driven by any block attribute: whether participants are
 * public is the owner's decision on the tournament itself, and a display
 * setting must never be able to override it. The server already strips the
 * participants for non-editors, but an editor previewing the page does receive
 * them — this check is what keeps them out of the editor's own view.
 *
 * @param tournament The tournament.
 * @param ssfCount   Count from SSF for SSF-backed tournaments; undefined until resolved.
 * @return The count, or null to render nothing.
 */
export function participantCount(
	tournament: Tournament,
	ssfCount: number | undefined
): number | null {
	const count =
		tournament.ssfGroupId > 0
			? ssfCount
			: tournament.participants.filter( ( p ) => p.active ).length;

	// undefined means an SSF count that hasn't resolved yet — nothing to show.
	if ( count === undefined ) {
		return null;
	}

	return participantsVisible( tournament.showParticipants, count )
		? count
		: null;
}
