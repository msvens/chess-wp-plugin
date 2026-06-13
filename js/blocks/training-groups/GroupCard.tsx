import type { TrainingGroup } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';
import { formatSchedule } from '../../shared/formatSchedule';

interface Props {
	group: TrainingGroup;
	canEdit: boolean;
	lang: Language;
}

export default function GroupCard( { group, canEdit, lang }: Props ) {
	const t = getTranslation( lang );
	const activeParticipants = group.participants.filter( ( p ) => p.active );
	const showParticipants = canEdit || ( group.showParticipants ?? true );
	const schedule =
		group.schedule && group.schedule.startDate
			? formatSchedule( group.schedule, lang, t.training, false )
			: null;

	return (
		<a href={ `/training/${ group.slug }/` } className="rc-tg__card">
			<div className="rc-tg__card-header">
				{ group.semester && (
					<span className="rc-tg__badge rc-tg__badge--semester">
						{ group.semester }
					</span>
				) }
			</div>
			<h3 className="rc-tg__card-title">{ group.title }</h3>
			{ group.description && (
				<p className="rc-tg__card-desc">{ group.description }</p>
			) }
			{ schedule && <p className="rc-tg__card-schedule">{ schedule }</p> }
			{ showParticipants && (
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
