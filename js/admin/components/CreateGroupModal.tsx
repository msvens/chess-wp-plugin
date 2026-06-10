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
import type {
	EventData,
	Tournament,
	TrainingGroup,
	TrainingStatusChoice,
} from '../types';
import {
	createGroup,
	fetchEvents,
	createEvent,
	fetchTournaments,
	addParticipant,
} from '../api';
import { deriveStatus } from '../../shared/deriveStatus';
import { FlatpickrInput } from './FlatpickrInput';

interface CreateGroupModalProps {
	t: Translations;
	// When set, the modal acts as a "copy" of this group (prefilled, no tournament link).
	source?: TrainingGroup;
	sourceEvent?: EventData | null;
	onClose: () => void;
	onCreated: () => void;
}

export function CreateGroupModal( {
	t,
	source,
	sourceEvent,
	onClose,
	onCreated,
}: CreateGroupModalProps ) {
	const isCopy = !! source;
	const copyTitle = source
		? `${ source.title } (${ t.training.copySuffix })`
		: '';

	const [ title, setTitle ] = useState( copyTitle );
	const [ description, setDescription ] = useState(
		source?.description ?? ''
	);
	const [ semester, setSemester ] = useState( source?.semester ?? '' );
	const [ audience, setAudience ] = useState< 'junior' | 'adult' | 'mixed' >(
		source?.audience ?? 'mixed'
	);
	const [ trainers, setTrainers ] = useState( source?.trainers ?? '' );
	const [ contact, setContact ] = useState( source?.contact ?? '' );
	// The linked tournament is intentionally never carried over to a copy.
	const [ linkedTournamentId, setLinkedTournamentId ] = useState( '' );
	const [ showParticipants, setShowParticipants ] = useState(
		source?.showParticipants ?? true
	);
	const [ status, setStatus ] = useState< TrainingStatusChoice >( 'auto' );
	const [ copyParticipants, setCopyParticipants ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const [ events, setEvents ] = useState< EventData[] >( [] );
	const [ tournaments, setTournaments ] = useState< Tournament[] >( [] );
	const [ selectedEventId, setSelectedEventId ] = useState( '' );
	// Copy starts a fresh event (same pattern, new dates).
	const [ showNewEvent, setShowNewEvent ] = useState( isCopy );

	const [ eventTitle, setEventTitle ] = useState( copyTitle );
	const [ eventStart, setEventStart ] = useState( '' );
	const [ eventEnd, setEventEnd ] = useState( '' );
	const [ eventLocation, setEventLocation ] = useState(
		sourceEvent?.location ?? ''
	);
	const [ eventCategory, setEventCategory ] = useState(
		sourceEvent?.category ?? 'training'
	);
	const [ eventRecurring, setEventRecurring ] = useState(
		sourceEvent?.isRecurring ?? false
	);
	const [ eventRecurrenceType, setEventRecurrenceType ] = useState<
		'weekly' | 'biweekly'
	>( sourceEvent?.recurrenceType ?? 'weekly' );

	useEffect( () => {
		fetchEvents()
			.then( setEvents )
			.catch( () => {} );
		fetchTournaments()
			.then( setTournaments )
			.catch( () => {} );
	}, [] );

	async function handleSave() {
		if ( ! title.trim() ) {
			return;
		}
		setSaving( true );
		setError( null );
		try {
			let eventId: number | undefined;

			if ( showNewEvent && eventStart && eventEnd ) {
				const created = await createEvent( {
					title: eventTitle.trim() || title.trim(),
					startDate: eventStart,
					endDate: eventEnd,
					location: eventLocation.trim() || undefined,
					category: eventCategory,
					isRecurring: eventRecurring,
					recurrenceType: eventRecurring
						? ( eventRecurrenceType as 'weekly' | 'biweekly' )
						: undefined,
				} );
				eventId = created.id;
			} else if ( selectedEventId ) {
				eventId = Number( selectedEventId );
			}

			const newGroup = await createGroup( {
				title: title.trim(),
				description: description.trim() || undefined,
				semester: semester.trim() || undefined,
				audience,
				status,
				eventId,
				trainers: trainers.trim() || undefined,
				contact: contact.trim() || undefined,
				linkedTournamentId: linkedTournamentId
					? Number( linkedTournamentId )
					: undefined,
				showParticipants,
			} );

			// Clone the source roster after the group exists (participants are
			// added via separate calls, not at create time).
			if ( isCopy && copyParticipants && source ) {
				for ( const p of source.participants ) {
					// eslint-disable-next-line no-await-in-loop
					await addParticipant( newGroup.id, {
						id: p.id,
						name: p.name,
						ssfId: p.ssfId,
					} );
				}
			}

			onCreated();
			onClose();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to create group' );
			setSaving( false );
		}
	}

	// Live preview of the derived status from the chosen event's dates.
	const selectedEvent = events.find(
		( e ) => String( e.id ) === selectedEventId
	);
	const previewStart = showNewEvent
		? eventStart
		: selectedEvent?.startDate ?? '';
	const previewEnd = showNewEvent ? eventEnd : selectedEvent?.endDate ?? '';
	const previewStatus =
		status === 'auto'
			? deriveStatus( previewStart, previewEnd, false )
			: null;

	const eventOptions = [
		{ label: t.training.selectEvent, value: '' },
		...events.map( ( e ) => ( { label: e.title, value: String( e.id ) } ) ),
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
			title={ isCopy ? t.training.copyGroup : t.training.createGroup }
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
				label={ t.tournament.status }
				value={ status }
				help={
					previewStatus
						? `${ t.tournament.statusAutoHint } → ${ t.tournament.statuses[ previewStatus ] }`
						: t.tournament.statusAutoHint
				}
				options={ [
					{ label: t.tournament.statusAuto, value: 'auto' },
					{ label: t.tournament.statuses.planned, value: 'planned' },
					{ label: t.tournament.statuses.active, value: 'active' },
					{
						label: t.tournament.statuses.completed,
						value: 'completed',
					},
					{ label: t.training.statusHidden, value: 'draft' },
				] }
				onChange={ ( v ) => setStatus( v as TrainingStatusChoice ) }
			/>

			<SelectControl
				label={ t.tournament.linkedTournament }
				value={ linkedTournamentId }
				options={ tournamentOptions }
				onChange={ setLinkedTournamentId }
			/>

			<CheckboxControl
				label={ t.training.showParticipants }
				checked={ showParticipants }
				onChange={ setShowParticipants }
			/>
			{ isCopy && (
				<CheckboxControl
					label={ t.training.copyParticipants }
					checked={ copyParticipants }
					onChange={ setCopyParticipants }
				/>
			) }

			{ /* Event picker */ }
			<div
				style={ {
					marginTop: 16,
					padding: 12,
					background: '#f0f0f0',
					borderRadius: 4,
				} }
			>
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
							value={ showNewEvent ? '' : selectedEventId }
							options={ eventOptions }
							onChange={ ( val ) => {
								setSelectedEventId( val );
								setShowNewEvent( false );
							} }
							disabled={ showNewEvent }
						/>
					</div>
					<Button
						variant={ showNewEvent ? 'secondary' : 'tertiary' }
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
								t.training.event + ' — ' + t.training.groupName
							}
							value={ eventTitle }
							onChange={ setEventTitle }
							placeholder={ title }
						/>
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
					</div>
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
