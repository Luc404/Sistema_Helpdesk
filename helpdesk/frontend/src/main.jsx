// ============================================
// PONTO DE ENTRADA DO FRONTEND (React)
// ============================================
// Este é o primeiro arquivo executado pelo navegador. O index.html (na raiz
// do projeto) apenas o carrega, e a partir daqui o React controla a tela.
//
// O que acontece aqui:
//   1. Cria a raiz do React em cima da <div id="root"> do index.html.
//   2. Renderiza o componente <App />, que por sua vez define as rotas.
//
// Nada de lógica de negócio vive neste arquivo: o roteamento está em
// App.jsx, a sessão em context/AuthProvider.jsx e a API em services/.

// StrictMode: ativa verificações extras do React em desenvolvimento
// (ex.: warns sobre efeitos sem limpeza). Não muda o comportamento em produção.
import { StrictMode } from 'react'

// createRoot: cria a raiz da aplicação React 19 em um elemento do DOM.
import { createRoot } from 'react-dom/client'

// Estilo global do projeto (variáveis CSS, fonte base, etc.).
import './index.css'

// Componente raiz da aplicação: define o roteamento de todas as telas.
import App from './App.jsx'

// Bootstrap e os ícones são carregados por aqui (e não no index.html)
// para que o Vite possa tratar esses arquivos durante o build.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Monta a aplicação dentro da <div id="root"> do index.html.
createRoot(document.getElementById('root')).render(
  // StrictMode envolve tudo para validar a árvore de componentes em dev.
  <StrictMode>
    <App />
  </StrictMode>,
)
