import type { SsfPlayer } from '../../admin/types';
import type { Translations } from '../../shared/translations';
import { getRatingValue, PAGE_SIZE } from './utils';
import type { RatingType } from './utils';

interface Props {
	players: SsfPlayer[];
	ratingType: RatingType;
	page: number;
	t: Translations;
}

export default function RankingTable( {
	players,
	ratingType,
	page,
	t,
}: Props ) {
	if ( players.length === 0 ) {
		return <p className="rc-rl__empty">{ t.ranking.noPlayers }</p>;
	}

	const start = ( page - 1 ) * PAGE_SIZE;
	const pageItems = players.slice( start, start + PAGE_SIZE );

	return (
		<div className="rc-rl__table-wrap">
			<table className="rc-rl__table">
				<thead>
					<tr>
						<th>{ t.ranking.rank }</th>
						<th>{ t.ranking.titleCol }</th>
						<th>{ t.ranking.firstName }</th>
						<th>{ t.ranking.lastName }</th>
						<th>{ t.ranking.rating }</th>
					</tr>
				</thead>
				<tbody>
					{ pageItems.map( ( player, idx ) => (
						<tr key={ player.id }>
							<td>{ start + idx + 1 }</td>
							<td>{ player.elo?.title || '' }</td>
							<td>{ player.firstName }</td>
							<td>{ player.lastName }</td>
							<td className="rc-rl__rating">
								{ getRatingValue( player.elo, ratingType ) ||
									'–' }
							</td>
						</tr>
					) ) }
				</tbody>
			</table>
		</div>
	);
}
