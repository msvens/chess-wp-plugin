import type { TrainingGroup } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';
import { formatSchedule } from '../../shared/formatSchedule';

interface Props {
	group: TrainingGroup;
	canEdit: boolean;
	lang: Language;
}

/**
 * Compact list-view row for a training group — same data as the card, laid out
 * as a single divider-separated row (title + schedule on the left, semester +
 * participant count on the right).
 * @param root0
 * @param root0.group
 * @param root0.canEdit
 * @param root0.lang
 */
export default function GroupRow( { group, canEdit, lang }: Props ) {
	const t = getTranslation( lang );
	const activeParticipants = group.participants.filter( ( p ) => p.active );
	const showParticipants = canEdit || ( group.showParticipants ?? true );
	const schedule =
		group.schedule && group.schedule.startDate
			? formatSchedule( group.schedule, lang, t.training, false )
			: null;

	return (
		<a href={ `/training/${ group.slug }/` } className="rc-tg__row">
			<span className="rc-tg__row-main">
				<span className="rc-tg__row-title">{ group.title }</span>
				{ schedule && (
					<span className="rc-tg__row-schedule">{ schedule }</span>
				) }
			</span>
			<span className="rc-tg__row-meta">
				{ group.semester && (
					<span className="rc-tg__badge rc-tg__badge--semester">
						{ group.semester }
					</span>
				) }
				{ showParticipants && (
					<span className="rc-tg__row-count">
						{ activeParticipants.length }{ ' ' }
						{ t.training.participants.toLowerCase() }
					</span>
				) }
			</span>
		</a>
	);
}
