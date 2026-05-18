import type { Tab } from './TrainingGroupApp';
import type { Translations } from '../../shared/translations';

interface Props {
	activeTab: Tab;
	onChange: ( tab: Tab ) => void;
	t: Translations[ 'training' ];
}

const tabs: { key: Tab; labelKey: keyof Translations[ 'training' ] }[] = [
	{ key: 'participants', labelKey: 'participants' },
	{ key: 'sessions', labelKey: 'sessions' },
];

export default function TabBar( { activeTab, onChange, t }: Props ) {
	return (
		<div className="rc-td__tabs" role="tablist">
			{ tabs.map( ( tab ) => (
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
