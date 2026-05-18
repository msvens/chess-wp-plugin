import type { Tournament } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';

interface Props {
	tournament: Tournament;
	lang: Language;
}

export default function TournamentCard( { tournament, lang }: Props ) {
	const t = getTranslation( lang );
	const activeParticipants = tournament.participants.filter(
		( p ) => p.active
	);
	const isSsfBacked = tournament.ssfGroupId > 0;

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
			{ tournament.description && (
				<p className="rc-tn__card-desc">{ tournament.description }</p>
			) }
			<div className="rc-tn__card-footer">
				<span className="rc-tn__card-meta">
					{ activeParticipants.length }{ ' ' }
					{ t.training.participants.toLowerCase() }
				</span>
			</div>
		</a>
	);
}
