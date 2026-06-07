import type { Tab } from './TrainingGroupApp';
import type { Translations } from '../../shared/translations';

interface Props {
	tabs: Tab[];
	activeTab: Tab;
	onChange: ( tab: Tab ) => void;
	t: Translations[ 'training' ];
}

const labelKeys: Record< Tab, keyof Translations[ 'training' ] > = {
	participants: 'participants',
	sessions: 'sessions',
};

export default function TabBar( { tabs, activeTab, onChange, t }: Props ) {
	return (
		<div className="rc-td__tabs" role="tablist">
			{ tabs.map( ( tab ) => (
				<button
					key={ tab }
					role="tab"
					aria-selected={ activeTab === tab }
					className={ `rc-td__tab${
						activeTab === tab ? ' rc-td__tab--active' : ''
					}` }
					onClick={ () => onChange( tab ) }
				>
					{ t[ labelKeys[ tab ] ] as string }
				</button>
			) ) }
		</div>
	);
}
