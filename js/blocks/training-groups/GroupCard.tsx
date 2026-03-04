import type { TrainingGroup } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';

interface Props {
	group: TrainingGroup;
	lang: Language;
}

export default function GroupCard( { group, lang }: Props ) {
	const t = getTranslation( lang );
	const activeParticipants = group.participants.filter( ( p ) => p.active );
	const tcLabel =
		t.training[ group.timeControl as 'classical' | 'rapid' | 'blitz' ] ||
		group.timeControl;

	return (
		<a href={ `/training-groups/${ group.slug }/` } className="rc-tg__card">
			<div className="rc-tg__card-header">
				{ group.semester && (
					<span className="rc-tg__badge rc-tg__badge--semester">
						{ group.semester }
					</span>
				) }
				{ group.hasTournament && (
					<span className="rc-tg__badge rc-tg__badge--tournament">
						{ t.training.tournament }
					</span>
				) }
			</div>
			<h3 className="rc-tg__card-title">{ group.title }</h3>
			{ group.description && (
				<p className="rc-tg__card-desc">{ group.description }</p>
			) }
			<div className="rc-tg__card-footer">
				<span className="rc-tg__card-meta">
					{ activeParticipants.length }{ ' ' }
					{ t.training.participants.toLowerCase() }
				</span>
				<span className="rc-tg__card-meta">{ tcLabel }</span>
			</div>
		</a>
	);
}
