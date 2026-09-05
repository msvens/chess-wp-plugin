import type { TrainingGroup } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';
import { formatSchedule } from '../../shared/formatSchedule';
import { participantsVisible } from '../../shared/participantsVisible';
import { toSingleLine } from '../../shared/Description';
import type { TrainingGroupFields } from '../../shared/overviewFields';

interface Props {
	group: TrainingGroup;
	lang: Language;
	fields: TrainingGroupFields;
}

/**
 * Compact list-view row for a training group — same data as the card, laid out
 * as a single divider-separated row (title + schedule on the left, semester +
 * participant count on the right).
 * @param root0
 * @param root0.group
 * @param root0.lang
 * @param root0.fields
 */
export default function GroupRow( { group, lang, fields }: Props ) {
	const t = getTranslation( lang );
	const activeParticipants = group.participants.filter( ( p ) => p.active );
	// ANDed, never ORed: the block toggle can only hide a count, never reveal one
	// the group itself has hidden. Privacy is the group owner's call; this toggle
	// only lets a page author drop the count from a crowded overview.
	const showCount =
		fields.showParticipantCount &&
		participantsVisible(
			group.showParticipants,
			activeParticipants.length
		);
	const schedule =
		fields.showSchedule && group.schedule && group.schedule.startDate
			? formatSchedule(
					group.schedule,
					lang,
					t.training,
					fields.showLocation
			  )
			: null;

	// Training groups reuse the tournament status labels — same three states,
	// same StatusDeriver. 'draft' is filtered out before rendering.
	const status =
		fields.showStatus && group.status !== 'draft'
			? t.tournament.statuses[ group.status ]
			: null;

	// The location rides along inside the schedule string, so it only stands on
	// its own when the schedule itself is hidden.
	const location =
		fields.showLocation && ! fields.showSchedule
			? group.schedule?.location || ''
			: '';

	// Every toggle has to work here too: the row is the mobile layout, so a
	// field that only appeared on cards would silently do nothing on a phone.
	const details = [
		{ show: !! location, label: t.training.location, value: location },
		{
			show: fields.showTrainers && !! group.trainers,
			label: t.training.trainers,
			value: group.trainers,
		},
		{
			show: fields.showContact && !! group.contact,
			label: t.training.contact,
			value: group.contact,
		},
	].filter( ( d ) => d.show );

	return (
		<a href={ `/training/${ group.slug }/` } className="rc-tg__row">
			<span className="rc-tg__row-main">
				<span className="rc-tg__row-title">{ group.title }</span>
				{ schedule && (
					<span className="rc-tg__row-schedule">{ schedule }</span>
				) }
				{ fields.showDescription && group.description && (
					<span className="rc-tg__row-desc">
						{ toSingleLine( group.description ) }
					</span>
				) }
				{ details.map( ( d ) => (
					<span className="rc-tg__row-detail" key={ d.label }>
						<span className="rc-tg__card-label">{ d.label }</span>{ ' ' }
						{ d.value }
					</span>
				) ) }
			</span>
			<span className="rc-tg__row-meta">
				{ status && (
					<span
						className={ `rc-tg__badge rc-tg__badge--status is-${ group.status }` }
					>
						{ status }
					</span>
				) }
				{ fields.showSemester && group.semester && (
					<span className="rc-tg__badge rc-tg__badge--semester">
						{ group.semester }
					</span>
				) }
				{ showCount && (
					<span className="rc-tg__row-count">
						{ activeParticipants.length }{ ' ' }
						{ t.training.participants.toLowerCase() }
					</span>
				) }
			</span>
		</a>
	);
}
