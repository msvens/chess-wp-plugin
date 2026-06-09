import { useState } from '@wordpress/element';
import { Modal } from '@wordpress/components';
import type { Translations } from '../../../shared';
import type { Tournament, CreateTournamentData } from '../../types';
import { updateTournament } from '../../api';
import { TournamentForm } from './TournamentForm';

interface EditTournamentModalProps {
	t: Translations;
	tournament: Tournament;
	onClose: () => void;
	onUpdated: () => void;
}

export function EditTournamentModal( {
	t,
	tournament,
	onClose,
	onUpdated,
}: EditTournamentModalProps ) {
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	async function handleSubmit( data: CreateTournamentData ) {
		setSaving( true );
		setError( null );
		try {
			await updateTournament( tournament.id, data );
			onUpdated();
			onClose();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to update tournament' );
			setSaving( false );
		}
	}

	return (
		<Modal
			title={ t.tournament.editTournament }
			onRequestClose={ onClose }
			className="rc-wide-modal"
		>
			<TournamentForm
				t={ t }
				initialHasResults={ tournament.rounds.some( ( r ) =>
					r.pairings.some( ( p ) => !! p.result )
				) }
				initial={ {
					title: tournament.title,
					description: tournament.description,
					category: tournament.category,
					// 'auto' when status is derived; otherwise the explicit value.
					status: tournament.statusIsAuto
						? 'auto'
						: tournament.status,
					timeControl: tournament.timeControl as
						| 'classical'
						| 'rapid'
						| 'blitz',
					ssfGroupId: tournament.ssfGroupId
						? String( tournament.ssfGroupId )
						: '',
					startDate: tournament.startDate,
					endDate: tournament.endDate,
					externalLink: tournament.externalLink,
					showParticipants: tournament.showParticipants,
					showStandings: tournament.showStandings,
				} }
				submitLabel={ t.common.save }
				saving={ saving }
				error={ error }
				onCancel={ onClose }
				onSubmit={ handleSubmit }
			/>
		</Modal>
	);
}
