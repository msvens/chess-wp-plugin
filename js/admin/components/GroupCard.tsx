import { useState } from '@wordpress/element';
import {
	Card,
	CardBody,
	CardHeader,
	Button,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../shared';
import type { TrainingGroup } from '../types';
import { deleteGroup } from '../api';

interface GroupCardProps {
	group: TrainingGroup;
	t: Translations;
	onClick: () => void;
	onDeleted: () => void;
}

export function GroupCard( { group, t, onClick, onDeleted }: GroupCardProps ) {
	const activeCount = group.participants.filter( ( p ) => p.active ).length;
	const [ confirming, setConfirming ] = useState( false );

	function handleDelete( e: React.MouseEvent ) {
		e.stopPropagation();
		if ( ! confirming ) {
			setConfirming( true );
			return;
		}
		deleteGroup( group.id )
			.then( onDeleted )
			.catch( () => setConfirming( false ) );
	}

	return (
		<Card size="small" onClick={ onClick } style={ { cursor: 'pointer' } }>
			<CardHeader>
				<div
					style={ {
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						width: '100%',
					} }
				>
					<Heading level={ 4 } style={ { margin: 0 } }>
						{ group.title }
					</Heading>
					<Button
						isDestructive
						variant={ confirming ? 'primary' : 'tertiary' }
						size="small"
						onClick={ handleDelete }
						onBlur={ () => setConfirming( false ) }
					>
						{ confirming ? t.common.confirm : t.common.delete }
					</Button>
				</div>
			</CardHeader>
			<CardBody>
				<Text
					style={ {
						display: 'inline-block',
						padding: '1px 8px',
						borderRadius: 9999,
						fontSize: 11,
						fontWeight: 500,
						marginBottom: 4,
						background:
							group.status === 'active' ? '#dbeafe' : '#f3f4f6',
						color:
							group.status === 'active' ? '#1e40af' : '#6b7280',
					} }
				>
					{ group.status === 'active' ? t.training.active : 'Draft' }
				</Text>
				{ group.semester && (
					<Text style={ { display: 'block' } }>
						{ t.training.semester }: { group.semester }
					</Text>
				) }
				<Text style={ { display: 'block' } }>
					{ t.training.participants }: { activeCount }
				</Text>
				{ group.groupType && group.groupType !== 'training' && (
					<Text style={ { display: 'block', fontStyle: 'italic' } }>
						{ group.groupType === 'both'
							? t.training.trainingAndTournament
							: t.training.tournamentOnly }
					</Text>
				) }
			</CardBody>
		</Card>
	);
}
