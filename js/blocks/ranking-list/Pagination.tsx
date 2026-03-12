import type { Translations } from '../../shared/translations';
import { PAGE_SIZE } from './utils';

interface Props {
	total: number;
	page: number;
	onPageChange: ( page: number ) => void;
	t: Translations;
}

/**
 * Build page numbers with ellipsis gaps.
 * Always shows first page, last page, and a window around current.
 *
 * @param current    Current active page number.
 * @param totalPages Total number of pages.
 */
function getPageNumbers(
	current: number,
	totalPages: number
): ( number | '...' )[] {
	if ( totalPages <= 7 ) {
		return Array.from( { length: totalPages }, ( _, i ) => i + 1 );
	}

	const pages: ( number | '...' )[] = [ 1 ];

	let windowStart = Math.max( 2, current - 1 );
	let windowEnd = Math.min( totalPages - 1, current + 1 );

	// Near the start: extend window rightward
	if ( current <= 4 ) {
		windowStart = 2;
		windowEnd = Math.min( totalPages - 1, 5 );
	}
	// Near the end: extend window leftward
	else if ( current >= totalPages - 3 ) {
		windowEnd = totalPages - 1;
		windowStart = Math.max( 2, totalPages - 4 );
	}

	if ( windowStart > 2 ) {
		pages.push( '...' );
	}

	for ( let i = windowStart; i <= windowEnd; i++ ) {
		pages.push( i );
	}

	if ( windowEnd < totalPages - 1 ) {
		pages.push( '...' );
	}

	pages.push( totalPages );

	return pages;
}

export default function Pagination( { total, page, onPageChange, t }: Props ) {
	const totalPages = Math.ceil( total / PAGE_SIZE );
	if ( totalPages <= 1 ) {
		return null;
	}

	const start = ( page - 1 ) * PAGE_SIZE + 1;
	const end = Math.min( page * PAGE_SIZE, total );
	const pageNumbers = getPageNumbers( page, totalPages );

	return (
		<div className="rc-rl__pagination">
			<span className="rc-rl__pagination-summary">
				{ t.ranking.showing } { start }–{ end } { t.ranking.of }{ ' ' }
				{ total } { t.ranking.players }
			</span>
			<div className="rc-rl__pagination-buttons">
				<button
					className="rc-rl__page-btn rc-rl__page-btn--arrow"
					disabled={ page === 1 }
					onClick={ () => onPageChange( page - 1 ) }
					aria-label="Previous page"
				>
					‹
				</button>
				{ pageNumbers.map( ( p, idx ) =>
					p === '...' ? (
						<span
							key={ `dots-${ idx }` }
							className="rc-rl__page-dots"
						>
							…
						</span>
					) : (
						<button
							key={ p }
							className={ `rc-rl__page-btn${
								p === page ? ' rc-rl__page-btn--active' : ''
							}` }
							onClick={ () => onPageChange( p ) }
						>
							{ p }
						</button>
					)
				) }
				<button
					className="rc-rl__page-btn rc-rl__page-btn--arrow"
					disabled={ page === totalPages }
					onClick={ () => onPageChange( page + 1 ) }
					aria-label="Next page"
				>
					›
				</button>
			</div>
		</div>
	);
}
