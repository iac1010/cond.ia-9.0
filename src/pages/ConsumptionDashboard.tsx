import React, { useState, useRef, useMemo } from 'react';
import { 
  Droplets, Home, BarChart2, Database, History, Settings, 
  AlertTriangle, CloudRain, Sun, Cloud, ShowerHead, Waves, 
  WashingMachine, HelpCircle, Building, Upload, CheckCircle, FileSpreadsheet,
  Download, Camera, Brain, Loader2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { BackButton } from '../components/BackButton';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function parsePDFText(text: string) {
  const readings = [];
  const tokens = text.split(/\s+/);
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (/^\d{1,2}-[a-z]{3}\.?$/i.test(token)) {
      const date = token.replace('.', '');
      
      const numbers = [];
      let j = i + 1;
      while (j < tokens.length && numbers.length < 3) {
        if (/^\d+$/.test(tokens[j])) {
          numbers.push(parseInt(tokens[j], 10));
        }
        j++;
      }
      
      if (numbers.length === 3) {
        const current = numbers[0];
        const previous = numbers[1];
        const consumption = numbers[2];
        
        let variation = '-';
        let faixa = 'Faixa 1';
        
        // Look ahead for variation and faixa
        let k = j;
        // Limit lookahead to avoid bleeding into next line
        while (k < tokens.length && k < j + 15) {
          const t = tokens[k];
          if (t === 'Faixa' && tokens[k+1] && /^\d$/.test(tokens[k+1])) {
            faixa = `Faixa ${tokens[k+1]}`;
            break;
          }
          if (t === 'SL' || t === '0' || t.includes('%')) {
            variation = t;
            if (tokens[k-1] === '↓' || tokens[k-1] === '↑') {
              variation = tokens[k-1] + ' ' + variation;
            } else if (t.includes('↓') || t.includes('↑')) {
               variation = t.replace('↓', '↓ ').replace('↑', '↑ ');
            }
          }
          k++;
        }
        
        readings.push({
          date,
          current,
          previous,
          consumption,
          variation,
          faixa
        });
      }
    }
  }
  return readings;
}

// Dados iniciais baseados na planilha de monitoramento do condomínio (Fevereiro)
const initialReadings = [
  { date: '28-fev', current: 518, previous: 458, consumption: 60, variation: '↑ 2%', faixa: 'Faixa 2' },
  { date: '27-fev', current: 458, previous: 399, consumption: 59, variation: '↓ 67%', faixa: 'Faixa 2' },
  { date: '26-fev', current: 399, previous: 222, consumption: 177, variation: 'SL', faixa: 'Faixa 2' },
  { date: '25-fev', current: 222, previous: 222, consumption: 0, variation: 'SL', faixa: 'Faixa 2' },
  { date: '24-fev', current: 222, previous: 222, consumption: 0, variation: '↓ 100%', faixa: 'Faixa 2' },
  { date: '23-fev', current: 222, previous: 174, consumption: 48, variation: '↓ 16%', faixa: 'Faixa 2' },
  { date: '22-fev', current: 174, previous: 117, consumption: 57, variation: '↑ 12%', faixa: 'Faixa 2' },
  { date: '21-fev', current: 117, previous: 66, consumption: 51, variation: '↓ 23%', faixa: 'Faixa 2' },
  { date: '20-fev', current: 66, previous: 0, consumption: 66, variation: '↑ 14%', faixa: 'Faixa 2' },
  { date: '19-fev', current: 67862, previous: 67804, consumption: 58, variation: '↓ 6%', faixa: 'Faixa 2' },
  { date: '18-fev', current: 67804, previous: 67742, consumption: 62, variation: '↑ 44%', faixa: 'Faixa 2' },
  { date: '17-fev', current: 67742, previous: 67699, consumption: 43, variation: '↑ 5%', faixa: 'Faixa 1' },
  { date: '16-fev', current: 67699, previous: 67658, consumption: 41, variation: '↓ 33%', faixa: 'Faixa 1' },
  { date: '15-fev', current: 67658, previous: 67597, consumption: 61, variation: '↓ 2%', faixa: 'Faixa 1' },
  { date: '14-fev', current: 67597, previous: 67535, consumption: 62, variation: '↑ 29%', faixa: 'Faixa 1' },
  { date: '13-fev', current: 67535, previous: 67487, consumption: 48, variation: '↓ 11%', faixa: 'Faixa 1' },
  { date: '12-fev', current: 67487, previous: 67433, consumption: 54, variation: '↓ 13%', faixa: 'Faixa 1' },
  { date: '11-fev', current: 67433, previous: 67371, consumption: 62, variation: '↑ 48%', faixa: 'Faixa 1' },
  { date: '10-fev', current: 67371, previous: 67329, consumption: 42, variation: '↓ 9%', faixa: 'Faixa 1' },
  { date: '09-fev', current: 67329, previous: 67283, consumption: 46, variation: '↓ 43%', faixa: 'Faixa 1' },
  { date: '08-fev', current: 67283, previous: 67202, consumption: 81, variation: '↑ 161%', faixa: 'Faixa 1' },
  { date: '07-fev', current: 67202, previous: 67171, consumption: 31, variation: '↑ 63%', faixa: 'Faixa 1' },
  { date: '06-fev', current: 67152, previous: 67062, consumption: 19, variation: '↓ 79%', faixa: 'Faixa 1' },
  { date: '05-fev', current: 67152, previous: 67062, consumption: 90, variation: '↑ 64%', faixa: 'Faixa 1' },
  { date: '04-fev', current: 67062, previous: 67007, consumption: 55, variation: '↑ 41%', faixa: 'Faixa 1' },
  { date: '03-fev', current: 67007, previous: 66968, consumption: 39, variation: '↓ 58%', faixa: 'Faixa 1' },
  { date: '02-fev', current: 66968, previous: 66875, consumption: 93, variation: 'SL', faixa: 'Faixa 1' },
  { date: '01-fev', current: 66875, previous: 66875, consumption: 0, variation: 'SL', faixa: 'Faixa 1' },
];

export default function ConsumptionDashboard() {
  const store = useStore();
  const { processConsumptionReadingWithAI } = store;
  const buildings = useMemo(() => {
    return store.clients.map(c => ({
      id: c.id,
      name: c.name,
      units: c.unit ? parseInt(c.unit) || 0 : 0,
      cisternVolume: c.cisternVolume,
      reservoirVolume: c.reservoirVolume
    }));
  }, [store.clients]);

  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [isUploading, setIsUploading] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [readings, setReadings] = useState(initialReadings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  const handleAIFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsAIProcessing(true);
      try {
        const result = await processConsumptionReadingWithAI(file, 'WATER');
        if (result) {
          toast.success(`Leitura detectada: ${result.value} (Confiança: ${Math.round(result.confidence * 100)}%)`);
          // Add to readings
          const newReading = {
            date: format(new Date(), 'dd-MMM', { locale: ptBR }).toLowerCase(),
            current: result.value,
            previous: readings[0]?.current || 0,
            consumption: readings[0] ? result.value - readings[0].current : 0,
            variation: 'IA',
            faixa: 'Faixa 1'
          };
          setReadings([newReading, ...readings]);
        }
      } catch (error) {
        console.error(error);
        toast.error('Erro ao processar imagem com IA. Verifique sua chave de API.');
      } finally {
        setIsAIProcessing(false);
        if (aiFileInputRef.current) aiFileInputRef.current.value = '';
      }
    }
  };

  const chartData = useMemo(() => {
    // Reverter para mostrar do mais antigo para o mais novo no gráfico
    return [...readings].reverse().map(r => ({
      name: r.date,
      consumo: r.consumption
    }));
  }, [readings]);

  const latestConsumption = readings[0]?.consumption || 0;
  const totalConsumption = readings.reduce((acc, curr) => acc + curr.consumption, 0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      
      try {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }
          
          const newReadings = parsePDFText(fullText);
          
          if (newReadings.length > 0) {
            // Reverse the array to have the newest dates first if the PDF is chronological
            setReadings(newReadings.reverse());
            setUploadSuccess(true);
            toast.success('PDF processado com sucesso!');
          } else {
            toast.error('Não foi possível extrair leituras do PDF.');
          }
        } else {
          const reader = new FileReader();
          
          reader.onload = (event) => {
            try {
              const text = event.target?.result as string;
              const lines = text.split('\n').filter(line => line.trim() !== '');
              
              const newReadings = [];
              // Pula o cabeçalho (i=1)
              for (let i = 1; i < lines.length; i++) {
                // Suporta separador por vírgula ou ponto e vírgula
                const cols = lines[i].split(/[,;]/);
                if (cols.length >= 4) {
                  newReadings.push({
                    date: cols[0].trim(),
                    current: parseInt(cols[1].trim()) || 0,
                    previous: parseInt(cols[2].trim()) || 0,
                    consumption: parseInt(cols[3].trim()) || 0,
                    variation: cols[4] ? cols[4].trim() : '-',
                    faixa: cols[5] ? cols[5].trim() : 'Faixa 1'
                  });
                }
              }
              
              if (newReadings.length > 0) {
                setReadings(newReadings);
                setUploadSuccess(true);
                toast.success('Planilha processada com sucesso!');
              } else {
                toast.error('Formato de planilha inválido. Use o modelo fornecido.');
              }
            } catch (err) {
              toast.error('Erro ao ler o arquivo.');
            } finally {
              setIsUploading(false);
              setTimeout(() => setUploadSuccess(false), 3000);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          };
          
          reader.onerror = () => {
            setIsUploading(false);
            toast.error('Erro ao ler o arquivo.');
          };
          
          reader.readAsText(file);
          return; // Exit early for CSV to handle async reader
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro ao processar o arquivo.');
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadSuccess(false), 3000);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const headers = "Data,Leitura Atual,Leitura Anterior,Consumo (m3),Variação,Faixa\n";
    const sampleData = "28-fev,518,458,60,↑ 2%,Faixa 2\n27-fev,458,399,59,↓ 67%,Faixa 2\n26-fev,399,222,177,SL,Faixa 2\n";
    const blob = new Blob([headers + sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_consumo_agua.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedBuildingObj = useMemo(() => {
    return buildings.find(b => b.id === selectedBuilding);
  }, [buildings, selectedBuilding]);

  if (!selectedBuilding) {
    return (
      <div className="min-h-screen bg-[#0f0f11] text-white relative overflow-hidden font-sans -m-8 flex flex-col items-center justify-center p-8">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-black/80"></div>
        
        <div className="relative z-10 w-full max-w-4xl">
          <div className="flex items-center gap-4 mb-12 justify-center">
            <BackButton />
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <Droplets className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-light tracking-wide text-center">
              <span className="font-bold">SmartWater</span> Gestão
            </h1>
          </div>

          <h2 className="text-2xl font-light text-center mb-8 text-white/80">Selecione o Prédio / Condomínio</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {buildings.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBuilding(b.id)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 transition-all duration-300 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 group"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:bg-blue-500/20 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                  <Building className="w-8 h-8 text-white/50 group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-1">{b.name}</h3>
                  <p className="text-sm text-white/50">{b.units} unidades</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const buildingName = selectedBuildingObj?.name;

  const cisternCapacity = selectedBuildingObj?.cisternVolume || 15600;
  const currentCisternVolume = Math.round(cisternCapacity * 0.78); // Simulating 78% for now if no real sensor data

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans -m-8 flex flex-col">
      {/* Matte Black Background */}
      <div className="absolute inset-0 z-0 bg-[#0f0f11]">
        {/* Subtle noise texture for the matte/frosted effect */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-black/80"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-8 md:p-12 h-full flex flex-col flex-1">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 px-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <div title="Voltar para seleção de prédio">
              <BackButton onClick={() => setSelectedBuilding(null)} />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <Droplets className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-light tracking-wide">
                <span className="font-bold">SmartWater</span> - {buildingName}
              </h1>
            </div>
          </div>

          <nav className="hidden md:flex gap-8">
            <NavItem icon={<Home />} label="Visão Geral" active={activeTab === 'visao-geral'} onClick={() => setActiveTab('visao-geral')} />
            <NavItem icon={<BarChart2 />} label="Consumo" active={activeTab === 'consumo'} onClick={() => setActiveTab('consumo')} />
            <NavItem icon={<Database />} label="Cisterna" active={activeTab === 'cisterna'} onClick={() => setActiveTab('cisterna')} />
            <NavItem icon={<History />} label="Histórico" active={activeTab === 'historico'} onClick={() => setActiveTab('historico')} />
            <NavItem icon={<Settings />} label="Configurações" active={activeTab === 'configuracoes'} onClick={() => setActiveTab('configuracoes')} />
          </nav>
        </header>

        {/* Greeting & Upload */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <h2 className="text-2xl font-light text-white/90 drop-shadow-md">
            Olá! Gestão de água para <span className="font-bold text-white">{buildingName}</span>.
          </h2>
          
          {/* Quick Upload Button */}
          <div className="flex gap-3">
            <button 
              onClick={downloadTemplate}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-4 py-2 rounded-xl font-bold tracking-wider uppercase text-xs transition-all flex items-center gap-2 backdrop-blur-md"
              title="Baixar modelo de planilha CSV"
            >
              <Download className="w-4 h-4" />
              Modelo CSV
            </button>
            <input 
              type="file" 
              ref={aiFileInputRef} 
              onChange={handleAIFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button 
              onClick={() => aiFileInputRef.current?.click()}
              disabled={isAIProcessing}
              className="bg-purple-600/80 hover:bg-purple-500 border border-purple-400/30 text-white px-4 py-2 rounded-xl font-bold tracking-wider uppercase text-xs transition-all flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              {isAIProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              {isAIProcessing ? 'Processando IA...' : 'Leitura por Foto (IA)'}
            </button>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".csv,.pdf" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-blue-600/80 hover:bg-blue-500 border border-blue-400/30 text-white px-4 py-2 rounded-xl font-bold tracking-wider uppercase text-xs transition-all flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : uploadSuccess ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              {isUploading ? 'Processando...' : uploadSuccess ? 'Sucesso' : 'Importar (CSV/PDF)'}
            </button>
          </div>
        </div>

        {/* Dynamic Content Based on Tab */}
        {activeTab === 'visao-geral' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            {/* Left Column - Visão Geral */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <GlassPanel className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <h3 className="text-lg font-bold tracking-widest uppercase mb-6 self-start w-full">Visão Geral</h3>
                
                {/* Circular Progress */}
                <div className="relative w-48 h-48 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="45" fill="none" 
                      stroke="url(#gradient)" strokeWidth="8" 
                      strokeDasharray="282.7" strokeDashoffset="56.5" 
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-500/10 rounded-full m-4 border border-blue-400/30 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider text-center px-2">Última Leitura:</span>
                    <span className="text-3xl font-black text-white drop-shadow-lg">{latestConsumption} m³</span>
                  </div>
                </div>
                <p className="text-sm font-bold text-white/80 tracking-widest uppercase">Total Acumulado: {totalConsumption} m³</p>

                <div className="w-full h-px bg-white/20 my-6"></div>

                <div className="flex flex-col gap-4 w-full">
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-16 border-2 border-white/40 rounded-lg relative overflow-hidden bg-white/5 p-0.5">
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 h-[78%] rounded-sm">
                        <div className="absolute top-0 left-0 w-full h-full opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBhdGggZD0iTTAgNWM1IDAgNS01IDEwLTUgNSAwIDUgNSA1IDVzNS01IDEwLTUgNSAwIDUgNSA1IDV2NWgtNDB6IiBmaWxsPSIjZmZmIi8+PC9zdmc+')] bg-repeat-x opacity-30"></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Nível da Cisterna:</p>
                      <p className="text-lg font-black text-white">78% (Médio)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full mt-2">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 ${readings[0]?.faixa?.includes('2') ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-white/10 border-white/20 text-white'}`}>
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Status de Consumo:</p>
                      <p className={`text-lg font-black ${readings[0]?.faixa?.includes('2') ? 'text-orange-400' : 'text-white'}`}>
                        {readings[0]?.faixa || 'Faixa 1'}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            </div>

            {/* Middle Column */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              {/* Alertas */}
              <GlassPanel className="bg-orange-500/10 border-orange-500/30 flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-widest uppercase text-orange-200">Alertas</h3>
                  <p className="text-white/90">Pico de consumo detectado no dia 01-mar (119 m³).</p>
                </div>
              </GlassPanel>

              {/* Chart */}
              <GlassPanel className="flex-1 p-6 flex flex-col">
                <h3 className="text-lg font-bold tracking-widest uppercase mb-6">Evolução do Consumo (m³)</h3>
                <div className="flex-1 w-full min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.7)'}} axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.7)'}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="consumo" name="Consumo (m³)" stroke="#38bdf8" strokeWidth={4} dot={{r: 4, fill: '#38bdf8', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} style={{ filter: 'drop-shadow(0px 0px 8px rgba(56,189,248,0.8))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-white/50 mt-4 uppercase tracking-widest">Dias de Medição</p>
              </GlassPanel>

              {/* Detalhamento */}
              <GlassPanel className="p-6">
                <h3 className="text-sm font-bold tracking-widest uppercase mb-4 text-white/80">Estatísticas Rápidas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem icon={<BarChart2 className="w-5 h-5" />} label="Média Diária" value={`${(totalConsumption / readings.length).toFixed(1)} m³`} />
                  <DetailItem icon={<AlertTriangle className="w-5 h-5" />} label="Maior Consumo" value={`${Math.max(...readings.map(r => r.consumption))} m³`} />
                  <DetailItem icon={<ShowerHead className="w-5 h-5" />} label="Menor Consumo" value={`${Math.min(...readings.map(r => r.consumption))} m³`} />
                  <DetailItem icon={<History className="w-5 h-5" />} label="Dias Medidos" value={`${readings.length} dias`} />
                </div>
              </GlassPanel>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              {/* Cisterna */}
              <GlassPanel className="flex-1 p-6 flex flex-col items-center relative">
                <h3 className="text-lg font-bold tracking-widest uppercase mb-8 self-start w-full">Cisterna</h3>
                
                <div className="flex items-center justify-center gap-6 flex-1 w-full">
                  <div className="flex flex-col justify-between h-48 text-xs font-bold text-white/60 tracking-widest text-right">
                    <span>CHEIO &mdash;</span>
                    <span>MÉDIO &mdash;</span>
                    <span>BAIXO &mdash;</span>
                    <span>VAZIO &mdash;</span>
                  </div>
                  
                  <div className="w-24 h-48 border-4 border-white/30 rounded-t-3xl rounded-b-xl relative overflow-hidden bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.1)] p-1">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 border-4 border-white/30 border-b-0 rounded-t-lg"></div>
                    <div className="absolute bottom-1 left-1 right-1 bg-gradient-to-t from-blue-700 via-blue-500 to-cyan-400 h-[78%] rounded-b-lg rounded-t-sm shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]">
                      {/* Bubbles */}
                      <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-white/60 rounded-full animate-ping"></div>
                      <div className="absolute bottom-6 right-3 w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-12 left-4 w-1 h-1 bg-white/50 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                      
                      {/* Surface Wave */}
                      <div className="absolute top-0 left-0 w-full h-2 bg-white/30 rounded-t-full"></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center w-full bg-white/5 py-3 rounded-xl border border-white/10">
                  <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Cisterna Principal</p>
                  <p className="text-sm font-black text-white">CAPACIDADE: 78% | {cisternCapacity.toLocaleString()} L</p>
                </div>
              </GlassPanel>

              {/* Previsão */}
              <GlassPanel className="p-6">
                <h3 className="text-sm font-bold tracking-widest uppercase mb-4 text-white/80">Previsão do Tempo & Captação</h3>
                <div className="flex justify-around items-center mb-4">
                  <Sun className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" />
                  <Cloud className="w-8 h-8 text-white/70" />
                  <CloudRain className="w-8 h-8 text-blue-300 drop-shadow-[0_0_10px_rgba(147,197,253,0.6)]" />
                </div>
                <p className="text-center text-[11px] text-white/70 uppercase tracking-wider">
                  Próxima Chuva: <span className="font-bold text-white">Moderada (Sáb)</span> | Est. Captação: <span className="font-bold text-white">+4.000 L</span>
                </p>
              </GlassPanel>
            </div>
          </div>
        )}

        {activeTab === 'consumo' && (
          <div className="flex flex-col gap-6 flex-1">
            <GlassPanel className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold tracking-widest uppercase mb-2">Análise de Consumo</h3>
                <p className="text-white/60">Acompanhe a evolução do consumo de água do condomínio com base nas leituras importadas.</p>
              </div>
            </GlassPanel>
            
            <GlassPanel className="flex-1 p-8 flex flex-col">
              <h3 className="text-lg font-bold tracking-widest uppercase mb-6">Evolução do Consumo (m³)</h3>
              <div className="flex-1 w-full min-h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.7)'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.7)'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="consumo" name="Consumo (m³)" stroke="#38bdf8" strokeWidth={4} dot={{r: 6, fill: '#38bdf8', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} style={{ filter: 'drop-shadow(0px 0px 8px rgba(56,189,248,0.8))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>
          </div>
        )}

        {activeTab === 'cisterna' && (
          <div className="flex flex-col gap-6 flex-1">
            <GlassPanel className="flex-1 p-8 flex flex-col items-center justify-center relative">
              <h3 className="text-2xl font-bold tracking-widest uppercase mb-12">Monitoramento da Cisterna</h3>
              <div className="flex flex-col md:flex-row items-center justify-center gap-12 w-full max-w-4xl">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col justify-between h-96 text-sm font-bold text-white/60 tracking-widest text-right">
                    <span>100% &mdash;</span>
                    <span>75% &mdash;</span>
                    <span>50% &mdash;</span>
                    <span>25% &mdash;</span>
                    <span>0% &mdash;</span>
                  </div>
                  
                  <div className="w-48 h-96 border-4 border-white/30 rounded-t-[3rem] rounded-b-2xl relative overflow-hidden bg-white/5 shadow-[0_0_50px_rgba(255,255,255,0.1)] p-2">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-6 border-4 border-white/30 border-b-0 rounded-t-xl"></div>
                    <div className="absolute bottom-2 left-2 right-2 bg-gradient-to-t from-blue-700 via-blue-500 to-cyan-400 h-[78%] rounded-b-xl rounded-t-md shadow-[inset_0_0_30px_rgba(255,255,255,0.4)]">
                      {/* Bubbles */}
                      <div className="absolute bottom-4 left-4 w-3 h-3 bg-white/60 rounded-full animate-ping"></div>
                      <div className="absolute bottom-12 right-6 w-4 h-4 bg-white/40 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-24 left-8 w-2 h-2 bg-white/50 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                      <div className="absolute bottom-32 right-8 w-3 h-3 bg-white/50 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                      
                      {/* Surface Wave */}
                      <div className="absolute top-0 left-0 w-full h-4 bg-white/30 rounded-t-full"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-6 w-full max-w-sm">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <p className="text-sm font-bold text-white/70 uppercase tracking-widest mb-2">Volume Atual</p>
                    <p className="text-4xl font-black text-blue-400">{currentCisternVolume.toLocaleString()} L</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <p className="text-sm font-bold text-white/70 uppercase tracking-widest mb-2">Capacidade Total</p>
                    <p className="text-4xl font-black text-white">{cisternCapacity.toLocaleString()} L</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <p className="text-sm font-bold text-white/70 uppercase tracking-widest mb-2">Status</p>
                    <p className="text-2xl font-black text-white">Nível Adequado</p>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="flex flex-col gap-6 flex-1">
            <GlassPanel className="flex-1 p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold tracking-widest uppercase">Histórico de Leituras</h3>
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">
                  {readings.length} Registros
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 text-sm uppercase tracking-wider">
                      <th className="p-4 font-medium">Data</th>
                      <th className="p-4 font-medium">Leitura Atual</th>
                      <th className="p-4 font-medium">Leitura Anterior</th>
                      <th className="p-4 font-medium">Consumo (m³)</th>
                      <th className="p-4 font-medium">Variação</th>
                      <th className="p-4 font-medium">Faixa</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/90">
                    {readings.map((reading, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">{reading.date}</td>
                        <td className="p-4 font-mono">{reading.current}</td>
                        <td className="p-4 font-mono">{reading.previous}</td>
                        <td className="p-4 font-bold text-blue-400">{reading.consumption}</td>
                        <td className={`p-4 ${
                          reading.variation.includes('↑') ? 'text-red-400' : 
                          reading.variation.includes('↓') ? 'text-white' : 'text-white/50'
                        }`}>
                          {reading.variation}
                        </td>
                        <td className={`p-4 font-bold ${
                          reading.faixa?.includes('2') ? 'text-orange-400' : 'text-white'
                        }`}>
                          {reading.faixa || 'Faixa 1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          </div>
        )}

        {activeTab === 'configuracoes' && (
          <div className="flex flex-col gap-6 flex-1">
            <GlassPanel className="p-8 max-w-2xl mx-auto w-full">
              <h3 className="text-xl font-bold tracking-widest uppercase mb-8">Configurações do Prédio</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Nome do Condomínio</label>
                  <input type="text" value={buildingName || ''} readOnly className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500/50 transition-colors" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Meta de Consumo Diário (L)</label>
                  <input type="number" defaultValue={350} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500/50 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Capacidade da Cisterna (L)</label>
                  <input type="number" defaultValue={cisternCapacity} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-blue-500/50 transition-colors" />
                </div>

                <div className="pt-6 border-t border-white/10">
                  <button 
                    onClick={() => setSelectedBuilding(null)}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-6 py-4 rounded-xl font-bold tracking-wider uppercase text-sm transition-all"
                  >
                    Trocar de Prédio
                  </button>
                </div>
              </div>
            </GlassPanel>
          </div>
        )}

      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${active ? 'text-white' : 'text-white/50 hover:text-white/80'}`}>
      <div className={`p-2 rounded-xl ${active ? 'bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : ''}`}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
      </div>
      <span className="text-xs font-bold tracking-widest uppercase">{label}</span>
    </button>
  );
}

function GlassPanel({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl ${className}`}>
      {children}
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
      <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{label}</p>
        <p className="text-sm font-black text-white">{value}</p>
      </div>
    </div>
  );
}
