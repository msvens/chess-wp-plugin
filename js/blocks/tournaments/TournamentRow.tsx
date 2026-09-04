import type { Tournament } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';
import { formatDate, participantCount } from './tournamentDisplay';

interface Props {
	tournament: Tournament;
	lang: Language;
	// Participant count from SSF, for SSF-backed tournaments.
	ssfCount?: number;
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
