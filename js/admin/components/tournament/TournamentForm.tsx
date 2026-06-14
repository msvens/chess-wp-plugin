import { useState, useEffect, useRef } from '@wordpress/element';
import {
	TextControl,
	TextareaControl,
	SelectControl,
	CheckboxControl,
	Button,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../../shared';
import type {
	TournamentCategory,
	TournamentStatusChoice,
	CreateTournamentData,
} from '../../types';
import { fetchSsfTournamentForGroup, fetchSsfRoundResults } from '../../api';
import {
	ssfFindGroup,
	isSsfTeamType,
	parseSsfTimeControl,
} from '../../../shared/ssfTypes';
import { deriveStatus } from '../../../shared/deriveStatus';
import {
	EventSection,
	emptyEventValue,
	type EventSectionValue,
} from '../EventSection';

// A labelled read-only value (SSF tournaments mirror their data from SSF).
function ReadOnlyField( { label, value }: { label: string; value: string } ) {
	return (
		<div style={ { marginBottom: 12 } }>
			<div
				style={ {
					fontSize: 11,
					textTransform: 'uppercase',
					letterSpacing: '0.05em',
					color: '#757575',
					marginBottom: 2,
				} }
			>
				{ label }
			</div>
			<div>{ value || '—' }</div>
		</div>
	);
}

// Whole-day span between two date strings (date part only). 0 if unparseable.
function daysBetween( a: string, b: string ): number {
	const re = /^(\d{4})-(\d{2})-(\d{2})/;
	const ma = a.match( re );
	const mb = b.match( re );
	if ( ! ma || ! mb ) {
		return 0;
	}
	const da = new Date( +ma[ 1 ], +ma[ 2 ] - 1, +ma[ 3 ] );
	const db = new Date( +mb[ 1 ], +mb[ 2 ] - 1, +mb[ 3 ] );
	return Math.round( ( db.getTime() - da.getTime() ) / 86400000 );
}

export interface TournamentFormValues {
	title: string;
	description: string;
	category: TournamentCategory;
	status: TournamentStatusChoice;
	timeControl: 'classical' | 'rapid' | 'blitz';
	ssfGroupId: string;
	ssfTournamentId: number;
	ssfTournamentName: string;
	startDate: string;
	endDate: string;
	externalLink: string;
	showParticipants: boolean;
	showStandings: boolean;
	ssfHasResults: boolean;
	addToCalendar: boolean;
	eventStart: string;
	eventEnd: string;
	eventLocation: string;
	eventCategory: string;
	eventRecurring: boolean;
	eventRecurrenceType: 'weekly' | 'biweekly';
	eventRecurrenceEnd: string;
}

interface TournamentFormProps {
	t: Translations;
	initial?: Partial< TournamentFormValues >;
	// Whether the tournament already has round results — used to preview the
	// derived 'Automatic' status (local tournaments; SSF uses the fetched flag).
	initialHasResults?: boolean;
	submitLabel: string;
	saving: boolean;
	error: string | null;
	onCancel: () => void;
	onSubmit: ( data: CreateTournamentData ) => void;
}

const DEFAULTS: TournamentFormValues = {
	title: '',
	description: '',
	category: 'mixed',
	status: 'auto',
	timeControl: 'classical',
	ssfGroupId: '',
	ssfTournamentId: 0,
	ssfTournamentName: '',
	startDate: '',
	endDate: '',
	externalLink: '',
	showParticipants: true,
	showStandings: true,
	ssfHasResults: false,
	addToCalendar: false,
	eventStart: '',
	eventEnd: '',
	eventLocation: '',
	eventCategory: 'tournament',
	eventRecurring: false,
	eventRecurrenceType: 'weekly',
	eventRecurrenceEnd: '',
};

export function TournamentForm( {
	t,
	initial,
	initialHasResults,
	submitLabel,
	saving,
	error,
	onCancel,
	onSubmit,
}: TournamentFormProps ) {
	const init = { ...DEFAULTS, ...initial };
	const [ title, setTitle ] = useState( init.title );
	const [ description, setDescription ] = useState( init.description );
	const [ category, setCategory ] = useState< TournamentCategory >(
		init.category
	);
	const [ status, setStatus ] = useState< TournamentStatusChoice >(
		init.status
	);
	const [ timeControl, setTimeControl ] = useState< typeof init.timeControl >(
		init.timeControl
	);
	const [ ssfGroupId, setSsfGroupId ] = useState( init.ssfGroupId );
	const [ ssfTournamentId, setSsfTournamentId ] = useState(
		init.ssfTournamentId
	);
	const [ ssfTournamentName, setSsfTournamentName ] = useState(
		init.ssfTournamentName
	);
	const [ startDate, setStartDate ] = useState( init.startDate );
	const [ endDate, setEndDate ] = useState( init.endDate );
	const [ externalLink, setExternalLink ] = useState( init.externalLink );
	const [ showParticipants, setShowParticipants ] = useState(
		init.showParticipants
	);
	const [ showStandings, setShowStandings ] = useState( init.showStandings );
	const [ ssfHasResults, setSsfHasResults ] = useState( init.ssfHasResults );
	const [ addToCalendar, setAddToCalendar ] = useState( init.addToCalendar );
	const [ eventValue, setEventValue ] = useState< EventSectionValue >(
		emptyEventValue( {
			eventStart: init.eventStart,
			eventEnd: init.eventEnd,
			eventLocation: init.eventLocation,
			eventCategory: init.eventCategory,
			eventRecurring: init.eventRecurring,
			eventRecurrenceType: init.eventRecurrenceType,
			eventRecurrenceEnd: init.eventRecurrenceEnd,
		} )
	);

	const [ ssfFetching, setSsfFetching ] = useState( false );
	const [ ssfNote, setSsfNote ] = useState< string | null >( null );
	// SSF lifecycle state (1=registration, 2=started, 3=finished) from the last
	// fetch — drives the status preview for SSF tournaments.
	const [ ssfState, setSsfState ] = useState< number | undefined >(
		undefined
	);
	// Guards the auto-fetch effect from re-fetching an unchanged group id.
	const lastFetchedRef = useRef( Number( init.ssfGroupId ) || 0 );

	const ssfId = Number( ssfGroupId );
	const isSsfBacked = ssfId > 0;

	// A home-grown tournament has no own dates — its lifecycle dates come from
	// the linked event (start; recurring → series end, else occurrence end). SSF
	// tournaments keep their own read-only dates.
	const effectiveStart = isSsfBacked
		? startDate
		: addToCalendar
		? eventValue.eventStart
		: '';
	const effectiveEnd = isSsfBacked
		? endDate
		: addToCalendar
		? eventValue.eventRecurring
			? eventValue.eventRecurrenceEnd
			: eventValue.eventEnd
		: '';

	// Live preview of what 'Automatic' resolves to. SSF tournaments preview from
	// the fetched SSF state (mirrors the server); local ones from the dates.
	const previewStatus =
		status === 'auto'
			? deriveStatus(
					effectiveStart,
					effectiveEnd,
					isSsfBacked ? ssfHasResults : !! initialHasResults,
					isSsfBacked ? ssfState : undefined
			  )
			: null;

	const timeControlLabel =
		timeControl === 'rapid'
			? t.training.rapid
			: timeControl === 'blitz'
			? t.training.blitz
			: t.training.classical;

	async function handleSsfFetch() {
		if ( ! isSsfBacked ) {
			return;
		}
		lastFetchedRef.current = ssfId;
		setSsfFetching( true );
		setSsfNote( null );
		try {
			const [ tournament, rounds ] = await Promise.all( [
				fetchSsfTournamentForGroup( ssfId ),
				fetchSsfRoundResults( ssfId ).catch( () => [] ),
			] );
			const group = ssfFindGroup( tournament, ssfId );
			// Tournament-level dates: a group's own start can be a registration
			// window weeks before play (status uses the SSF state, not these).
			const start = tournament.start || group?.start || '';
			const end = tournament.end || group?.end || '';
			const tname = tournament.name || '';
			const gname = group?.name || tname;
			const isTeam = isSsfTeamType( tournament.type );

			// SSF tournaments mirror SSF: title = group name, dates/time control/
			// link derived. (All read-only in the form — set on every fetch.)
			setTitle( gname );
			setSsfTournamentName( tname );
			setSsfTournamentId( tournament.id );
			setSsfState( tournament.state );
			if ( start ) {
				setStartDate( start );
			}
			if ( end ) {
				setEndDate( end );
			}
			setTimeControl( parseSsfTimeControl( tournament.thinkingTime ) );
			if ( tournament.id ) {
				setExternalLink(
					`https://chess.msvens.com/results/${ tournament.id }/${ ssfId }`
				);
			}
			setSsfHasResults( Array.isArray( rounds ) && rounds.length > 0 );

			if ( isTeam ) {
				setSsfNote( t.tournament.ssfTeamNotice );
			} else {
				const roundsN = group?.nrofrounds;
				const roundsPart = roundsN
					? ` · ${ roundsN } ${ t.training.round.toLowerCase() }`
					: '';
				setSsfNote(
					`${ gname || tname } · ${ start } – ${ end }${ roundsPart }`
				);
			}
		} catch {
			setSsfNote( t.tournament.ssfFetchError );
		} finally {
			setSsfFetching( false );
		}
	}

	// Keep a ref to the latest fetch closure so the debounce effect below can
	// call it without re-subscribing on every render.
	const fetchRef = useRef( handleSsfFetch );
	useEffect( () => {
		fetchRef.current = handleSsfFetch;
	} );

	// Auto-fetch when the SSF Group ID changes to a new value (debounced), so you
	// don't have to click Fetch. Safe because the SSF fields are read-only
	// mirrors — a re-fetch is expected to overwrite them.
	useEffect( () => {
		if ( ! isSsfBacked || ssfId === lastFetchedRef.current ) {
			return;
		}
		const timer = setTimeout( () => fetchRef.current(), 600 );
		return () => clearTimeout( timer );
	}, [ ssfId, isSsfBacked ] );

	function handleSubmit() {
		if ( ! title.trim() ) {
			return;
		}
		onSubmit( {
			title: title.trim(),
			description: description.trim() || undefined,
			category,
			status,
			timeControl,
			ssfGroupId: isSsfBacked ? ssfId : 0,
			ssfTournamentId: isSsfBacked ? ssfTournamentId : 0,
			ssfTournamentName: isSsfBacked ? ssfTournamentName : '',
			startDate: effectiveStart,
			endDate: effectiveEnd,
			externalLink: externalLink.trim(),
			showParticipants,
			showStandings,
			ssfHasResults: isSsfBacked ? ssfHasResults : false,
			calendarEvent: addToCalendar
				? {
						startDate: eventValue.eventStart,
						endDate: eventValue.eventEnd,
						location: eventValue.eventLocation.trim(),
						category: eventValue.eventCategory,
						isRecurring: eventValue.eventRecurring,
						recurrenceType: eventValue.eventRecurrenceType,
						recurrenceEndDate: eventValue.eventRecurring
							? eventValue.eventRecurrenceEnd
							: '',
				  }
				: null,
		} );
	}

	return (
		<>
			{ /* SSF link first — it's the earliest decision and drives the
			   title / dates / link prefill below. */ }
			<TextControl
				label={ t.tournament.ssfBacked }
				value={ ssfGroupId }
				onChange={ setSsfGroupId }
				type="number"
				help={ t.tournament.ssfBackedHint }
			/>
			{ isSsfBacked && (
				<div style={ { marginBottom: 12 } }>
					<Button
						variant="secondary"
						onClick={ handleSsfFetch }
						isBusy={ ssfFetching }
						disabled={ ssfFetching }
						size="compact"
					>
						{ t.tournament.refreshFromSsf }
					</Button>
					{ ssfNote && (
						<Text
							style={ {
								display: 'block',
								marginTop: 6,
								fontStyle: 'italic',
							} }
						>
							{ ssfNote }
						</Text>
					) }
				</div>
			) }

			{ isSsfBacked ? (
				<>
					<ReadOnlyField
						label={ t.tournament.ssfGroupName }
						value={ title }
					/>
					{ ssfTournamentName && ssfTournamentName !== title && (
						<ReadOnlyField
							label={ t.tournament.ssfParentTournament }
							value={ ssfTournamentName }
						/>
					) }
				</>
			) : (
				<TextControl
					label={ t.tournament.tournamentName }
					value={ title }
					onChange={ setTitle }
					required
				/>
			) }

			<TextareaControl
				label={ t.training.description }
				value={ description }
				onChange={ setDescription }
			/>

			<div style={ { display: 'flex', gap: 12 } }>
				<div style={ { flex: 1 } }>
					<SelectControl
						label={ t.tournament.category }
						value={ category }
						options={ [
							{
								label: t.tournament.categories.junior,
								value: 'junior',
							},
							{
								label: t.tournament.categories.youth,
								value: 'youth',
							},
							{
								label: t.tournament.categories.adult,
								value: 'adult',
							},
							{
								label: t.tournament.categories.senior,
								value: 'senior',
							},
							{
								label: t.tournament.categories.mixed,
								value: 'mixed',
							},
						] }
						onChange={ ( v ) =>
							setCategory( v as TournamentCategory )
						}
					/>
				</div>
				<div style={ { flex: 1 } }>
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
							{
								label: t.tournament.statuses.planned,
								value: 'planned',
							},
							{
								label: t.tournament.statuses.active,
								value: 'active',
							},
							{
								label: t.tournament.statuses.completed,
								value: 'completed',
							},
						] }
						onChange={ ( v ) =>
							setStatus( v as TournamentStatusChoice )
						}
					/>
				</div>
				{ ! isSsfBacked && (
					<div style={ { flex: 1 } }>
						<SelectControl
							label={ t.training.timeControl }
							value={ timeControl }
							options={ [
								{
									label: t.training.classical,
									value: 'classical',
								},
								{ label: t.training.rapid, value: 'rapid' },
								{ label: t.training.blitz, value: 'blitz' },
							] }
							onChange={ ( v ) =>
								setTimeControl( v as typeof init.timeControl )
							}
						/>
					</div>
				) }
			</div>

			{ isSsfBacked ? (
				<div className="rc-date-fields">
					<ReadOnlyField
						label={ t.training.timeControl }
						value={ timeControlLabel }
					/>
					<ReadOnlyField
						label={ t.tournament.startDate }
						value={ startDate }
					/>
					<ReadOnlyField
						label={ t.tournament.endDate }
						value={ endDate }
					/>
				</div>
			) : (
				<>
					{ /* Home-grown tournaments take their dates from the linked
					   calendar event below (Add to calendar) — no separate date
					   fields. Without an event the tournament has no dates and
					   you set its status manually. */ }
					<TextControl
						label={ t.tournament.externalLink }
						value={ externalLink }
						onChange={ setExternalLink }
						type="url"
					/>

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
				</>
			) }

			<CheckboxControl
				label={ t.tournament.addToCalendar }
				checked={ addToCalendar }
				onChange={ ( checked ) => {
					setAddToCalendar( checked );
					// Prefill the event when first enabling. For an SSF tournament
					// we only know the day span: ≤ 7 days → one multi-day event;
					// longer → a weekly-recurrence guess (SSF gives no time, so
					// default 18:00–20:00) you then adjust. Home-grown starts blank.
					if (
						! checked ||
						eventValue.eventStart ||
						eventValue.eventEnd
					) {
						return;
					}
					const day = startDate.slice( 0, 10 );
					if (
						isSsfBacked &&
						daysBetween( startDate, endDate ) > 7
					) {
						setEventValue( {
							...eventValue,
							eventStart: day ? `${ day }T18:00:00` : '',
							eventEnd: day ? `${ day }T20:00:00` : '',
							eventRecurring: true,
							eventRecurrenceType: 'weekly',
							eventRecurrenceEnd: endDate.slice( 0, 10 ),
							eventCategory: 'tournament',
						} );
					} else {
						setEventValue( {
							...eventValue,
							eventStart: startDate,
							eventEnd: endDate,
							eventCategory: 'tournament',
						} );
					}
				} }
				help={ t.tournament.addToCalendarHint }
			/>
			{ addToCalendar && (
				<EventSection
					t={ t }
					mode="create-only"
					showRecurrence={ true }
					events={ [] }
					value={ eventValue }
					onChange={ setEventValue }
					entityTitle={ title }
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
				<Button variant="tertiary" onClick={ onCancel }>
					{ t.common.cancel }
				</Button>
				<Button
					variant="primary"
					onClick={ handleSubmit }
					isBusy={ saving }
					disabled={ ! title.trim() || saving }
				>
					{ submitLabel }
				</Button>
			</div>
		</>
	);
}
