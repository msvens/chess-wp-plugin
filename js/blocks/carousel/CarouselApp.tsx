import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
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

	// Slider mode wraps via clone-on-each-end:
	//   slides[0]       = clone of images[last]   (leading clone)
	//   slides[1..N]    = images[0..N-1]          (real slides)
	//   slides[N+1]     = clone of images[0]      (trailing clone)
	// displayedIndex 1 = the first real slide. When the user crosses into a
	// clone position, after the transition we snap to the matching real slide
	// with transitions disabled so the jump is invisible.
	const usesCloneLoop = mode === 'slider' && total > 1;
	const slides: CarouselImage[] = usesCloneLoop
		? [ images[ total - 1 ], ...images, images[ 0 ] ]
		: images;
	const initialDisplayed = usesCloneLoop ? 1 : 0;

	const [ displayedIndex, setDisplayedIndex ] = useState( initialDisplayed );
	const [ transitionsOn, setTransitionsOn ] = useState( true );
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
				const atEnd =
					Math.abs(
						vp.scrollLeft + vp.clientWidth - vp.scrollWidth
					) < 2;
				if ( atEnd ) {
					// Instant snap back to start — avoids the "running through
					// previous images" effect of a smooth-scroll rewind.
					vp.scrollTo( { left: 0, behavior: 'auto' } );
				} else {
					vp.scrollBy( {
						left: vp.clientWidth,
						behavior: 'smooth',
					} );
				}
			}
		}, intervalMs );
		return () => window.clearInterval( id );
	}, [ autoplay, autoplayInterval, total, mode ] );

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

	if ( total === 0 ) {
		return null;
	}

	const setPaused = ( value: boolean ) => {
		pausedRef.current = value;
	};

	const slideStyle: React.CSSProperties =
		mode === 'slider'
			? { width: '100%' }
			: { width: `${ 100 / visibleItems }%` };

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

	return (
		<div
			ref={ containerRef }
			className={ `rc-carousel rc-carousel--${ mode } rc-carousel--fit-${ fit } ${ aspectClass(
				config.aspectRatio
			) }` }
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
		</div>
	);
}
