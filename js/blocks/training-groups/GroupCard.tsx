import type { TrainingGroup } from '../../admin/types';
import type { Language } from '../../shared/types';
import { getTranslation } from '../../shared/translations';

interface Props {
	group: TrainingGroup;
	canEdit: boolean;
	lang: Language;
}

function formatSchedule(
	schedule: NonNullable< TrainingGroup[ 'schedule' ] >,
	lang: Language,
	t: ReturnType< typeof getTranslation >[ 'training' ]
): string {
	const start = new Date( schedule.startDate );
	const loc = lang === 'sv' ? 'sv-SE' : 'en-US';
	const weekday = start.toLocaleDateString( loc, { weekday: 'long' } );

	const timeMatch = ( s: string ) => {
		const m = s.match( /(\d{2}):(\d{2})/ );
		return m ? `${ m[ 1 ] }:${ m[ 2 ] }` : '';
	};
	const timeStart = timeMatch( schedule.startDate );
	const timeEnd = timeMatch( schedule.endDate );

	const prefix =
		schedule.recurrenceType === 'biweekly'
			? t.everyOtherWeek
			: schedule.isRecurring
			? t.everyWeek
			: '';

	const dayStr = prefix
		? `${ prefix } ${ weekday.toLowerCase() }`
		: weekday.charAt( 0 ).toUpperCase() + weekday.slice( 1 );

	return `${ dayStr } ${ timeStart }–${ timeEnd }`;
}

export default function GroupCard( { group, canEdit, lang }: Props ) {
	const t = getTranslation( lang );
	const activeParticipants = group.participants.filter( ( p ) => p.active );
	const showParticipants = canEdit || ( group.showParticipants ?? true );
	const schedule =
		group.schedule && group.schedule.startDate
			? formatSchedule( group.schedule, lang, t.training )
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
