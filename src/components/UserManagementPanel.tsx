import React, { useState } from 'react';
import { useStore } from '../store';
import { AppUser } from '../types';
import { 
  User, Shield, Plus, Trash2, Edit2, CheckSquare, Square, 
  UserCheck, Key, Layers, Eye, Settings, X, Save, ShieldAlert
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AVAILABLE_PAGES = [
  { path: '/kanban', label: 'Quadro Kanban (Técnico)' },
  { path: '/tickets', label: 'Ordens de Serviço (Lista)' },
  { path: '/checklist', label: 'Checklist Inteligente' },
  { path: '/clients', label: 'Clientes' },
  { path: '/financial', label: 'Financeiro' },
  { path: '/products', label: 'Produtos & Estoque' },
  { path: '/supplies', label: 'Insumos / Fornecedores' },
  { path: '/calendar', label: 'Agenda / Calendário' },
  { path: '/settings', label: 'Configurações' }
];

const AVAILABLE_TILES = [
  { id: 'daily-tasks', label: 'Tarefas Diárias (Kanban)' },
  { id: 'execution-center', label: 'Central de Execução' },
  { id: 'tickets', label: 'Ordens de Serviço (Tile)' },
  { id: 'kanban', label: 'Quadro Kanban' },
  { id: 'intelligent-checklist', label: 'Manutenção Preventiva' },
  { id: 'financial', label: 'Resumo Financeiro' },
  { id: 'incoming-money', label: 'Entradas de Caixa' },
  { id: 'clients', label: 'Clientes' },
  { id: 'products', label: 'Produtos & Estoque' },
  { id: 'supplies', label: 'Insumos' },
  { id: 'consumption', label: 'Consumo (Água/Gás)' },
  { id: 'calendar', label: 'Calendário de Visitas' },
  { id: 'weather', label: 'Clima Tempo' },
  { id: 'whatsapp-status', label: 'Status do WhatsApp' },
  { id: 'monitoring', label: 'Automações IoT' },
  { id: 'document-factory', label: 'Central de Documentos' }
];

export function UserManagementPanel() {
  const { users, currentUser, addUser, updateUser, deleteUser } = useStore();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'TECNICO' | 'CLIENTE' | 'OUTRO'>('TECNICO');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [allowedTiles, setAllowedTiles] = useState<string[]>([]);

  const handleEditClick = (user: AppUser) => {
    setEditingUserId(user.id);
    setIsCreating(false);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password || '');
    setRole(user.role);
    const superAdmin = user.allowedPages.includes('*') && user.allowedTiles.includes('*');
    setIsSuperAdmin(superAdmin);
    setAllowedPages(superAdmin ? AVAILABLE_PAGES.map(p => p.path) : user.allowedPages);
    setAllowedTiles(superAdmin ? AVAILABLE_TILES.map(t => t.id) : user.allowedTiles);
  };

  const handleCreateClick = () => {
    setEditingUserId(null);
    setIsCreating(true);
    setName('');
    setUsername('');
    setPassword('');
    setRole('TECNICO');
    setIsSuperAdmin(false);
    setAllowedPages(['/kanban', '/tickets', '/checklist']);
    setAllowedTiles(['daily-tasks', 'execution-center', 'tickets', 'kanban']);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingUserId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !username.trim() || !password.trim()) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    const pages = isSuperAdmin ? ['*'] : allowedPages;
    const tiles = isSuperAdmin ? ['*'] : allowedTiles;

    const userPayload = {
      name,
      username: username.toLowerCase().trim(),
      password,
      role,
      allowedPages: pages,
      allowedTiles: tiles
    };

    if (isCreating) {
      // Check duplicate username
      const duplicated = users.some(u => u.username.toLowerCase() === username.toLowerCase().trim());
      if (duplicated || username.toLowerCase().trim() === 'iac') {
        toast.error('Este nome de usuário já está em uso.');
        return;
      }
      addUser(userPayload);
      setIsCreating(false);
    } else if (editingUserId) {
      updateUser(editingUserId, userPayload);
      setEditingUserId(null);
    }
  };

  const handleDelete = (userId: string, userName: string) => {
    if (userId === 'super-admin' || userId === 'default-admin') {
      toast.error('Não é possível excluir o Administrador Principal de Fábrica.');
      return;
    }
    if (currentUser?.id === userId) {
      toast.error('Você não pode excluir seu próprio perfil de usuário ativo.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      deleteUser(userId);
    }
  };

  const togglePage = (path: string) => {
    if (isSuperAdmin) return;
    setAllowedPages(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const toggleTile = (tileId: string) => {
    if (isSuperAdmin) return;
    setAllowedTiles(prev => 
      prev.includes(tileId) ? prev.filter(t => t !== tileId) : [...prev, tileId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider text-white">Controle de Usuários & Perfis</h2>
          <p className="text-sm text-white/70">Gerencie contas, níveis de acesso e visualizações de painel</p>
        </div>
        {!isCreating && !editingUserId && (
          <button
            onClick={handleCreateClick}
            className="px-5 py-3 bg-white text-blue-900 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-100 transition-all flex items-center gap-2 shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" /> CRIAR USUÁRIO
          </button>
        )}
      </div>

      {(isCreating || editingUserId) ? (
        <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 shadow-2xl text-zinc-900 dark:text-zinc-100 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-500" />
              {isCreating ? 'Novo Perfil de Usuário' : 'Editar Perfil de Usuário'}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Basic Info */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Nome Completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo de Souza"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Nome de Usuário (Login) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 text-sm font-semibold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="carlos.tech"
                    disabled={editingUserId !== null && (editingUserId === 'default-admin' || editingUserId === 'default-tech' || editingUserId === 'default-client')}
                    className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Senha de Acesso *</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Função Principal</label>
                <div className="grid grid-cols-3 gap-2">
                  {['ADMIN', 'TECNICO', 'CLIENTE'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r as any)}
                      className={`py-2 px-3 border rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        role === r 
                          ? 'bg-blue-500 border-blue-500 text-white shadow-md' 
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Super Admin Toggle */}
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Acesso Geral Completo</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Permitir visualização de todas as páginas e blocos</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSuperAdmin(!isSuperAdmin);
                    if (!isSuperAdmin) {
                      setAllowedPages(AVAILABLE_PAGES.map(p => p.path));
                      setAllowedTiles(AVAILABLE_TILES.map(t => t.id));
                    }
                  }}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    isSuperAdmin ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow ${
                    isSuperAdmin ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Right Column: Pages & Tiles Checklists */}
            <div className="space-y-4">
              <div className={isSuperAdmin ? 'opacity-40 pointer-events-none' : ''}>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> Páginas Permitidas
                    </h4>
                    <p className="text-[10px] text-zinc-400 mb-2">Selecione quais telas este usuário poderá abrir</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                    {AVAILABLE_PAGES.map((page) => {
                      const active = allowedPages.includes(page.path) || isSuperAdmin;
                      return (
                        <button
                          key={page.path}
                          type="button"
                          onClick={() => togglePage(page.path)}
                          className="flex items-center gap-2 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-left transition-colors"
                        >
                          {active ? (
                            <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" />
                          )}
                          <span className="text-xs truncate">{page.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Blocos do Painel (Tiles)
                    </h4>
                    <p className="text-[10px] text-zinc-400 mb-2">Defina quais blocos aparecerão no Dashboard deste perfil</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                    {AVAILABLE_TILES.map((tile) => {
                      const active = allowedTiles.includes(tile.id) || isSuperAdmin;
                      return (
                        <button
                          key={tile.id}
                          type="button"
                          onClick={() => toggleTile(tile.id)}
                          className="flex items-center gap-2 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-left transition-colors"
                        >
                          {active ? (
                            <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" />
                          )}
                          <span className="text-xs truncate">{tile.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Salvar Usuário
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Default Super Admin user (Hardcoded built-in) */}
          <div className="bg-zinc-900/40 backdrop-blur border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-lg font-black shrink-0">
                  IA
                </div>
                <span className="px-2.5 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[8px] font-black uppercase tracking-wider rounded">
                  SUPER GERAL
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white leading-tight">Administrador Geral</h3>
                <p className="text-xs text-white/50">@iac</p>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[10px] text-white/60">
                  <span>Páginas:</span>
                  <span className="font-bold text-teal-300">Acesso Total (*)</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/60">
                  <span>Painel:</span>
                  <span className="font-bold text-teal-300">Acesso Total (*)</span>
                </div>
              </div>
            </div>
            <div className="pt-4 mt-4 border-t border-white/5 text-[9px] text-teal-400 font-bold uppercase tracking-widest text-center">
              Perfil Master de Sistema
            </div>
          </div>

          {/* Dynamic Users */}
          {users.map((user) => {
            const isSelf = currentUser?.id === user.id;
            const hasAllPages = user.allowedPages.includes('*');
            const hasAllTiles = user.allowedTiles.includes('*');

            return (
              <div key={user.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-xl text-zinc-950 dark:text-zinc-100">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-zinc-800 text-blue-500 dark:text-blue-400 flex items-center justify-center text-lg font-black shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded ${
                        user.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                        user.role === 'TECNICO' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {user.role}
                      </span>
                      {isSelf && (
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[7px] font-black rounded uppercase">
                          Você
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight leading-tight truncate">{user.name}</h3>
                    <p className="text-xs text-zinc-400">@{user.username}</p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400">Páginas Liberadas:</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        {hasAllPages ? 'Todas (*)' : `${user.allowedPages.length} selecionadas`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400">Módulos do Painel:</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        {hasAllTiles ? 'Todos (*)' : `${user.allowedTiles.length} selecionados`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800/80">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3 h-3" /> Editar Acesso
                  </button>
                  <button
                    onClick={() => handleDelete(user.id, user.name)}
                    disabled={isSelf || user.id === 'default-admin'}
                    className="p-2 bg-red-100 dark:bg-red-950/20 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/30 rounded-xl transition-all disabled:opacity-30 shrink-0"
                    title="Excluir Usuário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
