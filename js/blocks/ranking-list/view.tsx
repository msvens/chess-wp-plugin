/**
 * Frontend hydration for the Ranking List block.
 */
import { createRoot } from '@wordpress/element';
import RankingListApp from './RankingListApp';
import './ranking-list.css';

document
	.querySelectorAll< HTMLDivElement >( '.rockaden-ranking-list-block' )
	.forEach( ( el ) => {
		const clubId = el.dataset.clubId || '';
		const locale =
			document.documentElement.dataset.lang || el.dataset.locale || 'sv';
		createRoot( el ).render(
			<RankingListApp clubId={ clubId } locale={ locale } />
		);
	} );
