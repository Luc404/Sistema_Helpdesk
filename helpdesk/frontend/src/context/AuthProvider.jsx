// ============================================
// PROVEDOR DE AUTENTICAÇÃO
// ============================================
// Componente que guarda o estado da sessão do usuário logado e o distribui
// para toda a aplicação via AuthContext (declarado em auth-context.js).
//
// Ele é montado em App.jsx, ACIMA do BrowserRouter, para que as páginas
// e as rotas protegidas (/home, /meus-chamados...) consigam ler a sessão.
//
// Responsabilidades:
//   1. Recuperar a sessão do localStorage ao abrir a aplicação.
//   2. Revalidar o token guardado com o backend (GET /auth/me).
//   3. Expor login/logout e o perfil (isTecnico) para as páginas.

import { useEffect, useState } from 'react';

// O Context em si (declaração fica em auth-context.js).
import { AuthContext } from './auth-context';

// Acesso ao token e aos dados do usuário guardados no navegador.
import { authStorage } from '../services/authStorage';

// Chamadas de autenticação (login, /auth/me, redefinição de senha).
import { authService } from '../services/authService';

export const AuthProvider = ({ children }) => {
  // Recupera a sessão do localStorage para o login não se perder ao recarregar a página.
  // A função passada para useState é executada UMA vez, na montagem, e evita
  // ler o localStorage a cada render.
  const [usuario, setUsuario] = useState(() => authStorage.getUser());

  // "true" enquanto a sessão ainda não foi confirmada com o backend.
  // As rotas protegidas esperam este sinal para não expulsar o usuário
  // antes de o token ser testado (ver RotaProtegida em App.jsx).
  const [carregando, setCarregando] = useState(true);

  // Revalida o token guardado com o backend, garantindo a role mais atual
  useEffect(() => {
    // Impede setState após o componente ser desmontado (evita aviso do React).
    let cancelado = false;

    // Confere o token salvo chamando GET /auth/me.
    const validarSessao = async () => {
      // Sem token não há o que revalidar: a sessão é encerrada na hora.
      if (!authStorage.getToken()) {
        setCarregando(false);
        return;
      }

      try {
        // O backend confere a assinatura e a validade do token e devolve
        // os dados atualizados do usuário (inclusive a role).
        const user = await authService.eu();

        if (!cancelado) {
          // Atualiza o cache local para não repetir a chamada em cada reload.
          authStorage.setUser(user);
          setUsuario(user);
        }
      } catch {
        // Token expirado, revogado ou usuário desativado: limpa a sessão.
        authStorage.clear();

        if (!cancelado) {
          setUsuario(null);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    };

    validarSessao();

    // Limpeza do efeito: roda quando o provider é desmontado.
    return () => {
      cancelado = true;
    };

    // Array de dependências vazio: a validação acontece UMA vez, ao abrir a app.
  }, []);

  // Autentica no backend e persiste token + usuário (incluindo a role).
  // Devolve o usuário para a página decidir para onde navegar
  // (técnico -> /chamados, usuário -> /meus-chamados).
  const login = async (email, senha) => {
    const dados = await authService.login({ email, senha });

    // Guarda o token e o usuário no navegador para sobreviver ao reload.
    authStorage.save(dados.access_token, dados.user);
    setUsuario(dados.user);

    return dados.user;
  };

  // Encerra a sessão: apaga token/usuário do navegador e do estado do React.
  // Não há "logout" na API porque o token JWT é stateless — basta
  // esquecê-lo no lado do cliente.
  const logout = () => {
    authStorage.clear();
    setUsuario(null);
  };

  // A role vem do banco (GET /auth/me), nunca do e-mail digitado.
  // Usada para esconder links da sidebar e proteger a rota /chamados.
  const isTecnico = usuario?.role === 'TECNICO';

  return (
    // Disponibiliza o estado e as ações para todos os componentes filhos.
    <AuthContext.Provider value={{ usuario, carregando, isTecnico, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
