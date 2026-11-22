import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import type { Translations } from '../../../shared';
import type { Tournament } from '../../types';
import { deleteTournament } from '../../api';
import { formatDateRange } from './dates';

interface TournamentTableProps {
	tournaments: Tournament[];
	t: Translations;
	onSelect: ( tournamentId: number ) => void;
	onDeleted: () => void;
}

interface RowProps {
	tournament: Tournament;
	t: Translations;
	onSelect: () => void;
	onDeleted: () => void;
}

function TournamentTableRow( {
	tournament,
	t,
	onSelect,
	onDeleted,
}: RowProps ) {
	const [ confirming, setConfirming ] = useState( false );
	const isSsf = tournament.ssfGroupId > 0;
	const activeCount = tournament.participants.filter(
		( p ) => p.active
	).length;

	function handleDelete( e: React.MouseEvent ) {
		e.stopPropagation();
		if ( ! confirming ) {
			setConfirming( true );
			return;
		}
		deleteTournament( tournament.id )
			.then( onDeleted )
			.catch( () => setConfirming( false ) );
	}

	let players = '';
	if ( isSsf ) {
		players = 'SSF';
	} else if ( tournament.manageRounds ) {
		players = `${ activeCount }`;
	}

	return (
		<tr className="rc-tn-table__row" onClick={ onSelect }>
			<td className="rc-tn-table__name">
				<strong>{ tournament.title }</strong>
				{ isSsf &&
					tournament.ssfTournamentName &&
					tournament.ssfTournamentName !== tournament.title && (
						<div className="rc-tn-table__sub">
							{ tournament.ssfTournamentName }
						</div>
					) }
			</td>
			<td>
				<span className={ `rc-status-pill is-${ tournament.status }` }>
					{ t.tournament.statuses[ tournament.status ] }
				</span>
			</td>
			<td>{ t.tournament.categories[ tournament.category ] }</td>
			<td className="rc-tn-table__dates">
				{ formatDateRange( tournament.startDate, tournament.endDate ) }
			</td>
			<td>{ players }</td>
			<td className="rc-tn-table__actions">
				<Button
					isDestructive
					variant={ confirming ? 'primary' : 'tertiary' }
					size="small"
					onClick={ handleDelete }
					onBlur={ () => setConfirming( false ) }
				>
					{ confirming ? t.common.confirm : t.common.delete }
				</Button>
			</td>
		</tr>
	);
}

/**
 * Tournaments as a compact admin table; a click on a row opens the tournament.
 *
 * @param props             Component props.
 * @param props.tournaments Tournaments, already sorted.
 * @param props.t           Translations.
 * @param props.onSelect    Open a tournament.
 * @param props.onDeleted   Called after a tournament was deleted.
 */
export function TournamentTable( {
	tournaments,
	t,
	onSelect,
	onDeleted,
}: TournamentTableProps ) {
	return (
		<table className="widefat striped rc-tn-table">
			{ /* Fixed widths so the separate section tables line up. */ }
			<colgroup>
				<col className="rc-tn-table__col-name" />
				<col className="rc-tn-table__col-status" />
				<col className="rc-tn-table__col-category" />
				<col className="rc-tn-table__col-dates" />
				<col className="rc-tn-table__col-players" />
				<col className="rc-tn-table__col-actions" />
			</colgroup>
			<thead>
				<tr>
					<th>{ t.training.name }</th>
					<th>{ t.tournament.status }</th>
					<th>{ t.tournament.category }</th>
					<th>{ t.tournament.dates }</th>
					<th>{ t.training.participants }</th>
					<th aria-label={ t.common.delete } />
				</tr>
			</thead>
			<tbody>
				{ tournaments.map( ( tournament ) => (
					<TournamentTableRow
						key={ tournament.id }
						tournament={ tournament }
						t={ t }
						onSelect={ () => onSelect( tournament.id ) }
						onDeleted={ onDeleted }
					/>
				) ) }
			</tbody>
		</table>
	);
}
