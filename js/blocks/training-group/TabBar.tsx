import type { Tab } from './TrainingGroupApp';
import type { GroupType } from '../../admin/types';
import type { Translations } from '../../shared/translations';

interface Props {
	activeTab: Tab;
	groupType: GroupType;
	showParticipants: boolean;
	showStandings: boolean;
	ssfGroupId: number;
	onChange: ( tab: Tab ) => void;
	t: Translations[ 'training' ];
}

const tabs: { key: Tab; labelKey: keyof Translations[ 'training' ] }[] = [
	{ key: 'participants', labelKey: 'participants' },
	{ key: 'sessions', labelKey: 'sessions' },
	{ key: 'standings', labelKey: 'results' },
];

export default function TabBar( {
	activeTab,
	groupType,
	showParticipants,
	showStandings,
	ssfGroupId,
	onChange,
	t,
}: Props ) {
	const hasResults = groupType !== 'training' || ssfGroupId > 0;
	const visibleTabs = tabs.filter( ( tab ) => {
		if ( tab.key === 'participants' && ! showParticipants ) {
			return false;
		}
		if ( tab.key === 'sessions' && groupType === 'tournament' ) {
			return false;
		}
		if ( tab.key === 'standings' && ( ! hasResults || ! showStandings ) ) {
			return false;
		}
		return true;
	} );

	return (
		<div className="rc-td__tabs" role="tablist">
			{ visibleTabs.map( ( tab ) => (
				<button
					key={ tab.key }
					role="tab"
					aria-selected={ activeTab === tab.key }
					className={ `rc-td__tab${
						activeTab === tab.key ? ' rc-td__tab--active' : ''
					}` }
					onClick={ () => onChange( tab.key ) }
				>
					{ t[ tab.labelKey ] as string }
				</button>
			) ) }
		</div>
	);
}
