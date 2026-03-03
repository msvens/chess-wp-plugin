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
import { StandingsTable } from './StandingsTable';

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

	// Build schedule summary from event
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
		...( group.hasTournament
			? [ { name: 'standings', title: t.training.standings } ]
			: [] ),
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

			<Heading level={ 2 }>{ group.title }</Heading>
			{ group.semester && (
				<Text style={ { display: 'block', marginBottom: 4 } }>
					{ t.training.semester }: { group.semester }
					{ group.hasTournament && ` | ${ t.training.tournament }` }
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
										timeControl={ group.timeControl }
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
						case 'standings':
							return (
								<div style={ { marginTop: 12 } }>
									<StandingsTable
										participants={ group.participants }
										sessions={ sessions }
										ratings={ ratings }
										timeControl={ group.timeControl }
										t={ t }
									/>
								</div>
							);
						default:
							return null;
					}
				} }
			</TabPanel>
		</div>
	);
}
