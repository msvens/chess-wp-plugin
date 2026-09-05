import type { Tournament } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';
import { toSingleLine } from '../../shared/Description';
import type { TournamentFields } from '../../shared/overviewFields';
import { formatDate, participantCount } from './tournamentDisplay';

interface Props {
	tournament: Tournament;
	lang: Language;
	// Participant count from SSF, for SSF-backed tournaments.
	ssfCount?: number;
	fields: TournamentFields;
}

/**
 * Compact list-view row for a tournament — the same fields as the card, laid out
 * as a single divider-separated row (title and dates on the left,
 * status/category/count on the right).
 *
 * This is not merely the card's small sibling: it is also the mobile layout,
 * rendered unconditionally while CSS chooses which of the two is visible. So it
 * has to honour every field toggle, or a setting would silently do nothing on a
 * phone.
 *
 * @param root0            Props.
 * @param root0.tournament The tournament.
 * @param root0.lang       UI language.
 * @param root0.ssfCount   Count resolved from SSF, when available.
 * @param root0.fields     Which fields to render.
 */
export default function TournamentRow( {
	tournament,
	lang,
	ssfCount,
	fields,
}: Props ) {
	const t = getTranslation( lang );

	// ANDed, never ORed: the block toggle can only hide a count, never reveal one
	// the tournament itself has hidden. Privacy is the owner's call; this toggle
	// only lets a page author drop the count from a crowded overview.
	const count = fields.showParticipantCount
		? participantCount( tournament, ssfCount )
		: null;

	const isSsfBacked = tournament.ssfGroupId > 0;
	const dateRange = fields.showDates
		? [
				formatDate( tournament.startDate, lang ),
				formatDate( tournament.endDate, lang ),
		  ]
				.filter( Boolean )
				.join( ' – ' )
		: '';

	const location = fields.showLocation
		? tournament.calendarEvent?.location || ''
		: '';

	const timeControl =
		fields.showTimeControl && tournament.timeControl
			? t.training[
					tournament.timeControl as 'classical' | 'rapid' | 'blitz'
			  ] || tournament.timeControl
			: '';

	const details = [
		{ label: t.calendar.location, value: location },
		{ label: t.training.timeControl, value: timeControl },
	].filter( ( d ) => d.value );

	return (
		<a href={ `/tournaments/${ tournament.slug }/` } className="rc-tn__row">
			<span className="rc-tn__row-main">
				<span className="rc-tn__row-title">{ tournament.title }</span>
				{ dateRange && (
					<span className="rc-tn__row-dates">{ dateRange }</span>
				) }
				{ fields.showDescription && tournament.description && (
					<span className="rc-tn__row-desc">
						{ toSingleLine( tournament.description ) }
					</span>
				) }
				{ details.map( ( d ) => (
					<span className="rc-tn__row-detail" key={ d.label }>
						<span className="rc-tn__card-label">{ d.label }</span>{ ' ' }
						{ d.value }
					</span>
				) ) }
			</span>
			<span className="rc-tn__row-meta">
				{ fields.showStatus && (
					<span
						className={ `rc-tn__badge rc-tn__badge--status is-${ tournament.status }` }
					>
						{ t.tournament.statuses[ tournament.status ] }
					</span>
				) }
				{ fields.showCategory && (
					<span className="rc-tn__badge rc-tn__badge--category">
						{ t.tournament.categories[ tournament.category ] }
					</span>
				) }
				{ fields.showSsfBadge && isSsfBacked && (
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
