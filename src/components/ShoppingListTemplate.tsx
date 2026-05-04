import React from 'react';
import { SupplyItem, Client, CompanyData } from '../types';
import { format } from 'date-fns';
import { Package, MapPin, Calendar, ClipboardList } from 'lucide-react';

interface ShoppingListTemplateProps {
  items: { supplyItemId: string; quantity: number }[];
  supplyItems: SupplyItem[];
  client?: Client;
  companyData: CompanyData | null;
}

export const ShoppingListTemplate: React.FC<ShoppingListTemplateProps> = ({ 
  items, 
  supplyItems, 
  client,
  companyData 
}) => {
  const date = new Date();

  return (
    <div className="p-8 bg-white text-slate-900 min-h-[29.7cm] w-[21cm] mx-auto pdf-content" id="shopping-list-pdf">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2 uppercase">Lista de Compras</h1>
          <div className="flex items-center gap-2 text-slate-500 font-bold">
            <Calendar className="w-4 h-4" />
            <span>Emitido em: {format(date, 'dd/MM/yyyy HH:mm')}</span>
          </div>
        </div>
        {companyData && (
          <div className="text-right">
            <h2 className="text-xl font-black text-slate-900 uppercase">{companyData.name}</h2>
            <p className="text-sm text-slate-500 font-medium">{companyData.document}</p>
            <p className="text-sm text-slate-500 font-medium">{companyData.phone}</p>
          </div>
        )}
      </div>

      {/* Client Info */}
      {client && (
        <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Destino da Entrega</h3>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Condomínio / Prédio</p>
              <p className="font-bold text-slate-900">{client.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Endereço</p>
              <p className="font-bold text-slate-900">{client.address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-zinc-900 rounded-xl text-white">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">Itens Solicitados</h3>
        </div>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest rounded-tl-2xl">Item / Produto</th>
              <th className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest">Categoria</th>
              <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest rounded-tr-2xl">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {items.map((qi, idx) => {
              const item = supplyItems.find(si => si.id === qi.supplyItemId);
              return (
                <tr key={qi.supplyItemId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-4 px-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-900">{item?.name || 'Item não encontrado'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 border-b border-slate-100 text-center">
                    <span className="px-3 py-1 bg-slate-200 text-[10px] font-black uppercase tracking-widest rounded-lg text-slate-600">
                      {item?.category || '-'}
                    </span>
                  </td>
                  <td className="py-4 px-6 border-b border-slate-100 text-right">
                    <span className="text-lg font-black text-slate-900">{qi.quantity}</span>
                    <span className="text-sm text-slate-400 ml-1 font-bold">{item?.unit}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer / Notes */}
      <div className="mt-auto pt-12 border-t border-slate-200 break-inside-avoid">
        <div className="grid grid-cols-2 gap-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">Assinatura do Responsável</p>
            <div className="border-b border-slate-900 h-12 w-full"></div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">Data de Recebimento</p>
            <div className="border-b border-slate-900 h-12 w-full flex items-end justify-center pb-2 font-bold text-slate-300">
              ____ / ____ / ________
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-12 font-medium">
          Este documento é uma solicitação formal de compra gerada pelo sistema de gestão condominial.
        </p>
        {/* Spacer to prevent cutting off at the bottom of the page */}
        <div style={{ height: '40px', color: 'transparent', overflow: 'hidden' }}>.</div>
      </div>
    </div>
  );
};
