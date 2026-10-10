// ============================================
// TELA: SERVIÇOS (perfil TÉCNICO)
// ============================================
// Área dedicada ao gerenciamento dos serviços de suporte. Reúne em um
// só lugar a criação, a edição, a remoção e a listagem dos serviços.
//
// Antes essa parte ficava escondida dentro de ChamadosTecnico.jsx, atrás
// do botão "Gerenciar serviços". O problema é que o link "Serviços" da
// sidebar levava para /chamados?secao=servicos, e como a página /chamados
// já estava montada, o estado de "aberto" não era recalculado — o bloco
// simplesmente não abria. Agora cada área tem a sua própria rota.
//
// A rota é "/servicos" e exige sessão com role TECNICO (ver RotaProtegida
// somenteTecnico em App.jsx). O conteúdo do formulário e da lista está em
// components/GerenciarServicos.jsx.

import { SidebarLayout } from './SidebarLayout';
import { GerenciarServicos } from '../components/GerenciarServicos';

// Página de gerenciamento de serviços para o perfil de técnico.
export const ServicosTecnico = () => {
  return (
    <SidebarLayout>
      {/* Título da página */}
      <div className="text-center mb-3">
        <span className="bg-secondary text-white px-5 py-2 rounded-pill fw-bold fs-5">serviços</span>
      </div>

      {/* Cadastro, edição, remoção e listagem dos serviços. */}
      <GerenciarServicos />
    </SidebarLayout>
  );
};
