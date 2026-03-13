import { useState, useMemo } from '@wordpress/element';
import {
	Button,
	Notice,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import type { Translations } from '../../shared';
import { generateRoundRobin } from '../../shared';
import type { TrainingGroup, SsfRatingInfo, StoredRound } from '../types';
import { saveRounds, saveRoundResult } from '../api';
import { GameResultSelect } from './GameResultSelect';
import { ratingForTimeControl, ratingLabel } from './ratingUtils';

interface RoundsPanelProps {
	groupId: number;
	group: TrainingGroup;
	ratings: Map< number, SsfRatingInfo >;
	t: Translations;
	onUpdated: () => void;
	readOnly?: boolean;
}

export function RoundsPanel( {
	groupId,
	group,
	ratings,
	t,
	onUpdated,
	readOnly,
}: RoundsPanelProps ) {
	const [ activeRound, setActiveRound ] = useState( 0 );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const nameMap = useMemo( () => {
		const m = new Map< string, string >();
		for ( const p of group.participants ) {
			m.set( p.id, p.name );
		}
		return m;
	}, [ group.participants ] );

	const activeParticipants = useMemo(
		() => group.participants.filter( ( p ) => p.active ),
		[ group.participants ]
	);

	const hasRounds = group.rounds.length > 0;

	async function handleGenerate() {
		if (
			hasRounds &&
			// eslint-disable-next-line no-alert
			! window.confirm( t.training.regenerateWarning )
		) {
			return;
		}

		setSaving( true );
		setError( null );
		try {
			const generated = generateRoundRobin(
				activeParticipants.map( ( p ) => p.id )
			);
			const storedRounds: StoredRound[] = generated.map( ( r ) => ( {
				round: r.round,
				pairings: r.pairings.map( ( p ) => ( {
					whiteId: p.whiteId,
					blackId: p.blackId,
					result: null,
				} ) ),
				bye: r.bye,
			} ) );
			await saveRounds( groupId, storedRounds );
			setActiveRound( 0 );
			onUpdated();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to generate rounds' );
		} finally {
			setSaving( false );
		}
	}

	async function handleResultChange(
		roundIdx: number,
		gameIdx: number,
		result: string | null
	) {
		setSaving( true );
		setError( null );
		try {
			await saveRoundResult( groupId, roundIdx, gameIdx, result );
			onUpdated();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to save result' );
		} finally {
			setSaving( false );
		}
	}

	function getRating( participantId: string ): string {
		const p = group.participants.find( ( pp ) => pp.id === participantId );
		if ( ! p?.ssfId ) {
			return t.training.ratingUnavailable;
		}
		const r = ratings.get( p.ssfId );
		if ( ! r ) {
			return t.training.ratingUnavailable;
		}
		const val = ratingForTimeControl( r, group.timeControl );
		return val ? String( val ) : t.training.ratingUnavailable;
	}

	function getName( id: string ): string {
		return nameMap.get( id ) || id;
	}

	function resultLabel( result: string | null ): string {
		switch ( result ) {
			case '1-0':
				return '1 - 0';
			case '0.5-0.5':
				return '½ - ½';
			case '0-1':
				return '0 - 1';
			default:
				return t.training.notPlayed;
		}
	}

	const rLabel = ratingLabel( group.timeControl, t );
	const round = hasRounds ? group.rounds[ activeRound ] : null;

	return (
		<div style={ { marginTop: 24 } }>
			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					gap: 12,
					marginBottom: 12,
				} }
			>
				<Heading level={ 4 } style={ { margin: 0 } }>
					{ t.training.round }
				</Heading>
				{ ! readOnly && activeParticipants.length >= 2 && (
					<Button
						variant={ hasRounds ? 'tertiary' : 'secondary' }
						isDestructive={ hasRounds }
						onClick={ handleGenerate }
						isBusy={ saving }
						disabled={ saving }
						size="compact"
					>
						{ hasRounds
							? t.training.regenerateRounds
							: t.training.generateRounds }
					</Button>
				) }
			</div>

			{ error && (
				<Notice
					status="error"
					isDismissible
					onDismiss={ () => setError( null ) }
				>
					{ error }
				</Notice>
			) }

			{ ! hasRounds && (
				<p style={ { fontStyle: 'italic' } }>
					{ t.training.notPlayed }
				</p>
			) }

			{ hasRounds && (
				<>
					<div
						style={ {
							display: 'flex',
							gap: 0,
							marginBottom: 12,
							flexWrap: 'wrap',
							borderBottom: '1px solid #ccc',
						} }
					>
						{ group.rounds.map( ( r, idx ) => {
							const isActive = idx === activeRound;
							return (
								<button
									key={ r.round }
									type="button"
									onClick={ () => setActiveRound( idx ) }
									style={ {
										padding: '8px 16px',
										border: 'none',
										background: 'none',
										cursor: 'pointer',
										fontWeight: isActive ? 600 : 400,
										borderBottom: isActive
											? '2px solid #3858e9'
											: '2px solid transparent',
										color: isActive ? '#3858e9' : '#1e1e1e',
										marginBottom: '-1px',
									} }
								>
									{ t.training.round } { r.round }
								</button>
							);
						} ) }
					</div>

					{ round && (
						<table className="widefat striped">
							<thead>
								<tr>
									<th>{ t.training.board }</th>
									<th>{ t.training.white }</th>
									<th>{ rLabel }</th>
									<th>{ t.training.black }</th>
									<th>{ rLabel }</th>
									<th>{ t.training.result }</th>
								</tr>
							</thead>
							<tbody>
								{ round.pairings.map( ( pairing, gi ) => (
									<tr key={ gi }>
										<td>{ gi + 1 }</td>
										<td>{ getName( pairing.whiteId ) }</td>
										<td>
											{ getRating( pairing.whiteId ) }
										</td>
										<td>{ getName( pairing.blackId ) }</td>
										<td>
											{ getRating( pairing.blackId ) }
										</td>
										<td>
											{ readOnly ? (
												resultLabel(
													pairing.result || null
												)
											) : (
												<GameResultSelect
													value={
														pairing.result || null
													}
													onChange={ ( result ) =>
														handleResultChange(
															activeRound,
															gi,
															result
														)
													}
													t={ t }
													disabled={ saving }
												/>
											) }
										</td>
									</tr>
								) ) }
								{ round.bye && (
									<tr>
										<td />
										<td>{ getName( round.bye ) }</td>
										<td>{ getRating( round.bye ) }</td>
										<td
											colSpan={ 3 }
											style={ {
												fontStyle: 'italic',
											} }
										>
											{ t.training.bye } (1p)
										</td>
									</tr>
								) }
							</tbody>
						</table>
					) }
				</>
			) }
		</div>
	);
}
