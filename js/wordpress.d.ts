declare module '@wordpress/blocks' {
	export function registerBlockType( name: string, settings: any ): void;
}

declare module '@wordpress/block-editor' {
	export function useBlockProps( props?: any ): any;
	export function InspectorControls( props: any ): any;
}
