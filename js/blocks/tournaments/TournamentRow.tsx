import type { Tournament } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';

interface Props {
	tournament: Tournament;
	lang: Language;
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
export default function TournamentRow( { tournament, lang }: Props ) {
	const t = getTranslation( lang );
	const activeParticipants = tournament.participants.filter(
		( p ) => p.active
	);
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
				<span className="rc-tn__row-count">
					{ activeParticipants.length }{ ' ' }
					{ t.training.participants.toLowerCase() }
				</span>
			</span>
		</a>
	);
}
