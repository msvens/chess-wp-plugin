import { useState } from '@wordpress/element';
import { Modal } from '@wordpress/components';
import type { Translations } from '../../../shared';
import type { Tournament, CreateTournamentData } from '../../types';
import { createTournament } from '../../api';
import { TournamentForm } from './TournamentForm';

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
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	async function handleSubmit( data: CreateTournamentData ) {
		setSaving( true );
		setError( null );
		try {
			const created = await createTournament( data );
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
			<TournamentForm
				t={ t }
				submitLabel={ t.common.save }
				saving={ saving }
				error={ error }
				onCancel={ onClose }
				onSubmit={ handleSubmit }
			/>
		</Modal>
	);
}
