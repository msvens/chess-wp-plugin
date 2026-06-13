import { useState } from '@wordpress/element';
import {
	Button,
	Spinner,
	Notice,
	TabPanel,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../shared';
import { useTrainingGroup } from '../hooks/useTrainingGroup';
import { useSsfRatings } from '../hooks/useSsfRatings';
import { ParticipantList } from './ParticipantList';
import { AddParticipantModal } from './AddParticipantModal';
import { SessionList } from './SessionList';
import { ScheduleTimeline } from './ScheduleTimeline';
import { ExcludedDatesPanel } from './ExcludedDatesPanel';
import { EditGroupModal } from './EditGroupModal';
import { CreateGroupModal } from './CreateGroupModal';

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
	const [ showCopyModal, setShowCopyModal ] = useState( false );

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
				<span className={ `rc-status-pill is-${ group.status }` }>
					{ group.status === 'draft'
						? t.training.statusHidden
						: t.tournament.statuses[ group.status ] }
				</span>
				<Button
					variant="tertiary"
					size="compact"
					onClick={ () => setShowEditModal( true ) }
				>
					{ t.common.edit }
				</Button>
				<Button
					variant="tertiary"
					size="compact"
					onClick={ () => setShowCopyModal( true ) }
				>
					{ t.common.copy }
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

			{ showCopyModal && (
				<CreateGroupModal
					t={ t }
					source={ group }
					sourceEvent={ event }
					onClose={ () => setShowCopyModal( false ) }
					onCreated={ onBack }
				/>
			) }
		</div>
	);
}
