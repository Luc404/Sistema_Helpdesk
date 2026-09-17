import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from './SidebarLayout';

// Página de criação de novo chamado (solicitação de treinamento)
export const CriarChamado = () => {
  // Hook para navegação
  const navigate = useNavigate();

  // Estado do formulário de criação de chamado
  const [formData, setFormData] = useState({
    servico: '',    // Tipo de serviço selecionado
    unidade: '',    // Unidade do usuário
    duvida: '',     // Tipo de problema (dúvida ou defeito)
    copia: '',      // Usuários em cópia
    descricao: ''   // Descrição detalhada do chamado
  });

  // Valida e envia o formulário de chamado
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Chamado criado com sucesso!');
    navigate('/meus-chamados'); // Redireciona para a lista de chamados
  };

  return (
    <SidebarLayout>
      <div className="container" style={{ maxWidth: '650px' }}>
        <div className="card border-secondary shadow-sm">
          {/* Cabeçalho com ícone e título do formulário */}
          <div className="card-header bg-white text-center py-3">
            <i className="bi bi-easel fs-1 text-dark"></i>
            <h4 className="fw-bold mt-2">Solicitação de treinamento</h4>
          </div>

          {/* Corpo do formulário com campos de preenchimento */}
          <div className="card-body bg-secondary p-4 text-dark">
            <form onSubmit={handleSubmit}>
              {/* Seção de seleção de serviço */}
              <div className="bg-white p-3 rounded mb-3 shadow-sm">
                <label className="form-label fw-bold">Selecione o serviço <span className="text-danger">*</span></label>
                <select className="form-select" value={formData.servico} onChange={e => setFormData({...formData, servico: e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="1">Treinamento Básico</option>
                </select>
              </div>

              {/* Seção de informações da unidade e tipo de problema */}
              <div className="bg-white p-3 rounded mb-3 shadow-sm">
                {/* Campo: Unidade do usuário */}
                <label className="form-label fw-bold">Informe sua unidade <span className="text-danger">*</span></label>
                <select className="form-select mb-3" value={formData.unidade} onChange={e => setFormData({...formData, unidade: e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="matriz">Matriz</option>
                </select>

                {/* Campo: Tipo de problema */}
                <label className="form-label fw-bold">Dúvida ou mau funcionamento <span className="text-danger">*</span></label>
                <select className="form-select mb-3" value={formData.duvida} onChange={e => setFormData({...formData, duvida: e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="defeito">Defeito</option>
                </select>

                {/* Campo: Usuários em cópia */}
                <label className="form-label fw-bold">Usuários em cópia <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="ex: Paulo.vitor" value={formData.copia} onChange={e => setFormData({...formData, copia: e.target.value})} />
              </div>

              {/* Seção de descrição do chamado */}
              <div className="bg-white p-3 rounded mb-4 shadow-sm">
                <label className="form-label fw-bold">Descrição do chamado <span className="text-danger">*</span></label>
                <textarea className="form-control" rows={3} value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})}></textarea>
              </div>

              {/* Botão de envio do formulário */}
              <div className="text-center">
                <button type="submit" className="btn btn-light px-5 fw-bold rounded-pill shadow-sm">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};
