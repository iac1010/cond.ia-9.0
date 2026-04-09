import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Edit2, Trash2, X, CheckSquare } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';

export default function ChecklistManager() {
  const navigate = useNavigate();
  const { checklistItems, addChecklistItem, updateChecklistItem, deleteChecklistItem, clients } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    task: string;
    category: string;
    clientIds: string[];
  }>({
    task: '',
    category: '',
    clientIds: []
  });

  const categories = Array.from(new Set(checklistItems.map(item => item.category))).filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      task: formData.task,
      category: formData.category,
      clientIds: formData.clientIds
    };
    
    if (editingId) {
      updateChecklistItem(editingId, dataToSave);
    } else {
      addChecklistItem(dataToSave);
    }
    closeModal();
  };

  const openModal = (item?: typeof checklistItems[0]) => {
    if (item) {
      // Handle legacy clientId as well
      const initialClientIds = item.clientIds || (item.clientId ? [item.clientId] : []);
      setFormData({ task: item.task, category: item.category, clientIds: initialClientIds });
      setEditingId(item.id);
    } else {
      setFormData({ task: '', category: categories[0] || '', clientIds: [] });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ task: '', category: '', clientIds: [] });
  };

  return (
    <div className="min-h-screen bg-[#004a7c] text-white -m-8 p-8 md:p-12 overflow-x-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,900 1000,600 L1000,1000 L0,1000 Z" fill="white" fillOpacity="0.1" />
          <path d="M0,800 C200,600 500,700 1000,400 L1000,800 L0,800 Z" fill="white" fillOpacity="0.05" />
        </svg>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 relative z-10 gap-6">
        <div className="flex items-center gap-6">
          <BackButton />
          <div>
            <h1 className="text-6xl font-light tracking-tight">Checklist</h1>
            <p className="text-xl opacity-60 mt-2 font-light">Configuração de tarefas preventivas</p>
          </div>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all group rounded-2xl"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" /> 
          <span className="text-lg font-medium">Nova Tarefa</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
        {checklistItems.map(item => {
          const itemClientIds = item.clientIds || (item.clientId ? [item.clientId] : []);
          const assignedClients = clients.filter(c => itemClientIds.includes(c.id));
          
          return (
            <div key={item.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col hover:bg-white/10 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-block bg-white/10 text-white/60 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-2">
                    {item.category}
                  </span>
                  <h3 className="text-xl font-bold text-white line-clamp-2">{item.task}</h3>
                </div>
                <div className="flex gap-2 shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openModal(item)}
                    className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setItemToDelete(item.id)}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-white/10">
                <p className="text-sm text-white/50">
                  <span className="font-bold uppercase tracking-wider text-[10px] block mb-1">Atribuído a:</span>
                  <span className="text-white/80">
                    {assignedClients.length > 0 
                      ? assignedClients.map(c => c.name).join(', ') 
                      : 'Todos (Global)'}
                  </span>
                </p>
              </div>
            </div>
          );
        })}

        {checklistItems.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white/5 backdrop-blur-md border border-dashed border-white/20 rounded-2xl">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <CheckSquare className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-2xl font-light opacity-60">Nenhuma tarefa configurada</h3>
            <p className="opacity-40 mt-2">Clique em "Nova Tarefa" para começar.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingId ? 'Editar Tarefa' : 'Nova Tarefa'}
        maxWidth="md"
        glass
      >
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Descrição da Tarefa *</label>
            <input 
              required
              type="text" 
              value={formData.task}
              onChange={e => setFormData({...formData, task: e.target.value})}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
              placeholder="Ex: Verificar iluminação de emergência"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Categoria *</label>
            <input 
              required
              type="text" 
              list="categories"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
              placeholder="Ex: Elétrica, Hidráulica, Segurança..."
            />
            <datalist id="categories">
              {categories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-4">Atribuir a Clientes (Opcional)</label>
            <div className="max-h-64 overflow-y-auto border border-white/10 rounded-xl p-4 space-y-2 bg-white/5">
              <label className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                <input 
                  type="checkbox"
                  checked={formData.clientIds.length === 0}
                  onChange={() => setFormData({...formData, clientIds: []})}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-white focus:ring-white/30"
                />
                <span className="text-sm font-bold text-white">Todos (Checklist Global)</span>
              </label>
              
              <div className="h-px bg-white/10 my-2" />

              {clients.map(client => (
                <label key={client.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                  <input 
                    type="checkbox"
                    checked={formData.clientIds.includes(client.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({...formData, clientIds: [...formData.clientIds, client.id]});
                      } else {
                        setFormData({...formData, clientIds: formData.clientIds.filter(id => id !== client.id)});
                      }
                    }}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-white focus:ring-white/30"
                  />
                  <span className="text-sm text-white/70">{client.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-3">
              Se nenhum for selecionado, a tarefa aparecerá para todos.
            </p>
          </div>
          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={closeModal}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-white/20 hover:bg-white/30 text-white px-10 py-3 rounded-xl font-bold backdrop-blur-md border border-white/20 transition-all active:scale-95"
            >
              SALVAR
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={!!itemToDelete} 
        onClose={() => setItemToDelete(null)} 
        title="Confirmar Exclusão"
        maxWidth="sm"
        glass
      >
        <div className="space-y-6 p-2">
          <p className="text-xl font-light text-white/70">Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-3 pt-6">
            <button 
              onClick={() => setItemToDelete(null)}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                if (itemToDelete) deleteChecklistItem(itemToDelete);
                setItemToDelete(null);
              }}
              className="bg-red-500/80 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold backdrop-blur-md border border-red-500/20 transition-all active:scale-95"
            >
              EXCLUIR
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
