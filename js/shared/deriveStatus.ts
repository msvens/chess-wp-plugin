// Client-side mirror of the server's StatusDeriver (PHP) so forms can preview
// what 'Automatic' resolves to. Local-midnight date compares.

export type DerivedStatus = 'planned' | 'active' | 'completed';

function parseLocalDate( value: string ): Date | null {
	const m = value.slice( 0, 10 ).match( /^(\d{4})-(\d{2})-(\d{2})$/ );
	return m
		? new Date( Number( m[ 1 ] ), Number( m[ 2 ] ) - 1, Number( m[ 3 ] ) )
		: null;
}

export function deriveStatus(
	start: string,
	end: string,
	hasResults: boolean
): DerivedStatus {
	const today = new Date();
	today.setHours( 0, 0, 0, 0 );
	const endDate = parseLocalDate( end );
	if ( endDate && today > endDate ) {
		return 'completed';
	}
	const startDate = parseLocalDate( start );
	if ( ! hasResults && ( ! startDate || today < startDate ) ) {
		return 'planned';
	}
	return 'active';
}
