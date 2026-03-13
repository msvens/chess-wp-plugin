import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import type { EventCategory } from '../../shared/types';
import type { ViewMode } from './utils';
import { categoryClassMap } from './utils';

interface ViewModeLabels {
	month: string;
	week: string;
	day: string;
}

interface CalendarHeaderProps {
	title: string;
	locale: string;
	todayLabel: string;
	categories: EventCategory[];
	categoryLabels: Record< EventCategory, string >;
	allLabel: string;
	filterCategory: EventCategory | null;
	onFilterChange: ( category: EventCategory | null ) => void;
	viewMode: ViewMode;
	viewModeLabels: ViewModeLabels;
	onViewModeChange: ( mode: ViewMode ) => void;
	onPrev: () => void;
	onNext: () => void;
	onToday: () => void;
}

const viewModes: ViewMode[] = [ 'month', 'week', 'day' ];

export default function CalendarHeader( {
	title,
	todayLabel,
	categories,
	categoryLabels,
	allLabel,
	filterCategory,
	onFilterChange,
	viewMode,
	viewModeLabels,
	onViewModeChange,
	onPrev,
	onNext,
	onToday,
}: CalendarHeaderProps ) {
	const [ filterOpen, setFilterOpen ] = useState( false );
	const [ viewOpen, setViewOpen ] = useState( false );
	const filterRef = useRef< HTMLDivElement >( null );
	const viewRef = useRef< HTMLDivElement >( null );

	const handleFilterSelect = useCallback(
		( cat: EventCategory | null ) => {
			onFilterChange( cat );
			setFilterOpen( false );
		},
		[ onFilterChange ]
	);

	const handleViewSelect = useCallback(
		( mode: ViewMode ) => {
			onViewModeChange( mode );
			setViewOpen( false );
		},
		[ onViewModeChange ]
	);

	// Close dropdowns on outside click
	useEffect( () => {
		if ( ! filterOpen && ! viewOpen ) {
			return;
		}
		function onClickOutside( e: MouseEvent ) {
			if (
				filterOpen &&
				filterRef.current &&
				! filterRef.current.contains( e.target as Node )
			) {
				setFilterOpen( false );
			}
			if (
				viewOpen &&
				viewRef.current &&
				! viewRef.current.contains( e.target as Node )
			) {
				setViewOpen( false );
			}
		}
		document.addEventListener( 'mousedown', onClickOutside );
		return () =>
			document.removeEventListener( 'mousedown', onClickOutside );
	}, [ filterOpen, viewOpen ] );

	const navLabel =
		viewMode === 'month' ? 'month' : viewMode === 'week' ? 'week' : 'day';

	return (
		<div className="rc-cal__header">
			<div className="rc-cal__header-left">
				<div className="rc-cal__filter" ref={ filterRef }>
					<button
						type="button"
						className="rc-cal__filter-btn"
						onClick={ () => setFilterOpen( ! filterOpen ) }
						aria-expanded={ filterOpen }
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

					{ filterOpen && (
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
									onClick={ () => handleFilterSelect( null ) }
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
										onClick={ () =>
											handleFilterSelect( cat )
										}
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
					aria-label={ `Previous ${ navLabel }` }
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

				<span className="rc-cal__header-title">{ title }</span>

				<button
					type="button"
					className="rc-cal__nav-btn"
					onClick={ onNext }
					aria-label={ `Next ${ navLabel }` }
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

				<div className="rc-cal__view-switcher" ref={ viewRef }>
					<button
						type="button"
						className="rc-cal__view-btn"
						onClick={ () => setViewOpen( ! viewOpen ) }
						aria-expanded={ viewOpen }
						aria-haspopup="listbox"
					>
						<span>{ viewModeLabels[ viewMode ] }</span>
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

					{ viewOpen && (
						<ul className="rc-cal__view-menu" role="listbox">
							{ viewModes.map( ( mode ) => (
								<li key={ mode }>
									<button
										type="button"
										className={ `rc-cal__view-option${
											viewMode === mode
												? ' rc-cal__view-option--active'
												: ''
										}` }
										role="option"
										aria-selected={ viewMode === mode }
										onClick={ () =>
											handleViewSelect( mode )
										}
									>
										{ viewModeLabels[ mode ] }
									</button>
								</li>
							) ) }
						</ul>
					) }
				</div>
			</div>
		</div>
	);
}
