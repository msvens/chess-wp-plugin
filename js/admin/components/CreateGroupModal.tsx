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
import type { EventData, TrainingGroup, TrainingStatusChoice } from '../types';
import { createGroup, fetchEvents, createEvent, addParticipant } from '../api';
import { deriveStatus } from '../../shared/deriveStatus';
import {
	EventSection,
	emptyEventValue,
	type EventSectionValue,
} from './EventSection';

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
	const [ showParticipants, setShowParticipants ] = useState(
		source?.showParticipants ?? true
	);
	const [ status, setStatus ] = useState< TrainingStatusChoice >( 'auto' );
	const [ copyParticipants, setCopyParticipants ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const [ events, setEvents ] = useState< EventData[] >( [] );
	const [ eventValue, setEventValue ] = useState< EventSectionValue >(
		emptyEventValue( {
			// Copy starts a fresh event (same pattern, new dates).
			showNewEvent: isCopy,
			eventTitle: copyTitle,
			eventLocation: sourceEvent?.location ?? '',
			eventCategory: sourceEvent?.category ?? 'training',
			eventRecurring: sourceEvent?.isRecurring ?? false,
			eventRecurrenceType: sourceEvent?.recurrenceType ?? 'weekly',
		} )
	);

	useEffect( () => {
		fetchEvents()
			.then( setEvents )
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

			if (
				eventValue.showNewEvent &&
				eventValue.eventStart &&
				eventValue.eventEnd
			) {
				const created = await createEvent( {
					title: eventValue.eventTitle.trim() || title.trim(),
					startDate: eventValue.eventStart,
					endDate: eventValue.eventEnd,
					location: eventValue.eventLocation.trim() || undefined,
					category: eventValue.eventCategory,
					isRecurring: eventValue.eventRecurring,
					recurrenceType: eventValue.eventRecurring
						? eventValue.eventRecurrenceType
						: undefined,
					recurrenceEndDate: eventValue.eventRecurring
						? eventValue.eventRecurrenceEnd
						: '',
				} );
				eventId = created.id;
			} else if ( eventValue.selectedEventId ) {
				eventId = Number( eventValue.selectedEventId );
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
		( e ) => String( e.id ) === eventValue.selectedEventId
	);
	const previewStart = eventValue.showNewEvent
		? eventValue.eventStart
		: selectedEvent?.startDate ?? '';
	// A recurring event ends (for status) at its series end, not the occurrence.
	const previewEnd = eventValue.showNewEvent
		? eventValue.eventRecurring && eventValue.eventRecurrenceEnd
			? eventValue.eventRecurrenceEnd
			: eventValue.eventEnd
		: selectedEvent?.isRecurring && selectedEvent?.recurrenceEndDate
		? selectedEvent.recurrenceEndDate
		: selectedEvent?.endDate ?? '';
	const previewStatus =
		status === 'auto'
			? deriveStatus( previewStart, previewEnd, false )
			: null;

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

			<EventSection
				t={ t }
				mode="select-or-create"
				showRecurrence={ true }
				events={ events }
				value={ eventValue }
				onChange={ setEventValue }
				entityTitle={ title }
			/>

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
