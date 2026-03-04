import type { Tab } from './TrainingGroupApp';
import type { Translations } from '../../shared/translations';

interface Props {
	activeTab: Tab;
	hasTournament: boolean;
	onChange: ( tab: Tab ) => void;
	t: Translations[ 'training' ];
}

const tabs: { key: Tab; labelKey: keyof Translations[ 'training' ] }[] = [
	{ key: 'participants', labelKey: 'participants' },
	{ key: 'sessions', labelKey: 'sessions' },
	{ key: 'standings', labelKey: 'standings' },
];

export default function TabBar( {
	activeTab,
	hasTournament,
	onChange,
	t,
}: Props ) {
	const visibleTabs = hasTournament
		? tabs
		: tabs.filter( ( tab ) => tab.key !== 'standings' );

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
