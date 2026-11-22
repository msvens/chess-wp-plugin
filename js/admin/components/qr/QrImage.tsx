import { useEffect, useRef } from '@wordpress/element';
import { qrSvg } from '../../../shared/qr';

interface QrImageProps {
	url: string;
	size: number;
}

/**
 * A QR code drawn as inline SVG, `size` pixels square.
 *
 * @param props      Component props.
 * @param props.url  Address to encode.
 * @param props.size Width and height in pixels.
 */
export function QrImage( { url, size }: QrImageProps ) {
	const ref = useRef< HTMLDivElement >( null );

	useEffect( () => {
		let cancelled = false;
		qrSvg( url ).then( ( svg ) => {
			if ( ! cancelled && ref.current ) {
				ref.current.innerHTML = svg;
			}
		} );
		return () => {
			cancelled = true;
		};
	}, [ url ] );

	return (
		<div
			ref={ ref }
			className="rc-qr-image"
			style={ { width: size, height: size } }
			aria-hidden="true"
		/>
	);
}
