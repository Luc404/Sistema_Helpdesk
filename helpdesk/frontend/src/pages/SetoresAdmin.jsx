// ============================================
// TELA: SETORES (perfil ADMIN)
// ============================================
// Área dedicada ao gerenciamento dos setores/departamentos da empresa.
// Reúne em um só lugar a criação, a edição, a remoção e a listagem.
//
// A gestão de setores saiu do TÉCNICO e passou para o ADMIN. Os setores
// aparecem para o usuário no cadastro e ajudam a saber de QUAL ÁREA veio
// o chamado (a unidade diz o local físico).
//
// A rota é "/setores" e exige sessão com role ADMIN (ver RotaProtegida
// somenteAdmin em App.jsx). O conteúdo está em
// components/GerenciarSetores.jsx.

import { SidebarLayout } from './SidebarLayout';
import { GerenciarSetores } from '../components/GerenciarSetores';

// Página de gerenciamento de setores para o perfil de administrador.
export const SetoresAdmin = () => {
  return (
    <SidebarLayout>
      {/* Título da página */}
      <div className="text-center mb-3">
        <span className="bg-secondary text-white px-5 py-2 rounded-pill fw-bold fs-5">setores</span>
      </div>

      {/* Cadastro, edição, remoção e listagem dos setores. */}
      <GerenciarSetores />
    </SidebarLayout>
  );
};