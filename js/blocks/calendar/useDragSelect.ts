import { useCallback } from '@wordpress/element';
import type { CSSProperties } from 'react';
import { TIME_GRID_END, TIME_GRID_START, positionToTime } from './utils';

const DRAG_THRESHOLD_PX = 10;
const SNAP_MINUTES_DRAG = 15;
const SNAP_MINUTES_CLICK = 30;

export interface ActiveSelection {
	dateKey: string;
	startPct: number;
	endPct: number;
}

interface UseDragSelectResult {
	onPointerDown: ( e: React.PointerEvent< HTMLDivElement > ) => void;
	overlayStyle: CSSProperties | null;
}

function pad( n: number ): string {
	return String( n ).padStart( 2, '0' );
}

function clampToGrid(
	hour: number,
	minute: number
): { hour: number; minute: number } {
	if ( hour < TIME_GRID_START ) {
		return { hour: TIME_GRID_START, minute: 0 };
	}
	if ( hour > TIME_GRID_END ) {
		return { hour: TIME_GRID_END, minute: 0 };
	}
	if ( hour === TIME_GRID_END && minute > 0 ) {
		return { hour: TIME_GRID_END, minute: 0 };
	}
	return { hour, minute };
}

/**
 * Drag-to-select hook for a single timegrid day column.
 * Mouse/pen only — touch is ignored so native scroll keeps working.
 *
 * Returns an `onPointerDown` to spread onto the column element, plus an
 * `overlayStyle` that, when non-null, renders the drag highlight inside the
 * column.
 *
 * @param dateKey    - YYYY-MM-DD for the column's day.
 * @param enabled    - Whether dragging/click-to-create is active (e.g. admin only).
 * @param onCreateAt - Called with start/end ISO strings on commit.
 */
interface AnchorRect {
	top: number;
	left: number;
	bottom: number;
	right: number;
}

export function useDragSelect(
	dateKey: string,
	enabled: boolean,
	onCreateAt: (
		startISO: string,
		endISO: string,
		anchorRect: AnchorRect
	) => void,
	activeSelection: ActiveSelection | null,
	setActiveSelection: ( sel: ActiveSelection | null ) => void
): UseDragSelectResult {
	const onPointerDown = useCallback(
		( e: React.PointerEvent< HTMLDivElement > ) => {
			if ( ! enabled ) {
				return;
			}
			if ( e.pointerType === 'touch' ) {
				return;
			}
			// Pills (event blocks) handle their own clicks; never start a drag from one.
			const target = e.target as HTMLElement | null;
			if ( target && target.closest( '.rc-cal__time-event' ) ) {
				return;
			}
			// Only left mouse button.
			if ( e.button !== 0 ) {
				return;
			}

			const colEl = e.currentTarget;
			const rect = colEl.getBoundingClientRect();
			if ( rect.height <= 0 ) {
				return;
			}

			const startY = e.clientY - rect.top;
			const startPct = ( startY / rect.height ) * 100;
			let crossedThreshold = false;

			colEl.setPointerCapture( e.pointerId );

			const handleMove = ( ev: PointerEvent ) => {
				const y = ev.clientY - rect.top;
				const pct = Math.max(
					0,
					Math.min( 100, ( y / rect.height ) * 100 )
				);
				if (
					! crossedThreshold &&
					Math.abs( y - startY ) > DRAG_THRESHOLD_PX
				) {
					crossedThreshold = true;
				}
				if ( crossedThreshold ) {
					setActiveSelection( {
						dateKey,
						startPct,
						endPct: pct,
					} );
				}
			};

			const finish = ( ev: PointerEvent ) => {
				colEl.removeEventListener( 'pointermove', handleMove );
				colEl.removeEventListener( 'pointerup', finish );
				colEl.removeEventListener( 'pointercancel', finish );

				const endY = ev.clientY - rect.top;
				const endPct = Math.max(
					0,
					Math.min( 100, ( endY / rect.height ) * 100 )
				);
				const moved = Math.abs( endY - startY ) > DRAG_THRESHOLD_PX;

				// Anchor the create-popover at the release point.
				const anchorRect: AnchorRect = {
					top: ev.clientY,
					bottom: ev.clientY,
					left: ev.clientX,
					right: ev.clientX,
				};

				if ( moved ) {
					const lo = Math.min( startPct, endPct );
					const hi = Math.max( startPct, endPct );
					const s = positionToTime( lo, SNAP_MINUTES_DRAG );
					const e2 = positionToTime( hi, SNAP_MINUTES_DRAG );
					const sClamped = clampToGrid( s.hour, s.minute );
					const eClamped = clampToGrid( e2.hour, e2.minute );
					// Ensure non-zero duration: enforce >= one snap step.
					const sMin = sClamped.hour * 60 + sClamped.minute;
					let eMin = eClamped.hour * 60 + eClamped.minute;
					if ( eMin - sMin < SNAP_MINUTES_DRAG ) {
						eMin = sMin + SNAP_MINUTES_DRAG;
					}
					const ec = clampToGrid(
						Math.floor( eMin / 60 ),
						eMin % 60
					);
					// Persist the selection so the orange overlay stays visible
					// while the create-popover is open.
					setActiveSelection( { dateKey, startPct: lo, endPct: hi } );
					onCreateAt(
						`${ dateKey }T${ pad( sClamped.hour ) }:${ pad(
							sClamped.minute
						) }`,
						`${ dateKey }T${ pad( ec.hour ) }:${ pad(
							ec.minute
						) }`,
						anchorRect
					);
				} else {
					// Plain click: start at the clicked position, end +1 hour.
					const s = positionToTime( startPct, SNAP_MINUTES_CLICK );
					const sClamped = clampToGrid( s.hour, s.minute );
					const ec = clampToGrid(
						sClamped.hour + 1,
						sClamped.minute
					);
					// Reflect the clicked range visually too (snap-rounded).
					const startPctRounded =
						( ( sClamped.hour -
							TIME_GRID_START +
							sClamped.minute / 60 ) /
							( TIME_GRID_END - TIME_GRID_START ) ) *
						100;
					const endPctRounded =
						( ( ec.hour - TIME_GRID_START + ec.minute / 60 ) /
							( TIME_GRID_END - TIME_GRID_START ) ) *
						100;
					setActiveSelection( {
						dateKey,
						startPct: startPctRounded,
						endPct: endPctRounded,
					} );
					onCreateAt(
						`${ dateKey }T${ pad( sClamped.hour ) }:${ pad(
							sClamped.minute
						) }`,
						`${ dateKey }T${ pad( ec.hour ) }:${ pad(
							ec.minute
						) }`,
						anchorRect
					);
				}
			};

			colEl.addEventListener( 'pointermove', handleMove );
			colEl.addEventListener( 'pointerup', finish );
			colEl.addEventListener( 'pointercancel', finish );
		},
		[ enabled, dateKey, onCreateAt, setActiveSelection ]
	);

	const overlayStyle: CSSProperties | null =
		activeSelection && activeSelection.dateKey === dateKey
			? ( () => {
					const lo = Math.min(
						activeSelection.startPct,
						activeSelection.endPct
					);
					const hi = Math.max(
						activeSelection.startPct,
						activeSelection.endPct
					);
					return {
						top: `${ lo }%`,
						height: `${ Math.max( hi - lo, 1 ) }%`,
					};
			  } )()
			: null;

	return { onPointerDown, overlayStyle };
}
