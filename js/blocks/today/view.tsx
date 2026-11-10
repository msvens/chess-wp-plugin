/**
 * Frontend hydration for the Today block.
 */
import { createRoot } from '@wordpress/element';
import { configureSsf } from '../../shared/ssf';
import TodayApp from './TodayApp';
import './today.css';

document
	.querySelectorAll< HTMLDivElement >( '.rockaden-today-block' )
	.forEach( ( el ) => {
		configureSsf( el.dataset.ssfBase || '' );
		const districtId = Number( el.dataset.districtId ) || 0;
		const showHeading = el.dataset.showHeading !== 'false';
		const showNote = el.dataset.showNote !== 'false';
		const locale =
			document.documentElement.dataset.lang || el.dataset.locale || 'sv';
		createRoot( el ).render(
			<TodayApp
				districtId={ districtId }
				showHeading={ showHeading }
				showNote={ showNote }
				locale={ locale }
			/>
		);
	} );
