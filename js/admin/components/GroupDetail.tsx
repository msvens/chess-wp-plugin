import { useState, useEffect } from '@wordpress/element';
import {
	Button,
	Spinner,
	Notice,
	TabPanel,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../shared';
import type { Tournament } from '../types';
import { useTrainingGroup } from '../hooks/useTrainingGroup';
import { useSsfRatings } from '../hooks/useSsfRatings';
import { updateGroup, fetchTournament } from '../api';
import { ParticipantList } from './ParticipantList';
import { AddParticipantModal } from './AddParticipantModal';
import { SessionList } from './SessionList';
import { ScheduleTimeline } from './ScheduleTimeline';
import { ExcludedDatesPanel } from './ExcludedDatesPanel';
import { EditGroupModal } from './EditGroupModal';

interface GroupDetailProps {
	groupId: number;
	clubId: string;
	t: Translations;
	onBack: () => void;
	onSelectSession: ( sessionId: number ) => void;
}

export function GroupDetail( {
	groupId,
	clubId,
	t,
	onBack,
	onSelectSession,
}: GroupDetailProps ) {
	const { group, sessions, event, scheduleDates, loading, error, refetch } =
		useTrainingGroup( groupId );
	const {
		ratings,
		players,
		loading: ratingsLoading,
	} = useSsfRatings( clubId );
	const [ showAddModal, setShowAddModal ] = useState( false );
	const [ showEditModal, setShowEditModal ] = useState( false );
	const [ updatingStatus, setUpdatingStatus ] = useState( false );
	const [ linkedTournament, setLinkedTournament ] =
		useState< Tournament | null >( null );

	useEffect( () => {
		if ( ! group || ! group.linkedTournamentId ) {
			setLinkedTournament( null );
			return;
		}
		fetchTournament( group.linkedTournamentId )
			.then( setLinkedTournament )
			.catch( () => setLinkedTournament( null ) );
	}, [ group?.linkedTournamentId ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const toggleStatus = () => {
		if ( ! group ) {
			return;
		}
		const newStatus = group.status === 'active' ? 'draft' : 'active';
		setUpdatingStatus( true );
		updateGroup( groupId, { status: newStatus } )
			.then( () => refetch() )
			.finally( () => setUpdatingStatus( false ) );
	};

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
	if ( ! group ) {
		return null;
	}

	let scheduleSummary = '';
	if ( event ) {
		const start = new Date( event.startDate );
		const dayName = start.toLocaleDateString( undefined, {
			weekday: 'long',
		} );
		const time = start.toLocaleTimeString( undefined, {
			hour: '2-digit',
			minute: '2-digit',
		} );
		scheduleSummary = `${ dayName } ${ time }`;
		if ( event.location ) {
			scheduleSummary += ` — ${ event.location }`;
		}
		if ( event.isRecurring ) {
			const recLabel =
				event.recurrenceType === 'biweekly'
					? t.calendar.biweekly
					: t.calendar.weekly;
			scheduleSummary += ` (${ recLabel })`;
		}
	}

	const tabs = [
		{
			name: 'participants',
			title: t.training.participants,
		},
		{
			name: 'sessions',
			title: t.training.sessions,
		},
	];

	return (
		<div>
			<Button
				variant="link"
				onClick={ onBack }
				style={ { marginBottom: 8 } }
			>
				&larr; { t.training.backToList }
			</Button>

			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					gap: 12,
					marginBottom: 4,
				} }
			>
				<Heading level={ 2 } style={ { margin: 0 } }>
					{ group.title }
				</Heading>
				<Button
					variant={
						group.status === 'active' ? 'primary' : 'secondary'
					}
					size="compact"
					isBusy={ updatingStatus }
					onClick={ toggleStatus }
				>
					{ group.status === 'active' ? t.training.active : 'Draft' }
				</Button>
				<Button
					variant="tertiary"
					size="compact"
					onClick={ () => setShowEditModal( true ) }
				>
					{ t.common.edit }
				</Button>
			</div>
			{ group.semester && (
				<Text style={ { display: 'block', marginBottom: 4 } }>
					{ t.training.semester }: { group.semester }
				</Text>
			) }
			{ group.trainers && (
				<Text style={ { display: 'block', marginBottom: 4 } }>
					{ t.training.trainers }: { group.trainers }
				</Text>
			) }
			{ group.contact && (
				<Text style={ { display: 'block', marginBottom: 4 } }>
					{ t.training.contact }: { group.contact }
				</Text>
			) }
			{ scheduleSummary && (
				<Text
					style={ {
						display: 'block',
						marginBottom: 16,
						color: '#555',
					} }
				>
					{ t.training.schedule }: { scheduleSummary }
				</Text>
			) }

			{ linkedTournament && (
				<div
					style={ {
						marginBottom: 16,
						padding: 12,
						background: '#f9fafb',
						borderRadius: 4,
						borderLeft: '3px solid #2563eb',
					} }
				>
					<Text
						style={ {
							display: 'block',
							fontSize: 11,
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
							color: '#6b7280',
							marginBottom: 4,
						} }
					>
						{ t.tournament.linkedTournament }
					</Text>
					<Heading level={ 4 } style={ { margin: '0 0 4px 0' } }>
						{ linkedTournament.title }
					</Heading>
					<Text style={ { display: 'block', color: '#555' } }>
						{ t.tournament.statuses[ linkedTournament.status ] }
						{ ' — ' }
						{ t.tournament.categories[ linkedTournament.category ] }
					</Text>
				</div>
			) }

			<TabPanel tabs={ tabs }>
				{ ( tab ) => {
					switch ( tab.name ) {
						case 'participants':
							return (
								<div style={ { marginTop: 12 } }>
									<ParticipantList
										groupId={ groupId }
										participants={ group.participants }
										ratings={ ratings }
										timeControl={ 'classical' }
										t={ t }
										onUpdated={ refetch }
										onAddClick={ () =>
											setShowAddModal( true )
										}
									/>
									{ showAddModal && (
										<AddParticipantModal
											groupId={ groupId }
											existingParticipants={
												group.participants
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
								</div>
							);
						case 'sessions':
							return (
								<div style={ { marginTop: 12 } }>
									{ event && scheduleDates.length > 0 ? (
										<>
											<ScheduleTimeline
												groupId={ groupId }
												scheduleDates={ scheduleDates }
												sessions={ sessions }
												t={ t }
												onSelectSession={
													onSelectSession
												}
												onCreated={ refetch }
											/>
											{ event.isRecurring && (
												<ExcludedDatesPanel
													event={ event }
													scheduleDates={
														scheduleDates
													}
													t={ t }
													onUpdated={ refetch }
												/>
											) }
										</>
									) : (
										<SessionList
											groupId={ groupId }
											sessions={ sessions }
											t={ t }
											onSelectSession={ onSelectSession }
											onCreated={ refetch }
										/>
									) }
								</div>
							);
						default:
							return null;
					}
				} }
			</TabPanel>

			{ showEditModal && (
				<EditGroupModal
					group={ group }
					event={ event }
					t={ t }
					onClose={ () => setShowEditModal( false ) }
					onUpdated={ refetch }
				/>
			) }
		</div>
	);
}
