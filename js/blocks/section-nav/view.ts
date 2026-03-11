import './section-nav.css';

document
	.querySelectorAll< HTMLElement >( '.rc-section-nav' )
	.forEach( ( nav ) => {
		const btn = nav.querySelector< HTMLButtonElement >(
			'.rc-section-nav__mobile-btn'
		);
		const menu = nav.querySelector< HTMLElement >(
			'.rc-section-nav__mobile-menu'
		);
		if ( ! btn || ! menu ) {
			return;
		}

		btn.addEventListener( 'click', () => {
			const open = menu.classList.toggle( 'is-open' );
			btn.classList.toggle( 'is-open', open );
			btn.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		} );

		document.addEventListener( 'click', ( e: Event ) => {
			if (
				! btn.contains( e.target as Node ) &&
				! menu.contains( e.target as Node )
			) {
				menu.classList.remove( 'is-open' );
				btn.classList.remove( 'is-open' );
				btn.setAttribute( 'aria-expanded', 'false' );
			}
		} );
	} );
