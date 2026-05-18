import { useState } from '@wordpress/element';
import {
	Modal,
	TextControl,
	TextareaControl,
	SelectControl,
	CheckboxControl,
	Button,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../../shared';
import type {
	Tournament,
	TournamentCategory,
	TournamentStatus,
} from '../../types';
import { createTournament } from '../../api';
import { FlatpickrInput } from '../FlatpickrInput';

interface CreateTournamentModalProps {
	t: Translations;
	onClose: () => void;
	onCreated: ( tournament: Tournament ) => void;
}

export function CreateTournamentModal( {
	t,
	onClose,
	onCreated,
}: CreateTournamentModalProps ) {
	const [ title, setTitle ] = useState( '' );
	const [ description, setDescription ] = useState( '' );
	const [ category, setCategory ] = useState< TournamentCategory >( 'mixed' );
	const [ status, setStatus ] = useState< TournamentStatus >( 'planned' );
	const [ timeControl, setTimeControl ] = useState<
		'classical' | 'rapid' | 'blitz'
	>( 'classical' );
	const [ ssfGroupId, setSsfGroupId ] = useState( '' );
	const [ startDate, setStartDate ] = useState( '' );
	const [ endDate, setEndDate ] = useState( '' );
	const [ externalLink, setExternalLink ] = useState( '' );
	const [ showParticipants, setShowParticipants ] = useState( true );
	const [ showStandings, setShowStandings ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const isSsfBacked = Number( ssfGroupId ) > 0;

	async function handleSave() {
		if ( ! title.trim() ) {
			return;
		}
		setSaving( true );
		setError( null );
		try {
			const created = await createTournament( {
				title: title.trim(),
				description: description.trim() || undefined,
				category,
				status,
				timeControl,
				ssfGroupId: isSsfBacked ? Number( ssfGroupId ) : undefined,
				startDate: startDate || undefined,
				endDate: endDate || undefined,
				externalLink: externalLink.trim() || undefined,
				showParticipants,
				showStandings,
			} );
			onCreated( created );
			onClose();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to create tournament' );
			setSaving( false );
		}
	}

	return (
		<Modal
			title={ t.tournament.createTournament }
			onRequestClose={ onClose }
			className="rc-wide-modal"
		>
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
						options={ [
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
						onChange={ ( v ) => setStatus( v as TournamentStatus ) }
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
							setTimeControl(
								v as 'classical' | 'rapid' | 'blitz'
							)
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
