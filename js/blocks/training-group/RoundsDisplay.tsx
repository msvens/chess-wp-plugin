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
						{ t.round } { r.round }
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
								<th>{ t.black }</th>
								<th>{ t.result }</th>
							</tr>
						</thead>
						<tbody>
							{ current.pairings.map( ( p ) => (
								<tr key={ p.board }>
									<td>{ p.board }</td>
									<td>
										{ p.whiteName }
										{ p.whiteRating && (
											<span className="rc-rounds__rating">
												{ ' ' }
												({ p.whiteRating })
											</span>
										) }
									</td>
									<td>
										{ p.blackName }
										{ p.blackRating && (
											<span className="rc-rounds__rating">
												{ ' ' }
												({ p.blackRating })
											</span>
										) }
									</td>
									<td className="rc-rounds__result">
										{ p.result }
									</td>
								</tr>
							) ) }
							{ current.byeName && (
								<tr className="rc-rounds__bye">
									<td colSpan={ 4 }>
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
