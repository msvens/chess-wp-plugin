import { registerBlockType, createBlock } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	Notice,
	PanelBody,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { next as nextShortcode } from '@wordpress/shortcode';
import { getTranslation } from '../../shared/translations';
import {
	mountGames,
	parseGames,
	type ChessGameConfig,
	type MountedGame,
	type MoveList,
	type Orientation,
} from './mountGame';
import { attributesFromShortcode, type ChessGameAttributes } from './shortcode';

const t = getTranslation().chessGame;

const PGN_PLACEHOLDER =
	'[White "Carlsen"]\n[Black "Nakamura"]\n\n1. e4 e5 2. Nf3 *';

interface EditProps {
	attributes: ChessGameAttributes;
	setAttributes: ( attrs: Partial< ChessGameAttributes > ) => void;
	isSelected: boolean;
}

/**
 * Waits for typing to pause before re-parsing a (possibly long) PGN.
 *
 * @param value Value to debounce.
 * @param delay Pause in milliseconds.
 */
function useDebounced< T >( value: T, delay: number ): T {
	const [ debounced, setDebounced ] = useState( value );
	useEffect( () => {
		const timer = setTimeout( () => setDebounced( value ), delay );
		return () => clearTimeout( timer );
	}, [ value, delay ] );
	return debounced;
}

function Edit( { attributes, setAttributes, isSelected }: EditProps ) {
	const blockProps = useBlockProps( { className: 'rc-chess-game' } );
	const previewRef = useRef< HTMLDivElement >( null );
	const mounted = useRef< MountedGame | null >( null );
	const pgn = useDebounced( attributes.pgn, 300 );
	const [ status, setStatus ] = useState< {
		count: number;
		error: string | null;
	} >( { count: 0, error: null } );

	const { orientation, initialPly, showMoves, puzzle, lichessLinks } =
		attributes;

	useEffect( () => {
		const el = previewRef.current;
		if ( ! el ) {
			return;
		}
		const { games, error } = parseGames( pgn );
		setStatus( { count: games.length, error } );
		if ( ! games.length || error ) {
			// Keep the last good preview on screen while the PGN is mid-edit.
			return;
		}
		const config: ChessGameConfig = {
			orientation,
			initialPly,
			showMoves,
			puzzle,
			lichessLinks,
		};
		mounted.current = mountGames( el, games, config );
	}, [ pgn, orientation, initialPly, showMoves, puzzle, lichessLinks ] );

	const applyShownPosition = () => {
		const data = mounted.current?.viewer()?.curData();
		if ( ! data ) {
			return;
		}
		// The initial position carries no ply. Inside a variation the ply is
		// the depth, which the viewer then resolves on the mainline.
		const ply = 'ply' in data ? Number( data.ply ) : 0;
		setAttributes( { initialPly: String( ply ) } );
	};

	const hasGame = status.count > 0 && pgn.trim() !== '';

	return (
		<>
			<InspectorControls>
				<PanelBody title={ t.display }>
					<SelectControl
						label={ t.orientation }
						value={ orientation }
						options={ [
							{ label: t.orientations.auto, value: 'auto' },
							{ label: t.orientations.white, value: 'white' },
							{ label: t.orientations.black, value: 'black' },
						] }
						onChange={ ( value: string ) =>
							setAttributes( {
								orientation: value as Orientation,
							} )
						}
					/>
					<ToggleControl
						label={ t.puzzle }
						help={ t.puzzleHelp }
						checked={ puzzle }
						onChange={ ( value: boolean ) =>
							setAttributes( { puzzle: value } )
						}
					/>
					{ ! puzzle && (
						<SelectControl
							label={ t.moveList }
							value={ showMoves }
							options={ [
								{ label: t.moveLists.auto, value: 'auto' },
								{ label: t.moveLists.right, value: 'right' },
								{ label: t.moveLists.bottom, value: 'bottom' },
								{ label: t.moveLists.none, value: 'none' },
							] }
							onChange={ ( value: string ) =>
								setAttributes( {
									showMoves: value as MoveList,
								} )
							}
						/>
					) }
					<ToggleControl
						label={ t.startAtLast }
						checked={ initialPly === 'last' }
						onChange={ ( value: boolean ) =>
							setAttributes( {
								initialPly: value ? 'last' : '0',
							} )
						}
					/>
					{ initialPly !== 'last' && (
						<TextControl
							label={ t.startPly }
							help={ t.startPlyHelp }
							type="number"
							min={ 0 }
							value={ initialPly }
							onChange={ ( value: string ) =>
								setAttributes( {
									initialPly: String(
										Math.max(
											0,
											parseInt( value, 10 ) || 0
										)
									),
								} )
							}
						/>
					) }
					<Button
						variant="secondary"
						onClick={ applyShownPosition }
						disabled={ ! hasGame }
					>
						{ t.useCurrent }
					</Button>
					<p className="components-base-control__help">
						{ t.useCurrentHelp }
					</p>
					<ToggleControl
						label={ t.lichessLinks }
						help={ t.lichessLinksHelp }
						checked={ lichessLinks }
						onChange={ ( value: boolean ) =>
							setAttributes( { lichessLinks: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div
					ref={ previewRef }
					style={ hasGame ? undefined : { display: 'none' } }
				/>
				{ ( isSelected || ! attributes.pgn.trim() ) && (
					<div className="rc-chess-game__editor">
						<TextareaControl
							label={ t.pgn }
							help={
								status.count > 1
									? `${ t.pgnHelp } ${ t.gamesFound.replace(
											'{n}',
											String( status.count )
									  ) }`
									: t.pgnHelp
							}
							placeholder={ PGN_PLACEHOLDER }
							value={ attributes.pgn }
							rows={ 8 }
							onChange={ ( value: string ) =>
								setAttributes( { pgn: value } )
							}
						/>
						{ status.error && (
							<Notice status="error" isDismissible={ false }>
								{ status.error }
							</Notice>
						) }
					</div>
				) }
			</div>
		</>
	);
}

registerBlockType( 'rockaden/chess-game', {
	edit: Edit,
	save() {
		return null;
	},
	transforms: {
		from: [
			// [pgn] in classic content ("Convert to blocks") and pasted text.
			{
				type: 'shortcode',
				tag: 'pgn',
				transform: (
					{ named }: { named: Record< string, string > },
					{ shortcode }: { shortcode: { content?: string } }
				) =>
					createBlock(
						'rockaden/chess-game',
						attributesFromShortcode(
							named,
							shortcode.content || ''
						)
					),
			},
			// A Shortcode block that holds [pgn]…[/pgn].
			{
				type: 'block',
				blocks: [ 'core/shortcode' ],
				isMatch: ( { text }: { text: string } ) =>
					/^\s*\[pgn[\s\]]/i.test( text || '' ),
				transform: ( { text }: { text: string } ) => {
					const found = nextShortcode( 'pgn', text );
					return createBlock(
						'rockaden/chess-game',
						found
							? attributesFromShortcode(
									found.shortcode.attrs.named,
									found.shortcode.content || ''
							  )
							: {}
					);
				},
			},
		],
	},
} );
