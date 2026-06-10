import {
	useState,
	useEffect,
	useRef,
	useCallback,
	createPortal,
} from '@wordpress/element';
import { getTranslation, toLanguage } from '../../shared/translations';
import { useLocale } from '../../shared/useLocale';

export interface CarouselImage {
	id: number;
	url: string;
	width: number;
	height: number;
	alt: string;
}

export type AspectRatio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | 'auto';

export type ImageFit = 'cover' | 'contain';

export type BackdropStyle = 'blurred' | 'black';

export type ConstrainMode = 'none' | 'width' | 'height';

export type Alignment = 'left' | 'center' | 'right';

export interface CarouselConfig {
	images: CarouselImage[];
	mode: 'slider' | 'carousel';
	autoplay: boolean;
	autoplayInterval: number;
	visibleItems: number;
	aspectRatio: AspectRatio;
	imageFit: ImageFit;
	backdropStyle: BackdropStyle;
	constrain: ConstrainMode;
	constraintValue: number;
	alignment: Alignment;
	allowFullscreen?: boolean;
	cellSizing?: 'aspect' | 'height';
	cellHeight?: number;
}

interface Props {
	config: CarouselConfig;
	locale: string;
}

const SLIDER_TRANSITION_MS = 450;

function prefersReducedMotion(): boolean {
	if ( typeof window === 'undefined' || ! window.matchMedia ) {
		return false;
	}
	return window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
}

function aspectClass( ratio: CarouselConfig[ 'aspectRatio' ] ): string {
	switch ( ratio ) {
		case '16:9':
			return 'rc-carousel--ar-16-9';
		case '4:3':
			return 'rc-carousel--ar-4-3';
		case '1:1':
			return 'rc-carousel--ar-1-1';
		case '3:4':
			return 'rc-carousel--ar-3-4';
		case '9:16':
			return 'rc-carousel--ar-9-16';
		default:
			return 'rc-carousel--ar-auto';
	}
}

function aspectRatioFactor( ratio: AspectRatio ): number | null {
	switch ( ratio ) {
		case '16:9':
			return 16 / 9;
		case '4:3':
			return 4 / 3;
		case '1:1':
			return 1;
		case '3:4':
			return 3 / 4;
		case '9:16':
			return 9 / 16;
		default:
			return null;
	}
}

/**
 * Resolve a max-width in px from the constrain / constraintValue settings,
 * always honoring the aspect ratio. Setting constrain=height converts the
 * height limit into a width limit so the aspect ratio drives the height
 * down to exactly the requested cap.
 * @param constrain
 * @param value
 * @param ratio
 */
function effectiveMaxWidth(
	constrain: ConstrainMode,
	value: number,
	ratio: AspectRatio
): number | null {
	if ( constrain === 'none' || value <= 0 ) {
		return null;
	}
	if ( constrain === 'width' ) {
		return value;
	}
	// constrain === 'height'
	const r = aspectRatioFactor( ratio );
	if ( r === null ) {
		// auto aspect-ratio + height constraint can't be derived; ignore.
		return null;
	}
	return Math.round( value * r );
}

function alignmentMargin( a: Alignment ): {
	marginLeft: string;
	marginRight: string;
} {
	switch ( a ) {
		case 'left':
			return { marginLeft: '0', marginRight: 'auto' };
		case 'right':
			return { marginLeft: 'auto', marginRight: '0' };
		default:
			return { marginLeft: 'auto', marginRight: 'auto' };
	}
}

export default function CarouselApp( { config, locale }: Props ) {
	const currentLocale = useLocale( locale );
	const lang = toLanguage( currentLocale );
	const t = getTranslation( lang ).carousel;
	const { images, mode, autoplay, autoplayInterval, visibleItems } = config;
	const total = images.length;
	const fit = config.imageFit ?? 'contain';
	const backdropStyle = config.backdropStyle ?? 'blurred';
	const showBackdrop = fit === 'contain';
	const allowFullscreen = config.allowFullscreen ?? false;
	// Carousel mode only: size cells by a fixed pixel height instead of an aspect
	// ratio, so the strip height stays constant regardless of how many are shown.
	const cellSizing = config.cellSizing ?? 'aspect';
	const cellHeight = config.cellHeight ?? 0;
	const useFixedHeight =
		mode === 'carousel' && cellSizing === 'height' && cellHeight > 0;

	// Slider mode wraps via clone-on-each-end:
	//   slides[0]       = clone of images[last]   (leading clone)
	//   slides[1..N]    = images[0..N-1]          (real slides)
	//   slides[N+1]     = clone of images[0]      (trailing clone)
	// displayedIndex 1 = the first real slide. When the user crosses into a
	// clone position, after the transition we snap to the matching real slide
	// with transitions disabled so the jump is invisible.
	const usesCloneLoop = mode === 'slider' && total > 1;
	// Carousel mode loops by cloning a page of images on each end and snapping the
	// scroll position back when you cross into a clone — the scroll-based analogue
	// of the slider's clone trick, so the last page flows into the first.
	const carouselLoop = mode === 'carousel' && total > visibleItems;
	const cloneCount = carouselLoop ? Math.min( visibleItems, total ) : 0;
	const slides: CarouselImage[] = usesCloneLoop
		? [ images[ total - 1 ], ...images, images[ 0 ] ]
		: carouselLoop
		? [
				...images.slice( total - cloneCount ),
				...images,
				...images.slice( 0, cloneCount ),
		  ]
		: images;
	const initialDisplayed = usesCloneLoop ? 1 : 0;

	const [ displayedIndex, setDisplayedIndex ] = useState( initialDisplayed );
	const [ transitionsOn, setTransitionsOn ] = useState( true );
	// null = closed; otherwise the real image index shown in the fullscreen overlay.
	const [ fullscreenIndex, setFullscreenIndex ] = useState< number | null >(
		null
	);
	// Carousel-mode pagination, measured from the scroll container so it stays
	// correct when the layout changes (e.g. collapses to one-per-row on mobile).
	const [ carouselPages, setCarouselPages ] = useState( 1 );
	const [ carouselPage, setCarouselPage ] = useState( 0 );
	const containerRef = useRef< HTMLDivElement >( null );
	const viewportRef = useRef< HTMLDivElement >( null );
	const pausedRef = useRef( false );

	const realIndex = usesCloneLoop
		? ( ( ( displayedIndex - 1 ) % total ) + total ) % total
		: displayedIndex;

	const goPrev = useCallback( () => {
		if ( mode === 'slider' ) {
			setTransitionsOn( true );
			setDisplayedIndex( ( i ) =>
				usesCloneLoop ? Math.max( 0, i - 1 ) : Math.max( 0, i - 1 )
			);
		} else if ( viewportRef.current ) {
			// Carousel mode: page left. Cloned edges + the reset handle wrapping.
			viewportRef.current.scrollBy( {
				left: -viewportRef.current.clientWidth,
				behavior: 'smooth',
			} );
		}
	}, [ mode, usesCloneLoop ] );

	const goNext = useCallback( () => {
		if ( mode === 'slider' ) {
			setTransitionsOn( true );
			setDisplayedIndex( ( i ) => {
				const cap = usesCloneLoop ? total + 1 : total - 1;
				return Math.min( cap, i + 1 );
			} );
		} else if ( viewportRef.current ) {
			// Carousel mode: page right. Cloned edges + the reset handle wrapping.
			viewportRef.current.scrollBy( {
				left: viewportRef.current.clientWidth,
				behavior: 'smooth',
			} );
		}
	}, [ mode, usesCloneLoop, total ] );

	const goTo = useCallback(
		( realIdx: number ) => {
			if ( total === 0 ) {
				return;
			}
			const target = ( ( realIdx % total ) + total ) % total;
			if ( mode === 'slider' ) {
				setTransitionsOn( true );
				setDisplayedIndex( usesCloneLoop ? target + 1 : target );
			} else if ( viewportRef.current ) {
				const vp = viewportRef.current;
				const width = vp.clientWidth;
				vp.scrollTo( {
					left: ( width * target ) / visibleItems,
					behavior: 'smooth',
				} );
			}
		},
		[ total, mode, usesCloneLoop, visibleItems ]
	);

	// Move within the fullscreen overlay (wraps), independent of the track.
	const fsGo = useCallback(
		( delta: number ) => {
			setFullscreenIndex( ( i ) =>
				i === null ? i : ( ( ( i + delta ) % total ) + total ) % total
			);
		},
		[ total ]
	);

	// Closing fullscreen leaves the carousel/slider on the image last viewed in
	// the overlay, so browsing in fullscreen carries back to the page.
	const closeFullscreen = useCallback( () => {
		if ( fullscreenIndex !== null ) {
			if ( mode === 'slider' ) {
				// Jump straight there (no sweep) to match carousel's instant
				// close — reuses the clone-snap's transition-off trick.
				setTransitionsOn( false );
				setDisplayedIndex(
					usesCloneLoop ? fullscreenIndex + 1 : fullscreenIndex
				);
			} else if ( viewportRef.current ) {
				const vp = viewportRef.current;
				const slide = vp.querySelector< HTMLElement >(
					'.rc-carousel__slide'
				);
				const cell = slide
					? slide.offsetWidth
					: vp.clientWidth / Math.max( 1, visibleItems );
				const leading = carouselLoop ? cloneCount * cell : 0;
				vp.scrollTo( {
					left: leading + fullscreenIndex * cell,
					behavior: 'auto',
				} );
			}
		}
		setFullscreenIndex( null );
	}, [
		fullscreenIndex,
		mode,
		usesCloneLoop,
		carouselLoop,
		cloneCount,
		visibleItems,
	] );

	// While the fullscreen overlay is open: lock body scroll and handle Esc/arrows.
	useEffect( () => {
		if ( fullscreenIndex === null ) {
			return;
		}
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		function onKey( e: KeyboardEvent ) {
			if ( e.key === 'Escape' ) {
				closeFullscreen();
			} else if ( e.key === 'ArrowLeft' ) {
				fsGo( -1 );
			} else if ( e.key === 'ArrowRight' ) {
				fsGo( 1 );
			}
		}
		document.addEventListener( 'keydown', onKey );
		return () => {
			document.removeEventListener( 'keydown', onKey );
			document.body.style.overflow = prevOverflow;
		};
	}, [ fullscreenIndex, fsGo, closeFullscreen ] );

	// Snap from clone positions back to the matching real slide after the
	// slide animation completes. Disabling transitions makes the snap invisible.
	useEffect( () => {
		if ( ! usesCloneLoop ) {
			return;
		}
		if ( displayedIndex !== 0 && displayedIndex !== total + 1 ) {
			return;
		}
		const id = window.setTimeout( () => {
			setTransitionsOn( false );
			setDisplayedIndex( displayedIndex === 0 ? total : 1 );
		}, SLIDER_TRANSITION_MS );
		return () => window.clearTimeout( id );
	}, [ displayedIndex, total, usesCloneLoop ] );

	// Re-enable transitions on the frame after a snap so subsequent navigation animates.
	useEffect( () => {
		if ( transitionsOn ) {
			return;
		}
		const id = window.setTimeout( () => setTransitionsOn( true ), 50 );
		return () => window.clearTimeout( id );
	}, [ transitionsOn ] );

	// Autoplay
	useEffect( () => {
		if ( ! autoplay || total <= 1 || prefersReducedMotion() ) {
			return;
		}
		const intervalMs = Math.max( 2000, autoplayInterval * 1000 );
		const id = window.setInterval( () => {
			if ( pausedRef.current ) {
				return;
			}
			if ( mode === 'slider' ) {
				setTransitionsOn( true );
				setDisplayedIndex( ( i ) => i + 1 );
			} else if ( viewportRef.current ) {
				const vp = viewportRef.current;
				if ( carouselLoop ) {
					// Cloned edges + the reset make this wrap seamlessly.
					vp.scrollBy( {
						left: vp.clientWidth,
						behavior: 'smooth',
					} );
				} else {
					const atEnd =
						Math.abs(
							vp.scrollLeft + vp.clientWidth - vp.scrollWidth
						) < 2;
					if ( atEnd ) {
						vp.scrollTo( { left: 0, behavior: 'auto' } );
					} else {
						vp.scrollBy( {
							left: vp.clientWidth,
							behavior: 'smooth',
						} );
					}
				}
			}
		}, intervalMs );
		return () => window.clearInterval( id );
	}, [ autoplay, autoplayInterval, total, mode, carouselLoop ] );

	// Keyboard nav when focus is within the carousel
	useEffect( () => {
		const node = containerRef.current;
		if ( ! node ) {
			return;
		}
		function onKey( e: KeyboardEvent ) {
			if ( e.key === 'ArrowLeft' ) {
				e.preventDefault();
				goPrev();
			} else if ( e.key === 'ArrowRight' ) {
				e.preventDefault();
				goNext();
			}
		}
		node.addEventListener( 'keydown', onKey );
		return () => node.removeEventListener( 'keydown', onKey );
	}, [ goPrev, goNext ] );

	// Carousel pagination + seamless looping. Page count/index derive from the
	// real images (clones excluded). When the user crosses into a cloned edge we
	// snap the scroll position back by one real width — once scrolling settles,
	// so the jump stays invisible (no momentum hitch).
	useEffect( () => {
		if ( mode !== 'carousel' ) {
			return;
		}
		const vp = viewportRef.current;
		if ( ! vp ) {
			return;
		}

		const cellOf = () => {
			const s = vp.querySelector< HTMLElement >( '.rc-carousel__slide' );
			return s
				? s.offsetWidth
				: vp.clientWidth / Math.max( 1, visibleItems );
		};

		const updatePagination = () => {
			const cw = vp.clientWidth;
			const cell = cellOf();
			if ( cw <= 0 || cell <= 0 ) {
				return;
			}
			const perPage = Math.max( 1, Math.round( cw / cell ) );
			const pages = Math.max( 1, Math.ceil( total / perPage ) );
			const leading = carouselLoop ? cloneCount * cell : 0;
			const realWidth = total * cell;
			let rel = vp.scrollLeft - leading;
			if ( realWidth > 0 ) {
				rel = ( ( rel % realWidth ) + realWidth ) % realWidth;
			}
			const page = ( ( Math.round( rel / cw ) % pages ) + pages ) % pages;
			setCarouselPages( pages );
			setCarouselPage( page );
		};

		const resetLoop = () => {
			if ( ! carouselLoop ) {
				return;
			}
			const cell = cellOf();
			const leading = cloneCount * cell;
			const realWidth = total * cell;
			if ( realWidth <= 0 ) {
				return;
			}
			if ( vp.scrollLeft < leading - 1 ) {
				vp.scrollLeft += realWidth;
			} else if ( vp.scrollLeft > leading + realWidth - 1 ) {
				vp.scrollLeft -= realWidth;
			}
		};

		let settle = 0;
		const onScroll = () => {
			updatePagination();
			window.clearTimeout( settle );
			settle = window.setTimeout( resetLoop, 80 );
		};

		// Start on the first real slide (just past the leading clones).
		if ( carouselLoop ) {
			const cell = cellOf();
			if ( cell > 0 ) {
				vp.scrollLeft = cloneCount * cell;
			}
		}
		updatePagination();
		vp.addEventListener( 'scroll', onScroll, { passive: true } );
		window.addEventListener( 'resize', updatePagination );
		return () => {
			window.clearTimeout( settle );
			vp.removeEventListener( 'scroll', onScroll );
			window.removeEventListener( 'resize', updatePagination );
		};
	}, [ mode, total, visibleItems, carouselLoop, cloneCount ] );

	if ( total === 0 ) {
		return null;
	}

	const setPaused = ( value: boolean ) => {
		pausedRef.current = value;
	};

	const slideStyle: React.CSSProperties =
		mode === 'slider'
			? { width: '100%' }
			: {
					width: `${ 100 / visibleItems }%`,
					...( useFixedHeight
						? { height: `${ cellHeight }px` }
						: {} ),
			  };

	const trackStyle: React.CSSProperties =
		mode === 'slider'
			? {
					transform: `translateX(-${ displayedIndex * 100 }%)`,
					transition: transitionsOn ? undefined : 'none',
			  }
			: {};

	const constrain = config.constrain ?? 'none';
	const constraintValue = config.constraintValue ?? 0;
	const alignment = config.alignment ?? 'center';
	const maxW = effectiveMaxWidth(
		constrain,
		constraintValue,
		config.aspectRatio
	);
	const containerStyle: React.CSSProperties = {
		...( maxW !== null ? { maxWidth: `${ maxW }px` } : {} ),
		...( maxW !== null ? alignmentMargin( alignment ) : {} ),
	};

	// Open fullscreen at the image the viewer is currently looking at. In slider
	// mode that's the active slide; in carousel mode it's the left-most image of
	// the currently scrolled set (derived from the scroll position).
	const openFullscreen = () => {
		const vp = viewportRef.current;
		if ( mode === 'carousel' && vp ) {
			const firstSlide = vp.querySelector< HTMLElement >(
				'.rc-carousel__slide'
			);
			const cellWidth =
				firstSlide?.offsetWidth || vp.clientWidth / visibleItems;
			const leading = carouselLoop ? cloneCount * cellWidth : 0;
			const idx =
				cellWidth > 0
					? Math.round( ( vp.scrollLeft - leading ) / cellWidth )
					: 0;
			setFullscreenIndex( ( ( idx % total ) + total ) % total );
		} else {
			setFullscreenIndex( realIndex );
		}
	};

	const goToPage = ( p: number ) => {
		const vp = viewportRef.current;
		if ( ! vp ) {
			return;
		}
		const slide = vp.querySelector< HTMLElement >( '.rc-carousel__slide' );
		const cell = slide
			? slide.offsetWidth
			: vp.clientWidth / Math.max( 1, visibleItems );
		const leading = carouselLoop ? cloneCount * cell : 0;
		vp.scrollTo( {
			left: leading + p * vp.clientWidth,
			behavior: 'smooth',
		} );
	};

	return (
		<div
			ref={ containerRef }
			className={ `rc-carousel rc-carousel--${ mode } rc-carousel--fit-${ fit } ${
				useFixedHeight ? '' : aspectClass( config.aspectRatio )
			}` }
			style={ containerStyle }
			role="region"
			aria-roledescription="carousel"
			tabIndex={ 0 }
			onMouseEnter={ () => setPaused( true ) }
			onMouseLeave={ () => setPaused( false ) }
			onFocus={ () => setPaused( true ) }
			onBlur={ () => setPaused( false ) }
		>
			<div className="rc-carousel__viewport" ref={ viewportRef }>
				<ul className="rc-carousel__track" style={ trackStyle }>
					{ slides.map( ( img, idx ) => (
						<li
							key={ idx }
							className="rc-carousel__slide"
							style={ slideStyle }
							aria-roledescription="slide"
							aria-label={ t.slideOf
								.replace( '{n}', String( realIndex + 1 ) )
								.replace( '{total}', String( total ) ) }
						>
							{ showBackdrop && (
								<span
									className={ `rc-carousel__backdrop rc-carousel__backdrop--${ backdropStyle }` }
									aria-hidden="true"
									style={
										backdropStyle === 'blurred'
											? {
													backgroundImage: `url(${ img.url })`,
											  }
											: undefined
									}
								/>
							) }
							<img
								className="rc-carousel__image"
								src={ img.url }
								alt={ img.alt }
								width={ img.width }
								height={ img.height }
								loading="lazy"
							/>
						</li>
					) ) }
				</ul>
			</div>

			{ total > 1 && (
				<>
					<button
						type="button"
						className="rc-carousel__nav rc-carousel__nav--prev"
						onClick={ goPrev }
						aria-label={ t.prev }
					>
						‹
					</button>
					<button
						type="button"
						className="rc-carousel__nav rc-carousel__nav--next"
						onClick={ goNext }
						aria-label={ t.next }
					>
						›
					</button>
				</>
			) }

			{ mode === 'slider' && total > 1 && (
				<div className="rc-carousel__dots" role="tablist">
					{ images.map( ( img, idx ) => (
						<button
							key={ img.id }
							type="button"
							className={ `rc-carousel__dot${
								idx === realIndex
									? ' rc-carousel__dot--active'
									: ''
							}` }
							role="tab"
							aria-selected={ idx === realIndex }
							aria-label={ t.slideOf
								.replace( '{n}', String( idx + 1 ) )
								.replace( '{total}', String( total ) ) }
							onClick={ () => goTo( idx ) }
						/>
					) ) }
				</div>
			) }

			{ mode === 'carousel' && carouselPages > 1 && (
				<div className="rc-carousel__dots" role="tablist">
					{ Array.from( { length: carouselPages } ).map( ( _, p ) => (
						<button
							key={ p }
							type="button"
							className={ `rc-carousel__dot${
								p === carouselPage
									? ' rc-carousel__dot--active'
									: ''
							}` }
							role="tab"
							aria-selected={ p === carouselPage }
							aria-label={ t.slideOf
								.replace( '{n}', String( p + 1 ) )
								.replace( '{total}', String( carouselPages ) ) }
							onClick={ () => goToPage( p ) }
						/>
					) ) }
				</div>
			) }

			{ allowFullscreen && (
				<button
					type="button"
					className="rc-carousel__fullscreen-btn"
					onClick={ openFullscreen }
					aria-label={ t.enterFullscreen }
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
					</svg>
				</button>
			) }

			{ fullscreenIndex !== null &&
				createPortal(
					<div
						className="rc-carousel-fullscreen"
						role="dialog"
						aria-modal="true"
					>
						{ /* Full-area click target to close (a real button, so it's keyboard-accessible). */ }
						<button
							type="button"
							className="rc-carousel-fullscreen__backdrop"
							onClick={ closeFullscreen }
							aria-label={ t.exitFullscreen }
						/>
						<button
							type="button"
							className="rc-carousel-fullscreen__close"
							onClick={ closeFullscreen }
							aria-label={ t.exitFullscreen }
						>
							×
						</button>
						<img
							className="rc-carousel-fullscreen__image"
							src={ images[ fullscreenIndex ].url }
							alt={ images[ fullscreenIndex ].alt }
						/>
						{ total > 1 && (
							<>
								<button
									type="button"
									className="rc-carousel-fullscreen__nav rc-carousel-fullscreen__nav--prev"
									onClick={ () => fsGo( -1 ) }
									aria-label={ t.prev }
								>
									‹
								</button>
								<button
									type="button"
									className="rc-carousel-fullscreen__nav rc-carousel-fullscreen__nav--next"
									onClick={ () => fsGo( 1 ) }
									aria-label={ t.next }
								>
									›
								</button>
								<div className="rc-carousel-fullscreen__counter">
									{ t.slideOf
										.replace(
											'{n}',
											String( fullscreenIndex + 1 )
										)
										.replace( '{total}', String( total ) ) }
								</div>
							</>
						) }
					</div>,
					document.body
				) }
		</div>
	);
}
