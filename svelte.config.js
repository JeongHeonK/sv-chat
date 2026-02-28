import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			'@/*': './src/lib/*',
			$ui: 'src/lib/components/ui',
			'$ui/*': 'src/lib/components/ui/*'
		}
	}
};

export default config;
