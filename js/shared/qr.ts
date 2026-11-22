/**
 * QR code rendering shared by the QR admin screens and the QR Code block, so
 * every code the plugin produces uses the same print settings.
 */
import QRCode from 'qrcode';

// Fixed for print: medium error correction, the 4-module quiet zone the QR spec
// requires, black on white (inverted codes scan badly).
const OPTIONS = {
	errorCorrectionLevel: 'M',
	margin: 4,
	color: { dark: '#000000', light: '#ffffff' },
} as const;

/**
 * The code as an SVG document string.
 *
 * @param url Address to encode.
 */
export function qrSvg( url: string ): Promise< string > {
	return QRCode.toString( url, { ...OPTIONS, type: 'svg' } );
}

/**
 * The code as a PNG data URL, `size` pixels square.
 *
 * @param url  Address to encode.
 * @param size Width and height in pixels.
 */
export function qrPngDataUrl( url: string, size: number ): Promise< string > {
	return QRCode.toDataURL( url, { ...OPTIONS, width: size } );
}

/**
 * A printed code needs an absolute address: a site path such as `/bli-medlem/`
 * is expanded to the site URL (PHP does the same on save). Anything else is
 * returned trimmed.
 *
 * @param value   What the user typed.
 * @param siteUrl The site's home URL.
 */
export function expandPath( value: string, siteUrl: string ): string {
	const trimmed = value.trim();
	if ( trimmed.startsWith( '/' ) && ! trimmed.startsWith( '//' ) ) {
		return siteUrl.replace( /\/+$/, '' ) + trimmed;
	}
	return trimmed;
}

/**
 * Whether `value` is an http(s) address a code can point to.
 *
 * @param value Address to check.
 */
export function isHttpUrl( value: string ): boolean {
	try {
		const { protocol } = new URL( value );
		return protocol === 'http:' || protocol === 'https:';
	} catch {
		return false;
	}
}

function slugify( text: string ): string {
	return text
		.normalize( 'NFD' )
		.replace( /[\u0300-\u036f]/g, '' )
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /^-+|-+$/g, '' );
}

/**
 * A download file name (without extension) for a code. From its name
 * when it has one ("Vinterturnering 2027 – anmälan" → "vinterturnering-2027-
 * anmalan"), otherwise from the address: the last path segment
 * ("/bli-medlem/" → "bli-medlem") or the host ("https://schack.se/" →
 * "schack-se").
 *
 * @param name The code's name; may be empty.
 * @param url  The address it encodes.
 */
export function qrFileName( name: string, url: string ): string {
	const fromName = slugify( name );
	if ( fromName ) {
		return fromName;
	}
	try {
		const { hostname, pathname } = new URL( url );
		const segment = pathname.split( '/' ).filter( Boolean ).pop() || '';
		return (
			slugify( segment ) ||
			slugify( hostname.replace( /^www\./, '' ) ) ||
			'qr-code'
		);
	} catch {
		return 'qr-code';
	}
}

/**
 * Let the browser save `href` as `fileName`.
 *
 * @param href     Object or data URL.
 * @param fileName Suggested file name.
 */
function saveAs( href: string, fileName: string ): void {
	const a = document.createElement( 'a' );
	a.href = href;
	a.download = fileName;
	document.body.appendChild( a );
	a.click();
	a.remove();
}

/**
 * Download the code as an SVG file named by qrFileName().
 *
 * @param url  Address to encode.
 * @param name The code's name; may be empty.
 */
export async function downloadSvg(
	url: string,
	name: string
): Promise< void > {
	const svg = await qrSvg( url );
	const href = URL.createObjectURL(
		new Blob( [ svg ], { type: 'image/svg+xml' } )
	);
	saveAs( href, `${ qrFileName( name, url ) }.svg` );
	// Revoking right after click() can cancel the download in Safari.
	setTimeout( () => URL.revokeObjectURL( href ), 1000 );
}

/**
 * Download the code as a PNG, `size` pixels square, named by qrFileName().
 *
 * @param url  Address to encode.
 * @param name The code's name; may be empty.
 * @param size Width and height in pixels.
 */
export async function downloadPng(
	url: string,
	name: string,
	size: number
): Promise< void > {
	saveAs(
		await qrPngDataUrl( url, size ),
		`${ qrFileName( name, url ) }.png`
	);
}

const missingCache = new Map< string, Promise< boolean > >();

/**
 * Whether an address on this site answers 404/410 to a logged-out visitor
 * (credentials omitted, so a draft or private page counts as missing).
 * Addresses on other sites aren't checked: the browser can't read their
 * responses. A network error doesn't count as missing.
 *
 * @param url Address to check.
 */
export function isTargetMissing( url: string ): Promise< boolean > {
	let origin: string;
	try {
		origin = new URL( url ).origin;
	} catch {
		return Promise.resolve( false );
	}
	if ( origin !== window.location.origin ) {
		return Promise.resolve( false );
	}
	let pending = missingCache.get( url );
	if ( ! pending ) {
		pending = fetch( url, { method: 'HEAD', credentials: 'omit' } )
			.then( ( res ) => res.status === 404 || res.status === 410 )
			.catch( () => false );
		missingCache.set( url, pending );
	}
	return pending;
}
