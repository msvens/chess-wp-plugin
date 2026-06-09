import { useState } from '@wordpress/element';
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
	TournamentStatus,
	TournamentStatusChoice,
	CreateTournamentData,
} from '../../types';
import { fetchSsfGroup, fetchSsfRoundResults } from '../../api';
import { FlatpickrInput } from '../FlatpickrInput';

// Client-side mirror of the server's derive_status (TournamentApi.php) so the
// Edit form can preview what 'Automatic' will resolve to. Local-midnight compares.
function parseLocalDate( value: string ): Date | null {
	const m = value.slice( 0, 10 ).match( /^(\d{4})-(\d{2})-(\d{2})$/ );
	return m
		? new Date( Number( m[ 1 ] ), Number( m[ 2 ] ) - 1, Number( m[ 3 ] ) )
		: null;
}

function deriveStatus(
	start: string,
	end: string,
	hasResults: boolean
): TournamentStatus {
	const today = new Date();
	today.setHours( 0, 0, 0, 0 );
	const endDate = parseLocalDate( end );
	if ( endDate && today > endDate ) {
		return 'completed';
	}
	const startDate = parseLocalDate( start );
	if ( ! hasResults && ( ! startDate || today < startDate ) ) {
		return 'planned';
	}
	return 'active';
}

export interface TournamentFormValues {
	title: string;
	description: string;
	category: TournamentCategory;
	status: TournamentStatusChoice;
	timeControl: 'classical' | 'rapid' | 'blitz';
	ssfGroupId: string;
	startDate: string;
	endDate: string;
	externalLink: string;
	showParticipants: boolean;
	showStandings: boolean;
	ssfHasResults: boolean;
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
	startDate: '',
	endDate: '',
	externalLink: '',
	showParticipants: true,
	showStandings: true,
	ssfHasResults: false,
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
	const [ startDate, setStartDate ] = useState( init.startDate );
	const [ endDate, setEndDate ] = useState( init.endDate );
	const [ externalLink, setExternalLink ] = useState( init.externalLink );
	const [ showParticipants, setShowParticipants ] = useState(
		init.showParticipants
	);
	const [ showStandings, setShowStandings ] = useState( init.showStandings );
	const [ ssfHasResults, setSsfHasResults ] = useState( init.ssfHasResults );

	const [ ssfFetching, setSsfFetching ] = useState( false );
	const [ ssfNote, setSsfNote ] = useState< string | null >( null );

	const ssfId = Number( ssfGroupId );
	const isSsfBacked = ssfId > 0;

	// Live preview of what 'Automatic' resolves to, from the current dates.
	const previewStatus =
		status === 'auto'
			? deriveStatus(
					startDate,
					endDate,
					isSsfBacked ? ssfHasResults : !! initialHasResults
			  )
			: null;

	async function handleSsfFetch() {
		if ( ! isSsfBacked ) {
			return;
		}
		setSsfFetching( true );
		setSsfNote( null );
		try {
			const [ group, rounds ] = await Promise.all( [
				fetchSsfGroup( ssfId ),
				fetchSsfRoundResults( ssfId ).catch( () => [] ),
			] );
			if ( group.start ) {
				setStartDate( group.start );
			}
			if ( group.end ) {
				setEndDate( group.end );
			}
			setSsfHasResults( Array.isArray( rounds ) && rounds.length > 0 );
			setSsfNote(
				group.name
					? `${ group.name } · ${ group.start } – ${ group.end } · ${
							group.nrofrounds
					  } ${ t.training.round.toLowerCase() }`
					: `${ group.start } – ${ group.end }`
			);
		} catch {
			setSsfNote( t.tournament.ssfFetchError );
		} finally {
			setSsfFetching( false );
		}
	}

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
			startDate,
			endDate,
			externalLink: externalLink.trim(),
			showParticipants,
			showStandings,
			ssfHasResults: isSsfBacked ? ssfHasResults : false,
		} );
	}

	return (
		<>
			<TextControl
				label={ t.tournament.tournamentName }
				value={ title }
				onChange={ setTitle }
				required
			/>
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
				<div style={ { flex: 1 } }>
					<SelectControl
						label={ t.training.timeControl }
						value={ timeControl }
						options={ [
							{ label: t.training.classical, value: 'classical' },
							{ label: t.training.rapid, value: 'rapid' },
							{ label: t.training.blitz, value: 'blitz' },
						] }
						onChange={ ( v ) =>
							setTimeControl( v as typeof init.timeControl )
						}
					/>
				</div>
			</div>

			<div className="rc-date-fields">
				<div className="rc-date-field">
					<label>{ t.tournament.startDate }</label>
					<FlatpickrInput
						value={ startDate }
						onChange={ setStartDate }
					/>
				</div>
				<div className="rc-date-field">
					<label>{ t.tournament.endDate }</label>
					<FlatpickrInput value={ endDate } onChange={ setEndDate } />
				</div>
			</div>

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
