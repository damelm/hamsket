import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
	{ ignores: ['out/**', 'dist/**', 'resources/**', 'node_modules/**', 'test-results/**', 'scripts/**'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['src/renderer/**/*.{ts,tsx}'],
		languageOptions: { globals: globals.browser },
		plugins: { 'react-hooks': reactHooks },
		rules: {
			...reactHooks.configs.recommended.rules,
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},
	{
		files: ['src/main/**/*.ts', 'src/preload/**/*.ts', 'electron.vite.config.ts', 'playwright.config.ts'],
		languageOptions: { globals: globals.node }
	},
	{
		files: ['src/shared/**/*.ts'],
		languageOptions: { globals: { ...globals.node, ...globals.browser } }
	},
	{
		files: ['test/**/*.ts'],
		languageOptions: { globals: { ...globals.node, ...globals.browser } }
	},
	eslintConfigPrettier
)
