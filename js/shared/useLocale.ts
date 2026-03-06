import { useState, useEffect } from '@wordpress/element';

/**
 * Hook that listens for rockaden-lang-change events and returns the
 * current locale string. React blocks use this for live language switching.
 *
 * @param initialLocale The starting locale value (e.g. 'sv' or 'en').
 */
export function useLocale( initialLocale: string ): string {
	const [ locale, setLocale ] = useState( initialLocale );

	useEffect( () => {
		const handler = ( e: Event ) => {
			const detail = ( e as CustomEvent ).detail;
			if ( detail?.lang ) {
				setLocale( detail.lang );
			}
		};
		window.addEventListener( 'rockaden-lang-change', handler );
		return () =>
			window.removeEventListener( 'rockaden-lang-change', handler );
	}, [] );

	return locale;
}
