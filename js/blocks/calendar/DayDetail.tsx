import type { CalendarEvent } from '../../shared/types';
import type { Translations } from '../../shared/translations';
import { categoryClassMap, formatFullDate, formatTime } from './utils';

interface DayDetailProps {
	day: number;
	month: number;
	year: number;
	events: CalendarEvent[];
	locale: string;
	t: Translations[ 'calendar' ];
	onClose: () => void;
}

export default function DayDetail( {
	day,
	month,
	year,
	events,
	locale,
	t,
	onClose,
}: DayDetailProps ) {
	return (
		<div className="rc-cal__detail">
			<div className="rc-cal__detail-header">
				<span className="rc-cal__detail-date">
					{ formatFullDate( year, month, day, locale ) }
				</span>
				<button
					type="button"
					className="rc-cal__detail-close"
					onClick={ onClose }
					aria-label="Close"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			{ events.length === 0 ? (
				<p className="rc-cal__detail-empty">{ t.noEvents }</p>
			) : (
				<div className="rc-cal__detail-list">
					{ events.map( ( event ) => (
						<EventCard
							key={ event.id }
							event={ event }
							locale={ locale }
							t={ t }
						/>
					) ) }
				</div>
			) }
		</div>
	);
}

function EventCard( {
	event,
	locale,
	t,
}: {
	event: CalendarEvent;
	locale: string;
	t: Translations[ 'calendar' ];
} ) {
	const cls = categoryClassMap[ event.category ];
	const startTime = formatTime( event.startDate, locale );
	const endTime = formatTime( event.endDate, locale );

	return (
		<div className="rc-cal__event-card">
			<div
				className={ `rc-cal__event-indicator rc-cal__event-indicator--${ cls }` }
			/>
			<div className="rc-cal__event-body">
				<p className="rc-cal__event-title">{ event.title }</p>
				<div className="rc-cal__event-meta">
					<span className="rc-cal__event-meta-item">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
						{ startTime }–{ endTime }
					</span>
					{ event.location && (
						<span className="rc-cal__event-meta-item">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
								<circle cx="12" cy="10" r="3" />
							</svg>
							{ event.location }
						</span>
					) }
				</div>
				{ event.description && (
					<p className="rc-cal__event-desc">{ event.description }</p>
				) }
				<span
					className={ `rc-cal__event-category rc-cal__event-category--${ cls }` }
				>
					{ t.eventCategories[ event.category ] }
				</span>
				{ event.link && (
					<>
						{ ' ' }
						<a
							className="rc-cal__event-link"
							href={ event.link }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ event.linkLabel || event.link }
						</a>
					</>
				) }
			</div>
		</div>
	);
}
