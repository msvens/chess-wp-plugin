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
import type { TrainingGroup, EventData, TrainingStatusChoice } from '../types';
import { updateGroup, updateEvent, createEvent, fetchEvents } from '../api';
import { deriveStatus } from '../../shared/deriveStatus';
import {
	EventSection,
	emptyEventValue,
	type EventSectionValue,
} from './EventSection';

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
	const [ showParticipants, setShowParticipants ] = useState(
		group.showParticipants ?? true
	);
	const [ status, setStatus ] = useState< TrainingStatusChoice >(
		group.statusIsAuto ? 'auto' : group.status
	);
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const [ eventValue, setEventValue ] = useState< EventSectionValue >(
		emptyEventValue( {
			eventStart: event?.startDate || '',
			eventEnd: event?.endDate || '',
			eventLocation: event?.location || '',
			eventCategory: event?.category || 'training',
			eventRecurring: event?.isRecurring || false,
			eventRecurrenceType: event?.recurrenceType || 'weekly',
			eventRecurrenceEnd: ( event?.recurrenceEndDate || '' ).substring(
				0,
				10
			),
		} )
	);
	const [ existingEvents, setExistingEvents ] = useState< EventData[] >( [] );

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
			let eventId: number | undefined;

			if ( event ) {
				await updateEvent( event.id, {
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
			} else if (
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

			await updateGroup( group.id, {
				title: title.trim(),
				description: description.trim(),
				semester: semester.trim(),
				audience,
				trainers: trainers.trim(),
				contact: contact.trim(),
				showParticipants,
				status,
				...( eventId !== undefined ? { eventId } : {} ),
			} );
			onUpdated();
			onClose();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to update group' );
			setSaving( false );
		}
	}

	// A recurring event ends (for status) at its series end, not the occurrence.
	const previewEnd =
		eventValue.eventRecurring && eventValue.eventRecurrenceEnd
			? eventValue.eventRecurrenceEnd
			: eventValue.eventEnd;
	const previewStatus =
		status === 'auto'
			? deriveStatus( eventValue.eventStart, previewEnd, false )
			: null;

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

			<EventSection
				t={ t }
				mode={ event ? 'create-only' : 'select-or-create' }
				showRecurrence={ true }
				events={ existingEvents }
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
