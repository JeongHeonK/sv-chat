import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				optimizeDeps: {
					include: ['bits-ui', 'tailwind-variants', 'tailwind-merge', 'clsx']
				},
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				resolve: {
					alias: {
						'$env/dynamic/private': '/src/lib/server/__tests__/mock-env.ts',
						'$app/server': '/src/lib/server/__tests__/mock-app-server.ts',
						'$app/environment': '/src/lib/server/__tests__/mock-app-environment.ts'
					}
				},
				test: {
					name: 'server',
					environment: 'node',
					env: loadEnv('', process.cwd(), ''),
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
