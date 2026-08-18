import { useState } from '@wordpress/element';
import { Button, Notice, SelectControl } from '@wordpress/components';
import type { Translations } from '../../shared';
import type { Participant, ParticipantRole, SsfRatingInfo } from '../types';
import { addParticipant, removeParticipant } from '../api';
import { ratingForTimeControl, ratingLabel } from './ratingUtils';

interface ParticipantListProps {
	groupId: number;
	participants: Participant[];
	ratings: Map< number, SsfRatingInfo >;
	timeControl: string;
	t: Translations;
	onUpdated: () => void;
	onAddClick: () => void;
	readOnly?: boolean;
}

export function ParticipantList( {
	groupId,
	participants,
	ratings,
	timeControl,
	t,
	onUpdated,
	onAddClick,
	readOnly,
}: ParticipantListProps ) {
	const [ removing, setRemoving ] = useState< string | null >( null );
	const [ savingRole, setSavingRole ] = useState< string | null >( null );
	const [ error, setError ] = useState< string | null >( null );
	const [ showInactive, setShowInactive ] = useState( false );

	const active = participants.filter( ( p ) => p.active );
	const inactive = participants.filter( ( p ) => ! p.active );

	async function handleRemove( participantId: string ) {
		// eslint-disable-next-line no-alert
		if ( ! window.confirm( t.training.removeParticipant + '?' ) ) {
			return;
		}
		setRemoving( participantId );
		setError( null );
		try {
			await removeParticipant( groupId, participantId );
			onUpdated();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to remove participant' );
		} finally {
			setRemoving( null );
		}
	}

	// The add endpoint is idempotent on id, so re-posting the participant with a
	// new role is the role change — no separate route needed.
	async function handleRoleChange( p: Participant, role: ParticipantRole ) {
		setSavingRole( p.id );
		setError( null );
		try {
			await addParticipant( groupId, {
				id: p.id,
				name: p.name,
				ssfId: p.ssfId,
				role,
			} );
			onUpdated();
		} catch ( err: any ) {
			setError( err?.message || 'Failed to update role' );
		} finally {
			setSavingRole( null );
		}
	}

	function roleLabel( role: ParticipantRole | undefined ): string {
		return role === 'leader'
			? t.training.roleLeader
			: t.training.roleParticipant;
	}

	function getRating( p: Participant ): string {
		if ( p.ssfId === null ) {
			return t.training.ratingUnavailable;
		}
		const r = ratings.get( p.ssfId );
		if ( ! r ) {
			return t.training.ratingUnavailable;
		}
		const val = ratingForTimeControl( r, timeControl );
		return val ? String( val ) : t.training.ratingUnavailable;
	}

	return (
		<div>
			{ error && (
				<Notice
					status="error"
					isDismissible
					onDismiss={ () => setError( null ) }
				>
					{ error }
				</Notice>
			) }

			{ ! readOnly && (
				<div style={ { marginBottom: 12 } }>
					<Button variant="primary" onClick={ onAddClick }>
						{ t.training.addParticipant }
					</Button>
				</div>
			) }

			<table className="widefat striped">
				<thead>
					<tr>
						<th>{ t.training.name }</th>
						<th>{ ratingLabel( timeControl, t ) }</th>
						<th>{ t.training.role }</th>
						{ ! readOnly && <th></th> }
					</tr>
				</thead>
				<tbody>
					{ active.map( ( p ) => (
						<tr key={ p.id }>
							<td>{ p.name }</td>
							<td>{ getRating( p ) }</td>
							<td>
								{ readOnly ? (
									roleLabel( p.role )
								) : (
									<SelectControl
										aria-label={ t.training.role }
										value={ p.role ?? 'participant' }
										disabled={ savingRole === p.id }
										options={ [
											{
												label: t.training
													.roleParticipant,
												value: 'participant',
											},
											{
												label: t.training.roleLeader,
												value: 'leader',
											},
										] }
										onChange={ ( value ) =>
											handleRoleChange(
												p,
												value as ParticipantRole
											)
										}
										__nextHasNoMarginBottom
									/>
								) }
							</td>
							{ ! readOnly && (
								<td>
									<Button
										variant="tertiary"
										isDestructive
										isBusy={ removing === p.id }
										disabled={ removing !== null }
										onClick={ () => handleRemove( p.id ) }
									>
										{ t.training.removeParticipant }
									</Button>
								</td>
							) }
						</tr>
					) ) }
					{ active.length === 0 && (
						<tr>
							<td
								colSpan={ readOnly ? 3 : 4 }
								style={ {
									textAlign: 'center',
									fontStyle: 'italic',
								} }
							>
								{ t.training.noGroups }
							</td>
						</tr>
					) }
				</tbody>
			</table>

			{ inactive.length > 0 && (
				<div style={ { marginTop: 16 } }>
					<Button
						variant="link"
						onClick={ () => setShowInactive( ! showInactive ) }
					>
						{ t.training.inactive } ({ inactive.length })
					</Button>
					{ showInactive && (
						<table
							className="widefat striped"
							style={ { marginTop: 8 } }
						>
							<tbody>
								{ inactive.map( ( p ) => (
									<tr key={ p.id } style={ { opacity: 0.6 } }>
										<td>{ p.name }</td>
										<td>{ getRating( p ) }</td>
										<td>{ roleLabel( p.role ) }</td>
										<td></td>
									</tr>
								) ) }
							</tbody>
						</table>
					) }
				</div>
			) }
		</div>
	);
}
