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
import type { TrainingGroup } from '../types';
import { updateGroup } from '../api';

interface EditGroupModalProps {
	group: TrainingGroup;
	t: Translations;
	onClose: () => void;
	onUpdated: () => void;
}

export function EditGroupModal( {
	group,
	t,
	onClose,
	onUpdated,
}: EditGroupModalProps ) {
	const [ title, setTitle ] = useState( group.title );
	const [ description, setDescription ] = useState( group.description );
	const [ semester, setSemester ] = useState( group.semester );
	const [ hasTournament, setHasTournament ] = useState( group.hasTournament );
	const [ timeControl, setTimeControl ] = useState<
		'classical' | 'rapid' | 'blitz'
	>(
		( group.timeControl as 'classical' | 'rapid' | 'blitz' ) || 'classical'
	);
	const [ trainers, setTrainers ] = useState( group.trainers );
	const [ contact, setContact ] = useState( group.contact );
	const [ tournamentLink, setTournamentLink ] = useState(
		group.tournamentLink
	);
	const [ showParticipants, setShowParticipants ] = useState(
		group.showParticipants
	);
	const [ showStandings, setShowStandings ] = useState( group.showStandings );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

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
				hasTournament,
				timeControl: hasTournament ? timeControl : undefined,
				trainers: trainers.trim(),
				contact: contact.trim(),
				tournamentLink: tournamentLink.trim(),
				showParticipants,
				showStandings,
			} );
			onUpdated();
			onClose();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to update group' );
			setSaving( false );
		}
	}

	return (
		<Modal title={ t.common.edit } onRequestClose={ onClose }>
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
			{ group.ssfGroupId > 0 && (
				<TextControl
					label={ t.training.ssfGroupId }
					value={ String( group.ssfGroupId ) }
					onChange={ () => {} }
					readOnly
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
