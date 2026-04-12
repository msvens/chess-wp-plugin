/**
 * Documentation block — mobile nav dropdown toggle.
 */
( function () {
	document
		.querySelectorAll( '.rc-docs-sidebar' )
		.forEach( function ( sidebar ) {
			const btn = sidebar.querySelector( '.rc-docs-nav__mobile-btn' );
			const menu = sidebar.querySelector( '.rc-docs-nav__mobile-menu' );
			if ( ! btn || ! menu ) {
				return;
			}

			btn.addEventListener( 'click', function () {
				const open = menu.classList.toggle( 'is-open' );
				btn.classList.toggle( 'is-open', open );
				btn.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
			} );

			document.addEventListener( 'click', function ( e ) {
				if (
					! btn.contains( e.target ) &&
					! menu.contains( e.target )
				) {
					menu.classList.remove( 'is-open' );
					btn.classList.remove( 'is-open' );
					btn.setAttribute( 'aria-expanded', 'false' );
				}
			} );
		} );
} )();
