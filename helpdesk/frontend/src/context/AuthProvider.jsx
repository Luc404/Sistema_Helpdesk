import { useState } from 'react';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);

  const login = (email, tipoUsuario = 'Usuário') => setUsuario({ email, tipoUsuario });
  const logout = () => setUsuario(null);

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};