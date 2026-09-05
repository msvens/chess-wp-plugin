import type { TrainingGroup } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';
import { formatSchedule } from '../../shared/formatSchedule';
import { toSingleLine } from '../../shared/Description';
import { participantsVisible } from '../../shared/participantsVisible';
import type { TrainingGroupFields } from '../../shared/overviewFields';

interface Props {
	group: TrainingGroup;
	lang: Language;
	fields: TrainingGroupFields;
}

export default function GroupCard( { group, lang, fields }: Props ) {
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

	// The location rides along inside the schedule string, so it only stands on
	// its own when the schedule itself is hidden.
	const location =
		fields.showLocation && ! fields.showSchedule
			? group.schedule?.location || ''
			: '';

	// Training groups reuse the tournament status labels — the same three states,
	// derived by the same StatusDeriver. 'draft' never reaches here; the app
	// filters it out before rendering.
	const status =
		fields.showStatus && group.status !== 'draft'
			? t.tournament.statuses[ group.status ]
			: null;

	return (
		<a href={ `/training/${ group.slug }/` } className="rc-tg__card">
			<div className="rc-tg__card-header">
				{ fields.showSemester && group.semester && (
					<span className="rc-tg__badge rc-tg__badge--semester">
						{ group.semester }
					</span>
				) }
				{ status && (
					<span
						className={ `rc-tg__badge rc-tg__badge--status is-${ group.status }` }
					>
						{ status }
					</span>
				) }
			</div>
			<h3 className="rc-tg__card-title">{ group.title }</h3>
			{ fields.showDescription && group.description && (
				<p className="rc-tg__card-desc">
					{ toSingleLine( group.description ) }
				</p>
			) }
			{ schedule && <p className="rc-tg__card-schedule">{ schedule }</p> }
			{ location && (
				<p className="rc-tg__card-detail">
					<span className="rc-tg__card-label">
						{ t.training.location }
					</span>{ ' ' }
					{ location }
				</p>
			) }
			{ fields.showTrainers && group.trainers && (
				<p className="rc-tg__card-detail">
					<span className="rc-tg__card-label">
						{ t.training.trainers }
					</span>{ ' ' }
					{ group.trainers }
				</p>
			) }
			{ fields.showContact && group.contact && (
				<p className="rc-tg__card-detail">
					<span className="rc-tg__card-label">
						{ t.training.contact }
					</span>{ ' ' }
					{ group.contact }
				</p>
			) }
			{ showCount && (
				<div className="rc-tg__card-footer">
					<span className="rc-tg__card-meta">
						{ activeParticipants.length }{ ' ' }
						{ t.training.participants.toLowerCase() }
					</span>
				</div>
			) }
		</a>
	);
}
