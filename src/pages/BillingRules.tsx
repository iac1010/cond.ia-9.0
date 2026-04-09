import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Save, Bell, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function BillingRules() {
  const { billingRules, addBillingRule, updateBillingRule, deleteBillingRule } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    daysBeforeDue: [] as number[],
    daysAfterDue: [] as number[],
    messageTemplate: '',
    active: true
  });

  const handleAddRule = () => {
    if (!newRule.name || !newRule.messageTemplate) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    addBillingRule(newRule);
    setIsAdding(false);
    setNewRule({ name: '', daysBeforeDue: [], daysAfterDue: [], messageTemplate: '', active: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Régua de Cobrança</h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">Automatize lembretes de pagamento para os moradores</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Régua
        </button>
      </div>

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configurar Nova Régua</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Nome da Régua</label>
              <input
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Padrão Condomínio"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Template da Mensagem</label>
              <textarea
                value={newRule.messageTemplate}
                onChange={(e) => setNewRule({ ...newRule, messageTemplate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none h-24"
                placeholder="Use {nome} e {vencimento} como variáveis"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddRule}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar Régua
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {billingRules.map((rule) => (
          <div
            key={rule.id}
            className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${rule.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                    {rule.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteBillingRule(rule.id)}
                className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                <Clock className="w-4 h-4" />
                <span>Antes do vencimento: {rule.daysBeforeDue.join(', ')} dias</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                <Clock className="w-4 h-4" />
                <span>Após o vencimento: {rule.daysAfterDue.join(', ')} dias</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-lg text-xs text-gray-500 italic">
                "{rule.messageTemplate}"
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => updateBillingRule(rule.id, { active: !rule.active })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${rule.active ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {rule.active ? 'Pausar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
