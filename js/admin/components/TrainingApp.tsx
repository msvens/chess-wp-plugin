import { useState } from '@wordpress/element';
import { getTranslation } from '../../shared';
import type { View, AppConfig } from '../types';
import { GroupList } from './GroupList';
import { GroupDetail } from './GroupDetail';
import { SessionDetail } from './SessionDetail';

interface TrainingAppProps {
	config: AppConfig;
}

export function TrainingApp( { config }: TrainingAppProps ) {
	const [ view, setView ] = useState< View >( { screen: 'list' } );
	const t = getTranslation( config.language );

	const navigateToList = () => setView( { screen: 'list' } );
	const navigateToGroup = ( groupId: number ) =>
		setView( { screen: 'group', groupId } );
	const navigateToSession = ( groupId: number, sessionId: number ) =>
		setView( { screen: 'session', groupId, sessionId } );

	switch ( view.screen ) {
		case 'list':
			return <GroupList t={ t } onSelectGroup={ navigateToGroup } />;
		case 'group':
			return (
				<GroupDetail
					groupId={ view.groupId }
					clubId={ config.clubId }
					t={ t }
					onBack={ navigateToList }
					onSelectSession={ ( sessionId ) =>
						navigateToSession( view.groupId, sessionId )
					}
				/>
			);
		case 'session':
			return (
				<SessionDetail
					groupId={ view.groupId }
					sessionId={ view.sessionId }
					t={ t }
					onBack={ () => navigateToGroup( view.groupId ) }
				/>
			);
	}
}
