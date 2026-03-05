import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import type { EventCategory } from '../../shared/types';
import { categoryClassMap, formatMonthYear } from './utils';

interface CalendarHeaderProps {
	year: number;
	month: number;
	locale: string;
	todayLabel: string;
	categories: EventCategory[];
	categoryLabels: Record< EventCategory, string >;
	allLabel: string;
	filterCategory: EventCategory | null;
	onFilterChange: ( category: EventCategory | null ) => void;
	onPrev: () => void;
	onNext: () => void;
	onToday: () => void;
}

export default function CalendarHeader( {
	year,
	month,
	locale,
	todayLabel,
	categories,
	categoryLabels,
	allLabel,
	filterCategory,
	onFilterChange,
	onPrev,
	onNext,
	onToday,
}: CalendarHeaderProps ) {
	const [ open, setOpen ] = useState( false );
	const ref = useRef< HTMLDivElement >( null );

	const handleSelect = useCallback(
		( cat: EventCategory | null ) => {
			onFilterChange( cat );
			setOpen( false );
		},
		[ onFilterChange ]
	);

	// Close on outside click
	useEffect( () => {
		if ( ! open ) {
			return;
		}
		function onClickOutside( e: MouseEvent ) {
			if ( ref.current && ! ref.current.contains( e.target as Node ) ) {
				setOpen( false );
			}
		}
		document.addEventListener( 'mousedown', onClickOutside );
		return () =>
			document.removeEventListener( 'mousedown', onClickOutside );
	}, [ open ] );

	return (
		<div className="rc-cal__header">
			<div className="rc-cal__header-left">
				<div className="rc-cal__filter" ref={ ref }>
					<button
						type="button"
						className="rc-cal__filter-btn"
						onClick={ () => setOpen( ! open ) }
						aria-expanded={ open }
						aria-haspopup="listbox"
					>
						{ filterCategory && (
							<span
								className={ `rc-cal__filter-dot rc-cal__filter-dot--${ categoryClassMap[ filterCategory ] }` }
							/>
						) }
						<span>
							{ filterCategory
								? categoryLabels[ filterCategory ]
								: allLabel }
						</span>
						<svg
							className="rc-cal__filter-chevron"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</button>

					{ open && (
						<ul className="rc-cal__filter-menu" role="listbox">
							<li>
								<button
									type="button"
									className={ `rc-cal__filter-option${
										filterCategory === null
											? ' rc-cal__filter-option--active'
											: ''
									}` }
									role="option"
									aria-selected={ filterCategory === null }
									onClick={ () => handleSelect( null ) }
								>
									{ allLabel }
								</button>
							</li>
							{ categories.map( ( cat ) => (
								<li key={ cat }>
									<button
										type="button"
										className={ `rc-cal__filter-option${
											filterCategory === cat
												? ' rc-cal__filter-option--active'
												: ''
										}` }
										role="option"
										aria-selected={ filterCategory === cat }
										onClick={ () => handleSelect( cat ) }
									>
										<span
											className={ `rc-cal__filter-dot rc-cal__filter-dot--${ categoryClassMap[ cat ] }` }
										/>
										{ categoryLabels[ cat ] }
									</button>
								</li>
							) ) }
						</ul>
					) }
				</div>
			</div>

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

			<div className="rc-cal__header-right">
				<button
					type="button"
					className="rc-cal__today-btn"
					onClick={ onToday }
				>
					{ todayLabel }
				</button>
			</div>
		</div>
	);
}
