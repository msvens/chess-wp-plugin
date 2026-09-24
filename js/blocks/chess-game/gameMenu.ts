/**
 * Our ⋮ menu for the chess viewer. The viewer's own menu can't take extra
 * entries, so clicks on its ⋮ button are intercepted and open this dropdown
 * instead; the entries call the viewer's own actions.
 */
import type PgnViewer from '@lichess-org/pgn-viewer/pgnViewer';
import { getTranslation } from '../../shared/translations';

export interface GameMenuActions {
	viewer: () => PgnViewer | undefined;
	/** Whether the move list (and players) are showing now. */
	isFull: () => boolean;
	toggleFull: () => void;
	lichessLinks: boolean;
}

export interface GameMenu {
	close: () => void;
}

/** Listeners per root, dropped on every remount. */
const controllers = new WeakMap< HTMLElement, AbortController >();

const MENU_BUTTON = '.lpv__controls__menu';

/**
 * @param root    Container of the whole block (game selector and viewer).
 * @param anchor  Positioned element the dropdown is placed in.
 * @param actions What the entries do.
 */
export function attachGameMenu(
	root: HTMLElement,
	anchor: HTMLElement,
	actions: GameMenuActions
): GameMenu {
	controllers.get( root )?.abort();
	const controller = new AbortController();
	controllers.set( root, controller );
	const { signal } = controller;

	const doc = root.ownerDocument;
	let menu: HTMLElement | null = null;
	const button = () => root.querySelector< HTMLElement >( MENU_BUTTON );

	const close = ( focusButton = false ) => {
		if ( ! menu ) {
			return;
		}
		menu.remove();
		menu = null;
		button()?.setAttribute( 'aria-expanded', 'false' );
		if ( focusButton ) {
			button()?.focus();
		}
	};

	const open = () => {
		const viewer = actions.viewer();
		const menuButton = button();
		if ( ! viewer || ! menuButton ) {
			return;
		}
		const t = getTranslation().chessGame;
		const strings = t.viewer;
		const list = doc.createElement( 'div' );
		list.className = 'rc-chess-game__menu';
		list.setAttribute( 'role', 'menu' );
		list.setAttribute( 'aria-label', strings.menu );

		const item = ( label: string, run: () => void ) => {
			const entry = doc.createElement( 'button' );
			entry.type = 'button';
			entry.className = 'rc-chess-game__menu-item';
			entry.setAttribute( 'role', 'menuitem' );
			entry.textContent = label;
			entry.addEventListener( 'click', () => {
				close();
				run();
			} );
			list.appendChild( entry );
		};
		const link = ( label: string, href: string ) => {
			const entry = doc.createElement( 'a' );
			entry.className = 'rc-chess-game__menu-item';
			entry.setAttribute( 'role', 'menuitem' );
			entry.href = href;
			entry.target = '_blank';
			entry.rel = 'noopener';
			entry.textContent = label;
			entry.setAttribute(
				'aria-label',
				strings[ 'aria.linkOpensInNewTab' ].replace( '%s', label )
			);
			entry.addEventListener( 'click', () => close() );
			list.appendChild( entry );
		};

		item( strings.flipTheBoard, () => actions.viewer()?.flip() );
		item(
			actions.isFull() ? t.hideMoveList : t.showMoveList,
			actions.toggleFull
		);
		if ( actions.lichessLinks ) {
			link( strings.analysisBoard, viewer.analysisUrl( false ) );
			link( strings.practiceWithComputer, viewer.practiceUrl() );
		}
		item( strings.getPgn, () => actions.viewer()?.togglePgn() );

		anchor.appendChild( list );
		// Open upwards from the button, right edges aligned.
		const box = anchor.getBoundingClientRect();
		const at = menuButton.getBoundingClientRect();
		list.style.right = `${ box.right - at.right }px`;
		list.style.bottom = `${ box.bottom - at.top + 4 }px`;
		menu = list;
		menuButton.setAttribute( 'aria-expanded', 'true' );
		list.querySelector< HTMLElement >( '[role="menuitem"]' )?.focus();
	};

	// Capture phase runs before the viewer's own listener on its button, so
	// that listener never fires — except while the viewer's PGN panel is open,
	// when the button is the viewer's ✕ that closes it.
	root.addEventListener(
		'click',
		( e ) => {
			if ( ! ( e.target as Element ).closest?.( MENU_BUTTON ) ) {
				return;
			}
			if ( actions.viewer()?.pane !== 'board' ) {
				return;
			}
			e.stopPropagation();
			e.preventDefault();
			if ( menu ) {
				close();
			} else {
				open();
			}
		},
		{ capture: true, signal }
	);

	// A click anywhere else closes the dropdown, and the viewer's PGN panel.
	doc.addEventListener(
		'pointerdown',
		( e ) => {
			const target = e.target as Node;
			if (
				menu &&
				! menu.contains( target ) &&
				! button()?.contains( target )
			) {
				close();
			}
			const viewer = actions.viewer();
			if (
				viewer &&
				viewer.pane !== 'board' &&
				! root.contains( target )
			) {
				viewer.toggleMenu();
			}
		},
		{ signal }
	);

	root.addEventListener(
		'keydown',
		( e ) => {
			if ( ! menu ) {
				return;
			}
			if ( e.key === 'Escape' ) {
				e.preventDefault();
				close( true );
				return;
			}
			if ( e.key !== 'ArrowDown' && e.key !== 'ArrowUp' ) {
				return;
			}
			const items = Array.from(
				menu.querySelectorAll< HTMLElement >( '[role="menuitem"]' )
			);
			const index = items.indexOf( doc.activeElement as HTMLElement );
			const step = e.key === 'ArrowDown' ? 1 : -1;
			items[ ( index + step + items.length ) % items.length ]?.focus();
			e.preventDefault();
		},
		{ signal }
	);

	// Tabbing out of the dropdown closes it.
	root.addEventListener(
		'focusout',
		( e ) => {
			const next = ( e as FocusEvent ).relatedTarget as Node | null;
			if (
				menu &&
				next &&
				! menu.contains( next ) &&
				! button()?.contains( next )
			) {
				close();
			}
		},
		{ signal }
	);

	return { close: () => close() };
}
