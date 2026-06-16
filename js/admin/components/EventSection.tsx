import {
	TextControl,
	CheckboxControl,
	SelectControl,
} from '@wordpress/components';
import type { Translations } from '../../shared';
import type { CalendarEventPayload } from '../types';
import { FlatpickrInput } from './FlatpickrInput';

// Controlled state for the event section, shared by the training and tournament
// flows. Both author a single owner-projected event from these fields; the
// owning form gates visibility with its own "Add to calendar" checkbox.
export interface EventSectionValue {
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

// Map the section's form state to the `calendarEvent` payload the REST API
// reconciles into the owner-projected event.
export function eventSectionToPayload(
	value: EventSectionValue
): CalendarEventPayload {
	return {
		startDate: value.eventStart,
		endDate: value.eventEnd,
		location: value.eventLocation.trim(),
		category: value.eventCategory,
		isRecurring: value.eventRecurring,
		recurrenceType: value.eventRecurrenceType,
		recurrenceEndDate: value.eventRecurring ? value.eventRecurrenceEnd : '',
	};
}

interface EventSectionProps {
	t: Translations;
	showRecurrence: boolean;
	value: EventSectionValue;
	onChange: ( value: EventSectionValue ) => void;
}

export function EventSection( {
	t,
	showRecurrence,
	value,
	onChange,
}: EventSectionProps ) {
	const set = ( patch: Partial< EventSectionValue > ) => {
		const next = { ...value, ...patch };
		// When recurring, each occurrence ends on its start day — force the end
		// date onto the start day (keeping the end time). The series length is
		// controlled solely by "Repeats until". Matches the server invariant.
		if ( next.eventRecurring && next.eventStart && next.eventEnd ) {
			next.eventEnd =
				next.eventStart.slice( 0, 10 ) + next.eventEnd.slice( 10 );
		}
		onChange( next );
	};

	return (
		<div
			style={ {
				marginTop: 16,
				padding: 12,
				background: '#f0f0f0',
				borderRadius: 4,
			} }
		>
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
						onChange={ ( v ) => set( { eventRecurring: v } ) }
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
										set( { eventRecurrenceEnd: v } )
									}
									dateOnly
									clearable
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
						onChange={ ( v ) => set( { eventLocation: v } ) }
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
						onChange={ ( v ) => set( { eventCategory: v } ) }
					/>
				</div>
			</div>
		</div>
	);
}
