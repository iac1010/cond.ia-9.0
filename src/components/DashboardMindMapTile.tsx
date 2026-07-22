import { useState, useEffect, useRef } from 'react';
import { 
  Network, Plus, Trash2, Edit3, HelpCircle, Save, Sliders, Check, 
  Map, ZoomIn, ZoomOut, Maximize2, RefreshCw, Layout, Smartphone,
  Radio, Cpu, Lightbulb, Shield, Thermometer, Wifi, Link, Info, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export interface MindMapNode {
  id: string;
  label: string;
  type: 'hub' | 'room' | 'device' | 'group' | string;
  protocol?: 'WiFi' | 'Zigbee' | 'ZWave' | 'Bluetooth' | 'IP' | 'N/A' | string;
  deviceType?: 'light' | 'switch' | 'sensor' | 'security' | 'climate' | 'media' | 'other' | string;
  status?: 'active' | 'inactive';
  details?: string;
  parentId?: string | null;
  connectionDisabled?: boolean;
  ipAddress?: string;
  battery?: number;
  signal?: number;
  // Position offsets for flexible visualization
  x: number;
  y: number;
}

const ROOM_COLORS: Record<string, string> = {
  hub: 'from-purple-600 to-indigo-600 border-purple-400 text-white',
  room: 'from-sky-600 to-blue-600 border-sky-400 text-white',
  group: 'from-amber-600 to-orange-600 border-amber-400 text-white',
  device: 'from-zinc-800 to-zinc-900 border-zinc-700 text-zinc-200'
};

const PROTOCOL_ICONS: Record<string, string> = {
  WiFi: '🌐',
  Zigbee: '🐝',
  ZWave: '🌊',
  Bluetooth: '🦷',
  IP: '🔌'
};

const DEVICE_ICONS: Record<string, string> = {
  light: '💡',
  switch: '🎛️',
  sensor: '🌡️',
  security: '🛡️',
  climate: '❄️',
  media: '📺',
  other: '⚙️'
};

export function DashboardMindMapTile({ 
  isEditMode 
}: { 
  isEditMode: boolean;
}) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mindmap nodes state
  const [nodes, setNodes] = useState<MindMapNode[]>(() => {
    const saved = localStorage.getItem('condfy_installation_mindmap');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Error reading installation mindmap nodes:', e);
      }
    }
    
    // Seed gorgeous smart home mindmap preset
    return [
      { id: '1', label: 'Central Home Assistant', type: 'hub', protocol: 'IP', status: 'active', details: 'Intel NUC - Sala de Servomarcas', x: 200, y: 150 },
      
      // Rooms
      { id: '2', label: 'Sala de Estar', type: 'room', parentId: '1', status: 'active', details: 'Automação principal', x: 380, y: 60 },
      { id: '3', label: 'Suíte Principal', type: 'room', parentId: '1', status: 'active', details: 'Quarto dócil recatado', x: 380, y: 240 },
      { id: '4', label: 'Área Externa', type: 'room', parentId: '1', status: 'active', details: 'Jardim e Lazer', x: 50, y: 150 },

      // Room 1 Devices
      { id: '5', label: 'Interruptor Touch 4CH', type: 'device', parentId: '2', protocol: 'Zigbee', deviceType: 'switch', status: 'active', details: 'Controle de Plafon e fita LED', x: 530, y: 20 },
      { id: '6', label: 'Sensor de Presença', type: 'device', parentId: '2', protocol: 'Zigbee', deviceType: 'sensor', status: 'active', details: 'Radar de ondas milimétricas Tuya', x: 530, y: 100 },

      // Room 2 Devices
      { id: '7', label: 'Fechadura Smart', type: 'device', parentId: '3', protocol: 'Zigbee', deviceType: 'security', status: 'active', details: 'Fechadura de embutir Yale', x: 530, y: 200 },
      { id: '8', label: 'Módulo Variador AR', type: 'device', parentId: '3', protocol: 'WiFi', deviceType: 'climate', status: 'active', details: 'Controle Condicionado Split', x: 530, y: 280 },

      // Room 3 Devices
      { id: '9', label: 'Controle de Irrigação', type: 'device', parentId: '4', protocol: 'WiFi', deviceType: 'other', status: 'inactive', details: 'Valvula de Solenoide 12V', x: -100, y: 90 },
      { id: '10', label: 'Refletor Spot RGB', type: 'device', parentId: '4', protocol: 'Zigbee', deviceType: 'light', status: 'active', details: 'Spot Jardim dimerizável', x: -100, y: 210 }
    ];
  });

  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [activeView, setActiveView] = useState<'view' | 'edit-node' | 'add' | 'templates'>('view');
  
  // Map configuration
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [layoutMode, setLayoutMode] = useState<'radial' | 'organic'>('radial');

  // Form states
  const [formLabel, setFormLabel] = useState('');
  const [formType, setFormType] = useState<'hub' | 'room' | 'device' | 'group' | 'custom'>('device');
  const [formProtocol, setFormProtocol] = useState<'WiFi' | 'Zigbee' | 'ZWave' | 'Bluetooth' | 'IP' | 'N/A' | 'custom'>('Zigbee');
  const [formDeviceType, setFormDeviceType] = useState<'light' | 'switch' | 'sensor' | 'security' | 'climate' | 'media' | 'other' | 'custom'>('light');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formDetails, setFormDetails] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [customType, setCustomType] = useState('');
  const [customProtocol, setCustomProtocol] = useState('');
  const [customDeviceType, setCustomDeviceType] = useState('');

  // Persists the custom map structure to localStorage
  useEffect(() => {
    localStorage.setItem('condfy_installation_mindmap', JSON.stringify(nodes));
  }, [nodes]);

  // Handle external backup/restore syncing
  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem('condfy_installation_mindmap');
      if (saved) {
        try {
          setNodes(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener('condfy_installation_mindmap_updated', handleSync);
    return () => {
      window.removeEventListener('condfy_installation_mindmap_updated', handleSync);
    };
  }, []);

  // Preset smart home templates
  const applyPresetTemplate = (type: 'small' | 'large' | 'comercial') => {
    let preset: MindMapNode[] = [];
    if (type === 'small') {
      preset = [
        { id: '1', label: 'Hub Zigbee Tuya', type: 'hub', protocol: 'WiFi', status: 'active', details: 'Hub central USB Sala', x: 200, y: 150 },
        { id: '2', label: 'Cozinha', type: 'room', parentId: '1', status: 'active', x: 380, y: 100 },
        { id: '3', label: 'Quarto Principal', type: 'room', parentId: '1', status: 'active', x: 380, y: 200 },
        { id: '4', label: 'Fita LED Sanca', type: 'device', parentId: '2', protocol: 'Zigbee', deviceType: 'light', status: 'active', details: 'LED integrada cozinha americana', x: 520, y: 80 },
        { id: '5', label: 'Sensor Temperatura', type: 'device', parentId: '3', protocol: 'Zigbee', deviceType: 'sensor', status: 'active', details: 'Monitoramento climatização', x: 520, y: 220 }
      ];
    } else if (type === 'comercial') {
      preset = [
        { id: '1', label: 'Bridge Corporativa KNX', type: 'hub', protocol: 'IP', status: 'active', details: 'Quadro Central de Redes', x: 200, y: 150 },
        { id: '2', label: 'Sala de Reunião', type: 'room', parentId: '1', status: 'active', x: 380, y: 60 },
        { id: '3', label: 'Recepção', type: 'room', parentId: '1', status: 'active', x: 50, y: 60 },
        { id: '4', label: 'Projetor Laser', type: 'device', parentId: '2', protocol: 'IP', deviceType: 'media', status: 'active', x: 530, y: 20 },
        { id: '5', label: 'Sensor Presença PoE', type: 'device', parentId: '2', protocol: 'IP', deviceType: 'sensor', status: 'active', x: 530, y: 100 },
        { id: '6', label: 'Controle de Acesso', type: 'device', parentId: '3', protocol: 'WiFi', deviceType: 'security', status: 'active', x: -100, y: 20 },
        { id: '7', label: 'Som Ambiente', type: 'device', parentId: '3', protocol: 'Bluetooth', deviceType: 'media', status: 'active', x: -100, y: 100 }
      ];
    } else {
      preset = [
        { id: '1', label: 'Central Inteligente Homey', type: 'hub', protocol: 'IP', status: 'active', details: 'Gateway Multiprotocolo', x: 200, y: 150 },
        { id: '2', label: 'Living', type: 'room', parentId: '1', status: 'active', x: 380, y: 50 },
        { id: '3', label: 'Garagem', type: 'room', parentId: '1', status: 'active', x: 380, y: 250 },
        { id: '4', label: 'Varanda Gourmet', type: 'room', parentId: '1', status: 'active', x: 50, y: 250 },
        { id: '5', label: 'Home Cinema', type: 'device', parentId: '2', protocol: 'WiFi', deviceType: 'media', status: 'active', x: 520, y: 10 },
        { id: '6', label: 'Cortina Integrada', type: 'device', parentId: '2', protocol: 'Zigbee', deviceType: 'switch', status: 'active', x: 520, y: 80 },
        { id: '7', label: 'Portão Garagem', type: 'device', parentId: '3', protocol: 'ZWave', deviceType: 'switch', status: 'active', x: 520, y: 220 },
        { id: '8', label: 'Câmera IP Speed', type: 'device', parentId: '3', protocol: 'IP', deviceType: 'security', status: 'active', x: 520, y: 290 },
        { id: '9', label: 'Módulo Jacuzzi', type: 'device', parentId: '4', protocol: 'WiFi', deviceType: 'other', status: 'inactive', x: -100, y: 260 }
      ];
    }
    
    setNodes(preset);
    setSelectedNode(null);
    setActiveView('view');
    toast.success('Template de mapa aplicado com sucesso!');
  };

  // Redestribute layout organically or radially
  const performAutoLayout = () => {
    const parent = nodes.find(n => n.type === 'hub') || nodes[0];
    if (!parent) return;

    let updated = [...nodes];
    const hubIndex = updated.findIndex(n => n.id === parent.id);
    if (hubIndex !== -1) {
      updated[hubIndex] = { ...parent, x: 200, y: 150 };
    }

    // Filter secondary rooms
    const rooms = updated.filter(n => n.parentId === parent.id && n.type === 'room');
    rooms.forEach((room, roomIdx) => {
      // Circle spacing
      const angle = (roomIdx / rooms.length) * 2 * Math.PI;
      const radius = 160;
      const rx = 200 + radius * Math.cos(angle);
      const ry = 150 + radius * Math.sin(angle);
      
      const rIdx = updated.findIndex(n => n.id === room.id);
      if (rIdx !== -1) {
        updated[rIdx] = { ...room, x: rx, y: ry };
      }

      // Spacing room devices out from their room node center
      const devices = updated.filter(n => n.parentId === room.id && n.type === 'device');
      devices.forEach((dev, devIdx) => {
        const dAngle = angle + ((devIdx - (devices.length - 1) / 2) * 0.35);
        const dRadius = 120;
        const dx = rx + dRadius * Math.cos(dAngle);
        const dy = ry + dRadius * Math.sin(dAngle);

        const dIdx = updated.findIndex(n => n.id === dev.id);
        if (dIdx !== -1) {
          updated[dIdx] = { ...dev, x: dx, y: dy };
        }
      });
    });

    setNodes(updated);
    toast.success('Visual reorganizado via algoritmo radial!');
  };

  // Node Drag and drop movement inside viewport
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    if (isEditMode) return; // Ignore dragging if dashboard is customizable
    setIsDraggingNode(nodeId);
    e.stopPropagation();
    
    // Scale matching zoom
    const clientX = e.clientX;
    const clientY = e.clientY;
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    if (isDraggingNode) {
      const dx = (e.clientX - dragStartRef.current.x) / zoom;
      const dy = (e.clientY - dragStartRef.current.y) / zoom;
      
      setNodes(prev => prev.map(n => n.id === isDraggingNode ? { 
        ...n, 
        x: Math.round(n.x + dx), 
        y: Math.round(n.y + dy) 
      } : n));
      
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleGlobalMouseUp = () => {
    setIsDraggingNode(null);
  };

  // Form edit handlers
  const openEditNode = (node: MindMapNode) => {
    setSelectedNode(node);
    setFormLabel(node.label);

    const standardTypes = ['hub', 'room', 'device', 'group'];
    if (!standardTypes.includes(node.type)) {
      setFormType('custom');
      setCustomType(node.type);
    } else {
      setFormType(node.type as any);
      setCustomType('');
    }

    const standardProtocols = ['WiFi', 'Zigbee', 'ZWave', 'Bluetooth', 'IP', 'N/A'];
    if (node.protocol && !standardProtocols.includes(node.protocol)) {
      setFormProtocol('custom');
      setCustomProtocol(node.protocol);
    } else {
      setFormProtocol((node.protocol as any) || 'Zigbee');
      setCustomProtocol('');
    }

    const standardDeviceTypes = ['light', 'switch', 'sensor', 'security', 'climate', 'media', 'other'];
    if (node.deviceType && !standardDeviceTypes.includes(node.deviceType)) {
      setFormDeviceType('custom');
      setCustomDeviceType(node.deviceType);
    } else {
      setFormDeviceType((node.deviceType as any) || 'light');
      setCustomDeviceType('');
    }

    setFormStatus(node.status || 'active');
    setFormDetails(node.details || '');
    setFormParentId(node.parentId || '');
    setActiveView('edit-node');
  };

  const openAddNode = () => {
    setFormLabel('');
    setFormType('device');
    setFormProtocol('Zigbee');
    setFormDeviceType('light');
    setCustomType('');
    setCustomProtocol('');
    setCustomDeviceType('');
    setFormStatus('active');
    setFormDetails('');
    // Try to pre-fill parent node as the currently selected or primary hub
    const defaultParent = selectedNode ? selectedNode.id : (nodes.find(n => n.type === 'hub')?.id || '');
    setFormParentId(defaultParent);
    setActiveView('add');
  };

  const openAddNodeWithParent = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormLabel('');
    setFormType('device');
    setFormProtocol('Zigbee');
    setFormDeviceType('light');
    setCustomType('');
    setCustomProtocol('');
    setCustomDeviceType('');
    setFormStatus('active');
    setFormDetails('');
    setFormParentId(parentId);
    setActiveView('add');
  };

  const toggleNodeConnection = (nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextVal = !n.connectionDisabled;
        toast.success(nextVal ? '🔌 Conexão Desativada / Desligada' : '🔌 Conexão Ativada / Ligada');
        return { ...n, connectionDisabled: nextVal };
      }
      return n;
    }));
    setSelectedNode(prev => {
      if (prev && prev.id === nodeId) {
        return { ...prev, connectionDisabled: !prev.connectionDisabled };
      }
      return prev;
    });
  };

  const toggleNodePowerStatus = (nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextStatus = n.status === 'active' ? 'inactive' : 'active';
        toast.success(nextStatus === 'active' ? '💡 Ponto de Instalação Ligado' : '🔌 Ponto Desligado (Offline)');
        return { ...n, status: nextStatus };
      }
      return n;
    }));
    setSelectedNode(prev => {
      if (prev && prev.id === nodeId) {
        return { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' };
      }
      return prev;
    });
  };

  const saveEditedNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;

    const finalType = formType === 'custom' ? (customType.trim() || 'Nossa Sessão') : formType;
    const finalProtocol = (formType === 'device' || formType === 'hub' || formType === 'custom')
      ? (formProtocol === 'custom' ? (customProtocol.trim() || 'Nossa Sessão') : formProtocol)
      : undefined;
    const finalDeviceType = (formType === 'device' || formType === 'custom')
      ? (formDeviceType === 'custom' ? (customDeviceType.trim() || 'Nossa Sessão') : formDeviceType)
      : undefined;

    setNodes(prev => prev.map(n => n.id === selectedNode.id ? {
      ...n,
      label: formLabel,
      type: finalType,
      protocol: finalProtocol,
      deviceType: finalDeviceType,
      status: formStatus,
      details: formDetails,
      parentId: formParentId || null,
      connectionDisabled: selectedNode.connectionDisabled
    } : n));

    toast.success('Dispositivo atualizado no mapa!');
    setActiveView('view');
  };

  const saveAddedNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) {
      toast.error('Informe um rótulo ou nome para o nó.');
      return;
    }

    const finalType = formType === 'custom' ? (customType.trim() || 'Nossa Sessão') : formType;
    const finalProtocol = (formType === 'device' || formType === 'hub' || formType === 'custom')
      ? (formProtocol === 'custom' ? (customProtocol.trim() || 'Nossa Sessão') : formProtocol)
      : undefined;
    const finalDeviceType = (formType === 'device' || formType === 'custom')
      ? (formDeviceType === 'custom' ? (customDeviceType.trim() || 'Nossa Sessão') : formDeviceType)
      : undefined;

    const newNode: MindMapNode = {
      id: 'node-' + Date.now(),
      label: formLabel.trim(),
      type: finalType,
      protocol: finalProtocol,
      deviceType: finalDeviceType,
      status: formStatus,
      details: formDetails,
      parentId: formParentId || null,
      // Default offset relative to window center or parent node
      x: 150 + Math.random() * 100,
      y: 120 + Math.random() * 100
    };

    setNodes(prev => [...prev, newNode]);
    toast.success('Nó adicionado ao mapa!');
    setActiveView('view');
  };

  const deleteNode = (id: string) => {
    // Delete and safely unlink descendants/children
    setNodes(prev => prev.filter(n => n.id !== id).map(n => n.parentId === id ? { ...n, parentId: null } : n));
    toast.success('Dispositivo deletado do mapa.');
    setSelectedNode(null);
    setActiveView('view');
  };

  const activeCount = nodes.filter(n => n.status !== 'inactive').length;

  return (
    <div 
      className="w-full h-full bg-gradient-to-b from-zinc-950/90 via-zinc-900/90 to-zinc-950/95 text-white rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden relative shadow-2xl backdrop-blur-md"
      onMouseMove={handleGlobalMouseMove}
      onMouseUp={handleGlobalMouseUp}
      onMouseLeave={handleGlobalMouseUp}
    >
      {/* GLOW EFFECT */}
      <div className="absolute top-0 left-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER */}
      <div className="px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur-xl z-10 select-none">
        <div 
          onClick={() => !isEditMode && navigate('/installation-mindmap')}
          className="flex items-center gap-2.5 cursor-pointer group min-w-0"
        >
          <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30 group-hover:border-indigo-400 group-hover:scale-105 transition-all text-indigo-400 shrink-0">
            <Network size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-white group-hover:text-indigo-300 transition-colors truncate">
                Mapa de Instalação
              </h3>
              <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-ping" />
                {activeCount}/{nodes.length} Online
              </span>
            </div>
            <p className="text-[8.5px] text-zinc-400 font-medium tracking-wide flex items-center gap-1 truncate group-hover:text-indigo-400 transition-colors mt-0.5">
              <span>Relatórios &amp; Telas</span>
              <Maximize2 size={8} className="text-indigo-400" />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            onClick={() => navigate('/installation-mindmap')}
            className="p-1.5 px-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-md hover:scale-105 active:scale-95"
            title="Abrir Tela Completa com Relatórios"
          >
            <Maximize2 size={10} /> Expandir
          </button>

          <button
            onClick={() => setActiveView('templates')}
            className="p-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-[9px] font-bold uppercase transition-all shadow-md hover:scale-105 active:scale-95"
            title="Gabaritos & Presets"
          >
            Templates
          </button>
          
          <button
            onClick={openAddNode}
            disabled={isEditMode}
            className="p-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all disabled:opacity-50 hover:scale-105 active:scale-95 shadow-md"
            title="Adicionar Novo Ponto"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* BODY VIEWPORT OR SHEET FOR EDITING */}
      <div className="flex-1 overflow-hidden relative flex flex-col justify-between" ref={containerRef}>
        {/* CANVAS SCHEMATIC BACKGROUND GRID PATTERN */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
        <AnimatePresence mode="wait">
          {activeView === 'view' && (
            <motion.div 
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full relative"
            >
              {/* INTERACTIVE CONTROLS OVERLAY */}
              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
                <div className="flex rounded-lg bg-black/60 border border-white/10 p-0.5 backdrop-blur-md">
                  <button 
                    onClick={() => setZoom(z => Math.max(0.5, z - 0.15))}
                    className="p-1 hover:bg-white/10 text-white transition-colors rounded"
                    title="Afastar Zoom"
                  >
                    <ZoomOut size={11} />
                  </button>
                  <span className="text-[8px] font-bold text-zinc-400 px-1 border-r border-l border-white/5 flex items-center justify-center min-w-[28px]">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button 
                    onClick={() => setZoom(z => Math.min(2.0, z + 0.15))}
                    className="p-1 hover:bg-white/10 text-white transition-colors rounded"
                    title="Aproximar Zoom"
                  >
                    <ZoomIn size={11} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={performAutoLayout}
                  className="p-1 rounded bg-black/60 border border-white/10 text-white hover:text-indigo-400 transition-all font-bold flex items-center gap-1 text-[8px] uppercase tracking-wider backdrop-blur-md"
                  title="Auto Ordenação de nós para melhor visibilidade"
                >
                  <RefreshCw size={9} /> Organizar
                </button>
              </div>

              {/* NODE MAP SVG VIEWER WITH CONNECTOR CHANNELS */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                {nodes.map(node => {
                  if (!node.parentId) return null;
                  const parent = nodes.find(n => n.id === node.parentId);
                  if (!parent) return null;

                  // Compute absolute coordinates inside viewBox center
                  const x1 = parent.x * zoom + pan.x;
                  const y1 = parent.y * zoom + pan.y;
                  const x2 = node.x * zoom + pan.x;
                  const y2 = node.y * zoom + pan.y;

                  return (
                    <g key={`link-${node.id}`}>
                      {/* Connection trace spline path */}
                      <path
                        d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke={node.connectionDisabled ? '#ef4444' : ((node.type === 'device' || !['hub', 'room', 'group'].includes(node.type)) ? '#6366f1' : '#38bdf8')}
                        strokeWidth={node.connectionDisabled ? 2.5 * zoom : 2 * zoom}
                        strokeOpacity={node.connectionDisabled ? 0.8 : 0.4}
                        strokeDasharray={node.connectionDisabled ? '3,3' : (node.status === 'inactive' ? '4,4' : undefined)}
                      />
                      {/* Interactive ping pulsing dots floating along connecters */}
                      {node.status !== 'inactive' && !node.connectionDisabled && (
                        <circle
                          r={3 * zoom}
                          fill="#39FF14"
                          className="animate-pulse"
                        >
                          <animateMotion
                            path={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                            dur="4s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* FLOATING INTERACTIVE GRAPH NODES */}
              <div 
                className="absolute inset-0 select-none overflow-hidden custom-scrollbar"
                style={{ zIndex: 2 }}
                onMouseDown={() => setSelectedNode(null)}
              >
                {/* Scrollable node arena */}
                <div 
                  className="w-full h-full relative"
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                    transformOrigin: 'top left'
                  }}
                >
                  {nodes.map(node => {
                    const isSelected = selectedNode?.id === node.id;
                    const isHub = node.type === 'hub';
                    const isRoom = node.type === 'room';
                    const isDev = node.type === 'device' || !['hub', 'room', 'group'].includes(node.type);
                    
                    const roomColorClass = ROOM_COLORS[node.type] || ROOM_COLORS.device;
                    const protocolIcon = node.protocol ? PROTOCOL_ICONS[node.protocol] || '' : '';
                    const deviceIcon = node.deviceType ? DEVICE_ICONS[node.deviceType] || '' : '';

                    return (
                      <div
                        key={node.id}
                        onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNode(node);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          openEditNode(node);
                        }}
                        style={{
                          left: `${node.x}px`,
                          top: `${node.y}px`,
                          position: 'absolute',
                          cursor: isDraggingNode === node.id ? 'grabbing' : 'grab'
                        }}
                        className={`p-1.5 px-2.5 rounded-xl border flex items-center gap-1.5 transition-all text-[10px] font-bold uppercase shadow-lg select-none w-auto min-w-[130px] max-w-[240px] ${roomColorClass} ${
                          isSelected 
                            ? 'ring-2 ring-[#39FF14] scale-105 border-white shadow-[0_0_15px_rgba(57,255,20,0.4)]' 
                            : 'border-white/10 hover:border-white/30'
                        } ${node.status === 'inactive' ? 'opacity-50 filter grayscale' : ''}`}
                      >
                        {/* Status Light */}
                        {isHub && <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-ping shrink-0" />}
                        {isRoom && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />}
                        
                        {/* Icons */}
                        <span className="text-[10px] shrink-0">
                          {isDev ? deviceIcon : isHub ? '🎛️' : '🏠'}
                        </span>

                        <div className="min-w-0 flex-1 leading-tight">
                          <span className="block text-[11px] font-black text-white break-words">{node.label}</span>
                          {node.details && (
                            <span className="block text-[7px] text-white/50 lowercase italic break-words mt-0.5">
                              {node.details}
                            </span>
                          )}
                        </div>

                        {protocolIcon && (
                          <span className="text-[8px] bg-black/40 p-0.5 px-1 rounded-md text-[7px] shrink-0" title={node.protocol}>
                            {protocolIcon}
                          </span>
                        )}

                        {node.parentId && node.connectionDisabled && (
                          <span 
                            onClick={(e) => toggleNodeConnection(node.id, e)}
                            className="text-[7px] bg-rose-500 text-white font-black p-0.5 px-1.5 rounded hover:bg-rose-600 transition-all shrink-0 cursor-pointer animate-pulse" 
                            title="Conexão Desligada! Clique para Ligar Conexão"
                          >
                            🔌 DESLIGADO
                          </span>
                        )}

                        <button
                          type="button"
                          id={`add-child-btn-${node.id}`}
                          onClick={(e) => openAddNodeWithParent(node.id, e)}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="ml-1 px-1 rounded bg-[#39FF14]/20 hover:bg-[#39FF14]/40 border border-[#39FF14]/30 hover:border-[#39FF14]/60 text-[#39FF14] font-black text-[10px] cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center justify-center shrink-0"
                          title="Adicionar ponto conectado a este"
                        >
                          +
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* QUICK NODE CONTROLLER DRAWER */}
              {selectedNode && (
                <div className="absolute bottom-2 left-2 right-2 z-20 bg-black/90 p-2 border border-white/10 rounded-2xl flex items-center justify-between backdrop-blur-md shadow-2xl">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-black text-[#39FF14] uppercase tracking-wider">{selectedNode.label}</span>
                      <span className="text-[7px] text-white/50 capitalize bg-white/5 px-1 rounded">
                        {selectedNode.type}
                      </span>
                    </div>
                    <p className="text-[7px] text-white/40 font-mono truncate max-w-[170px]">
                      {selectedNode.details || 'Nenhum detalhe adicional configurado para este nó.'}
                    </p>
                  </div>

                  <div className="flex gap-1.5 shrink-0 items-center">
                    {/* Toggle Connection Status (Link autonomy!) */}
                    {selectedNode.parentId && (
                      <button
                        type="button"
                        onClick={(e) => toggleNodeConnection(selectedNode.id, e)}
                        className={`p-1 px-1.5 rounded-lg border text-[7px] font-black uppercase tracking-wider transition-all flex items-center gap-0.5 ${
                          selectedNode.connectionDisabled
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/35 hover:scale-105 active:scale-95'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-[#39FF14] hover:bg-[#39FF14]/15 hover:scale-105 active:scale-95'
                        }`}
                        title={selectedNode.connectionDisabled ? "Reconectar canal de dados com Nó Pai" : "Desconectar canal temporariamente"}
                      >
                        {selectedNode.connectionDisabled ? '🔌 Ligar Link' : '🔌 Desligar Link'}
                      </button>
                    )}

                    {/* Quick Power Toggle */}
                    <button
                      type="button"
                      onClick={(e) => toggleNodePowerStatus(selectedNode.id, e)}
                      className={`p-1 px-1.5 rounded-lg border text-[7px] font-black uppercase tracking-wider transition-all flex items-center gap-0.5 ${
                        selectedNode.status === 'inactive'
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                          : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/30'
                      }`}
                      title={selectedNode.status === 'inactive' ? "Ligar equipamento" : "Desligar equipamento (Offline)"}
                    >
                      {selectedNode.status === 'inactive' ? '💡 Ligar' : '🔌 Desligar'}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditNode(selectedNode)}
                      className="p-1 px-2 rounded-lg bg-white/5 border border-white/10 hover:bg-[#39FF14]/15 hover:border-[#39FF14]/20 hover:text-[#39FF14] text-[8px] font-black uppercase tracking-wider transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNode(selectedNode.id)}
                      className="p-1 px-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-[8px] font-black uppercase tracking-wider transition-colors"
                    >
                      remover
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'templates' && (
            <motion.div 
              key="templates"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 space-y-3"
            >
              <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-1">Selecione um Template de Instalação</h4>
              
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('small')}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-indigo-500/30 text-left transition-all group"
                >
                  <div className="min-w-0 pr-1">
                    <span className="block text-[10px] font-black uppercase text-white">Apartamento Básico Zigbee</span>
                    <span className="block text-[8px] text-white/40">Hub central, fita led na cozinha, sensor de temperatura.</span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-500 group-hover:text-indigo-400" />
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetTemplate('large')}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-indigo-500/30 text-left transition-all group"
                >
                  <div className="min-w-0 pr-1">
                    <span className="block text-[10px] font-black uppercase text-white">Casa Automatizada Completa</span>
                    <span className="block text-[8px] text-white/40">Z-Wave na Garagem, Living inteligente, Varanda Gourmet.</span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-500 group-hover:text-indigo-400" />
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetTemplate('comercial')}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-indigo-500/30 text-left transition-all group"
                >
                  <div className="min-w-0 pr-1">
                    <span className="block text-[10px] font-black uppercase text-white">Escritório Corporativo KNX</span>
                    <span className="block text-[8px] text-white/40">PoE IP, Controle de Acesso, Projetor, Som Ambiente.</span>
                  </div>
                  <ChevronRight size={14} className="text-zinc-500 group-hover:text-indigo-400" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('view')}
                className="w-full py-1.5 text-center text-[9px] font-black uppercase tracking-wider text-white/50 hover:text-white"
              >
                Voltar ao mapa
              </button>
            </motion.div>
          )}

          {(activeView === 'add' || activeView === 'edit-node') && (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={activeView === 'add' ? saveAddedNode : saveEditedNode}
              className="p-4 space-y-2.5 overflow-y-auto max-h-full custom-scrollbar"
            >
              <h4 className="text-[9px] font-black text-[#39FF14] uppercase tracking-widest border-b border-white/5 pb-1 flex justify-between items-center">
                <span>{activeView === 'add' ? 'Adicionar Nó de Instalação' : 'Editar Propriedades'}</span>
                {activeView === 'edit-node' && (
                  <button
                    type="button"
                    onClick={() => deleteNode(selectedNode!.id)}
                    className="text-rose-500 hover:text-rose-400 font-bold flex items-center gap-1 text-[8px] tracking-wider transition-colors uppercase"
                  >
                    Delezar Nó
                  </button>
                )}
              </h4>

              {/* Label */}
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Rótulo / Nome do Dispositivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sensor Presença Corredor..."
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#39FF14]/50 font-bold uppercase"
                />
              </div>

              {/* Type Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Categoria de Nó</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-[#39FF14]/50 font-bold uppercase text-white"
                  >
                    <option value="hub">🎛️ Gateway / Hub</option>
                    <option value="room">🏠 Cômodo / Área</option>
                    <option value="device">💡 Dispositivo / atuador</option>
                    <option value="group">📦 Grupo de Dispositivos</option>
                    <option value="custom">✨ Nossa Sessão (Personalizado)</option>
                  </select>
                  {formType === 'custom' && (
                    <div className="mt-1">
                      <input
                        type="text"
                        required
                        placeholder="Categoria customizada..."
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-0.5 text-[9px] text-white focus:outline-none focus:border-[#39FF14]/50"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Nó Pai (Conexão)</label>
                  <select
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-[#39FF14]/50 font-bold uppercase"
                  >
                    <option value="">Sem Conexão (Raiz)</option>
                    {nodes.filter(n => n.id !== selectedNode?.id).map(n => (
                      <option key={n.id} value={n.id}>{n.label} ({n.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Protocol & Device properties (visible if device or hub is chosen) */}
              {(formType === 'device' || formType === 'hub' || formType === 'custom') && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-white/5 border border-white/5 rounded-2xl">
                  <div>
                    <label className="text-[7px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Protocolo Sem Fio</label>
                    <select
                      value={formProtocol}
                      onChange={(e) => setFormProtocol(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-[9px] text-white focus:outline-none"
                    >
                      <option value="Zigbee">Zigbee Core</option>
                      <option value="WiFi">Wi-Fi (2.4Ghz)</option>
                      <option value="ZWave">Z-Wave Mesh</option>
                      <option value="Bluetooth">Bluetooth (BLE)</option>
                      <option value="IP">IP / Rede Cabeada</option>
                      <option value="N/A">Nenhum/Outro</option>
                      <option value="custom">✨ Nossa Sessão (Personalizado)</option>
                    </select>
                    {formProtocol === 'custom' && (
                      <div className="mt-1">
                        <input
                          type="text"
                          required
                          placeholder="Ex: RF 433Mhz, LoRa, KNX..."
                          value={customProtocol}
                          onChange={(e) => setCustomProtocol(e.target.value)}
                          className="w-full bg-black/45 border border-white/10 rounded px-1.5 py-0.5 text-[8px] text-white focus:outline-none focus:border-[#39FF14]/50"
                        />
                      </div>
                    )}
                  </div>

                  {(formType === 'device' || formType === 'custom') && (
                    <div>
                      <label className="text-[7px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Tipo de Hardware</label>
                      <select
                        value={formDeviceType}
                        onChange={(e) => setFormDeviceType(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-[9px] text-white focus:outline-none"
                      >
                        <option value="light">Iluminação</option>
                        <option value="switch">Interruptor/Atuador</option>
                        <option value="sensor">Sensor/Presença</option>
                        <option value="security">Segurança/Acesso</option>
                        <option value="climate">Termostato/Ar</option>
                        <option value="media">Multimídia/Televisão</option>
                        <option value="other">Outros Acessórios</option>
                        <option value="custom">✨ Nossa Sessão (Personalizado)</option>
                      </select>
                      {formDeviceType === 'custom' && (
                        <div className="mt-1">
                          <input
                            type="text"
                            required
                            placeholder="Ex: Aspiração, Motor..."
                            value={customDeviceType}
                            onChange={(e) => setCustomDeviceType(e.target.value)}
                            className="w-full bg-black/45 border border-white/10 rounded px-1.5 py-0.5 text-[8px] text-white focus:outline-none focus:border-[#39FF14]/50"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Details & Info text area */}
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Especificações Técnicas / Marca / Endereço</label>
                <textarea
                  rows={2}
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  placeholder="Ex: IP 192.168.1.55, Canal de Rede 11, Bateria 100%..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#39FF14]/50"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('view');
                    setSelectedNode(null);
                  }}
                  className="w-1/3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 text-white transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 text-center shadow-lg hover:shadow-indigo-500/20"
                >
                  {activeView === 'add' ? 'Adicionar Nó' : 'Salvar Alteração'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChevronRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
