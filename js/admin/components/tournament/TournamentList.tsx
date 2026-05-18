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
import { TournamentCard } from './TournamentCard';
import { CreateTournamentModal } from './CreateTournamentModal';

interface TournamentListProps {
	t: Translations;
	onSelect: ( tournamentId: number ) => void;
}

export function TournamentList( { t, onSelect }: TournamentListProps ) {
	const { tournaments, loading, error, refetch } = useTournaments();
	const [ showCreate, setShowCreate ] = useState( false );

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

			{ loading ? (
				<Spinner />
			) : tournaments.length === 0 ? (
				<Text style={ { display: 'block', marginTop: 16 } }>
					{ t.tournament.noTournaments }
				</Text>
			) : (
				<div
					style={ {
						display: 'grid',
						gridTemplateColumns:
							'repeat(auto-fill, minmax(280px, 1fr))',
						gap: 16,
						marginTop: 16,
					} }
				>
					{ tournaments.map( ( tournament ) => (
						<TournamentCard
							key={ tournament.id }
							tournament={ tournament }
							t={ t }
							onClick={ () => onSelect( tournament.id ) }
							onDeleted={ refetch }
						/>
					) ) }
				</div>
			) }
		</div>
	);
}
