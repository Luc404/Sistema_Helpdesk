// ============================================
// CONFIGURAÇÃO DO VITE (servidor de desenvolvimento e build)
// ============================================
// O Vite é a ferramenta que serve o frontend durante o desenvolvimento
// (npm run dev), aplica o build de produção (npm run build) e
// transforma os .jsx/.tsx em JavaScript que o navegador entende.
//
// O frontend fica na pasta "frontend/src" (veja o index.html na raiz),
// por isso o caminho do script de entrada é relativo a partir da raiz.

import { defineConfig } from 'vite'
// Plugin que habilita o React: transforma JSX em JavaScript e adiciona
// o Fast Refresh (recarrega só o componente alterado, sem perder o estado).
import react from '@vitejs/plugin-react'

// Exporta a configuração do Vite usada tanto no dev quanto no build.
export default defineConfig({
  // Plugins do processo de build: aqui, apenas o suporte ao React/JSX.
  plugins: [react()],

  server: {
    // Porta do servidor de desenvolvimento do frontend.
    // IMPORTANTE: esta é a porta liberada no CORS do backend (app/main.py).
    // Se mudar aqui, é preciso mudar lá também, senão o navegador bloqueia
    // as chamadas à API com erro de CORS.
    port: 5173,

    // Expõe o servidor na rede local (acessível por IP, não só por localhost).
    host: true,

    // Abre o navegador automaticamente assim que o servidor sobe.
    open: '/'
  }
})
