// ============================================
// TELA: UNIDADES (perfil ADMIN)
// ============================================
// Área dedicada ao gerenciamento das unidades/locais (ex.: Matriz, Filial).
// Reúne em um só lugar a criação, a edição, a remoção e a listagem.
//
// A criação de unidades saiu do TÉCNICO e passou para o ADMIN (mesma regra
// dos setores). A unidade "Matriz" é criada automaticamente pelo seed na
// inicialização da API; o restante (filiais) é cadastrado aqui.
//
// A rota é "/unidades" e exige sessão com role ADMIN (ver RotaProtegida
// somenteAdmin em App.jsx). O conteúdo está em
// components/GerenciarUnidades.jsx.

import { SidebarLayout } from './SidebarLayout';
import { GerenciarUnidades } from '../components/GerenciarUnidades';

// Página de gerenciamento de unidades para o perfil de administrador.
export const UnidadesAdmin = () => {
  return (
    <SidebarLayout>
      {/* Título da página */}
      <div className="text-center mb-3">
        <span className="bg-secondary text-white px-5 py-2 rounded-pill fw-bold fs-5">unidades</span>
      </div>

      {/* Cadastro, edição, remoção e listagem das unidades. */}
      <GerenciarUnidades />
    </SidebarLayout>
  );
};