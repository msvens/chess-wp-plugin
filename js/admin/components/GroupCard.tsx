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
				{ group.semester && (
					<Text>
						{ t.training.semester }: { group.semester }
					</Text>
				) }
				<Text style={ { display: 'block' } }>
					{ t.training.participants }: { activeCount }
				</Text>
				{ group.hasTournament && (
					<Text style={ { display: 'block', fontStyle: 'italic' } }>
						{ t.training.tournament }
					</Text>
				) }
			</CardBody>
		</Card>
	);
}
