import { useState } from '@wordpress/element';
import {
	Button,
	Spinner,
	Notice,
	TabPanel,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../../shared';
import { useTournament } from '../../hooks/useTournament';
import { useSsfRatings } from '../../hooks/useSsfRatings';
import { ParticipantList } from './ParticipantList';
import { AddParticipantModal } from './AddParticipantModal';
import { StandingsTable } from './StandingsTable';
import { RoundsPanel } from './RoundsPanel';
import { SsfTournamentView } from '../SsfTournamentView';

interface TournamentDetailProps {
	tournamentId: number;
	clubId: string;
	t: Translations;
	onBack: () => void;
}

export function TournamentDetail( {
	tournamentId,
	clubId,
	t,
	onBack,
}: TournamentDetailProps ) {
	const { tournament, loading, error, refetch } =
		useTournament( tournamentId );
	const {
		ratings,
		players,
		loading: ratingsLoading,
	} = useSsfRatings( clubId );
	const [ showAddModal, setShowAddModal ] = useState( false );

	if ( loading ) {
		return <Spinner />;
	}
	if ( error ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ error }
			</Notice>
		);
	}
	if ( ! tournament ) {
		return null;
	}

	const isSsfBacked = tournament.ssfGroupId > 0;

	const tabs = [
		{
			name: 'participants',
			title: t.training.participants,
		},
		...( ! isSsfBacked
			? [
					{ name: 'rounds', title: t.training.round },
					{ name: 'standings', title: t.training.standings },
			  ]
			: [ { name: 'results', title: t.training.results } ] ),
	];

	return (
		<div>
			<Button
				variant="link"
				onClick={ onBack }
				style={ { marginBottom: 8 } }
			>
				&larr; { t.tournament.backToList }
			</Button>

			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: 8,
				} }
			>
				<div>
					<Heading level={ 2 } style={ { margin: 0 } }>
						{ tournament.title }
					</Heading>
					<div style={ { marginTop: 4 } }>
						<span
							className={ `rc-status-pill is-${ tournament.status }` }
						>
							{ t.tournament.statuses[ tournament.status ] }
						</span>
						<span className="rc-category-pill">
							{ t.tournament.categories[ tournament.category ] }
						</span>
						{ isSsfBacked && (
							<Text
								style={ {
									display: 'inline',
									fontStyle: 'italic',
									marginLeft: 8,
								} }
							>
								SSF #{ tournament.ssfGroupId }
							</Text>
						) }
					</div>
				</div>
			</div>

			{ tournament.description && (
				<Text style={ { display: 'block', marginBottom: 12 } }>
					{ tournament.description }
				</Text>
			) }

			{ isSsfBacked && (
				<Notice status="info" isDismissible={ false }>
					{ t.tournament.ssfBackedNote }
				</Notice>
			) }

			<TabPanel tabs={ tabs } initialTabName="participants">
				{ ( tab ) => {
					if ( tab.name === 'participants' ) {
						return (
							<>
								{ showAddModal && ! isSsfBacked && (
									<AddParticipantModal
										tournamentId={ tournament.id }
										existingParticipants={
											tournament.participants
										}
										players={ players }
										ratingsLoading={ ratingsLoading }
										t={ t }
										onClose={ () =>
											setShowAddModal( false )
										}
										onAdded={ refetch }
									/>
								) }
								<ParticipantList
									tournamentId={ tournament.id }
									participants={ tournament.participants }
									ratings={ ratings }
									timeControl={ tournament.timeControl }
									t={ t }
									onUpdated={ refetch }
									onAddClick={ () => setShowAddModal( true ) }
									readOnly={ isSsfBacked }
								/>
							</>
						);
					}
					if ( tab.name === 'rounds' ) {
						return (
							<RoundsPanel
								tournamentId={ tournament.id }
								tournament={ tournament }
								ratings={ ratings }
								t={ t }
								onUpdated={ refetch }
							/>
						);
					}
					if ( tab.name === 'standings' ) {
						return (
							<StandingsTable
								participants={ tournament.participants }
								rounds={ tournament.rounds }
								ratings={ ratings }
								timeControl={ tournament.timeControl }
								t={ t }
							/>
						);
					}
					if ( tab.name === 'results' ) {
						return (
							<SsfTournamentView
								ssfGroupId={ tournament.ssfGroupId }
								t={ t }
							/>
						);
					}
					return null;
				} }
			</TabPanel>
		</div>
	);
}
