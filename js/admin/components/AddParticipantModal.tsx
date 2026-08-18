import { useState, useMemo } from '@wordpress/element';
import {
	Modal,
	SearchControl,
	SelectControl,
	Button,
	Spinner,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../shared';
import type { Participant, ParticipantRole, SsfPlayer } from '../types';
import { addParticipant } from '../api';

interface AddParticipantModalProps {
	groupId: number;
	existingParticipants: Participant[];
	players: SsfPlayer[];
	ratingsLoading: boolean;
	t: Translations;
	onClose: () => void;
	onAdded: () => void;
}

export function AddParticipantModal( {
	groupId,
	existingParticipants,
	players,
	ratingsLoading,
	t,
	onClose,
	onAdded,
}: AddParticipantModalProps ) {
	const [ search, setSearch ] = useState( '' );
	const [ adding, setAdding ] = useState< number | null >( null );
	const [ error, setError ] = useState< string | null >( null );
	// Applies to each participant added while the modal is open, so a run of
	// leaders can be added without switching back and forth.
	const [ role, setRole ] = useState< ParticipantRole >( 'participant' );

	const existingIds = useMemo(
		() =>
			new Set(
				existingParticipants
					.filter( ( p ) => p.active )
					.map( ( p ) => p.ssfId )
			),
		[ existingParticipants ]
	);

	const filtered = useMemo( () => {
		if ( ! search.trim() ) {
			return [];
		}
		const q = search.toLowerCase();
		return players
			.filter( ( p ) => {
				if ( existingIds.has( p.id ) ) {
					return false;
				}
				const fullName =
					`${ p.firstName } ${ p.lastName }`.toLowerCase();
				return fullName.includes( q );
			} )
			.slice( 0, 20 );
	}, [ players, search, existingIds ] );

	async function handleAdd( player: SsfPlayer ) {
		setAdding( player.id );
		setError( null );
		try {
			await addParticipant( groupId, {
				id: String( player.id ),
				name: `${ player.firstName } ${ player.lastName }`,
				ssfId: player.id,
				role,
			} );
			onAdded();
			onClose();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to add participant' );
			setAdding( null );
		}
	}

	return (
		<Modal title={ t.training.addParticipant } onRequestClose={ onClose }>
			{ ratingsLoading ? (
				<Spinner />
			) : (
				<>
					<SearchControl
						value={ search }
						onChange={ setSearch }
						placeholder={ t.training.search }
					/>

					<SelectControl
						label={ t.training.role }
						value={ role }
						options={ [
							{
								label: t.training.roleParticipant,
								value: 'participant',
							},
							{
								label: t.training.roleLeader,
								value: 'leader',
							},
						] }
						onChange={ ( value ) =>
							setRole( value as ParticipantRole )
						}
						__nextHasNoMarginBottom
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

					{ search.trim() && filtered.length === 0 && (
						<Text
							style={ {
								display: 'block',
								marginTop: 12,
								fontStyle: 'italic',
							} }
						>
							{ t.training.ratingUnavailable }
						</Text>
					) }

					{ filtered.length > 0 && (
						<table
							className="widefat striped"
							style={ { marginTop: 12 } }
						>
							<thead>
								<tr>
									<th>{ t.training.name }</th>
									<th>{ t.training.rating }</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{ filtered.map( ( player ) => (
									<tr key={ player.id }>
										<td>
											{ player.firstName }{ ' ' }
											{ player.lastName }
										</td>
										<td>
											{ player.elo?.rating ||
												t.training.ratingUnavailable }
										</td>
										<td>
											<Button
												variant="primary"
												size="small"
												isBusy={ adding === player.id }
												disabled={ adding !== null }
												onClick={ () =>
													handleAdd( player )
												}
											>
												{ t.common.add }
											</Button>
										</td>
									</tr>
								) ) }
							</tbody>
						</table>
					) }
				</>
			) }
		</Modal>
	);
}
