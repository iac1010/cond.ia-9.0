import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { Product } from '../types';
import { Plus, Trash2, Edit, FileSpreadsheet, Search, Package, Tag, Info } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import Papa from 'papaparse';
import { Modal } from '../components/Modal';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const VIBRANT_GRADIENTS = [
  'from-[#0078d7] to-[#005a9e]', // Blue
  'from-[#00aba9] to-[#008a88]', // Teal
  'from-[#da532c] to-[#b94322]', // Orange
  'from-[#7e3878] to-[#632c5e]', // Purple
  'from-[#60a917] to-[#4d8712]', // Green
  'from-[#ee1111] to-[#cc0000]', // Red
  'from-[#f0a30a] to-[#d38b00]', // Yellow/Gold
  'from-[#2d89ef] to-[#1e71cd]', // Sky Blue
];

export default function Products() {
  const navigate = useNavigate();
  const { products, addProduct, updateProduct, deleteProduct, importProducts } = useStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    code: '',
    name: '',
    description: '',
    price: 0,
    unit: 'UN'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedProducts: Omit<Product, 'id'>[] = results.data.map((row: any) => {
          const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('nome') || k.toLowerCase().includes('prod'));
          const priceKey = Object.keys(row).find(k => k.toLowerCase().includes('preco') || k.toLowerCase().includes('preço') || k.toLowerCase().includes('valor'));
          const codeKey = Object.keys(row).find(k => k.toLowerCase().includes('cod') || k.toLowerCase().includes('cód'));
          const descKey = Object.keys(row).find(k => k.toLowerCase().includes('desc'));
          const unitKey = Object.keys(row).find(k => k.toLowerCase().includes('unid') || k.toLowerCase().includes('medida'));

          const name = nameKey ? row[nameKey] : Object.values(row)[0] as string;
          
          let price = 0;
          if (priceKey) {
            const priceStr = String(row[priceKey]).replace(/[R$\s]/g, '').replace(',', '.');
            price = parseFloat(priceStr);
          }

          return {
            name: name || 'Produto sem nome',
            price: isNaN(price) ? 0 : price,
            code: codeKey ? row[codeKey] : '',
            description: descKey ? row[descKey] : '',
            unit: unitKey ? row[unitKey] : 'UN'
          };
        });

        importProducts(parsedProducts);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price < 0) return;

    if (editingId) {
      updateProduct(editingId, formData);
    } else {
      addProduct(formData);
    }

    setIsAdding(false);
    setEditingId(null);
    setFormData({ code: '', name: '', description: '', price: 0, unit: 'UN' });
  };

  const handleEdit = (product: Product) => {
    setFormData({
      code: product.code || '',
      name: product.name,
      description: product.description || '',
      price: product.price,
      unit: product.unit || 'UN'
    });
    setEditingId(product.id);
    setIsAdding(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#004a7c] text-white -m-8 p-8 md:p-12 overflow-x-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,900 1000,600 L1000,1000 L0,1000 Z" fill="white" fillOpacity="0.1" />
          <path d="M0,800 C200,600 500,700 1000,400 L1000,800 L0,800 Z" fill="white" fillOpacity="0.05" />
        </svg>
      </div>

      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="flex items-center gap-6">
          <BackButton />
          <div>
            <h1 className="text-6xl font-light tracking-tight">Produtos</h1>
            <p className="text-xl opacity-60 mt-2 font-light">Gerencie seu catálogo de produtos e serviços</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden" 
            id="csv-upload-products"
          />
          <motion.label 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            htmlFor="csv-upload-products"
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-4 flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-5 h-5" /> 
            <span className="font-medium">Importar CSV</span>
          </motion.label>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setFormData({ code: '', name: '', description: '', price: 0, unit: 'UN' });
              setEditingId(null);
              setIsAdding(true);
            }}
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 flex items-center gap-3 border border-white/20 backdrop-blur-md transition-all group"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" /> 
            <span className="text-lg font-medium">Novo Produto</span>
          </motion.button>
        </div>
      </header>

      <div className="mb-8 max-w-xl relative z-10">
        <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input 
          type="text" 
          placeholder="Buscar por nome ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 focus:border-white/30 rounded-2xl outline-none transition-all text-xl font-light placeholder:text-white/20 backdrop-blur-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 relative z-10">
        {filteredProducts.map((product, index) => {
          const gradientClass = VIBRANT_GRADIENTS[index % VIBRANT_GRADIENTS.length];
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-gradient-to-br ${gradientClass} hover:brightness-110 transition-all p-6 aspect-square flex flex-col justify-between relative group overflow-hidden border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-95`}
            >
              {/* Glassmorphism Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Package className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.preventDefault(); handleEdit(product); }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4 text-white" />
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); setProductToDelete(product.id); }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="mt-4 relative z-10">
                <h3 className="text-2xl font-bold leading-tight mb-1 line-clamp-2 drop-shadow-lg">{product.name}</h3>
                {product.code && (
                  <p className="text-sm opacity-80 flex items-center gap-1 drop-shadow-md">
                    <Tag className="w-3 h-3" /> Cód: {product.code}
                  </p>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-white/10 relative z-10 flex justify-between items-end">
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Preço ({product.unit || 'UN'})</p>
                  <p className="text-3xl font-black drop-shadow-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-24 text-center relative z-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-full mb-6 backdrop-blur-md border border-white/10">
              <Package className="w-12 h-12 text-white/40" />
            </div>
            <h3 className="text-2xl font-light opacity-60">Nenhum produto encontrado</h3>
            <p className="opacity-40 mt-2">Clique em "Novo Produto" para começar seu catálogo.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isAdding} 
        onClose={() => setIsAdding(false)} 
        title={editingId ? 'Editar Produto' : 'Novo Produto'}
        maxWidth="md"
        glass
      >
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Nome do Produto *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                placeholder="Ex: Câmera IP 1080p"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Código / SKU</label>
              <input 
                type="text" 
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                placeholder="Ex: CAM-001"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Unidade de Medida</label>
              <input 
                type="text" 
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                placeholder="Ex: UN, KG, M, CX"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Preço de Venda (R$) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold">R$</span>
                <input 
                  type="number" 
                  value={formData.price || ''}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl pl-12 pr-4 py-3 outline-none transition-all text-white placeholder:text-white/30"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-white/50 mb-2">Descrição / Detalhes</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3 outline-none min-h-[100px] resize-none transition-all text-white placeholder:text-white/30"
                placeholder="Descreva as especificações do produto..."
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-white/20 hover:bg-white/30 text-white px-10 py-3 rounded-xl font-bold backdrop-blur-md border border-white/20 transition-all active:scale-95"
            >
              SALVAR PRODUTO
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!productToDelete} 
        onClose={() => setProductToDelete(null)} 
        title="Confirmar Exclusão"
        maxWidth="sm"
        glass
      >
        <div className="space-y-6 p-2">
          <p className="text-xl font-light text-white/70">
            Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-6">
            <button 
              onClick={() => setProductToDelete(null)}
              className="px-6 py-3 text-white/60 hover:text-white transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                if (productToDelete) deleteProduct(productToDelete);
                setProductToDelete(null);
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
