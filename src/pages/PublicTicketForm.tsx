import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { 
  Camera, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  MapPin,
  User,
  MessageSquare
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function PublicTicketForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients, addTicket, companyLogo, companyData } = useStore();
  
  const clientId = searchParams.get('client');
  const locationId = searchParams.get('location');
  
  const [client, setClient] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    reportedBy: '',
    description: '',
    photo: null as string | null
  });

  useEffect(() => {
    if (clientId) {
      const foundClient = clients.find(c => c.id === clientId);
      if (foundClient) {
        setClient(foundClient);
        if (locationId) {
          const foundLoc = foundClient.locations?.find(l => l.id === locationId);
          if (foundLoc) setLocation(foundLoc);
        }
      }
    }
  }, [clientId, locationId, clients]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsLoading(true);
    
    const newTicket = {
      id: uuidv4(),
      clientId: client.id,
      type: 'CORRETIVA' as const,
      status: 'PENDENTE_APROVACAO' as const,
      date: new Date().toISOString(),
      technician: 'A definir',
      observations: `Abertura via QR Code por ${formData.reportedBy}`,
      reportedBy: formData.reportedBy,
      location: location?.name || 'Não especificado',
      reportedProblem: formData.description,
      photoBefore: formData.photo || undefined,
      items: []
    };

    // Simulate network delay
    setTimeout(() => {
      addTicket(newTicket);
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  if (!clientId || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Link Inválido</h1>
          <p className="text-gray-500">Este QR Code não parece ser válido ou o condomínio não foi encontrado.</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-zinc-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Chamado Enviado!</h1>
            <p className="text-gray-500 mt-2">
              Obrigado, {formData.reportedBy}. Sua solicitação para <strong>{location?.name || 'o condomínio'}</strong> foi registrada com sucesso.
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover transition-all"
          >
            Abrir outro chamado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 md:p-8 flex justify-center items-start">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-zinc-800">
        <div className="bg-primary p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center overflow-hidden">
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Building2 className="w-5 h-5" />
              )}
            </div>
            <span className="font-bold uppercase tracking-widest text-xs opacity-80">Condomínio</span>
          </div>
          <h1 className="text-2xl font-black">{client.name}</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mt-1">
            {companyData?.name || 'FLORES MANUTENÇÃO'}
          </p>
          {location && (
            <div className="flex items-center gap-2 mt-2 opacity-90">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">{location.name}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="w-4 h-4" />
              Seu Nome / Apartamento
            </label>
            <input
              required
              type="text"
              value={formData.reportedBy}
              onChange={(e) => setFormData(prev => ({ ...prev, reportedBy: e.target.value }))}
              placeholder="Ex: João - Apto 42"
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <MessageSquare className="w-4 h-4" />
              Descrição do Problema
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o que está acontecendo..."
              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Camera className="w-4 h-4" />
              Foto do Local (Opcional)
            </label>
            
            <div className="relative">
              {!formData.photo ? (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all">
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">Clique para tirar foto ou upload</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                </label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden h-48 group">
                  <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, photo: null }))}
                    className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition-all"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar Chamado
              </>
            )}
          </button>
        </form>
        
        <div className="p-6 text-center border-t border-gray-50 dark:border-zinc-800">
          <p className="text-xs text-gray-400">
            Sistema de Gestão Predial Inteligente
          </p>
        </div>
      </div>
    </div>
  );
}
