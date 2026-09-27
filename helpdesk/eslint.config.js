// ============================================
// CONFIGURAÇÃO DO ESLINT (análise estática do código do frontend)
// ============================================
// O ESLint pointed para acusar problemas que o compilador NÃO detecta,
// como regras do React violadas por engano. Rodar com:
//
//     npm run lint
//
// Não corrija o código com o formatador automático: o ESLint aqui é
// somente leitura e serve para avisar antes do commit.

import js from '@eslint/js'             // Regras oficiais de JavaScript
import globals from 'globals'          // Lista de variáveis globais por ambiente
import reactHooks from 'eslint-plugin-react-hooks'      // Regras dos hooks (useState, useEffect...)
import reactRefresh from 'eslint-plugin-react-refresh'  // Regras de organização dos componentes
import { defineConfig, globalIgnores } from 'eslint/config'

// Configuração no formato "flat config" (padrão do ESLint 9+): um array
// onde cada item descreve um conjunto de arquivos e as regras aplicáveis.
export default defineConfig([
  // Ignora a pasta de build: ela contém o bundle minificado gerado pelo
  // Vite e não é código-fonte, então não faz sentido analisá-lo.
  globalIgnores(['dist']),

  {
    // Aplica estas regras a todo JavaScript/JSX do projeto.
    files: ['**/*.{js,jsx}'],

    // Conjuntos de regras herdados dos plugins importados acima.
    extends: [
      js.configs.recommended,                    // erros comuns (variável não usada, etc.)
      reactHooks.configs.flat.recommended,       // dependências de hooks, useEffect em laço...
      reactRefresh.configs.vite,                 // Fast Refresh funciona melhor sem mistura de componentes
    ],

    languageOptions: {
      // Variáveis globais disponíveis (window, document, localStorage...).
      globals: globals.browser,

      // Habilita a sintaxe JSX, que o parser padrão do ESLint não entende.
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
