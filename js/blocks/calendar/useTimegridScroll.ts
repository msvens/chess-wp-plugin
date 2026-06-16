import { useLayoutEffect } from '@wordpress/element';

interface RefLike {
	current: HTMLDivElement | null;
}

/**
 * On open, scroll the page so the red "now" line is vertically centred in the
 * viewport — so what's happening now is visible without hunting for it. The
 * time-grid scrolls with the page (no inner scroll area), so this nudges the
 * window. No-op when today isn't shown (`active` false) or the now-line isn't
 * rendered. Runs when `active` flips true (initial open, or pressing Today /
 * landing on today's week), not on every render.
 *
 * @param ref    Ref to the time-grid (scopes the now-line lookup).
 * @param active Whether today is in view (a now-line is rendered).
 */
export function useTimegridScroll( ref: RefLike, active: boolean ): void {
	useLayoutEffect( () => {
		if ( ! active ) {
			return;
		}
		const el = ref.current;
		if ( ! el ) {
			return;
		}
		const nowLine = el.querySelector< HTMLElement >( '.rc-cal__now-line' );
		if ( ! nowLine ) {
			return;
		}
		const rect = nowLine.getBoundingClientRect();
		const target = rect.top + window.scrollY - window.innerHeight / 2;
		window.scrollTo( { top: Math.max( 0, target ) } );
	}, [ ref, active ] );
}
