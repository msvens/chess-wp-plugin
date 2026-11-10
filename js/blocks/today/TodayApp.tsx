import { useState, useEffect } from '@wordpress/element';
import {
	findTournamentGroup,
	type GroupToday,
	type TournamentToday,
} from '@msvens/schack-se-sdk';
import { getTranslation, toLanguage } from '../../shared/translations';
import { useLocale } from '../../shared/useLocale';
import { fetchTournamentsToday } from '../../shared/ssf';

/** Tournament and group pages live on msvens-chess; the plugin has none. */
const RESULTS_BASE = 'https://chess.msvens.com/results';

interface Props {
	districtId: number;
	showHeading: boolean;
	showNote: boolean;
	locale: string;
}

/**
 * A group's label. The class name is added only when the tournament has
 * several classes; for a one-class event it just repeats itself.
 *
 * @param tournament The tournament the group belongs to.
 * @param group      A group played today.
 */
function groupLabel(
	tournament: TournamentToday,
	group: GroupToday[ 'group' ]
): string {
	const found = findTournamentGroup( tournament, group.id );
	const className = found?.hasMultipleClasses
		? found.parentClass.className
		: '';
	return className ? `${ className }, ${ group.name }` : group.name;
}

export default function TodayApp( {
	districtId,
	showHeading,
	showNote,
	locale,
}: Props ) {
	const currentLocale = useLocale( locale );
	const lang = toLanguage( currentLocale );
	const t = getTranslation( lang ).today;

	const [ tournaments, setTournaments ] = useState< TournamentToday[] >( [] );
	const [ loading, setLoading ] = useState( true );
	const [ failed, setFailed ] = useState( false );

	useEffect( () => {
		let cancelled = false;
		setLoading( true );
		setFailed( false );

		fetchTournamentsToday( districtId ).then( ( data ) => {
			if ( cancelled ) {
				return;
			}
			if ( data === null ) {
				setFailed( true );
				setTournaments( [] );
			} else {
				setTournaments( data );
			}
			setLoading( false );
		} );

		return () => {
			cancelled = true;
		};
	}, [ districtId ] );

	const sorted = [ ...tournaments ].sort( ( a, b ) =>
		a.name.localeCompare( b.name, lang )
	);

	let body;
	if ( loading ) {
		body = <p className="rc-today__state">{ t.loading }</p>;
	} else if ( failed ) {
		body = <p className="rc-today__state">{ t.loadError }</p>;
	} else if ( sorted.length === 0 ) {
		body = <p className="rc-today__state">{ t.empty }</p>;
	} else {
		body = (
			<ul className="rc-today__list">
				{ sorted.map( ( tournament ) => (
					<li key={ tournament.id } className="rc-today__item">
						<a
							className="rc-today__name"
							href={ `${ RESULTS_BASE }/${ tournament.id }` }
						>
							{ tournament.name }
						</a>
						{ tournament.city && (
							<div className="rc-today__meta">
								{ tournament.city }
							</div>
						) }
						{ tournament.groupsToday.length > 0 && (
							<ul className="rc-today__groups">
								{ tournament.groupsToday.map( ( { group } ) => (
									<li key={ group.id }>
										<a
											href={ `${ RESULTS_BASE }/${ tournament.id }/${ group.id }` }
										>
											{ groupLabel( tournament, group ) }
										</a>
									</li>
								) ) }
							</ul>
						) }
					</li>
				) ) }
			</ul>
		);
	}

	return (
		<div className="rc-today">
			{ showHeading && <h2 className="rc-today__title">{ t.title }</h2> }
			{ showNote && <p className="rc-today__note">{ t.note }</p> }
			{ body }
		</div>
	);
}
