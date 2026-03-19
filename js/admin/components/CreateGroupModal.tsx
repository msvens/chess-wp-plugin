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
import type { EventData, GroupType } from '../types';
import {
	createGroup,
	fetchEvents,
	createEvent,
	addParticipant,
	fetchSsfTournamentGroup,
	fetchSsfTournamentResults,
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
	const [ groupType, setGroupType ] = useState< GroupType >( 'training' );
	const [ timeControl, setTimeControl ] = useState<
		'classical' | 'rapid' | 'blitz'
	>( 'classical' );
	const [ trainers, setTrainers ] = useState( '' );
	const [ contact, setContact ] = useState( '' );
	const [ tournamentLink, setTournamentLink ] = useState( '' );
	const [ showParticipants, setShowParticipants ] = useState( true );
	const [ showStandings, setShowStandings ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	// SSF autofill state
	const [ ssfGroupId, setSsfGroupId ] = useState( '' );
	const [ ssfFetching, setSsfFetching ] = useState( false );
	const [ ssfError, setSsfError ] = useState< string | null >( null );
	const [ ssfPreview, setSsfPreview ] = useState< {
		name: string;
		participants: { ssfId: number; name: string }[];
		tournamentLink: string;
	} | null >( null );
	const [ ssfParticipants, setSsfParticipants ] = useState<
		{ ssfId: number; name: string }[]
	>( [] );

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

	useEffect( () => {
		fetchEvents()
			.then( setEvents )
			.catch( () => {} );
	}, [] );

	async function handleSsfFetch() {
		const id = Number( ssfGroupId );
		if ( ! id || id <= 0 ) {
			return;
		}
		setSsfFetching( true );
		setSsfError( null );
		setSsfPreview( null );
		try {
			const [ tournamentData, resultsData ] = await Promise.all( [
				fetchSsfTournamentGroup( id ),
				fetchSsfTournamentResults( id ),
			] );

			// Extract group name + tournament ID from typed response
			let groupName = '';
			const tournamentId = tournamentData.id || 0;
			if ( tournamentData.rootClasses ) {
				for ( const rc of tournamentData.rootClasses ) {
					for ( const g of rc.groups ) {
						if ( g.id === id ) {
							groupName = g.name || '';
						}
					}
				}
			}
			if ( ! groupName && tournamentData.name ) {
				groupName = tournamentData.name;
			}

			// Build results link
			const resultsLink =
				tournamentId > 0
					? `https://chess.msvens.com/results/${ tournamentId }/${ id }`
					: '';

			// Extract participants from typed results
			const participants: { ssfId: number; name: string }[] = [];
			if ( Array.isArray( resultsData ) ) {
				for ( const entry of resultsData ) {
					const pi = entry.playerInfo;
					if ( pi?.id ) {
						participants.push( {
							ssfId: pi.id,
							name: `${ pi.firstName || '' } ${
								pi.lastName || ''
							}`.trim(),
						} );
					}
				}
			}

			setSsfPreview( {
				name: groupName,
				participants,
				tournamentLink: resultsLink,
			} );
		} catch {
			setSsfError( t.training.ssfFetchError );
		} finally {
			setSsfFetching( false );
		}
	}

	function applySsfData() {
		if ( ! ssfPreview ) {
			return;
		}
		if ( ssfPreview.name ) {
			setTitle( ssfPreview.name );
		}
		if ( ssfPreview.tournamentLink ) {
			setTournamentLink( ssfPreview.tournamentLink );
		}
		setGroupType( 'tournament' );
		setSsfParticipants( ssfPreview.participants );
		setSsfPreview( null );
	}

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

			const hasTournament = groupType !== 'training';
			const created = await createGroup( {
				title: title.trim(),
				description: description.trim() || undefined,
				semester: semester.trim() || undefined,
				groupType,
				timeControl: hasTournament ? timeControl : undefined,
				eventId,
				ssfGroupId: ssfGroupId ? Number( ssfGroupId ) : undefined,
				trainers: trainers.trim() || undefined,
				contact: contact.trim() || undefined,
				tournamentLink: tournamentLink.trim() || undefined,
				showParticipants,
				showStandings,
			} );

			// Add SSF participants after group creation
			if ( ssfParticipants.length > 0 ) {
				for ( const p of ssfParticipants ) {
					await addParticipant( created.id, {
						id: `ssf-${ p.ssfId }`,
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

	const eventOptions = [
		{ label: t.training.selectEvent, value: '' },
		...events.map( ( e ) => ( { label: e.title, value: String( e.id ) } ) ),
	];

	return (
		<Modal
			title={ t.training.createGroup }
			onRequestClose={ onClose }
			className="rc-wide-modal"
		>
			{ /* SSF Autofill section */ }
			<div
				style={ {
					marginBottom: 16,
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
					} }
				>
					<div style={ { flex: 1 } }>
						<TextControl
							label={ t.training.ssfTournamentGroupId }
							value={ ssfGroupId }
							onChange={ setSsfGroupId }
							type="number"
						/>
					</div>
					<Button
						variant="secondary"
						onClick={ handleSsfFetch }
						isBusy={ ssfFetching }
						disabled={
							ssfFetching ||
							! ssfGroupId ||
							Number( ssfGroupId ) <= 0
						}
						style={ { marginBottom: 8 } }
					>
						{ ssfFetching
							? t.training.ssfFetching
							: t.training.fetchFromSsf }
					</Button>
				</div>
				{ ssfError && (
					<Text
						style={ {
							color: '#cc1818',
							display: 'block',
							marginTop: 4,
						} }
					>
						{ ssfError }
					</Text>
				) }
				{ ssfPreview && (
					<div
						style={ {
							marginTop: 8,
							padding: 8,
							background: '#fff',
							borderRadius: 4,
						} }
					>
						<Text
							style={ {
								display: 'block',
								fontWeight: 600,
								marginBottom: 4,
							} }
						>
							{ ssfPreview.name || '(no name)' }
						</Text>
						<Text style={ { display: 'block', marginBottom: 8 } }>
							{ t.training.participants }:{ ' ' }
							{ ssfPreview.participants.length }
						</Text>
						<div
							style={ {
								display: 'flex',
								gap: 8,
							} }
						>
							<Button
								variant="primary"
								size="small"
								onClick={ applySsfData }
							>
								{ t.training.ssfPreviewConfirm }
							</Button>
							<Button
								variant="tertiary"
								size="small"
								onClick={ () => setSsfPreview( null ) }
							>
								{ t.common.cancel }
							</Button>
						</div>
					</div>
				) }
				{ ssfParticipants.length > 0 && ! ssfPreview && (
					<Text
						style={ {
							display: 'block',
							marginTop: 4,
							color: '#1e7e34',
						} }
					>
						{ t.training.participants }: { ssfParticipants.length }
					</Text>
				) }
			</div>

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
