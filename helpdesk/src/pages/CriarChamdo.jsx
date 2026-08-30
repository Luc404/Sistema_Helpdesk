import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from './SidebarLayout';

export const CriarChamado = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    servico: '',
    unidade: '',
    duvida: '',
    copia: '',
    descricao: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Chamado criado com sucesso!');
    navigate('/meus-chamados');
  };

  return (
    <SidebarLayout>
      <div className="container" style={{ maxWidth: '650px' }}>
        <div className="card border-secondary shadow-sm">
          <div className="card-header bg-white text-center py-3">
            <i className="bi bi-easel fs-1 text-dark"></i>
            <h4 className="fw-bold mt-2">Solicitação de treinamento</h4>
          </div>

          <div className="card-body bg-secondary p-4 text-dark">
            <form onSubmit={handleSubmit}>
              <div className="bg-white p-3 rounded mb-3 shadow-sm">
                <label className="form-label fw-bold">Selecione o serviço <span className="text-danger">*</span></label>
                <select className="form-select" value={formData.servico} onChange={e => setFormData({...formData, servico: e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="1">Treinamento Básico</option>
                </select>
              </div>

              <div className="bg-white p-3 rounded mb-3 shadow-sm">
                <label className="form-label fw-bold">Informe sua unidade <span className="text-danger">*</span></label>
                <select className="form-select mb-3" value={formData.unidade} onChange={e => setFormData({...formData, unidade: e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="matriz">Matriz</option>
                </select>

                <label className="form-label fw-bold">Dúvida ou mau funcionamento <span className="text-danger">*</span></label>
                <select className="form-select mb-3" value={formData.duvida} onChange={e => setFormData({...formData, duvida: e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="defeito">Defeito</option>
                </select>

                <label className="form-label fw-bold">Usuários em cópia <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="ex: Paulo.vitor" value={formData.copia} onChange={e => setFormData({...formData, copia: e.target.value})} />
              </div>

              <div className="bg-white p-3 rounded mb-4 shadow-sm">
                <label className="form-label fw-bold">Descrição do chamado <span className="text-danger">*</span></label>
                <textarea className="form-control" rows={3} value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})}></textarea>
              </div>

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