import type { Tournament } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';

interface Props {
	tournament: Tournament;
	lang: Language;
	// Participant count from SSF, for SSF-backed tournaments.
	ssfCount?: number;
}

function formatDate( value: string, lang: Language ): string {
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
 * Compact list-view row for a tournament — same data as the card, laid out as a
 * single divider-separated row (title + dates on the left, status/category/count
 * on the right).
 * @param root0
 * @param root0.tournament
 * @param root0.lang
 */

/**
 * The participant count to display, or null to show no counter.
 *
 * SSF-backed tournaments keep their players in SSF, so the local list is empty;
 * their count arrives asynchronously and is simply absent until it does — better
 * than rendering a confident "0". Also honours the show-participants toggle, the
 * way the training-group cards do.
 *
 * @param tournament The tournament.
 * @param ssfCount   Count resolved from SSF, when available.
 */
function participantCount(
	tournament: Tournament,
	ssfCount: number | undefined
): number | null {
	if ( ! ( tournament.showParticipants ?? true ) ) {
		return null;
	}
	if ( tournament.ssfGroupId > 0 ) {
		return ssfCount ?? null;
	}
	return tournament.participants.filter( ( p ) => p.active ).length;
}

export default function TournamentRow( { tournament, lang, ssfCount }: Props ) {
	const t = getTranslation( lang );
	const count = participantCount( tournament, ssfCount );
	const isSsfBacked = tournament.ssfGroupId > 0;
	const dateRange = [
		formatDate( tournament.startDate, lang ),
		formatDate( tournament.endDate, lang ),
	]
		.filter( Boolean )
		.join( ' – ' );

	return (
		<a href={ `/tournaments/${ tournament.slug }/` } className="rc-tn__row">
			<span className="rc-tn__row-main">
				<span className="rc-tn__row-title">{ tournament.title }</span>
				{ dateRange && (
					<span className="rc-tn__row-dates">{ dateRange }</span>
				) }
			</span>
			<span className="rc-tn__row-meta">
				<span
					className={ `rc-tn__badge rc-tn__badge--status is-${ tournament.status }` }
				>
					{ t.tournament.statuses[ tournament.status ] }
				</span>
				<span className="rc-tn__badge rc-tn__badge--category">
					{ t.tournament.categories[ tournament.category ] }
				</span>
				{ isSsfBacked && (
					<span className="rc-tn__badge rc-tn__badge--ssf">SSF</span>
				) }
				{ count !== null && (
					<span className="rc-tn__row-count">
						{ count } { t.training.participants.toLowerCase() }
					</span>
				) }
			</span>
		</a>
	);
}
