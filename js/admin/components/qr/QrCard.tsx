import { useEffect, useState } from '@wordpress/element';
import {
	Card,
	CardBody,
	CardHeader,
	CardFooter,
	Button,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../../shared';
import type { QrCode } from '../../types';
import { deleteQrCode } from '../../api';
import { downloadSvg, downloadPng, isTargetMissing } from '../../../shared/qr';
import { QrImage } from './QrImage';

interface QrCardProps {
	code: QrCode;
	t: Translations;
	onEdit: () => void;
	onDeleted: () => void;
	onError: ( message: string ) => void;
}

export function QrCard( { code, t, onEdit, onDeleted, onError }: QrCardProps ) {
	const [ confirming, setConfirming ] = useState( false );
	const [ missing, setMissing ] = useState( false );

	useEffect( () => {
		let cancelled = false;
		isTargetMissing( code.url ).then( ( m ) => {
			if ( ! cancelled ) {
				setMissing( m );
			}
		} );
		return () => {
			cancelled = true;
		};
	}, [ code.url ] );

	function handleDelete( e: React.MouseEvent ) {
		e.stopPropagation();
		if ( ! confirming ) {
			setConfirming( true );
			return;
		}
		deleteQrCode( code.id )
			.then( onDeleted )
			.catch( () => {
				setConfirming( false );
				onError( t.qr.deleteError );
			} );
	}

	return (
		<Card
			size="small"
			onClick={ code.canEdit ? onEdit : undefined }
			style={ { cursor: code.canEdit ? 'pointer' : 'default' } }
		>
			<CardHeader>
				<div className="rc-qr-card__header">
					<Heading level={ 4 } style={ { margin: 0 } }>
						{ code.name || code.url }
					</Heading>
					{ code.canEdit && (
						<Button
							isDestructive
							variant={ confirming ? 'primary' : 'tertiary' }
							size="small"
							onClick={ handleDelete }
							onBlur={ () => setConfirming( false ) }
						>
							{ confirming ? t.common.confirm : t.common.delete }
						</Button>
					) }
				</div>
			</CardHeader>
			<CardBody>
				<div className="rc-qr-card__body">
					<QrImage url={ code.url } size={ 88 } />
					<div className="rc-qr-card__info">
						<a
							href={ code.url }
							target="_blank"
							rel="noopener noreferrer"
							onClick={ ( e ) => e.stopPropagation() }
							className="rc-qr-card__url"
						>
							{ code.url }
						</a>
						{ missing && (
							<span className="rc-qr-flag">
								{ t.qr.notFound }
							</span>
						) }
						{ ! code.canEdit && (
							<Text variant="muted" size="small">
								{ t.qr.ownedByOther }
							</Text>
						) }
					</div>
				</div>
			</CardBody>
			<CardFooter>
				<div
					className="rc-qr-card__actions"
					onClick={ ( e ) => e.stopPropagation() }
					role="presentation"
				>
					<Button
						variant="secondary"
						size="small"
						onClick={ () => downloadSvg( code.url, code.name ) }
					>
						{ t.qr.downloadSvg }
					</Button>
					<Button
						variant="secondary"
						size="small"
						onClick={ () =>
							downloadPng( code.url, code.name, 1024 )
						}
					>
						{ t.qr.downloadPng }
					</Button>
					{ code.canEdit && (
						<Button
							variant="tertiary"
							size="small"
							onClick={ onEdit }
						>
							{ t.common.edit }
						</Button>
					) }
				</div>
			</CardFooter>
		</Card>
	);
}
