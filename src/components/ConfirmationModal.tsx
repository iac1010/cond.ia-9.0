import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning'
}: ConfirmationModalProps) {
  const confirmBtnClass = type === 'danger' 
    ? 'bg-red-600 hover:bg-red-700 text-white' 
    : type === 'warning'
    ? 'bg-amber-500 hover:bg-amber-600 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${
            type === 'danger' ? 'bg-red-50 text-red-600' : 
            type === 'warning' ? 'bg-amber-50 text-amber-600' : 
            'bg-blue-50 text-blue-600'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-8 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg ${confirmBtnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
