import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  { ignores: ['dist/**', 'node_modules/**'] },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      // Produktnamen kommen aus einem Wiki. v-html waere eine XSS-Luecke.
      // Siehe Sicherheit.md im Vault.
      'vue/no-v-html': 'error',

      // Uebrig gebliebene Debug-Ausgaben sollen auffallen, aber nicht blockieren.
      'no-console': 'warn',
      'no-debugger': 'warn',
    },
  },

  // Muss zuletzt stehen: schaltet alle Formatierungsregeln ab,
  // damit ESLint und Prettier sich nicht widersprechen.
  prettier,
]
