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

export default function TournamentCard( {
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
		<a
			href={ `/tournaments/${ tournament.slug }/` }
			className="rc-tn__card"
		>
			<div className="rc-tn__card-header">
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
			</div>
			<h3 className="rc-tn__card-title">{ tournament.title }</h3>
			{ dateRange && <p className="rc-tn__card-dates">{ dateRange }</p> }
			{ fields.showDescription && tournament.description && (
				<p className="rc-tn__card-desc">
					{ toSingleLine( tournament.description ) }
				</p>
			) }
			{ details.map( ( d ) => (
				<p className="rc-tn__card-detail" key={ d.label }>
					<span className="rc-tn__card-label">{ d.label }</span>{ ' ' }
					{ d.value }
				</p>
			) ) }
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
