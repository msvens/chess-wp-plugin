import { useState } from '@wordpress/element';
import type { Translations } from '../../shared/translations';

export interface DisplayPairing {
	board: number;
	whiteName: string;
	whiteRating?: string;
	blackName: string;
	blackRating?: string;
	result: string; // "1-0", "½-½", "0-1", "—"
}

export interface DisplayRound {
	round: number;
	// Formatted round date shown under the round number in its tab; empty when
	// SSF gives neither a played date nor a scheduled one.
	date?: string;
	pairings: DisplayPairing[];
	byeName?: string;
}

interface Props {
	rounds: DisplayRound[];
	t: Translations[ 'training' ];
}

function formatResult( result: string | null ): string {
	if ( result === null ) {
		return '—';
	}
	if ( result === '0.5-0.5' ) {
		return '½-½';
	}
	return result;
}

export { formatResult };

export default function RoundsDisplay( { rounds, t }: Props ) {
	const [ activeRound, setActiveRound ] = useState( 0 );

	if ( rounds.length === 0 ) {
		return null;
	}

	const current = rounds[ activeRound ];
	// Rating columns only when there is something to put in them, decided over
	// all rounds so the table doesn't change shape between round tabs.
	const showRatings = rounds.some( ( r ) =>
		r.pairings.some( ( p ) => p.whiteRating || p.blackRating )
	);

	return (
		<div className="rc-rounds">
			<div className="rc-rounds__tabs">
				{ rounds.map( ( r, idx ) => (
					<button
						key={ r.round }
						className={ `rc-rounds__tab${
							idx === activeRound ? ' rc-rounds__tab--active' : ''
						}` }
						onClick={ () => setActiveRound( idx ) }
						type="button"
					>
						<span className="rc-rounds__tab-label">
							{ t.round } { r.round }
						</span>
						{ r.date && (
							<span className="rc-rounds__tab-date">
								{ r.date }
							</span>
						) }
					</button>
				) ) }
			</div>

			{ current && (
				<div className="rc-rounds__content">
					<table className="rc-rounds__table">
						<thead>
							<tr>
								<th>{ t.board }</th>
								<th>{ t.white }</th>
								{ showRatings && <th>{ t.rating }</th> }
								<th>{ t.black }</th>
								{ showRatings && <th>{ t.rating }</th> }
								<th>{ t.result }</th>
							</tr>
						</thead>
						<tbody>
							{ current.pairings.map( ( p ) => (
								<tr key={ p.board }>
									<td>{ p.board }</td>
									<td>{ p.whiteName }</td>
									{ showRatings && (
										<td className="rc-rounds__rating">
											{ p.whiteRating }
										</td>
									) }
									<td>{ p.blackName }</td>
									{ showRatings && (
										<td className="rc-rounds__rating">
											{ p.blackRating }
										</td>
									) }
									<td className="rc-rounds__result">
										{ p.result }
									</td>
								</tr>
							) ) }
							{ current.byeName && (
								<tr className="rc-rounds__bye">
									<td colSpan={ showRatings ? 6 : 4 }>
										{ t.bye }: { current.byeName }
									</td>
								</tr>
							) }
						</tbody>
					</table>
				</div>
			) }
		</div>
	);
}
