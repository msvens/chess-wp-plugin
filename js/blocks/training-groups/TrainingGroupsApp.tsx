import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { TrainingGroup } from '../../admin/types';
import { getTranslation, toLanguage } from '../../shared/translations';
import { useLocale } from '../../shared/useLocale';
import type { TrainingGroupFields } from '../../shared/overviewFields';
import { TRAINING_GROUP_FIELD_DEFAULTS } from '../../shared/overviewFields';
import GroupCard from './GroupCard';
import GroupRow from './GroupRow';

interface Props {
	locale: string;
	layout?: 'cards' | 'list';
	// Which fields the cards and rows render. Both are always mounted — CSS
	// picks the visible one — so one set drives both.
	fields?: TrainingGroupFields;
}

export default function TrainingGroupsApp( {
	locale,
	layout = 'cards',
	fields = TRAINING_GROUP_FIELD_DEFAULTS,
}: Props ) {
	const currentLocale = useLocale( locale );
	const lang = toLanguage( currentLocale );
	const t = getTranslation( lang );
	const [ groups, setGroups ] = useState< TrainingGroup[] >( [] );
	const [ loading, setLoading ] = useState( true );
	const [ showPast, setShowPast ] = useState( false );

	useEffect( () => {
		apiFetch< TrainingGroup[] >( { path: '/rockaden/v1/training-groups' } )
			.then( ( data ) => {
				// Exclude hidden (draft); show the rest grouped by lifecycle.
				setGroups( data.filter( ( g ) => g.status !== 'draft' ) );
				setLoading( false );
			} )
			.catch( () => {
				setLoading( false );
			} );
	}, [] );

	// Junior on the left, everything else on the right — reused for ongoing and past.
	const columns = ( list: TrainingGroup[] ) => {
		const junior = list.filter( ( g ) => g.audience === 'junior' );
		const allAges = list.filter( ( g ) => g.audience !== 'junior' );
		return (
			<div className="rc-tg__columns">
				{ junior.length > 0 && (
					<section className="rc-tg__column">
						<h2 className="rc-tg__column-title">
							{ t.training.audiences.junior }
						</h2>
						<div className="rc-tg__grid">
							{ junior.map( ( group ) => (
								<GroupCard
									key={ group.id }
									group={ group }
									lang={ lang }
									fields={ fields }
								/>
							) ) }
						</div>
					</section>
				) }
				{ allAges.length > 0 && (
					<section className="rc-tg__column">
						<h2 className="rc-tg__column-title">
							{ t.training.audiences.mixed }
						</h2>
						<div className="rc-tg__grid">
							{ allAges.map( ( group ) => (
								<GroupCard
									key={ group.id }
									group={ group }
									lang={ lang }
									fields={ fields }
								/>
							) ) }
						</div>
					</section>
				) }
			</div>
		);
	};

	// List view: a single stacked column with audience sub-headings (more compact
	// than the side-by-side card columns; also the mobile layout).
	const listSections = ( list: TrainingGroup[] ) => {
		const junior = list.filter( ( g ) => g.audience === 'junior' );
		const allAges = list.filter( ( g ) => g.audience !== 'junior' );
		const section = ( title: string, items: TrainingGroup[] ) =>
			items.length > 0 && (
				<section className="rc-tg__list-section">
					<h2 className="rc-tg__column-title">{ title }</h2>
					<ul className="rc-tg__list">
						{ items.map( ( group ) => (
							<li key={ group.id }>
								<GroupRow
									group={ group }
									lang={ lang }
									fields={ fields }
								/>
							</li>
						) ) }
					</ul>
				</section>
			);
		return (
			<div className="rc-tg__list-sections">
				{ section( t.training.audiences.junior, junior ) }
				{ section( t.training.audiences.mixed, allAges ) }
			</div>
		);
	};

	if ( loading ) {
		return <p className="rc-tg__loading">{ t.common.loading }</p>;
	}

	if ( groups.length === 0 ) {
		return <p className="rc-tg__empty">{ t.training.noGroups }</p>;
	}

	const ongoing = groups.filter( ( g ) => g.status !== 'completed' );
	const past = groups.filter( ( g ) => g.status === 'completed' );
	const pastVisible = showPast || ongoing.length === 0;
	const showCards = layout === 'cards';

	const renderGroups = ( list: TrainingGroup[] ) => (
		<>
			{ showCards && columns( list ) }
			{ listSections( list ) }
		</>
	);

	return (
		<div className={ `rc-tg is-${ layout }` }>
			{ ongoing.length > 0 && renderGroups( ongoing ) }

			{ past.length > 0 && (
				<div className="rc-tg__past">
					<button
						type="button"
						className="rc-tg__past-toggle"
						aria-expanded={ pastVisible }
						onClick={ () => setShowPast( ( v ) => ! v ) }
					>
						{ pastVisible ? '▾' : '▸' } { t.training.pastGroups } (
						{ past.length })
					</button>
					{ pastVisible && renderGroups( past ) }
				</div>
			) }
		</div>
	);
}
