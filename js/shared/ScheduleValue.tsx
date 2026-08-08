import type { Language } from './types';
import type { Translations } from './translations';
import {
	formatScheduleDetail,
	MAX_LISTED_DATES,
	MAX_LISTED_DATES_NARROW,
	type ScheduleDisplay,
	type ScheduleSource,
} from './formatSchedule';

/**
 * The value of a detail page's "Schedule" row.
 *
 * A phone fits far fewer dates on a line than a desktop, so the wide and narrow
 * wordings are both rendered and a media query picks one — no viewport state, no
 * resize listener. Most schedules read the same at both widths, in which case
 * only one node is emitted.
 */

interface Props {
	// The linked calendar event, or null when there is none.
	source: ScheduleSource | null;
	lang: Language;
	t: Translations[ 'training' ];
	// Editor-authored free text, which replaces the derived wording entirely.
	override?: string;
}

function Lines( { display }: { display: ScheduleDisplay } ) {
	return (
		<>
			<span className="rc-td__schedule-primary">{ display.primary }</span>
			{ display.secondary && (
				<span className="rc-td__schedule-secondary">
					{ display.secondary }
				</span>
			) }
		</>
	);
}

export default function ScheduleValue( { source, lang, t, override }: Props ) {
	if ( override ) {
		return <>{ override }</>;
	}
	if ( ! source ) {
		return null;
	}

	const wide = formatScheduleDetail( source, lang, t, MAX_LISTED_DATES );
	const narrow = formatScheduleDetail(
		source,
		lang,
		t,
		MAX_LISTED_DATES_NARROW
	);

	if (
		wide.primary === narrow.primary &&
		wide.secondary === narrow.secondary
	) {
		return <Lines display={ wide } />;
	}

	return (
		<>
			<span className="rc-td__schedule--wide">
				<Lines display={ wide } />
			</span>
			<span className="rc-td__schedule--narrow">
				<Lines display={ narrow } />
			</span>
		</>
	);
}
