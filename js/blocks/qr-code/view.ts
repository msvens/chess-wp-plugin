/**
 * Frontend for the QR Code block: draws each code from its data-url.
 */
import { qrSvg } from '../../shared/qr';
import './qr-code.css';

document
	.querySelectorAll< HTMLElement >( '.rockaden-qr-code-block .rc-qr__code' )
	.forEach( async ( el ) => {
		const url = el.dataset.url;
		if ( url ) {
			el.innerHTML = await qrSvg( url );
		}
	} );
