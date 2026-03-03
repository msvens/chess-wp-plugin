import { useState, useMemo } from '@wordpress/element';
import { Notice } from '@wordpress/components';
import type { Translations } from '../../shared';
import { generateRoundRobin } from '../../shared';
import type { Participant, Game } from '../types';
import { saveGameResult } from '../api';
import { GameResultSelect } from './GameResultSelect';

interface PairingsPanelProps {
	sessionId: number;
	sessionIndex: number;
	participants: Participant[];
	games: Game[];
	t: Translations;
	onGamesUpdated: ( games: Game[] ) => void;
}

export function PairingsPanel( {
	sessionId,
	sessionIndex,
	participants,
	games,
	t,
	onGamesUpdated,
}: PairingsPanelProps ) {
	const [ saving, setSaving ] = useState< number | null >( null );
	const [ error, setError ] = useState< string | null >( null );

	const activeParticipants = useMemo(
		() => participants.filter( ( p ) => p.active ),
		[ participants ]
	);

	const nameMap = useMemo( () => {
		const m = new Map< string, string >();
		for ( const p of participants ) {
			m.set( p.id, p.name );
		}
		return m;
	}, [ participants ] );

	const rounds = useMemo(
		() => generateRoundRobin( activeParticipants.map( ( p ) => p.id ) ),
		[ activeParticipants ]
	);

	// Map existing games by their pairing key for lookup
	const gameMap = useMemo( () => {
		const m = new Map< string, { game: Game; idx: number } >();
		games.forEach( ( g, idx ) => {
			m.set( `${ g.whiteId }-${ g.blackId }`, { game: g, idx } );
		} );
		return m;
	}, [ games ] );

	const round = rounds[ sessionIndex ];
	if ( ! round ) {
		return (
			<p style={ { fontStyle: 'italic' } }>{ t.training.notPlayed }</p>
		);
	}

	async function handleResultChange(
		whiteId: string,
		blackId: string,
		result: string | null
	) {
		const key = `${ whiteId }-${ blackId }`;
		const existing = gameMap.get( key );

		const game: Game = {
			round: round.round,
			whiteId,
			blackId,
			result: ( result as Game[ 'result' ] ) || null,
		};

		const idx = existing ? existing.idx : games.length;
		setSaving( idx );
		setError( null );

		try {
			const updated = await saveGameResult( sessionId, idx, game );
			onGamesUpdated( updated.games );
		} catch ( err: any ) {
			setError( err?.message || 'Failed to save result' );
		} finally {
			setSaving( null );
		}
	}

	return (
		<div>
			{ error && (
				<Notice
					status="error"
					isDismissible
					onDismiss={ () => setError( null ) }
				>
					{ error }
				</Notice>
			) }

			<table className="widefat striped">
				<thead>
					<tr>
						<th style={ { width: '35%' } }>{ t.training.name }</th>
						<th style={ { width: '30%' } }>
							{ t.training.result }
						</th>
						<th style={ { width: '35%' } }>{ t.training.name }</th>
					</tr>
				</thead>
				<tbody>
					{ round.pairings.map( ( pairing, i ) => {
						const key = `${ pairing.whiteId }-${ pairing.blackId }`;
						const existing = gameMap.get( key );
						return (
							<tr key={ i }>
								<td>
									{ nameMap.get( pairing.whiteId ) ||
										pairing.whiteId }
								</td>
								<td>
									<GameResultSelect
										value={ existing?.game.result || null }
										onChange={ ( result ) =>
											handleResultChange(
												pairing.whiteId,
												pairing.blackId,
												result
											)
										}
										t={ t }
										disabled={ saving !== null }
									/>
								</td>
								<td>
									{ nameMap.get( pairing.blackId ) ||
										pairing.blackId }
								</td>
							</tr>
						);
					} ) }
					{ round.bye && (
						<tr>
							<td>{ nameMap.get( round.bye ) || round.bye }</td>
							<td colSpan={ 2 } style={ { fontStyle: 'italic' } }>
								{ t.training.bye }
							</td>
						</tr>
					) }
				</tbody>
			</table>
		</div>
	);
}
