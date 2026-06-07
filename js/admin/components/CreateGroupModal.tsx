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
import type { EventData, Tournament } from '../types';
import {
	createGroup,
	fetchEvents,
	createEvent,
	fetchTournaments,
} from '../api';
import { FlatpickrInput } from './FlatpickrInput';

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
	const [ audience, setAudience ] = useState< 'junior' | 'adult' | 'mixed' >(
		'mixed'
	);
	const [ trainers, setTrainers ] = useState( '' );
	const [ contact, setContact ] = useState( '' );
	const [ linkedTournamentId, setLinkedTournamentId ] = useState( '' );
	const [ showParticipants, setShowParticipants ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const [ events, setEvents ] = useState< EventData[] >( [] );
	const [ tournaments, setTournaments ] = useState< Tournament[] >( [] );
	const [ selectedEventId, setSelectedEventId ] = useState( '' );
	const [ showNewEvent, setShowNewEvent ] = useState( false );

	const [ eventTitle, setEventTitle ] = useState( '' );
	const [ eventStart, setEventStart ] = useState( '' );
	const [ eventEnd, setEventEnd ] = useState( '' );
	const [ eventLocation, setEventLocation ] = useState( '' );
	const [ eventCategory, setEventCategory ] = useState( 'training' );
	const [ eventRecurring, setEventRecurring ] = useState( false );
	const [ eventRecurrenceType, setEventRecurrenceType ] = useState<
		'weekly' | 'biweekly'
	>( 'weekly' );

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

			await createGroup( {
				title: title.trim(),
				description: description.trim() || undefined,
				semester: semester.trim() || undefined,
				audience,
				eventId,
				trainers: trainers.trim() || undefined,
				contact: contact.trim() || undefined,
				linkedTournamentId: linkedTournamentId
					? Number( linkedTournamentId )
					: undefined,
				showParticipants,
			} );

			onCreated();
			onClose();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to create group' );
			setSaving( false );
		}
	}

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
			title={ t.training.createGroup }
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

			<CheckboxControl
				label={ t.training.showParticipants }
				checked={ showParticipants }
				onChange={ setShowParticipants }
			/>

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
