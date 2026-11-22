import { useEffect, useState } from '@wordpress/element';
import {
	Modal,
	TextControl,
	SelectControl,
	Button,
	Notice,
	__experimentalText as Text,
} from '@wordpress/components';
import type { Translations } from '../../../shared';
import type { QrCode } from '../../types';
import { saveQrCode } from '../../api';
import {
	expandPath,
	isHttpUrl,
	isTargetMissing,
	downloadSvg,
	downloadPng,
} from '../../../shared/qr';
import { QrImage } from './QrImage';

interface QrModalProps {
	t: Translations;
	siteUrl: string;
	// The code to edit; absent when creating one.
	code?: QrCode;
	onClose: () => void;
	onSaved: () => void;
}

export function QrModal( {
	t,
	siteUrl,
	code,
	onClose,
	onSaved,
}: QrModalProps ) {
	const [ name, setName ] = useState( code?.name ?? '' );
	const [ address, setAddress ] = useState( code?.url ?? '' );
	const [ pngSize, setPngSize ] = useState( '1024' );
	const [ missing, setMissing ] = useState( false );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	// What will be saved and encoded: a site path becomes a full address.
	const url = expandPath( address, siteUrl );
	const valid = isHttpUrl( url );
	const invalid = address.trim() !== '' && ! valid;

	// Check the target once typing pauses.
	useEffect( () => {
		setMissing( false );
		if ( ! valid ) {
			return;
		}
		let cancelled = false;
		const timer = window.setTimeout( () => {
			isTargetMissing( url ).then( ( m ) => {
				if ( ! cancelled ) {
					setMissing( m );
				}
			} );
		}, 600 );
		return () => {
			cancelled = true;
			window.clearTimeout( timer );
		};
	}, [ url, valid ] );

	async function handleSave() {
		if ( ! valid ) {
			// A typed but invalid address already shows a warning; only an
			// empty one needs the message here.
			if ( ! invalid ) {
				setError( t.qr.invalidAddress );
			}
			return;
		}
		setSaving( true );
		setError( null );
		try {
			await saveQrCode( { name: name.trim(), url }, code?.id );
			onSaved();
			onClose();
		} catch ( err: any ) {
			setError( err?.message || t.qr.saveError );
			setSaving( false );
		}
	}

	return (
		<Modal
			title={ code ? t.qr.edit : t.qr.create }
			onRequestClose={ onClose }
			className="rc-wide-modal"
		>
			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			) }

			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ t.qr.name }
				help={ t.qr.nameHelp }
				value={ name }
				onChange={ setName }
			/>

			<div style={ { marginTop: 16 } }>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ t.qr.address }
					help={ t.qr.addressHelp }
					value={ address }
					onChange={ setAddress }
					placeholder="https://… / /page-slug/"
				/>
				<Text
					as="p"
					weight={ 600 }
					style={ { display: 'block', marginTop: 8 } }
				>
					{ t.qr.slugWarning }
				</Text>
			</div>

			{ invalid && (
				<Notice status="warning" isDismissible={ false }>
					{ t.qr.invalidAddress }
				</Notice>
			) }
			{ missing && (
				<Notice status="warning" isDismissible={ false }>
					{ t.qr.missingTarget }
				</Notice>
			) }

			<div className="rc-qr-modal__preview">
				{ valid ? (
					<QrImage url={ url } size={ 200 } />
				) : (
					<div className="rc-qr-modal__placeholder" />
				) }
				<div className="rc-qr-modal__downloads">
					<Button
						variant="secondary"
						disabled={ ! valid }
						onClick={ () => downloadSvg( url, name ) }
					>
						{ t.qr.downloadSvg }
					</Button>
					<div className="rc-qr-modal__png">
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ t.qr.pngSize }
							value={ pngSize }
							options={ [ 512, 1024, 2048 ].map( ( s ) => ( {
								label: `${ s } px`,
								value: String( s ),
							} ) ) }
							onChange={ setPngSize }
						/>
						<Button
							variant="secondary"
							disabled={ ! valid }
							onClick={ () =>
								downloadPng( url, name, Number( pngSize ) )
							}
						>
							{ t.qr.downloadPng }
						</Button>
					</div>
					<Text variant="muted" size="small">
						{ t.qr.downloadHelp }
					</Text>
				</div>
			</div>

			<div className="rc-qr-modal__footer">
				<Button variant="tertiary" onClick={ onClose }>
					{ t.common.cancel }
				</Button>
				<Button
					variant="primary"
					isBusy={ saving }
					disabled={ saving }
					onClick={ handleSave }
				>
					{ t.common.save }
				</Button>
			</div>
		</Modal>
	);
}
