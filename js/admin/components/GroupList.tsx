import { useState } from '@wordpress/element';
import {
	Spinner,
	Notice,
	Button,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../shared';
import { useTrainingGroups } from '../hooks/useTrainingGroups';
import { GroupCard } from './GroupCard';
import { CreateGroupModal } from './CreateGroupModal';

interface GroupListProps {
	t: Translations;
	onSelectGroup: ( groupId: number ) => void;
}

export function GroupList( { t, onSelectGroup }: GroupListProps ) {
	const { groups, loading, error, refetch } = useTrainingGroups();
	const [ showCreate, setShowCreate ] = useState( false );

	return (
		<div>
			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				} }
			>
				<div>
					<Heading level={ 2 }>{ t.training.title }</Heading>
					<Text>{ t.training.subtitle }</Text>
				</div>
				<Button
					variant="primary"
					onClick={ () => setShowCreate( true ) }
				>
					{ t.training.createGroup }
				</Button>
			</div>

			{ showCreate && (
				<CreateGroupModal
					t={ t }
					onClose={ () => setShowCreate( false ) }
					onCreated={ refetch }
				/>
			) }

			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			) }

			{ loading ? (
				<Spinner />
			) : groups.length === 0 ? (
				<Text style={ { display: 'block', marginTop: 16 } }>
					{ t.training.noGroups }
				</Text>
			) : (
				<div
					style={ {
						display: 'grid',
						gridTemplateColumns:
							'repeat(auto-fill, minmax(280px, 1fr))',
						gap: 16,
						marginTop: 16,
					} }
				>
					{ groups.map( ( group ) => (
						<GroupCard
							key={ group.id }
							group={ group }
							t={ t }
							onClick={ () => onSelectGroup( group.id ) }
							onDeleted={ refetch }
						/>
					) ) }
				</div>
			) }
		</div>
	);
}
