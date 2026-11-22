import { useCallback, useEffect, useState } from '@wordpress/element';
import {
	Spinner,
	Notice,
	Button,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { getTranslation } from '../../../shared';
import type { Language } from '../../../shared';
import type { QrCode } from '../../types';
import { fetchQrCodes } from '../../api';
import { QrCard } from './QrCard';
import { QrModal } from './QrModal';

interface QrAppProps {
	siteUrl: string;
	language: Language;
}

// The modal is either closed, open for a new code, or open for one code.
type ModalState = null | { code?: QrCode };

export function QrApp( { siteUrl, language }: QrAppProps ) {
	const t = getTranslation( language );
	const [ codes, setCodes ] = useState< QrCode[] >( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );
	const [ modal, setModal ] = useState< ModalState >( null );

	const refetch = useCallback( () => {
		fetchQrCodes()
			.then( ( data ) => {
				setCodes( data );
				setError( null );
			} )
			.catch( () => setError( t.qr.loadError ) )
			.finally( () => setLoading( false ) );
	}, [ t ] );

	useEffect( refetch, [ refetch ] );

	return (
		<div>
			<div className="rc-qr-app__header">
				<div>
					<Heading level={ 2 }>{ t.qr.title }</Heading>
					<Text>{ t.qr.subtitle }</Text>
				</div>
				<Button variant="primary" onClick={ () => setModal( {} ) }>
					{ t.qr.create }
				</Button>
			</div>

			{ modal && (
				<QrModal
					t={ t }
					siteUrl={ siteUrl }
					code={ modal.code }
					onClose={ () => setModal( null ) }
					onSaved={ refetch }
				/>
			) }

			{ error && (
				<Notice status="error" onRemove={ () => setError( null ) }>
					{ error }
				</Notice>
			) }

			{ loading && <Spinner /> }
			{ ! loading && codes.length === 0 && (
				<Text style={ { display: 'block', marginTop: 16 } }>
					{ t.qr.empty }
				</Text>
			) }
			{ ! loading && codes.length > 0 && (
				<div className="rc-qr-app__grid">
					{ codes.map( ( code ) => (
						<QrCard
							key={ code.id }
							code={ code }
							t={ t }
							onEdit={ () => setModal( { code } ) }
							onDeleted={ refetch }
							onError={ setError }
						/>
					) ) }
				</div>
			) }
		</div>
	);
}
