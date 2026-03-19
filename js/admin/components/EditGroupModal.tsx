import { useState, useEffect } from '@wordpress/element';
import {
	Modal,
	TextControl,
	TextareaControl,
	CheckboxControl,
	SelectControl,
	Button,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../shared';
import type { TrainingGroup, EventData, GroupType } from '../types';
import { updateGroup, updateEvent, createEvent, fetchEvents } from '../api';
import { FlatpickrInput } from './FlatpickrInput';

interface EditGroupModalProps {
	group: TrainingGroup;
	event: EventData | null;
	t: Translations;
	onClose: () => void;
	onUpdated: () => void;
}

export function EditGroupModal( {
	group,
	event,
	t,
	onClose,
	onUpdated,
}: EditGroupModalProps ) {
	const [ title, setTitle ] = useState( group.title );
	const [ description, setDescription ] = useState( group.description );
	const [ semester, setSemester ] = useState( group.semester );
	const [ groupType, setGroupType ] = useState< GroupType >(
		group.groupType || 'training'
	);
	const [ timeControl, setTimeControl ] = useState<
		'classical' | 'rapid' | 'blitz'
	>(
		( group.timeControl as 'classical' | 'rapid' | 'blitz' ) || 'classical'
	);
	const [ trainers, setTrainers ] = useState( group.trainers );
	const [ contact, setContact ] = useState( group.contact );
	const [ tournamentLink, setTournamentLink ] = useState(
		group.tournamentLink
	);
	const [ ssfGroupId, setSsfGroupId ] = useState(
		String( group.ssfGroupId || '' )
	);
	const [ showParticipants, setShowParticipants ] = useState(
		group.showParticipants
	);
	const [ showStandings, setShowStandings ] = useState( group.showStandings );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	// Event editing state
	const [ eventStart, setEventStart ] = useState( event?.startDate || '' );
	const [ eventEnd, setEventEnd ] = useState( event?.endDate || '' );
	const [ eventLocation, setEventLocation ] = useState(
		event?.location || ''
	);
	const [ eventCategory, setEventCategory ] = useState(
		event?.category || 'training'
	);
	const [ eventRecurring, setEventRecurring ] = useState(
		event?.isRecurring || false
	);
	const [ eventRecurrenceType, setEventRecurrenceType ] = useState<
		'weekly' | 'biweekly'
	>( event?.recurrenceType || 'weekly' );

	// New event state (when no event is linked)
	const [ showNewEvent, setShowNewEvent ] = useState( false );
	const [ existingEvents, setExistingEvents ] = useState< EventData[] >( [] );
	const [ selectedEventId, setSelectedEventId ] = useState( '' );
	const [ eventTitle, setEventTitle ] = useState( '' );

	useEffect( () => {
		if ( ! event ) {
			fetchEvents()
				.then( setExistingEvents )
				.catch( () => {} );
		}
	}, [ event ] );

	async function handleSave() {
		if ( ! title.trim() ) {
			return;
		}
		setSaving( true );
		setError( null );
		try {
			// Handle event updates
			let eventId: number | undefined;

			if ( event ) {
				// Update existing linked event
				await updateEvent( event.id, {
					startDate: eventStart,
					endDate: eventEnd,
					location: eventLocation.trim() || undefined,
					category: eventCategory,
					isRecurring: eventRecurring,
					recurrenceType: eventRecurring
						? eventRecurrenceType
						: undefined,
				} );
			} else if ( showNewEvent && eventStart && eventEnd ) {
				// Create new event
				const created = await createEvent( {
					title: eventTitle.trim() || title.trim(),
					startDate: eventStart,
					endDate: eventEnd,
					location: eventLocation.trim() || undefined,
					category: eventCategory,
					isRecurring: eventRecurring,
					recurrenceType: eventRecurring
						? eventRecurrenceType
						: undefined,
				} );
				eventId = created.id;
			} else if ( selectedEventId ) {
				eventId = Number( selectedEventId );
			}

			const hasTournament = groupType !== 'training';
			await updateGroup( group.id, {
				title: title.trim(),
				description: description.trim(),
				semester: semester.trim(),
				groupType,
				timeControl: hasTournament ? timeControl : undefined,
				trainers: trainers.trim(),
				contact: contact.trim(),
				tournamentLink: tournamentLink.trim(),
				ssfGroupId: ssfGroupId ? Number( ssfGroupId ) : 0,
				showParticipants,
				showStandings,
				...( eventId !== undefined ? { eventId } : {} ),
			} );
			onUpdated();
			onClose();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to update group' );
			setSaving( false );
		}
	}

	const eventOptions = [
		{ label: t.training.selectEvent, value: '' },
		...existingEvents.map( ( e ) => ( {
			label: e.title,
			value: String( e.id ),
		} ) ),
	];

	return (
		<Modal
			title={ t.common.edit }
			onRequestClose={ onClose }
			className="rc-wide-modal"
		>
			<TextControl
				label={ t.training.groupName }
				value={ title }
				onChange={ setTitle }
				required
			/>
			<TextareaControl
				label={ t.training.description }
				value={ description }
				onChange={ setDescription }
			/>
			<TextControl
				label={ t.training.trainers }
				value={ trainers }
				onChange={ setTrainers }
			/>
			<TextControl
				label={ t.training.contact }
				value={ contact }
				onChange={ setContact }
			/>
			<TextControl
				label={ t.training.tournamentLink }
				value={ tournamentLink }
				onChange={ setTournamentLink }
				type="url"
			/>
			<TextControl
				label={ t.training.semester }
				value={ semester }
				onChange={ setSemester }
				placeholder="VT2026"
			/>
			<SelectControl
				label={ t.training.groupType }
				value={ groupType }
				options={ [
					{
						label: t.training.trainingOnly,
						value: 'training',
					},
					{
						label: t.training.tournamentOnly,
						value: 'tournament',
					},
					{
						label: t.training.trainingAndTournament,
						value: 'both',
					},
				] }
				onChange={ ( v ) => setGroupType( v as GroupType ) }
			/>
			{ groupType !== 'training' && (
				<SelectControl
					label={ t.training.timeControl }
					value={ timeControl }
					options={ [
						{ label: t.training.classical, value: 'classical' },
						{ label: t.training.rapid, value: 'rapid' },
						{ label: t.training.blitz, value: 'blitz' },
					] }
					onChange={ ( v ) =>
						setTimeControl( v as 'classical' | 'rapid' | 'blitz' )
					}
				/>
			) }
			<CheckboxControl
				label={ t.training.showParticipants }
				checked={ showParticipants }
				onChange={ setShowParticipants }
			/>
			<CheckboxControl
				label={ t.training.showStandings }
				checked={ showStandings }
				onChange={ setShowStandings }
			/>
			<TextControl
				label={ t.training.ssfTournamentGroupId }
				value={ ssfGroupId }
				onChange={ ( v ) => {
					setSsfGroupId( v );
					if ( Number( v ) > 0 ) {
						setGroupType( 'tournament' );
					}
				} }
				type="number"
			/>

			{ /* Event section */ }
			<div
				style={ {
					marginTop: 16,
					padding: 12,
					background: '#f0f0f0',
					borderRadius: 4,
				} }
			>
				{ event ? (
					<>
						<Text
							style={ {
								display: 'block',
								fontWeight: 600,
								marginBottom: 8,
								fontSize: '11px',
								textTransform: 'uppercase' as const,
								letterSpacing: '0.05em',
							} }
						>
							{ t.training.schedule }
						</Text>
						<div className="rc-date-fields">
							<div className="rc-date-field">
								<label>{ t.training.startDate } *</label>
								<FlatpickrInput
									value={ eventStart }
									onChange={ setEventStart }
									required
								/>
							</div>
							<div className="rc-date-field">
								<label>{ t.training.endDate } *</label>
								<FlatpickrInput
									value={ eventEnd }
									onChange={ setEventEnd }
									required
								/>
							</div>
						</div>
						<div style={ { display: 'flex', gap: 12 } }>
							<div style={ { flex: 1 } }>
								<TextControl
									label={ t.training.location }
									value={ eventLocation }
									onChange={ setEventLocation }
								/>
							</div>
							<div style={ { flex: 1 } }>
								<SelectControl
									label={
										t.calendar.eventCategories.training
									}
									value={ eventCategory }
									options={ Object.entries(
										t.calendar.eventCategories
									).map( ( [ value, label ] ) => ( {
										label,
										value,
									} ) ) }
									onChange={ setEventCategory }
								/>
							</div>
						</div>
						<CheckboxControl
							label={ t.calendar.recurring }
							checked={ eventRecurring }
							onChange={ setEventRecurring }
						/>
						{ eventRecurring && (
							<SelectControl
								label={ t.calendar.recurring }
								value={ eventRecurrenceType }
								options={ [
									{
										label: t.calendar.weekly,
										value: 'weekly',
									},
									{
										label: t.calendar.biweekly,
										value: 'biweekly',
									},
								] }
								onChange={ ( v ) =>
									setEventRecurrenceType(
										v as 'weekly' | 'biweekly'
									)
								}
							/>
						) }
					</>
				) : (
					<>
						<div
							style={ {
								display: 'flex',
								alignItems: 'flex-end',
								gap: 8,
								marginBottom: 8,
							} }
						>
							<div style={ { flex: 1 } }>
								<SelectControl
									label={ t.training.event }
									value={
										showNewEvent ? '' : selectedEventId
									}
									options={ eventOptions }
									onChange={ ( val ) => {
										setSelectedEventId( val );
										setShowNewEvent( false );
									} }
									disabled={ showNewEvent }
								/>
							</div>
							<Button
								variant={
									showNewEvent ? 'secondary' : 'tertiary'
								}
								onClick={ () => {
									setShowNewEvent( ! showNewEvent );
									if ( ! showNewEvent ) {
										setSelectedEventId( '' );
										setEventTitle( title );
									}
								} }
								style={ { marginBottom: 8 } }
							>
								{ showNewEvent
									? t.common.cancel
									: `+ ${ t.training.newEvent }` }
							</Button>
						</div>

						{ showNewEvent && (
							<div
								style={ {
									padding: 12,
									background: '#fff',
									borderRadius: 4,
								} }
							>
								<TextControl
									label={
										t.training.event +
										' — ' +
										t.training.groupName
									}
									value={ eventTitle }
									onChange={ setEventTitle }
									placeholder={ title }
								/>
								<div className="rc-date-fields">
									<div className="rc-date-field">
										<label>
											{ t.training.startDate } *
										</label>
										<FlatpickrInput
											value={ eventStart }
											onChange={ setEventStart }
											required
										/>
									</div>
									<div className="rc-date-field">
										<label>{ t.training.endDate } *</label>
										<FlatpickrInput
											value={ eventEnd }
											onChange={ setEventEnd }
											required
										/>
									</div>
								</div>
								<CheckboxControl
									label={ t.calendar.recurring }
									checked={ eventRecurring }
									onChange={ setEventRecurring }
								/>
								{ eventRecurring && (
									<SelectControl
										label={ t.calendar.recurring }
										value={ eventRecurrenceType }
										options={ [
											{
												label: t.calendar.weekly,
												value: 'weekly',
											},
											{
												label: t.calendar.biweekly,
												value: 'biweekly',
											},
										] }
										onChange={ ( v ) =>
											setEventRecurrenceType(
												v as 'weekly' | 'biweekly'
											)
										}
									/>
								) }
								<div style={ { display: 'flex', gap: 12 } }>
									<div style={ { flex: 1 } }>
										<TextControl
											label={ t.training.location }
											value={ eventLocation }
											onChange={ setEventLocation }
										/>
									</div>
									<div style={ { flex: 1 } }>
										<SelectControl
											label={
												t.calendar.eventCategories
													.training
											}
											value={ eventCategory }
											options={ Object.entries(
												t.calendar.eventCategories
											).map( ( [ value, label ] ) => ( {
												label,
												value,
											} ) ) }
											onChange={ setEventCategory }
										/>
									</div>
								</div>
							</div>
						) }
					</>
				) }
			</div>

			{ error && (
				<Text
					style={ {
						color: '#cc1818',
						display: 'block',
						marginTop: 8,
					} }
				>
					{ error }
				</Text>
			) }

			<div
				style={ {
					marginTop: 16,
					display: 'flex',
					justifyContent: 'flex-end',
					gap: 8,
				} }
			>
				<Button variant="tertiary" onClick={ onClose }>
					{ t.common.cancel }
				</Button>
				<Button
					variant="primary"
					onClick={ handleSave }
					isBusy={ saving }
					disabled={ ! title.trim() || saving }
				>
					{ t.common.save }
				</Button>
			</div>
		</Modal>
	);
}
