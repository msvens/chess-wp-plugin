/**
 * Frontend hydration for the Tournaments overview block.
 */
import { createRoot } from '@wordpress/element';
import {
	parseFields,
	TOURNAMENT_FIELD_DEFAULTS,
} from '../../shared/overviewFields';
import TournamentsApp from './TournamentsApp';
import { configureSsf } from '../../shared/ssf';
import './tournaments.css';

document
	.querySelectorAll< HTMLDivElement >( '.rockaden-tournaments-block' )
	.forEach( ( el ) => {
		const locale =
			document.documentElement.dataset.lang || el.dataset.locale || 'sv';
		const layout = el.dataset.layout === 'list' ? 'list' : 'cards';
		const fields = parseFields(
			el.dataset.fields,
			TOURNAMENT_FIELD_DEFAULTS
		);
		// SSF-backed tournaments keep their players in SSF, so the cards need
		// the proxy configured to count them.
		configureSsf( el.dataset.ssfBase || '' );
		createRoot( el ).render(
			<TournamentsApp
				locale={ locale }
				layout={ layout }
				fields={ fields }
			/>
		);
	} );
