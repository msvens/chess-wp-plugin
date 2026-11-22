/** Date display for the admin Tournaments page. */

function formatDate( value: string ): string {
	if ( ! value ) {
		return '';
	}
	const d = new Date( value );
	if ( isNaN( d.getTime() ) ) {
		return value;
	}
	return d.toLocaleDateString( 'sv-SE', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	} );
}

export function formatDateRange( start: string, end: string ): string {
	const s = formatDate( start );
	const e = formatDate( end );
	if ( s && e ) {
		return `${ s } – ${ e }`;
	}
	return s || e;
}
