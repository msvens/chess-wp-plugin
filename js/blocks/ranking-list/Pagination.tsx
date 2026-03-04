import type { Translations } from '../../shared/translations';
import { PAGE_SIZE } from './utils';

interface Props {
	total: number;
	page: number;
	onPageChange: ( page: number ) => void;
	t: Translations;
}

export default function Pagination( { total, page, onPageChange, t }: Props ) {
	const totalPages = Math.ceil( total / PAGE_SIZE );
	if ( totalPages <= 1 ) {
		return null;
	}

	const start = ( page - 1 ) * PAGE_SIZE + 1;
	const end = Math.min( page * PAGE_SIZE, total );

	// Windowed page numbers: show max 5 around current page.
	const windowSize = 5;
	let first = Math.max( 1, page - Math.floor( windowSize / 2 ) );
	const last = Math.min( totalPages, first + windowSize - 1 );
	if ( last - first + 1 < windowSize ) {
		first = Math.max( 1, last - windowSize + 1 );
	}

	const pages: number[] = [];
	for ( let i = first; i <= last; i++ ) {
		pages.push( i );
	}

	return (
		<div className="rc-rl__pagination">
			<span className="rc-rl__pagination-summary">
				{ t.ranking.showing } { start }–{ end } { t.ranking.of }{ ' ' }
				{ total } { t.ranking.players }
			</span>
			<div className="rc-rl__pagination-buttons">
				<button
					className="rc-rl__page-btn"
					disabled={ page === 1 }
					onClick={ () => onPageChange( page - 1 ) }
					aria-label="Previous page"
				>
					‹
				</button>
				{ pages.map( ( p ) => (
					<button
						key={ p }
						className={ `rc-rl__page-btn${
							p === page ? ' rc-rl__page-btn--active' : ''
						}` }
						onClick={ () => onPageChange( p ) }
					>
						{ p }
					</button>
				) ) }
				<button
					className="rc-rl__page-btn"
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
