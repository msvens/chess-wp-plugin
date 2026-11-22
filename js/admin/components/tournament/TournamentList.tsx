import { useState } from '@wordpress/element';
import {
	Spinner,
	Notice,
	Button,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../../shared';
import { useTournaments } from '../../hooks/useTournaments';
import { TournamentTable } from './TournamentTable';
import { sortTournaments } from '../../../shared/sortTournaments';
import { CreateTournamentModal } from './CreateTournamentModal';

interface TournamentListProps {
	t: Translations;
	onSelect: ( tournamentId: number ) => void;
}

export function TournamentList( { t, onSelect }: TournamentListProps ) {
	const { tournaments, loading, error, refetch } = useTournaments();
	const [ showCreate, setShowCreate ] = useState( false );
	const [ showPast, setShowPast ] = useState( false );

	// Ongoing, upcoming, then completed (collapsed), each in date order.
	const sorted = sortTournaments( tournaments );
	const sections = [
		{
			key: 'active',
			title: t.tournament.ongoing,
			items: sorted.filter( ( tn ) => tn.status === 'active' ),
			collapsible: false,
		},
		{
			key: 'planned',
			title: t.tournament.sectionUpcoming,
			items: sorted.filter( ( tn ) => tn.status === 'planned' ),
			collapsible: false,
		},
		{
			key: 'completed',
			title: t.tournament.pastTournaments,
			items: sorted.filter( ( tn ) => tn.status === 'completed' ),
			collapsible: true,
		},
	];

	return (
		<div>
			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				} }
			>
				<div>
					<Heading level={ 2 }>{ t.tournament.title }</Heading>
					<Text>{ t.tournament.subtitle }</Text>
				</div>
				<Button
					variant="primary"
					onClick={ () => setShowCreate( true ) }
				>
					{ t.tournament.createTournament }
				</Button>
			</div>

			{ showCreate && (
				<CreateTournamentModal
					t={ t }
					onClose={ () => setShowCreate( false ) }
					onCreated={ ( created ) => {
						refetch();
						onSelect( created.id );
					} }
				/>
			) }

			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			) }

			{ loading && <Spinner /> }
			{ ! loading && tournaments.length === 0 && (
				<Text style={ { display: 'block', marginTop: 16 } }>
					{ t.tournament.noTournaments }
				</Text>
			) }
			{ ! loading &&
				sections.map(
					( section ) =>
						section.items.length > 0 && (
							<div key={ section.key } className="rc-tn-section">
								{ section.collapsible ? (
									<button
										type="button"
										className="rc-tn-section__toggle"
										aria-expanded={ showPast }
										onClick={ () =>
											setShowPast( ! showPast )
										}
									>
										{ showPast ? '▾' : '▸' }{ ' ' }
										{ section.title } (
										{ section.items.length })
									</button>
								) : (
									<Heading
										level={ 3 }
										className="rc-tn-section__title"
									>
										{ section.title } (
										{ section.items.length })
									</Heading>
								) }
								{ ( ! section.collapsible || showPast ) && (
									<TournamentTable
										tournaments={ section.items }
										t={ t }
										onSelect={ onSelect }
										onDeleted={ refetch }
									/>
								) }
							</div>
						)
				) }
		</div>
	);
}
