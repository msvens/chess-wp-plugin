import {
	TextControl,
	CheckboxControl,
	SelectControl,
	Button,
} from '@wordpress/components';
import type { Translations } from '../../shared';
import type { EventData } from '../types';
import { FlatpickrInput } from './FlatpickrInput';

// Controlled state for the event section, shared by the training and tournament
// flows. A `selectedEventId` links an existing event; `showNewEvent` (or
// create-only mode) authors a fresh one from the fields below.
export interface EventSectionValue {
	selectedEventId: string;
	showNewEvent: boolean;
	eventTitle: string;
	eventStart: string;
	eventEnd: string;
	eventLocation: string;
	eventCategory: string;
	eventRecurring: boolean;
	eventRecurrenceType: 'weekly' | 'biweekly';
	// Series end (date-only YYYY-MM-DD); empty = repeats with no end date.
	eventRecurrenceEnd: string;
}

export function emptyEventValue(
	overrides: Partial< EventSectionValue > = {}
): EventSectionValue {
	return {
		selectedEventId: '',
		showNewEvent: false,
		eventTitle: '',
		eventStart: '',
		eventEnd: '',
		eventLocation: '',
		eventCategory: 'training',
		eventRecurring: false,
		eventRecurrenceType: 'weekly',
		eventRecurrenceEnd: '',
		...overrides,
	};
}

interface EventSectionProps {
	t: Translations;
	// 'select-or-create' (training): pick an existing event or create one.
	// 'create-only' (tournament): always author a fresh projected event.
	mode: 'select-or-create' | 'create-only';
	showRecurrence: boolean;
	events: EventData[];
	value: EventSectionValue;
	onChange: ( value: EventSectionValue ) => void;
	// The entity's title — placeholder/default for a new event.
	entityTitle: string;
}

export function EventSection( {
	t,
	mode,
	showRecurrence,
	events,
	value,
	onChange,
	entityTitle,
}: EventSectionProps ) {
	const set = ( patch: Partial< EventSectionValue > ) =>
		onChange( { ...value, ...patch } );

	const isCreateOnly = mode === 'create-only';
	const showForm = isCreateOnly || value.showNewEvent;

	const eventOptions = [
		{ label: t.training.selectEvent, value: '' },
		...events.map( ( e ) => ( { label: e.title, value: String( e.id ) } ) ),
	];

	return (
		<div
			style={ {
				marginTop: 16,
				padding: 12,
				background: '#f0f0f0',
				borderRadius: 4,
			} }
		>
			{ ! isCreateOnly && (
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
								value.showNewEvent ? '' : value.selectedEventId
							}
							options={ eventOptions }
							onChange={ ( val ) =>
								set( {
									selectedEventId: val,
									showNewEvent: false,
								} )
							}
							disabled={ value.showNewEvent }
						/>
					</div>
					<Button
						variant={
							value.showNewEvent ? 'secondary' : 'tertiary'
						}
						onClick={ () => {
							const next = ! value.showNewEvent;
							set( {
								showNewEvent: next,
								selectedEventId: next
									? ''
									: value.selectedEventId,
								eventTitle: next
									? entityTitle
									: value.eventTitle,
							} );
						} }
						style={ { marginBottom: 8 } }
					>
						{ value.showNewEvent
							? t.common.cancel
							: `+ ${ t.training.newEvent }` }
					</Button>
				</div>
			) }

			{ showForm && (
				<div
					style={ {
						padding: isCreateOnly ? 0 : 12,
						background: isCreateOnly ? 'transparent' : '#fff',
						borderRadius: 4,
					} }
				>
					{ ! isCreateOnly && (
						<TextControl
							label={
								t.training.event + ' — ' + t.training.groupName
							}
							value={ value.eventTitle }
							onChange={ ( v ) => set( { eventTitle: v } ) }
							placeholder={ entityTitle }
						/>
					) }
					<div className="rc-date-fields">
						<div className="rc-date-field">
							<label>{ t.training.startDate } *</label>
							<FlatpickrInput
								value={ value.eventStart }
								onChange={ ( v ) => set( { eventStart: v } ) }
								required
							/>
						</div>
						<div className="rc-date-field">
							<label>{ t.training.endDate } *</label>
							<FlatpickrInput
								value={ value.eventEnd }
								onChange={ ( v ) => set( { eventEnd: v } ) }
								required
							/>
						</div>
					</div>
					{ showRecurrence && (
						<>
							<CheckboxControl
								label={ t.calendar.recurring }
								checked={ value.eventRecurring }
								onChange={ ( v ) =>
									set( { eventRecurring: v } )
								}
							/>
							{ value.eventRecurring && (
								<>
									<SelectControl
										label={ t.calendar.recurring }
										value={ value.eventRecurrenceType }
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
											set( {
												eventRecurrenceType: v as
													| 'weekly'
													| 'biweekly',
											} )
										}
									/>
									<div style={ { marginBottom: 8 } }>
										<label
											style={ {
												display: 'block',
												marginBottom: 4,
											} }
										>
											{ t.calendar.repeatsUntil }
										</label>
										<FlatpickrInput
											value={ value.eventRecurrenceEnd }
											onChange={ ( v ) =>
												set( {
													eventRecurrenceEnd: v,
												} )
											}
											dateOnly
											placeholder={ t.calendar.noEndDate }
										/>
									</div>
								</>
							) }
						</>
					) }
					<div style={ { display: 'flex', gap: 12 } }>
						<div style={ { flex: 1 } }>
							<TextControl
								label={ t.training.location }
								value={ value.eventLocation }
								onChange={ ( v ) =>
									set( { eventLocation: v } )
								}
							/>
						</div>
						<div style={ { flex: 1 } }>
							<SelectControl
								label={ t.calendar.eventCategories.training }
								value={ value.eventCategory }
								options={ Object.entries(
									t.calendar.eventCategories
								).map( ( [ val, label ] ) => ( {
									label,
									value: val,
								} ) ) }
								onChange={ ( v ) =>
									set( { eventCategory: v } )
								}
							/>
						</div>
					</div>
				</div>
			) }
		</div>
	);
}
