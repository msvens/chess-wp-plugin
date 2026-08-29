import type { Tournament } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';
import { toSingleLine } from '../../shared/Description';
import { participantsVisible } from '../../shared/participantsVisible';

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

export default function TournamentCard( {
	tournament,
	lang,
	ssfCount,
}: Props ) {
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
		<a
			href={ `/tournaments/${ tournament.slug }/` }
			className="rc-tn__card"
		>
			<div className="rc-tn__card-header">
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
			</div>
			<h3 className="rc-tn__card-title">{ tournament.title }</h3>
			{ dateRange && <p className="rc-tn__card-dates">{ dateRange }</p> }
			{ tournament.description && (
				<p className="rc-tn__card-desc">
					{ toSingleLine( tournament.description ) }
				</p>
			) }
			{ count !== null && (
				<div className="rc-tn__card-footer">
					<span className="rc-tn__card-meta">
						{ count } { t.training.participants.toLowerCase() }
					</span>
				</div>
			) }
		</a>
	);
}
