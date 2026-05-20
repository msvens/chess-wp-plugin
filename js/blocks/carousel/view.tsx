/**
 * Frontend hydration for the Image Carousel block.
 */
import { createRoot } from '@wordpress/element';
import CarouselApp from './CarouselApp';
import type { CarouselConfig } from './CarouselApp';
import './carousel.css';

document
	.querySelectorAll< HTMLDivElement >( '.rockaden-carousel-block' )
	.forEach( ( el ) => {
		const raw = el.dataset.config;
		if ( ! raw ) {
			return;
		}
		let config: CarouselConfig;
		try {
			config = JSON.parse( raw );
		} catch {
			return;
		}
		const locale =
			document.documentElement.dataset.lang || el.dataset.locale || 'sv';
		// Clear the loading placeholder, then mount React.
		el.innerHTML = '';
		createRoot( el ).render(
			<CarouselApp config={ config } locale={ locale } />
		);
	} );
