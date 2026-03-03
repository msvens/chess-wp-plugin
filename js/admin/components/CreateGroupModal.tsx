import { useState, useEffect } from '@wordpress/element';
import {
	Modal,
	TextControl,
	TextareaControl,
	CheckboxControl,
	SelectControl,
	Button,
	DateTimePicker,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../shared';
import type { EventData } from '../types';
import { createGroup, fetchEvents, createEvent } from '../api';

interface CreateGroupModalProps {
	t: Translations;
	onClose: () => void;
	onCreated: () => void;
}

export function CreateGroupModal( {
	t,
	onClose,
	onCreated,
}: CreateGroupModalProps ) {
	const [ title, setTitle ] = useState( '' );
	const [ description, setDescription ] = useState( '' );
	const [ semester, setSemester ] = useState( '' );
	const [ hasTournament, setHasTournament ] = useState( false );
	const [ timeControl, setTimeControl ] = useState<
		'classical' | 'rapid' | 'blitz'
	>( 'classical' );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	// Event picker state
	const [ events, setEvents ] = useState< EventData[] >( [] );
	const [ selectedEventId, setSelectedEventId ] = useState( '' );
	const [ showNewEvent, setShowNewEvent ] = useState( false );

	// New event fields
	const [ eventTitle, setEventTitle ] = useState( '' );
	const [ eventStart, setEventStart ] = useState( '' );
	const [ eventEnd, setEventEnd ] = useState( '' );
	const [ eventLocation, setEventLocation ] = useState( '' );
	const [ eventCategory, setEventCategory ] = useState( 'training' );
	const [ eventRecurring, setEventRecurring ] = useState( false );
	const [ eventRecurrenceType, setEventRecurrenceType ] = useState<
		'weekly' | 'biweekly'
	>( 'weekly' );
	const [ showStartPicker, setShowStartPicker ] = useState( false );
	const [ showEndPicker, setShowEndPicker ] = useState( false );

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

			// Create new event if inline form was filled
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

			await createGroup( {
				title: title.trim(),
				description: description.trim() || undefined,
				semester: semester.trim() || undefined,
				hasTournament,
				timeControl: hasTournament ? timeControl : undefined,
				eventId,
			} );
			onCreated();
			onClose();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to create group' );
			setSaving( false );
		}
	}

	function formatDateTime( iso: string ): string {
		if ( ! iso ) {
			return '';
		}
		const d = new Date( iso );
		return d.toLocaleString( 'sv-SE', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		} );
	}

	const eventOptions = [
		{ label: t.training.selectEvent, value: '' },
		...events.map( ( e ) => ( { label: e.title, value: String( e.id ) } ) ),
	];

	return (
		<Modal title={ t.training.createGroup } onRequestClose={ onClose }>
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
				label={ t.training.semester }
				value={ semester }
				onChange={ setSemester }
				placeholder="VT2026"
			/>
			<CheckboxControl
				label={ t.training.hasTournament }
				checked={ hasTournament }
				onChange={ setHasTournament }
			/>
			{ hasTournament && (
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
							padding: 8,
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
						<div style={ { display: 'flex', gap: 12 } }>
							<div style={ { flex: 1 } }>
								<label
									style={ {
										display: 'block',
										marginBottom: 4,
										fontWeight: 500,
										fontSize: '11px',
										textTransform: 'uppercase',
									} }
								>
									{ t.training.startDate } *
								</label>
								<Button
									variant="secondary"
									onClick={ () =>
										setShowStartPicker( ! showStartPicker )
									}
									style={ {
										width: '100%',
										justifyContent: 'flex-start',
									} }
								>
									{ eventStart
										? formatDateTime( eventStart )
										: '—' }
								</Button>
							</div>
							<div style={ { flex: 1 } }>
								<label
									style={ {
										display: 'block',
										marginBottom: 4,
										fontWeight: 500,
										fontSize: '11px',
										textTransform: 'uppercase',
									} }
								>
									{ t.training.endDate } *
								</label>
								<Button
									variant="secondary"
									onClick={ () =>
										setShowEndPicker( ! showEndPicker )
									}
									style={ {
										width: '100%',
										justifyContent: 'flex-start',
									} }
								>
									{ eventEnd
										? formatDateTime( eventEnd )
										: '—' }
								</Button>
							</div>
						</div>
						{ showStartPicker && (
							<DateTimePicker
								currentDate={ eventStart || undefined }
								onChange={ ( date ) => {
									if ( date ) {
										setEventStart( date );
									}
									setShowStartPicker( false );
								} }
								is12Hour={ false }
							/>
						) }
						{ showEndPicker && (
							<DateTimePicker
								currentDate={ eventEnd || undefined }
								onChange={ ( date ) => {
									if ( date ) {
										setEventEnd( date );
									}
									setShowEndPicker( false );
								} }
								is12Hour={ false }
							/>
						) }
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
						<div
							style={ { display: 'flex', gap: 12, marginTop: 8 } }
						>
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
