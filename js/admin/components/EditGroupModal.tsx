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
import type { TrainingGroup, EventData, Tournament } from '../types';
import {
	updateGroup,
	updateEvent,
	createEvent,
	fetchEvents,
	fetchTournaments,
} from '../api';
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
	const [ audience, setAudience ] = useState< 'junior' | 'adult' | 'mixed' >(
		group.audience || 'mixed'
	);
	const [ trainers, setTrainers ] = useState( group.trainers );
	const [ contact, setContact ] = useState( group.contact );
	const [ linkedTournamentId, setLinkedTournamentId ] = useState(
		String( group.linkedTournamentId || '' )
	);
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

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

	const [ showNewEvent, setShowNewEvent ] = useState( false );
	const [ existingEvents, setExistingEvents ] = useState< EventData[] >( [] );
	const [ selectedEventId, setSelectedEventId ] = useState( '' );
	const [ eventTitle, setEventTitle ] = useState( '' );

	const [ tournaments, setTournaments ] = useState< Tournament[] >( [] );

	useEffect( () => {
		if ( ! event ) {
			fetchEvents()
				.then( setExistingEvents )
				.catch( () => {} );
		}
		fetchTournaments()
			.then( setTournaments )
			.catch( () => {} );
	}, [ event ] );

	async function handleSave() {
		if ( ! title.trim() ) {
			return;
		}
		setSaving( true );
		setError( null );
		try {
			let eventId: number | undefined;

			if ( event ) {
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

			await updateGroup( group.id, {
				title: title.trim(),
				description: description.trim(),
				semester: semester.trim(),
				audience,
				trainers: trainers.trim(),
				contact: contact.trim(),
				linkedTournamentId: linkedTournamentId
					? Number( linkedTournamentId )
					: 0,
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

	const tournamentOptions = [
		{ label: t.tournament.noLinkedTournament, value: '' },
		...tournaments.map( ( tournament ) => ( {
			label: tournament.title,
			value: String( tournament.id ),
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
				label={ t.training.semester }
				value={ semester }
				onChange={ setSemester }
				placeholder="VT2026"
			/>

			<SelectControl
				label={ t.training.audience }
				value={ audience }
				options={ [
					{
						label: t.training.audiences.junior,
						value: 'junior',
					},
					{
						label: t.training.audiences.adult,
						value: 'adult',
					},
					{
						label: t.training.audiences.mixed,
						value: 'mixed',
					},
				] }
				onChange={ ( v ) =>
					setAudience( v as 'junior' | 'adult' | 'mixed' )
				}
			/>

			<SelectControl
				label={ t.tournament.linkedTournament }
				value={ linkedTournamentId }
				options={ tournamentOptions }
				onChange={ setLinkedTournamentId }
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
