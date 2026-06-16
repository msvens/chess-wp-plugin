import { useState } from '@wordpress/element';
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
import { updateGroup } from '../api';
import { deriveStatus } from '../../shared/deriveStatus';
import {
	EventSection,
	emptyEventValue,
	eventSectionToPayload,
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

	// Checked when the group already owns an event; unchecking on save removes it.
	const [ addToCalendar, setAddToCalendar ] = useState( !! event );
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

	async function handleSave() {
		if ( ! title.trim() ) {
			return;
		}
		setSaving( true );
		setError( null );
		try {
			await updateGroup( group.id, {
				title: title.trim(),
				description: description.trim(),
				semester: semester.trim(),
				audience,
				trainers: trainers.trim(),
				contact: contact.trim(),
				showParticipants,
				status,
				// Reconciled server-side: a payload creates/updates the
				// group-owned event, null removes it. A group previously linked
				// to a non-owned (legacy) event gets its own new owned event
				// here; the shared event is left intact.
				calendarEvent: addToCalendar
					? eventSectionToPayload( eventValue )
					: null,
			} );
			onUpdated();
			onClose();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to update group' );
			setSaving( false );
		}
	}

	// A recurring event ends (for status) at its series end, not the occurrence.
	const previewStart = addToCalendar ? eventValue.eventStart : '';
	const previewEnd = addToCalendar
		? eventValue.eventRecurring && eventValue.eventRecurrenceEnd
			? eventValue.eventRecurrenceEnd
			: eventValue.eventEnd
		: '';
	const previewStatus =
		status === 'auto'
			? deriveStatus( previewStart, previewEnd, false )
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

			<CheckboxControl
				label={ t.tournament.addToCalendar }
				checked={ addToCalendar }
				onChange={ setAddToCalendar }
				help={ t.tournament.addToCalendarHint }
			/>
			{ addToCalendar && (
				<EventSection
					t={ t }
					showRecurrence={ true }
					value={ eventValue }
					onChange={ setEventValue }
				/>
			) }

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
