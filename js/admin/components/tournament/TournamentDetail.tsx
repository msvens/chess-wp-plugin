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
import { EditTournamentModal } from './EditTournamentModal';
import { SsfTournamentView } from '../SsfTournamentView';

function formatDate( value: string ): string {
	if ( ! value ) {
		return '';
	}
	const d = new Date( value );
	if ( isNaN( d.getTime() ) ) {
		return value;
	}
	return d.toLocaleDateString( 'sv-SE', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	} );
}

function formatDateRange( start: string, end: string ): string {
	const s = formatDate( start );
	const e = formatDate( end );
	if ( s && e ) {
		return `${ s } – ${ e }`;
	}
	return s || e;
}

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
	const [ showEditModal, setShowEditModal ] = useState( false );

	// Only show the spinner on the initial load. On a background refetch (e.g.
	// after auto-saving a round result) keep the current view mounted so the
	// active tab and round are preserved instead of snapping back to the first
	// tab. The brief loading:true would otherwise unmount the TabPanel.
	if ( loading && ! tournament ) {
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

	// Local (non-SSF) tournaments use these tabs. SSF tournaments render the SSF
	// view directly (no tabs) — it self-labels as standings or registered players.
	const tabs = [
		{ name: 'participants', title: t.training.participants },
		{ name: 'rounds', title: t.training.round },
		{ name: 'standings', title: t.training.standings },
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
					alignItems: 'flex-start',
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
					</div>
					{ ( tournament.startDate || tournament.endDate ) && (
						<div style={ { marginTop: 6, color: '#555' } }>
							{ formatDateRange(
								tournament.startDate,
								tournament.endDate
							) }
						</div>
					) }
					{ isSsfBacked && (
						<div style={ { marginTop: 6 } }>
							{ tournament.ssfTournamentName &&
								tournament.ssfTournamentName !==
									tournament.title && (
									<div
										style={ {
											color: '#555',
											marginBottom: 4,
										} }
									>
										{ t.tournament.ssfParentTournament }:{ ' ' }
										{ tournament.ssfTournamentName }
									</div>
								) }
							{ tournament.externalLink ? (
								<a
									href={ tournament.externalLink }
									target="_blank"
									rel="noreferrer"
								>
									{ t.tournament.viewOnSsf } ↗
								</a>
							) : (
								<Text style={ { fontStyle: 'italic' } }>
									SSF #{ tournament.ssfGroupId }
								</Text>
							) }
						</div>
					) }
				</div>
				<Button
					variant="secondary"
					onClick={ () => setShowEditModal( true ) }
					size="compact"
				>
					{ t.common.edit }
				</Button>
			</div>

			{ showEditModal && (
				<EditTournamentModal
					t={ t }
					tournament={ tournament }
					onClose={ () => setShowEditModal( false ) }
					onUpdated={ refetch }
				/>
			) }

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

			{ isSsfBacked ? (
				<SsfTournamentView
					ssfGroupId={ tournament.ssfGroupId }
					t={ t }
				/>
			) : (
				<TabPanel tabs={ tabs } initialTabName="participants">
					{ ( tab ) => {
						if ( tab.name === 'participants' ) {
							return (
								<>
									{ showAddModal && (
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
										onAddClick={ () =>
											setShowAddModal( true )
										}
										readOnly={ false }
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
						return null;
					} }
				</TabPanel>
			) }
		</div>
	);
}
