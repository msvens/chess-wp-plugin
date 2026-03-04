import { formatMonthYear } from './utils';

interface CalendarHeaderProps {
	year: number;
	month: number;
	locale: string;
	todayLabel: string;
	onPrev: () => void;
	onNext: () => void;
	onToday: () => void;
}

export default function CalendarHeader( {
	year,
	month,
	locale,
	todayLabel,
	onPrev,
	onNext,
	onToday,
}: CalendarHeaderProps ) {
	return (
		<div className="rc-cal__header">
			<div className="rc-cal__header-nav">
				<button
					type="button"
					className="rc-cal__nav-btn"
					onClick={ onPrev }
					aria-label="Previous month"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="15 18 9 12 15 6" />
					</svg>
				</button>

				<span className="rc-cal__header-title">
					{ formatMonthYear( year, month, locale ) }
				</span>

				<button
					type="button"
					className="rc-cal__nav-btn"
					onClick={ onNext }
					aria-label="Next month"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="9 18 15 12 9 6" />
					</svg>
				</button>
			</div>

			<button
				type="button"
				className="rc-cal__today-btn"
				onClick={ onToday }
			>
				{ todayLabel }
			</button>
		</div>
	);
}
