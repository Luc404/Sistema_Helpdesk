// ============================================
// CONTEXTO DE AUTENTICAÇÃO (declaration)
// ============================================
// Este arquivo apenas DECLARA o contexto e o hook que o consome.
// Quem preenche o contexto de verdade é o AuthProvider (AuthProvider.jsx).
//
// A separação em dois arquivos segue o padrão do React:
//   - "auth-context.js"  -> o objeto Context e o hook useAuth (sem JSX)
//   - "AuthProvider.jsx"  -> o componente que fornece os valores (com JSX)
// Isso evita dependência circular entre os dois arquivos.

import { createContext, useContext } from 'react';

// O "context" é um canal de dados compartilhado entre componentes sem
// precisar passar props de pai para filho.
//
// O valor inicial é "null": significa "ainda não existe provider acima
// deste componente". Por isso o useAuth abaixo precisa checar isso —
// se a página for renderizada fora do AuthProvider, o erro fica claro.
export const AuthContext = createContext(null);

// Hook que as páginas usam para acessar a sessão.
// Equivale a "useContext(AuthContext)": devolve o objeto fornecido pelo
// AuthProvider ({ usuario, carregando, isTecnico, isAdmin, login, logout,
// loginMaster }).
export const useAuth = () => useContext(AuthContext);

// Rótulos amigáveis para exibição da role vinda do backend
// (o banco devolve os valores em CAIXA ALTA: "USUARIO" / "TECNICO" / "ADMIN").
export const ROLE_LABEL = {
  USUARIO: 'Usuário',
  TECNICO: 'Técnico',
  ADMIN: 'Administrador',
};

// Página inicial de cada perfil, usada depois do login e como fallback dos
// guards de rota (App.jsx). Centralizar aqui evita repetir os ternários.
export const ROTA_INICIAL = {
  USUARIO: '/meus-chamados',
  TECNICO: '/chamados',
  ADMIN: '/admin',
};

// Devolve a rota inicial de um perfil (fallback genérico "/home").
export function rotaInicial(role) {
  return ROTA_INICIAL[role] || '/home';
}
