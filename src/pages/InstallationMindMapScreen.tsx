import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { 
  Network, Plus, Trash2, Edit3, HelpCircle, Save, Sliders, Check, 
  Map, ZoomIn, ZoomOut, Maximize2, RefreshCw, Layout, Smartphone,
  Radio, Cpu, Lightbulb, Shield, Thermometer, Wifi, Link, Info, Eye,
  ArrowLeft, Users, FileText, ChevronRight, ChevronLeft, Activity, Zap, CheckCircle2,
  Printer, Download, Layers, Sparkles, MessageSquare, AlertCircle, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export interface MindMapNode {
  id: string;
  label: string;
  type: 'hub' | 'room' | 'device' | 'group';
  protocol?: 'WiFi' | 'Zigbee' | 'ZWave' | 'Bluetooth' | 'IP' | 'N/A';
  deviceType?: 'light' | 'switch' | 'sensor' | 'security' | 'climate' | 'media' | 'other';
  status?: 'active' | 'inactive';
  details?: string;
  parentId?: string | null;
  connectionDisabled?: boolean;
  x: number;
  y: number;
}

// Default Seed clients if clients array is empty in the client store
const MEMORY_SEEDED_CLIENTS = [
  {
    id: 'c-1',
    name: 'Dr. Alberto Santos (Cobertura Ipanema)',
    address: 'Av. Vieira Souto, 450 - Cobertura',
    phone: '(21) 99888-1234',
    status: 'Em Testes',
    hubIp: '192.168.1.150',
    notes: 'Duas redes unificadas Ubiquiti. Automação principal Zigbee com cabeamento parcial KNX.',
    checklist: {
      survey: true,
      wiring: true,
      hw_installation: true,
      pairing: true,
      scenes: false,
      handover: false
    }
  },
  {
    id: 'c-2',
    name: 'Mariana Costa (Casa Lagoa)',
    address: 'Rua Jardim Botânico, 1120',
    phone: '(21) 98722-5544',
    status: 'Em Andamento',
    hubIp: '192.168.1.99',
    notes: 'Projeto de áudio multiroom integrado. Cortinas automatizadas via Somfy RTS.',
    checklist: {
      survey: true,
      wiring: true,
      hw_installation: false,
      pairing: false,
      scenes: false,
      handover: false
    }
  },
  {
    id: 'c-3',
    name: 'Studio Loft Jardins',
    address: 'Alameda Lorena, 882 - Apt 141',
    phone: '(11) 97112-9988',
    status: 'Finalizado',
    hubIp: '192.168.15.55',
    notes: 'Loft compacto inteiramente Wi-Fi e Bluetooth. Alexa integrada para cenas de iluminação.',
    checklist: {
      survey: true,
      wiring: true,
      hw_installation: true,
      pairing: true,
      scenes: true,
      handover: true
    }
  }
];

const ROOM_COLORS: Record<string, string> = {
  hub: 'from-purple-600 to-indigo-600 border-purple-400 text-white',
  room: 'from-sky-600 to-blue-600 border-sky-400 text-white',
  group: 'from-amber-600 to-orange-600 border-amber-400 text-white',
  device: 'from-zinc-800 to-zinc-950 border-zinc-700 text-zinc-100 dark:text-zinc-100'
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

export default function InstallationMindMapScreen() {
  const navigate = useNavigate();
  const { clients } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine store clients with fallback mock clients
  const displayClients = clients.length > 0 
    ? clients.map((c, i) => ({
        id: c.id,
        name: c.name,
        address: c.address || 'Endereço não cadastrado',
        phone: c.phone || 'Sem telefone',
        status: i % 2 === 0 ? 'Em Testes' : 'Em Andamento',
        hubIp: '192.168.1.100',
        notes: c.notes || 'Automação residencial planejada.',
        checklist: { survey: true, wiring: false, hw_installation: false, pairing: false, scenes: false, handover: false }
      }))
    : MEMORY_SEEDED_CLIENTS;

  const [selectedClientId, setSelectedClientId] = useState<string>(displayClients[0]?.id || 'c-1');
  const [activeTab, setActiveTab] = useState<'map' | 'report'>('map');
  const [searchTerm, setSearchTerm] = useState('');

  // Loaded client data
  const activeClient = displayClients.find(c => c.id === selectedClientId) || displayClients[0];

  // Specific mind map nodes state per client
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [mapViewMode, setMapViewMode] = useState<'view' | 'edit-node' | 'add' | 'templates'>('view');
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);

  // Client Summary Report & Checklists details
  const [clientHubIp, setClientHubIp] = useState('');
  const [clientRouterIp, setClientRouterIp] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [checklist, setChecklist] = useState({
    survey: false,
    wiring: false,
    hw_installation: false,
    pairing: false,
    scenes: false,
    handover: false
  });

  // Map settings
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Form states for node creator/editor
  const [formLabel, setFormLabel] = useState('');
  const [formType, setFormType] = useState<'hub' | 'room' | 'device' | 'group'>('device');
  const [formProtocol, setFormProtocol] = useState<'WiFi' | 'Zigbee' | 'ZWave' | 'Bluetooth' | 'IP' | 'N/A'>('Zigbee');
  const [formDeviceType, setFormDeviceType] = useState<'light' | 'switch' | 'sensor' | 'security' | 'climate' | 'media' | 'other'>('light');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formDetails, setFormDetails] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');

  // Filtered client list helper
  const filteredClients = displayClients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize and load nodes when active customer changes
  useEffect(() => {
    if (!activeClient) return;
    
    // Load state from localStorage or load custom default nodes
    const savedNodesKey = `condfy_installation_mindmap_${activeClient.id}`;
    const savedNotesKey = `condfy_installation_notes_${activeClient.id}`;
    const savedIpKey = `condfy_installation_ip_${activeClient.id}`;
    const savedRouterIpKey = `condfy_installation_router_ip_${activeClient.id}`;
    const savedChecklistKey = `condfy_installation_checklist_${activeClient.id}`;

    const savedNodes = localStorage.getItem(savedNodesKey);
    const savedNotes = localStorage.getItem(savedNotesKey);
    const savedIp = localStorage.getItem(savedIpKey);
    const savedRouterIp = localStorage.getItem(savedRouterIpKey);
    const savedChecklistString = localStorage.getItem(savedChecklistKey);

    // Node restoration
    if (savedNodes) {
      try {
        setNodes(JSON.parse(savedNodes));
      } catch (e) {
        setNodes(getDefaultNodesForClient(activeClient.id));
      }
    } else {
      setNodes(getDefaultNodesForClient(activeClient.id));
    }

    // Load static inputs
    setClientNotes(savedNotes !== null ? savedNotes : activeClient.notes);
    setClientHubIp(savedIp !== null ? savedIp : activeClient.hubIp);
    setClientRouterIp(savedRouterIp !== null ? savedRouterIp : ((activeClient as any).routerIp || '192.168.1.1'));
    
    if (savedChecklistString) {
      try {
        setChecklist(JSON.parse(savedChecklistString));
      } catch (e) {
        setChecklist(activeClient.checklist);
      }
    } else {
      setChecklist(activeClient.checklist);
    }

    setSelectedNode(null);
    setMapViewMode('view');
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [selectedClientId]);

  // Persists nodes & summaries on every state mutation
  useEffect(() => {
    if (!activeClient || nodes.length === 0) return;
    localStorage.setItem(`condfy_installation_mindmap_${activeClient.id}`, JSON.stringify(nodes));
    // Also backup to global key for backwards-compatibility with dashboard preview tile
    localStorage.setItem('condfy_installation_mindmap', JSON.stringify(nodes));
  }, [nodes, activeClient]);

  const saveTechnicalSummaries = () => {
    if (!activeClient) return;
    localStorage.setItem(`condfy_installation_notes_${activeClient.id}`, clientNotes);
    localStorage.setItem(`condfy_installation_ip_${activeClient.id}`, clientHubIp);
    localStorage.setItem(`condfy_installation_router_ip_${activeClient.id}`, clientRouterIp);
    localStorage.setItem(`condfy_installation_checklist_${activeClient.id}`, JSON.stringify(checklist));
    toast.success('Resumo e especificações técnicas salvas com sucesso!');
  };

  const handleToggleChecklist = (key: keyof typeof checklist) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    if (activeClient) {
      localStorage.setItem(`condfy_installation_checklist_${activeClient.id}`, JSON.stringify(updated));
    }
  };

  // Get customized initial map topolgies for seeded projects
  function getDefaultNodesForClient(clientId: string): MindMapNode[] {
    if (clientId === 'c-1') {
      return [
        { id: '1', label: 'Central Home Assistant Cobertura', type: 'hub', protocol: 'IP', status: 'active', details: 'NUC Server - Armário de Telecom', x: 220, y: 150 },
        { id: '2', label: 'Suíte Master', type: 'room', parentId: '1', status: 'active', details: 'Automação conforto', x: 420, y: 60 },
        { id: '3', label: 'Social & Pub', type: 'room', parentId: '1', status: 'active', details: 'Espaço Gourmet superior', x: 420, y: 240 },
        { id: '4', label: 'Planta de Energia', type: 'group', parentId: '1', status: 'active', details: 'Quadro Geral Trifásico', x: 20, y: 150 },
        { id: '5', label: 'Dimmer Pro 4CH Zigbee', type: 'device', parentId: '2', protocol: 'Zigbee', deviceType: 'switch', status: 'active', details: 'Controle de Dicroicas LED sanca', x: 580, y: 20 },
        { id: '6', label: 'Sensor Temperatura Real', type: 'device', parentId: '2', protocol: 'Zigbee', deviceType: 'sensor', status: 'active', details: 'Sonoff TH16', x: 580, y: 110 },
        { id: '7', label: 'Eletro-Valvula Gás', type: 'device', parentId: '3', protocol: 'Zigbee', deviceType: 'security', status: 'active', details: 'Dispositivo fail-safe cozinha', x: 580, y: 200 },
        { id: '8', label: 'Central Soundwave', type: 'device', parentId: '3', protocol: 'WiFi', deviceType: 'media', status: 'active', details: 'Som ambiente Denon AVR', x: 580, y: 280 }
      ];
    } else if (clientId === 'c-2') {
      return [
        { id: '1', label: 'Control4 EA-1 Controller', type: 'hub', protocol: 'IP', status: 'active', details: 'Rack Central Sala', x: 230, y: 160 },
        { id: '2', label: 'Living Room', type: 'room', parentId: '1', status: 'active', details: 'Ar condicionado e Som', x: 440, y: 70 },
        { id: '3', label: 'Área da Piscina', type: 'room', parentId: '1', status: 'active', details: 'Iluminação RGB', x: 440, y: 250 },
        { id: '4', label: 'Controle de Janelas', type: 'device', parentId: '2', protocol: 'ZWave', deviceType: 'switch', status: 'active', details: 'Motor de cortinas Somfy', x: 600, y: 40 },
        { id: '5', label: 'Climatizador Split', type: 'device', parentId: '2', protocol: 'WiFi', deviceType: 'climate', status: 'active', details: 'Integração CoolMaster', x: 600, y: 130 },
        { id: '6', label: 'Controlador RGB Pool', type: 'device', parentId: '3', protocol: 'WiFi', deviceType: 'light', status: 'inactive', details: 'Módulo Relé 4 canais 12V', x: 600, y: 260 }
      ];
    } else if (clientId === 'c-3') {
      return [
        { id: '1', label: 'Echo Hub Loft', type: 'hub', protocol: 'WiFi', status: 'active', details: 'Display de parede Entrada', x: 200, y: 150 },
        { id: '2', label: 'Loft Integrado', type: 'room', parentId: '1', status: 'active', details: 'Ambiente Geral', x: 400, y: 150 },
        { id: '3', label: 'Fita LED RGBIC', type: 'device', parentId: '2', protocol: 'WiFi', deviceType: 'light', status: 'active', x: 560, y: 80 },
        { id: '4', label: 'Ar Condicionado Dual', type: 'device', parentId: '2', protocol: 'WiFi', deviceType: 'climate', status: 'active', x: 560, y: 150 },
        { id: '5', label: 'Fechadura Yale Bio', type: 'device', parentId: '2', protocol: 'Zigbee', deviceType: 'security', status: 'active', x: 560, y: 220 }
      ];
    }
    
    // Fallback template
    return [
      { id: '1', label: 'Gateway Central Inteligente', type: 'hub', protocol: 'IP', status: 'active', details: 'Central principal de automação', x: 200, y: 150 },
      { id: '2', label: 'Área Interna', type: 'room', parentId: '1', status: 'active', x: 400, y: 150 }
    ];
  }

  // Node layout automatically arranged via simple ring formula
  const performRadialLayout = () => {
    const parent = nodes.find(n => n.type === 'hub') || nodes[0];
    if (!parent) return;

    let updated = [...nodes];
    const hubIndex = updated.findIndex(n => n.id === parent.id);
    if (hubIndex !== -1) {
      updated[hubIndex] = { ...parent, x: 200, y: 150 };
    }

    const rooms = updated.filter(n => n.parentId === parent.id && n.type === 'room');
    rooms.forEach((room, roomIdx) => {
      const angle = (roomIdx / rooms.length) * 2 * Math.PI;
      const radius = 180;
      const rx = 200 + radius * Math.cos(angle);
      const ry = 150 + radius * Math.sin(angle);
      
      const rIdx = updated.findIndex(n => n.id === room.id);
      if (rIdx !== -1) {
        updated[rIdx] = { ...room, x: rx, y: ry };
      }

      const devices = updated.filter(n => n.parentId === room.id && n.type === 'device');
      devices.forEach((dev, devIdx) => {
        const dAngle = angle + ((devIdx - (devices.length - 1) / 2) * 0.3);
        const dRadius = 140;
        const dx = rx + dRadius * Math.cos(dAngle);
        const dy = ry + dRadius * Math.sin(dAngle);

        const dIdx = updated.findIndex(n => n.id === dev.id);
        if (dIdx !== -1) {
          updated[dIdx] = { ...dev, x: dx, y: dy };
        }
      });
    });

    setNodes(updated);
    toast.success('Algoritmo de topologia radial redistribuído!');
  };

  // Node manual reposition dragging handlers
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    setIsDraggingNode(nodeId);
    e.stopPropagation();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
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

  // Node editing properties form openers
  const openEditNode = (node: MindMapNode) => {
    setSelectedNode(node);
    setFormLabel(node.label);
    setFormType(node.type);
    setFormProtocol(node.protocol || 'Zigbee');
    setFormDeviceType(node.deviceType || 'light');
    setFormStatus(node.status || 'active');
    setFormDetails(node.details || '');
    setFormParentId(node.parentId || '');
    setMapViewMode('edit-node');
  };

  const openAddNode = () => {
    setFormLabel('');
    setFormType('device');
    setFormProtocol('Zigbee');
    setFormDeviceType('light');
    setFormStatus('active');
    setFormDetails('');
    const defaultParent = selectedNode ? selectedNode.id : (nodes.find(n => n.type === 'hub')?.id || '');
    setFormParentId(defaultParent);
    setMapViewMode('add');
  };

  const openAddNodeWithParent = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormLabel('');
    setFormType('device');
    setFormProtocol('Zigbee');
    setFormDeviceType('light');
    setFormStatus('active');
    setFormDetails('');
    setFormParentId(parentId);
    setMapViewMode('add');
  };

  const toggleNodeConnection = (nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextVal = !n.connectionDisabled;
        toast.success(nextVal ? '🔌 Conexão Ativa Desativada / Desligada' : '🔌 Conexão Ativada / Ligada');
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
        toast.success(nextStatus === 'active' ? '💡 Ponto Ligado' : '🔌 Ponto Desconectado (Offline)');
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

    setNodes(prev => prev.map(n => n.id === selectedNode.id ? {
      ...n,
      label: formLabel,
      type: formType,
      protocol: formType === 'device' || formType === 'hub' ? formProtocol : undefined,
      deviceType: formType === 'device' ? formDeviceType : undefined,
      status: formStatus,
      details: formDetails,
      parentId: formParentId || null,
      connectionDisabled: selectedNode.connectionDisabled
    } : n));

    toast.success('Nó de automação atualizado!');
    setMapViewMode('view');
  };

  const saveAddedNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) return;

    const newNode: MindMapNode = {
      id: 'node-' + Date.now(),
      label: formLabel.trim(),
      type: formType,
      protocol: formType === 'device' || formType === 'hub' ? formProtocol : undefined,
      deviceType: formType === 'device' ? formDeviceType : undefined,
      status: formStatus,
      details: formDetails,
      parentId: formParentId || null,
      x: 150 + Math.random() * 120,
      y: 100 + Math.random() * 120
    };

    setNodes(prev => [...prev, newNode]);
    toast.success('Novo ponto adicionado ao mapa!');
    setMapViewMode('view');
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id).map(n => n.parentId === id ? { ...n, parentId: null } : n));
    toast.success('Ponto removido do mapa.');
    setSelectedNode(null);
    setMapViewMode('view');
  };

  // Generate templates presets
  const applyPresetLayout = (presetName: 'zigbee_mesh' | 'voice_wifi' | 'luxury_knx') => {
    let preset: MindMapNode[] = [];
    if (presetName === 'zigbee_mesh') {
      preset = [
        { id: '1', label: 'Hub Inteligente Zigbee 3.0', type: 'hub', protocol: 'IP', status: 'active', details: 'Local: Sala de Controle', x: 200, y: 150 },
        { id: '2', label: 'Cozinha Gourmet', type: 'room', parentId: '1', status: 'active', x: 400, y: 70 },
        { id: '3', label: 'Quarto Integrado', type: 'room', parentId: '1', status: 'active', x: 400, y: 230 },
        { id: '4', label: 'Pendente Balcão', type: 'device', parentId: '2', protocol: 'Zigbee', deviceType: 'light', status: 'active', x: 560, y: 30 },
        { id: '5', label: 'Sensor Vazamento Gás', type: 'device', parentId: '2', protocol: 'Zigbee', deviceType: 'security', status: 'active', x: 560, y: 100 },
        { id: '6', label: 'Módulo Cortina Rolo', type: 'device', parentId: '3', protocol: 'Zigbee', deviceType: 'switch', status: 'active', x: 560, y: 200 },
        { id: '7', label: 'Ar Condicionado Split', type: 'device', parentId: '3', protocol: 'WiFi', deviceType: 'climate', status: 'active', x: 560, y: 280 }
      ];
    } else if (presetName === 'voice_wifi') {
      preset = [
        { id: '1', label: 'Roteador Wi-Fi 6 Mesh', type: 'hub', protocol: 'IP', status: 'active', details: 'Roteador principal dual-band', x: 200, y: 150 },
        { id: '2', label: 'Sala de Estar', type: 'room', parentId: '1', status: 'active', x: 380, y: 60 },
        { id: '3', label: 'Área Social', type: 'room', parentId: '1', status: 'active', x: 380, y: 240 },
        { id: '4', label: 'Smart TV 75 OLED', type: 'device', parentId: '2', protocol: 'WiFi', deviceType: 'media', status: 'active', x: 530, y: 20 },
        { id: '5', label: 'Interruptor Alexa 3CH', type: 'device', parentId: '2', protocol: 'WiFi', deviceType: 'switch', status: 'active', x: 530, y: 100 },
        { id: '6', label: 'Iluminação Jardim', type: 'device', parentId: '3', protocol: 'WiFi', deviceType: 'light', status: 'active', x: 530, y: 200 },
        { id: '7', label: 'Câmera Externa LPR', type: 'device', parentId: '3', protocol: 'IP', deviceType: 'security', status: 'active', x: 530, y: 280 }
      ];
    } else {
      preset = [
        { id: '1', label: 'Servidor Central Control4 / KNX', type: 'hub', protocol: 'IP', status: 'active', details: 'Rack TI Principal', x: 200, y: 150 },
        { id: '2', label: 'Teatro Residencial', type: 'room', parentId: '1', status: 'active', x: 420, y: 60 },
        { id: '3', label: 'Suíte Master', type: 'room', parentId: '1', status: 'active', x: 420, y: 240 },
        { id: '4', label: 'Receiver Denon 9.2', type: 'device', parentId: '2', protocol: 'IP', deviceType: 'media', status: 'active', x: 580, y: 20 },
        { id: '5', label: 'Lift para Projetor', type: 'device', parentId: '2', protocol: 'ZWave', deviceType: 'switch', status: 'active', x: 580, y: 100 },
        { id: '6', label: 'Painel Termoseletor', type: 'device', parentId: '3', protocol: 'IP', deviceType: 'climate', status: 'active', x: 580, y: 200 },
        { id: '7', label: 'Keypad Gravado Laser', type: 'device', parentId: '3', protocol: 'IP', deviceType: 'switch', status: 'active', x: 580, y: 280 }
      ];
    }
    setNodes(preset);
    setSelectedNode(null);
    setMapViewMode('view');
    toast.success('Gabarito de mapa aplicado!');
  };

  // PDF / Document summary generator helper
  const handlePrintOutline = () => {
    window.print();
  };

  // Calculated topology metrics
  const activeDeviceCount = nodes.filter(n => n.type === 'device' && n.status === 'active').length;
  const inactiveDeviceCount = nodes.filter(n => n.type === 'device' && n.status === 'inactive').length;
  const roomNodes = nodes.filter(n => n.type === 'room');
  const totalRooms = roomNodes.length;
  
  // Protocol breakdown
  const protocolsCount = nodes.reduce((acc, current) => {
    if (current.type === 'device' && current.protocol) {
      acc[current.protocol] = (acc[current.protocol] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Device type breakdown
  const typesCount = nodes.reduce((acc, current) => {
    if (current.type === 'device' && current.deviceType) {
      acc[current.deviceType] = (acc[current.deviceType] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white relative flex flex-col overflow-hidden leading-relaxed animate-fade-in">
      <div className="print:hidden flex flex-col flex-1 min-h-0">
        {/* GLOW DECORATIONS */}
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/5 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-sky-500/5 rounded-full blur-[180px] pointer-events-none" />

      {/* HEADER SECTION */}
      <header className="border-b border-white/5 bg-zinc-900/60 backdrop-blur-xl p-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 z-40 print:hidden shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-white/5 flex items-center justify-center"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <Network size={24} className="text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase flex items-center gap-1.5">
                Portal de Mapas &amp; Instalações Smart
                <span className="text-[9px] bg-gradient-to-r from-indigo-400 to-sky-400 text-black font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Configurador IoT
                </span>
              </h1>
              <p className="text-xs text-zinc-400">Desenho topológico e resumos técnicos consolidados por cliente</p>
            </div>
          </div>
        </div>

        {/* Global Statistics ticker */}
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider bg-black/40 p-2 px-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-indigo-400" />
            <span className="text-zinc-400">Sistemas Ativos:</span>
            <span className="text-white">{displayClients.length}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Activity size={13} className="text-[#39FF14]" />
            <span className="text-zinc-400">Total Pontos Mapeados:</span>
            <span className="text-white">{nodes.length}</span>
          </div>
        </div>
      </header>

      {/* INTERACTIVE SPLIT BODY */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        
        {/* LEFT CLIENT SELECTOR SIDEBAR WITH FLUID COLLAPSE */}
        <aside className={`${isLeftSidebarOpen ? 'w-full lg:w-80 p-4 border-r opacity-100' : 'w-0 h-0 lg:h-full p-0 border-r-0 opacity-0 overflow-hidden'} border-white/5 bg-zinc-900/40 shrink-0 flex flex-col gap-4 overflow-y-auto max-h-[30vh] lg:max-h-full print:hidden transition-all duration-300`}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                <Users size={12} /> Projetos &amp; Clientes
              </h3>
              <button 
                onClick={() => setIsLeftSidebarOpen(false)}
                className="p-1 px-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-[8px] uppercase font-black tracking-widest flex items-center gap-0.5"
                title="Recolher Menu de Clientes"
              >
                <ChevronLeft size={10} /> Ocultar
              </button>
            </div>
            <input
              type="text"
              placeholder="Pesquisar cliente ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs placeholder-zinc-500 text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
            {filteredClients.map((client) => {
              const isSelected = client.id === selectedClientId;
              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all relative flex flex-col gap-1 overflow-hidden group ${
                    isSelected 
                      ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-xl shadow-indigo-600/5' 
                      : 'bg-zinc-900/30 border-white/5 hover:bg-zinc-900/70 hover:border-white/10 text-zinc-300'
                  }`}
                >
                  {/* Left accent color bar */}
                  {isSelected && (
                    <span className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500" />
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black truncate uppercase pr-2">{client.name}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 ${
                      client.status === 'Finalizado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      client.status === 'Em Testes' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}>
                      {client.status}
                    </span>
                  </div>

                  <p className="text-[9px] text-zinc-500 truncate lowercase">{client.address}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                    <span className="text-[8px] text-zinc-400 font-mono italic">{client.phone}</span>
                    <ChevronRight size={12} className={`text-zinc-600 group-hover:text-indigo-400 transition-colors ${isSelected ? 'text-indigo-400' : ''}`} />
                  </div>
                </button>
              );
            })}

            {filteredClients.length === 0 && (
              <div className="p-8 text-center bg-black/10 rounded-2xl border border-white/5 text-xs text-zinc-500 italic">
                Nenhum projeto encontrado.
              </div>
            )}
          </div>

          <div className="p-2 border-t border-white/5">
            <button
              onClick={() => navigate('/clients')}
              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase text-zinc-300 hover:text-white transition-all text-center flex items-center justify-center gap-1.5 border border-white/5"
            >
              <Plus size={11} /> Gerenciar Clientes
            </button>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <main 
          className="flex-1 bg-zinc-950 flex flex-col overflow-y-auto max-h-full"
          onMouseMove={handleGlobalMouseMove}
          onMouseUp={handleGlobalMouseUp}
          onMouseLeave={handleGlobalMouseUp}
        >
          {/* TAB HEADERS PANEL */}
          <div className="border-b border-white/5 bg-zinc-900/20 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-30 backdrop-blur opacity-95 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-1.5 py-1.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  activeTab === 'map' 
                    ? 'bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/20' 
                    : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Map size={14} /> 🗺️ Mapa Topológico
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-1.5 py-1.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  activeTab === 'report' 
                    ? 'bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/20' 
                    : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                <FileText size={14} /> 📊 Relatório &amp; Inventário
              </button>

              {activeTab === 'map' && (
                <div className="flex items-center gap-1.5 border-l border-white/10 pl-2.5 ml-0.5">
                  <button
                    onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                    className={`flex items-center gap-1 py-1 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                      isLeftSidebarOpen 
                        ? 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white' 
                        : 'bg-indigo-500 text-white/90 border-indigo-400/50 hover:bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.3)] animate-pulse'
                    }`}
                    title={isLeftSidebarOpen ? "Ocultar painel de clientes" : "Mostrar painel de clientes"}
                  >
                    <Users size={11} />
                    {isLeftSidebarOpen ? "← Ocultar Clientes" : "→ Mostrar Clientes"}
                  </button>

                  <button
                    onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                    className={`flex items-center gap-1 py-1 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                      isRightSidebarOpen 
                        ? 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white' 
                        : 'bg-[#39FF14] text-black border-[#39FF14]/50 hover:bg-[#34e012] shadow-[0_0_12px_rgba(57,255,20,0.3)] animate-pulse'
                    }`}
                    title={isRightSidebarOpen ? "Ocultar painel técnico" : "Mostrar painel técnico"}
                  >
                    <Sliders size={11} />
                    {isRightSidebarOpen ? "Ocultar Painel →" : "← Mostrar Painel"}
                  </button>
                </div>
              )}
            </div>

            {/* Quick customer metadata card */}
            {activeClient && (
              <div className="flex items-center gap-2 text-right">
                <div>
                  <h4 className="text-xs font-black uppercase text-white tracking-tight">{activeClient.name}</h4>
                  <p className="text-[10px] text-zinc-400 italic">IP Central: <code className="bg-black/40 px-1 py-0.5 rounded text-indigo-400 font-mono text-[9px]">{clientHubIp}</code></p>
                </div>
              </div>
            )}
          </div>

          {/* TAB CONTENTS */}
          <div className="flex-1 flex flex-col relative min-h-0">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: INTERACTIVE MAP EDITOR */}
              {activeTab === 'map' && activeClient && (
                <motion.div 
                  key="map-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col md:flex-row min-h-0"
                >
                  {/* WORKSPACE MAP PALETTE */}
                  <div className="flex-1 relative overflow-hidden bg-zinc-950 flex flex-col justify-between" ref={containerRef}>
                    
                    {/* TOP MAP TOOLS OVERLAY */}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 print:hidden select-none">
                      <div className="flex rounded-xl bg-black/80 p-1 border border-white/10 items-center backdrop-blur shadow-2xl">
                        <button
                          onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
                          className="p-1.5 hover:bg-white/10 text-zinc-300 hover:text-white rounded transition-colors"
                          title="Afastar Zoom"
                        >
                          <ZoomOut size={14} />
                        </button>
                        <span className="text-[9px] font-mono font-black text-zinc-400 min-w-[36px] text-center px-1 border-r border-l border-white/5">
                          {Math.round(zoom * 100)}%
                        </span>
                        <button
                          onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
                          className="p-1.5 hover:bg-white/10 text-zinc-300 hover:text-white rounded transition-colors"
                          title="Aproximar Zoom"
                        >
                          <ZoomIn size={14} />
                        </button>
                      </div>

                      <button
                        onClick={performRadialLayout}
                        className="p-2 py-1.5 rounded-xl bg-black/80 hover:bg-white/10 border border-white/10 text-[9px] font-black uppercase text-left flex items-center gap-1.5 transition-all text-white backdrop-blur shadow-2xl"
                        title="Auto Ordenação Radial de Nós"
                      >
                        <RefreshCw size={11} className="text-sky-400" /> Radial-Layout
                      </button>

                      <div className="hidden md:block p-3 rounded-2xl bg-black/80 border border-white/5 backdrop-blur text-[8px] uppercase font-bold text-zinc-500 max-w-[170px] space-y-1">
                        <span className="block text-zinc-400 font-extrabold mb-1">Dicas de Uso:</span>
                        <span className="block">🖱️ Arraste os nós para desenhar a rede.</span>
                        <span className="block">👆 Clique único para selecionar.</span>
                        <span className="block">✌️ Clique duplo para editar/excluir.</span>
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 z-20 flex gap-2 print:hidden select-none">
                      <button
                        onClick={() => setMapViewMode('templates')}
                        className="p-2 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-[9px] font-black uppercase flex items-center gap-1 transition-all text-indigo-400 backdrop-blur shadow-xl"
                      >
                        <Sparkles size={11} /> Gabaritos IoT
                      </button>
                      <button
                        onClick={openAddNode}
                        className="p-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-black uppercase flex items-center gap-1 transition-all text-emerald-400 backdrop-blur shadow-xl"
                      >
                        <Plus size={12} /> Novo Ponto
                      </button>
                    </div>

                    {/* INTER-NODE LINK VECTOR CHANNELS */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                      {nodes.map(node => {
                        if (!node.parentId) return null;
                        const parent = nodes.find(n => n.id === node.parentId);
                        if (!parent) return null;

                        const x1 = parent.x * zoom + pan.x;
                        const y1 = parent.y * zoom + pan.y;
                        const x2 = node.x * zoom + pan.x;
                        const y2 = node.y * zoom + pan.y;

                        const isDevice = node.type === 'device';
                        const isInactive = node.status === 'inactive';
                        const isConnDisabled = node.connectionDisabled === true;

                        return (
                          <g key={`screen-link-${node.id}`}>
                            {/* Connector line spline curved trail */}
                            <path
                              d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                              fill="none"
                              stroke={isConnDisabled ? '#ef4444' : (isDevice ? (isInactive ? '#a1a1aa' : '#6366f1') : '#0ea5e9')}
                              strokeWidth={isConnDisabled ? 3.5 * zoom : 3 * zoom}
                              strokeOpacity={isConnDisabled ? 0.9 : (isInactive ? 0.25 : 0.6)}
                              className="transition-colors duration-300"
                              strokeDasharray={isConnDisabled ? '3,3' : (isInactive ? '5,5' : undefined)}
                            />
                            {/* Speed packet simulator dot trail floating toward node direction */}
                            {!isInactive && !isConnDisabled && (
                              <circle
                                r={4 * zoom}
                                fill="#39FF14"
                                className="shadow-lg"
                              >
                                <animateMotion
                                  path={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                                  dur={`${node.protocol === 'WiFi' ? 2 : 4}s`}
                                  repeatCount="indefinite"
                                />
                              </circle>
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* SCROLLABLE VIRTUAL ARENA FOR FLOATING GRAPH */}
                    <div 
                      className="absolute inset-0 select-none overflow-hidden"
                      style={{ zIndex: 2 }}
                      onMouseDown={() => setSelectedNode(null)}
                    >
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
                          const isDev = node.type === 'device';
                          
                          const roomColorClass = ROOM_COLORS[node.type] || ROOM_COLORS.device;
                          const protocolIcon = node.protocol ? PROTOCOL_ICONS[node.protocol] || '' : '';
                          const deviceIcon = node.deviceType ? DEVICE_ICONS[node.deviceType] || '' : '';

                          const isInactive = node.status === 'inactive';

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
                              className={`p-2.5 px-4 rounded-2xl border flex items-center gap-2.5 transition-all text-[11px] font-black uppercase shadow-2xl select-none max-w-[200px] ${roomColorClass} ${
                                isSelected 
                                  ? 'ring-4 ring-[#39FF14] scale-105 border-white shadow-[0_0_20px_rgba(57,255,20,0.5)]' 
                                  : 'border-white/10 hover:border-white/30'
                              } ${isInactive ? 'opacity-40 filter grayscale' : ''}`}
                            >
                              {/* Status blink sensor indicator */}
                              {isHub && <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping shrink-0" />}
                              {isRoom && <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 animate-pulse" />}
                              {isDev && !isInactive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}

                              {/* Class Icons */}
                              <span className="text-xs shrink-0 select-none">
                                {isDev ? deviceIcon : isHub ? '🎛️' : '🏠'}
                              </span>

                              <div className="min-w-0 pr-1 leading-tight">
                                <span className="block truncate text-[10px] tracking-wide">{node.label}</span>
                                {node.details && (
                                  <span className="block text-[7px] text-white/50 font-normal lowercase italic truncate">
                                    {node.details}
                                  </span>
                                )}
                              </div>

                              {protocolIcon && (
                                <span className="text-[8px] bg-black/50 p-1 px-1.5 rounded-lg border border-white/5 font-black shrink-0 tracking-widest text-[8px]" title={node.protocol}>
                                  {protocolIcon} {node.protocol}
                                </span>
                              )}

                              {node.parentId && node.connectionDisabled && (
                                <span 
                                  onClick={(e) => toggleNodeConnection(node.id, e)}
                                  className="text-[8px] bg-rose-500 text-white font-black p-1 px-2 rounded-lg hover:bg-rose-600 transition-all shrink-0 cursor-pointer animate-pulse" 
                                  title="Conexão Desligada! Clique para Ligar"
                                >
                                  🔌 DESLIGADO
                                </span>
                              )}

                              <button
                                type="button"
                                id={`add-child-btn-${node.id}`}
                                onClick={(e) => openAddNodeWithParent(node.id, e)}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="ml-1.5 p-1 px-2 rounded-lg bg-[#39FF14]/20 hover:bg-[#39FF14]/40 border border-[#39FF14]/30 hover:border-[#39FF14]/60 text-[#39FF14] font-black text-[12px] cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center justify-center shrink-0"
                                title="Adicionar ponto conectado a este"
                              >
                                +
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SELECT NODE MINIMAL ACTION CARD */}
                    {selectedNode && mapViewMode === 'view' && (
                      <div className="absolute bottom-4 left-4 right-4 z-20 bg-zinc-900 border border-white/10 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-xl shadow-2xl">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#39FF14] uppercase tracking-wide">{selectedNode.label}</span>
                            <span className="text-[8px] uppercase tracking-wider text-zinc-400 bg-white/5 p-1 px-1.5 rounded-xl border border-white/5">
                              {selectedNode.type}
                            </span>
                            {selectedNode.status === 'inactive' && (
                              <span className="text-[7px] uppercase font-black px-1 bg-red-500/10 text-red-400 rounded">desconectado</span>
                            )}
                          </div>
                          {selectedNode.details ? (
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{selectedNode.details}</p>
                          ) : (
                            <p className="text-[10px] text-zinc-500 mt-0.5">Sem especificações técnicas adicionais gravadas.</p>
                          )}
                        </div>

                        <div className="flex gap-2 shrink-0 items-center flex-wrap sm:flex-nowrap">
                          {/* Toggle Connection Status (Link autonomy!) */}
                          {selectedNode.parentId && (
                            <button
                              type="button"
                              onClick={(e) => toggleNodeConnection(selectedNode.id, e)}
                              className={`p-1.5 px-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                                selectedNode.connectionDisabled
                                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/35 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
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
                            className={`p-1.5 px-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                              selectedNode.status === 'inactive'
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:scale-105 active:scale-95'
                                : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/30 hover:scale-105 active:scale-95'
                            }`}
                            title={selectedNode.status === 'inactive' ? "Ligar equipamento" : "Desligar equipamento (Offline)"}
                          >
                            {selectedNode.status === 'inactive' ? '💡 Ligar Ponto' : '🔌 Desligar Ponto'}
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditNode(selectedNode)}
                            className="p-1.5 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-[#39FF14]/10 hover:border-[#39FF14]/20 hover:text-[#39FF14] text-[9px] font-black uppercase transition-all"
                          >
                            Propriedades
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNode(selectedNode.id)}
                            className="p-1.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-[9px] font-black uppercase transition-all"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    )}

                    {/* FLOATING COLLAPSED DRAWER PULLS */}
                    {!isLeftSidebarOpen && (
                      <button
                        type="button"
                        onClick={() => setIsLeftSidebarOpen(true)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-r-2xl bg-zinc-900/90 hover:bg-indigo-600 border border-l-0 border-white/10 hover:border-indigo-500/50 text-indigo-400 hover:text-white shadow-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 text-[10px] font-black uppercase tracking-wider print:hidden"
                        title="Ver Clientes"
                      >
                        <ChevronRight size={13} className="animate-pulse" /> Clientes
                      </button>
                    )}

                    {!isRightSidebarOpen && (
                      <button
                        type="button"
                        onClick={() => setIsRightSidebarOpen(true)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-l-2xl bg-zinc-900/90 hover:bg-[#39FF14] border border-r-0 border-white/10 hover:border-[#39FF14]/50 text-[#39FF14] hover:text-black shadow-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 text-[10px] font-black uppercase tracking-wider print:hidden"
                        title="Ver Propriedades e Métricas"
                      >
                        Painel <ChevronLeft size={13} className="animate-pulse" />
                      </button>
                    )}
                  </div>

                  {/* RIGHT PANEL FORM AND TEMPLATES ON MAP TAB WITH FLUID COLLAPSE */}
                  <div className={`${isRightSidebarOpen ? 'w-full md:w-80 p-4 border-t md:border-t-0 md:border-l opacity-100' : 'w-0 h-0 md:h-full p-0 border-t-0 md:border-l-0 opacity-0 overflow-hidden'} border-white/5 bg-zinc-900/60 overflow-y-auto max-h-[40vh] md:max-h-full shrink-0 flex flex-col justify-start transition-all duration-300`}>
                    
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 shrink-0">
                      <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Painel Técnico</span>
                      <button 
                        onClick={() => setIsRightSidebarOpen(false)}
                        className="p-1 px-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-[8px] uppercase font-black tracking-widest flex items-center gap-0.5"
                        title="Recolher Painel Técnico"
                      >
                        Ocultar <ChevronRight size={10} />
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      
                      {mapViewMode === 'view' && (
                        <motion.div 
                          key="meta"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-4"
                        >
                          <div className="p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-2">
                            <h4 className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Resumo da Topologia</h4>
                            
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                                <span className="block text-lg font-black text-white">{activeDeviceCount + inactiveDeviceCount}</span>
                                <span className="text-[8px] text-zinc-500 font-black uppercase">Dispositivos</span>
                              </div>
                              <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                                <span className="block text-lg font-black text-sky-400">{totalRooms}</span>
                                <span className="text-[8px] text-zinc-500 font-black uppercase">Áreas/Cômodos</span>
                              </div>
                            </div>

                            {/* Network score safety index */}
                            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                              <span className="text-zinc-400">Eficiência Mesh:</span>
                              <span className="text-[#39FF14] font-black">98% (Excelente)</span>
                            </div>
                          </div>

                          {/* Quick checklist integration preview */}
                          <div className="space-y-2">
                            <h4 className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Etapas de Implantação</h4>
                            <div className="space-y-1.5">
                              {Object.entries({
                                survey: 'Estudo Técnico de Viabilidade',
                                wiring: 'Puxada de Neutro & Cabeamentos',
                                hw_installation: 'Sistemas Físicos & Placas',
                                pairing: 'Comunicação e Pareamento Zigbee',
                                scenes: 'Programação de Cenas & Rotinas',
                                handover: 'Entrega Técnica e Aceite'
                              }).map(([key, label]) => {
                                const checked = checklist[key as keyof typeof checklist];
                                return (
                                  <button
                                    key={key}
                                    onClick={() => handleToggleChecklist(key as any)}
                                    className="w-full flex items-center justify-between p-2 rounded-xl bg-black/20 hover:bg-black/40 text-left border border-white/5 text-[9px] font-black uppercase transition-all"
                                  >
                                    <span className={checked ? 'text-zinc-500 line-through' : 'text-zinc-300'}>{label}</span>
                                    {checked ? (
                                      <CheckCircle2 size={13} className="text-[#39FF14]" />
                                    ) : (
                                      <span className="w-3 h-3 rounded-full border border-zinc-600" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {mapViewMode === 'templates' && (
                        <motion.div 
                          key="tpls"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Preset Modelos de Carga</h4>
                            <button 
                              onClick={() => setMapViewMode('view')} 
                              className="text-[8px] font-black text-zinc-500 hover:text-white uppercase"
                            >
                              Voltar
                            </button>
                          </div>

                          <div className="space-y-2">
                            <button
                              onClick={() => applyPresetLayout('zigbee_mesh')}
                              className="w-full text-left p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all space-y-1 group"
                            >
                              <span className="block text-xs font-black uppercase text-white group-hover:text-indigo-400">AP Inteligente Zigbee Mesh</span>
                              <span className="block text-[9px] text-zinc-400 font-normal leading-tight">Gabarito para apartamentos com rede cabeada de hub inteligente e sensores Zigbee.</span>
                            </button>

                            <button
                              onClick={() => applyPresetLayout('voice_wifi')}
                              className="w-full text-left p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all space-y-1 group"
                            >
                              <span className="block text-xs font-black uppercase text-white group-hover:text-indigo-400">Casa Compacta Voice WiFi</span>
                              <span className="block text-[9px] text-zinc-400 font-normal leading-tight">Configuração de dispositivos operando sob redes Wi-Fi integrados em inteligência nativa Alexa.</span>
                            </button>

                            <button
                              onClick={() => applyPresetLayout('luxury_knx')}
                              className="w-full text-left p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all space-y-1 group"
                            >
                              <span className="block text-xs font-black uppercase text-white group-hover:text-indigo-400 font-sans">Infraestrutura Corporativa KNX/Control4</span>
                              <span className="block text-[9px] text-zinc-400 font-normal leading-tight">Para casas grandes e escritórios com switch PoE, rack técnico, receiver Denon, keypad KNX.</span>
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {(mapViewMode === 'add' || mapViewMode === 'edit-node') && (
                        <motion.form
                          key="form-edit"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          onSubmit={mapViewMode === 'add' ? saveAddedNode : saveEditedNode}
                          className="space-y-3 text-xs"
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-1">
                            <h4 className="text-[9px] font-black uppercase text-[#39FF14] tracking-widest">
                              {mapViewMode === 'add' ? 'Adicionar Ponto IoT' : 'Editar Propriedades'}
                            </h4>
                            <button
                              type="button"
                              onClick={() => setMapViewMode('view')}
                              className="text-[8px] font-black uppercase text-zinc-500 hover:text-white"
                            >
                              Voltar
                            </button>
                          </div>

                          {/* Label */}
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-zinc-500 block">Rótulo / Nome</label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: Sensor de Fumaça, Luz Sanca..."
                              value={formLabel}
                              onChange={(e) => setFormLabel(e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#39FF14]/50"
                            />
                          </div>

                          {/* Select type details */}
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-zinc-500 block">Categoria do Nó</label>
                            <select
                              value={formType}
                              onChange={(e) => setFormType(e.target.value as any)}
                              className="w-full bg-black/60 border border-white/10 rounded-xl p-1 text-xs text-white"
                            >
                              <option value="hub">🎛️ Gateway Principal / Hub</option>
                              <option value="room">🏠 Área / Cômodo</option>
                              <option value="device">💡 Dispositivo / Hardware</option>
                              <option value="group">📦 Grupo de Dispositivos</option>
                            </select>
                          </div>

                          {/* Connected node link parent */}
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-zinc-500 block">Nó de Conexão (Pai)</label>
                            <select
                              value={formParentId}
                              onChange={(e) => setFormParentId(e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-xl p-1 text-xs text-white"
                            >
                              <option value="">Sem conexão (Raiz)</option>
                              {nodes.filter(n => n.id !== selectedNode?.id).map(n => (
                                <option key={n.id} value={n.id}>{n.label} ({n.type})</option>
                              ))}
                            </select>
                          </div>

                          {/* Dynamic fields */}
                          {(formType === 'device' || formType === 'hub') && (
                            <div className="p-2.5 bg-black/30 border border-white/5 rounded-xl space-y-2">
                              <div className="space-y-1">
                                <label className="text-[7.5px] font-black uppercase text-zinc-400 block">Protocolo Sem Fio</label>
                                <select
                                  value={formProtocol}
                                  onChange={(e) => setFormProtocol(e.target.value as any)}
                                  className="w-full bg-zinc-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white"
                                >
                                  <option value="Zigbee">Zigbee Mesh</option>
                                  <option value="WiFi">Wi-Fi Wireless</option>
                                  <option value="ZWave">Z-Wave Mesh</option>
                                  <option value="Bluetooth">Bluetooth BLE</option>
                                  <option value="IP">IP RJ45 / Cabo</option>
                                  <option value="N/A">Nenhum/Analógico</option>
                                </select>
                              </div>

                              {formType === 'device' && (
                                <div className="space-y-1">
                                  <label className="text-[7.5px] font-black uppercase text-zinc-400 block">Tipo de Dispositivo</label>
                                  <select
                                    value={formDeviceType}
                                    onChange={(e) => setFormDeviceType(e.target.value as any)}
                                    className="w-full bg-zinc-900 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white"
                                  >
                                    <option value="light">Iluminação / Led</option>
                                    <option value="switch">Interruptor / Relé</option>
                                    <option value="sensor">Sensor / Radar</option>
                                    <option value="security">Segurança / Fechadura</option>
                                    <option value="climate">Ar Condicionado / Termo</option>
                                    <option value="media">Multimídia / TV</option>
                                    <option value="other">Outros/Atuadores</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Details field */}
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-zinc-500 block">Especificações Técnicas</label>
                            <textarea
                              rows={2}
                              value={formDetails}
                              onChange={(e) => setFormDetails(e.target.value)}
                              placeholder="Frequência, IP, canal, marca..."
                              className="w-full bg-black/60 border border-white/10 rounded-xl px-2 py-1 text-xs text-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-zinc-500 block">Status Operacional</label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setFormStatus('active')}
                                className={`flex-1 py-1 rounded-lg text-[9px] uppercase font-black tracking-wider transition-all ${
                                  formStatus === 'active' 
                                    ? 'bg-[#39FF14]/20 border border-[#39FF14]/30 text-[#39FF14]' 
                                    : 'bg-zinc-800 text-zinc-500 border border-transparent'
                                }`}
                              >
                                Ativo / Online
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormStatus('inactive')}
                                className={`flex-1 py-1 rounded-lg text-[9px] uppercase font-black tracking-wider transition-all ${
                                  formStatus === 'inactive' 
                                    ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400' 
                                    : 'bg-zinc-800 text-zinc-500 border border-transparent'
                                }`}
                              >
                                Inativo / Offline
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setMapViewMode('view')}
                              className="w-1/3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase"
                            >
                              Voltar
                            </button>
                            <button
                              type="submit"
                              className="w-2/3 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-[9px] font-black uppercase text-white shadow-lg"
                            >
                              Salvar
                            </button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>

                  </div>
                </motion.div>
              )}

              {/* TAB 2: DETAILED TECHNICAL REPORT & INVENTORY FOR THE CLIENT */}
              {activeTab === 'report' && activeClient && (
                <motion.div 
                  key="report-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full pb-16"
                >
                  {/* SUMMARY SECTION CARD */}
                  <div className="p-6 bg-zinc-900/60 border border-white/5 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                      <div>
                        <span className="text-[8px] font-black tracking-widest text-indigo-400 uppercase">Laudo de Implantação e Levantamento Técnico</span>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-white">{activeClient.name}</h2>
                        <span className="text-xs text-zinc-400 mt-0.5 block">📍 {activeClient.address}</span>
                      </div>

                      <div className="flex gap-2 shrink-0 print:hidden">
                        <button
                          onClick={handlePrintOutline}
                          className="p-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/5 flex items-center gap-1.5 transition-colors"
                        >
                          <Printer size={13} /> Imprimir / PDF
                        </button>
                        <button
                          onClick={saveTechnicalSummaries}
                          className="p-2 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-500/10"
                        >
                          <Save size={13} /> Salvar Alterações
                        </button>
                      </div>
                    </div>

                    {/* MAIN SPECIFICATIONS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Connection IP Setup Box */}
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
                        <span className="text-[8px] font-black text-indigo-400 uppercase block tracking-widest">Gateway Config (Infra &amp; IPs)</span>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[7.5px] uppercase font-black text-zinc-500 block mb-1">IP Local Central IoT (Hub)</label>
                            <input
                              type="text"
                              value={clientHubIp}
                              onChange={(e) => setClientHubIp(e.target.value)}
                              placeholder="Ex: 192.168.1.150"
                              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[7.5px] uppercase font-black text-zinc-500 block mb-1">IP do Roteador / Gateway Principal</label>
                            <input
                              type="text"
                              value={clientRouterIp}
                              onChange={(e) => setClientRouterIp(e.target.value)}
                              placeholder="Ex: 192.168.1.1"
                              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <span className="text-[7.5px] uppercase font-black text-zinc-500 block">Hub Status</span>
                            <span className="text-xs text-[#39FF14] font-bold flex items-center gap-1 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-ping shrink-0" /> Online &amp; Integrado
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Distribution breakdown */}
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-1 text-xs">
                        <span className="text-[8px] font-black text-sky-400 uppercase block tracking-widest mb-1.5">Distribuição Hardware</span>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-zinc-500">💡 Iluminação &amp; Led:</span>
                            <span className="font-extrabold text-white">{typesCount['light'] || 0} dispositivos</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-zinc-500">🎛️ Interruptores/Atuadores:</span>
                            <span className="font-extrabold text-white">{typesCount['switch'] || 0} canais</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-zinc-500">🌡️ Sensores/Presenças:</span>
                            <span className="font-extrabold text-white">{typesCount['sensor'] || 0} sensores</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-zinc-500">❄️ Clima/Ar Condicionado:</span>
                            <span className="font-extrabold text-white">{typesCount['climate'] || 0} unidades</span>
                          </div>
                        </div>
                      </div>

                      {/* Communications and Mesh Breakdown */}
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-1 text-xs">
                        <span className="text-[8px] font-black text-amber-400 uppercase block tracking-widest mb-1.5">Topologia de Rede</span>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-zinc-500">🌐 Wi-Fi (2.4Ghz &amp; 5Ghz):</span>
                            <span className="font-extrabold text-white">{protocolsCount['WiFi'] || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-zinc-500">🐝 Zigbee Core Mesh:</span>
                            <span className="font-extrabold text-[#39FF14]">{protocolsCount['Zigbee'] || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-zinc-500">🌊 Z-Wave Clássico:</span>
                            <span className="font-extrabold text-white">{protocolsCount['ZWave'] || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-zinc-500">🔌 Rede Metálica/IP:</span>
                            <span className="font-extrabold text-white">{protocolsCount['IP'] || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED DESCRIPTIVE MEMORANDUM TEXT AREA */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest">Memorial Descritivo do Projeto / Observações Gerais</label>
                      <textarea
                        rows={6}
                        value={clientNotes}
                        onChange={(e) => setClientNotes(e.target.value)}
                        placeholder="Insira detalhes descritivos sobre barramentos, detalhes de cabeamento, particularidades do condomínio, cenas programadas, canais Wi-Fi reservados..."
                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50 leading-relaxed font-sans"
                      />
                    </div>
                  </div>

                  {/* HARDWARE INVENTORY IN DETAIL */}
                  <div className="p-6 bg-zinc-900/60 border border-white/5 rounded-3xl space-y-4 shadow-xl">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white border-b border-white/5 pb-2 flex items-center justify-between">
                      <span>📋 Inventário Completo de Equipamentos ({nodes.filter(n => n.type === 'device').length})</span>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono">Gerado a partir do Mapa Mental</span>
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-zinc-300">
                        <thead>
                          <tr className="border-b border-white/5 text-[9px] uppercase font-black text-zinc-400">
                            <th className="pb-3">Dispositivo</th>
                            <th className="pb-3">Tipo</th>
                            <th className="pb-3">Protocolo</th>
                            <th className="pb-3">Observações/Especificações</th>
                            <th className="pb-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {nodes.filter(n => n.type === 'device').map((node) => (
                            <tr key={node.id} className="hover:bg-white/[0.02]">
                              <td className="py-3 font-semibold text-white">
                                {node.label}
                              </td>
                              <td className="py-3 font-mono text-[10px] uppercase text-zinc-400">
                                {node.deviceType ? DEVICE_ICONS[node.deviceType] + ' ' + node.deviceType : 'Outro'}
                              </td>
                              <td className="py-3">
                                <span className="bg-black/30 p-1 px-2 rounded-lg border border-white/5 text-[10px] font-bold">
                                  {node.protocol ? PROTOCOL_ICONS[node.protocol] + ' ' + node.protocol : 'Sem protocolo'}
                                </span>
                              </td>
                              <td className="py-3 text-zinc-400 italic text-[10px]">
                                {node.details || 'Sem especificações.'}
                              </td>
                              <td className="py-3 text-right">
                                <span className={`p-1 px-1.5 rounded text-[8px] font-black uppercase ${
                                  node.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                  {node.status === 'active' ? 'Online' : 'Offline'}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {nodes.filter(n => n.type === 'device').length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-zinc-500 italic">
                                Nenhum hardware inserido no mapa do dispositivo. Navegue na aba "Mapa" e clique em "Novo Ponto".
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* PRINT MEMORANDUM ON SHEET (Only visible on browser print) */}
                  <div className="hidden print:block border-t border-black p-4 pt-10 text-xs text-black font-serif space-y-4">
                    <h2 className="text-lg font-bold border-b pb-2 uppercase">Garantia &amp; Homologação das Instalações IoT</h2>
                    <p>O presente laudo técnico certifica que a topologia ilustrada e os equipamentos inventariados acima foram instalados de acordo com os padrões de conectividade recomendados, estando as rotinas e canais homologados e livres de interferências.</p>
                    <div className="pt-20 grid grid-cols-2 gap-10 text-center">
                      <div>
                        <div className="border-t border-black md:w-64 mx-auto pt-2 text-[10px]" />
                        <span>Assinatura do Técnico Responsável</span>
                      </div>
                      <div>
                        <div className="border-t border-black md:w-64 mx-auto pt-2 text-[10px]" />
                        <span>Aceite do Cliente Integrado</span>
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </main>
      </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SEÇÃO DE IMPRESSÃO - NOSSO PADRÃO DE QUALIDADE (ONLY VISIBLE ON PRINT)  */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="hidden print:block bg-white text-zinc-900 p-8 sm:p-12 font-sans w-full min-h-screen text-xs">
        {/* LOGO & EMISSÃO HEADER */}
        <div className="border-b-4 border-indigo-600 pb-4 mb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-wider uppercase text-indigo-700 font-sans">CONDFY SMART HOME</span>
              <span className="text-[8px] bg-indigo-100 text-indigo-800 font-black px-1.5 py-0.5 rounded uppercase">PADRÃO DE QUALIDADE</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium font-mono">LAUDO TÉCNICO DE CERTIFICAÇÃO E HOMOLOGAÇÃO DE REDE IOT</p>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-zinc-400 block uppercase">Código do Checklist</span>
            <span className="text-sm font-mono font-bold text-zinc-800">#CF-{activeClient?.id?.toUpperCase() || 'PRJ'}-{Date.now().toString().slice(-4)}</span>
            <span className="text-[9px] text-zinc-400 block mt-1">Geração Automática: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* CARTA DE PADRÃO DE QUALIDADE - "NOSSO PADRÃO DE QUALIDADE" */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 mb-6 leading-relaxed">
          <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5 font-sans">
            🛡️ CERTIFICADO DE EXCELÊNCIA E PADRÃO DE QUALIDADE CONDFY
          </h3>
          <p className="text-[10px] text-zinc-650 font-sans">
            A Condfy certifica solenemente que este projeto de automação residencial e IoT cumpre integralmente com os nossos rigorosos <strong>padrões técnicos de qualidade e redundância ativa de sinal</strong>. Todas as baterias, switches e atuadores de rádio foram pareados com canais de rádio analisados contra interferências mútuas, o barramento de alimentação está dimensionado e a malha mesh possui redundância ativa garantindo estabilidade e conectividade ininterrupta.
          </p>
        </div>

        {/* METADADOS DO CLIENTE */}
        <div className="grid grid-cols-2 gap-4 border border-zinc-200 rounded-xl p-4 mb-6 bg-white shadow-xs">
          <div className="space-y-1.5">
            <h4 className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Dados do Cliente Mapeado</h4>
            <div className="space-y-1">
              <p className="text-sm font-black text-zinc-850 uppercase">{activeClient?.name}</p>
              <p className="text-[10px] text-zinc-500">📍 Endereço de Instalação: {activeClient?.address}</p>
              <p className="text-[10px] text-zinc-500">📞 Contato de Suporte: {activeClient?.phone || 'Não informado'}</p>
              <p className="text-[10px] text-zinc-500">📊 Status Atual do Sistema: {activeClient?.status || 'Homologado'}</p>
            </div>
          </div>
          
          <div className="space-y-1.5 border-l border-zinc-200 pl-4">
            <h4 className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Parâmetros Críticos de Conectividade (Endereços IP)</h4>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-zinc-50 border border-zinc-200 p-2 rounded-lg text-center">
                <span className="text-[8px] font-bold text-indigo-600 block uppercase">1. IP Central IoT (Hub)</span>
                <span className="text-xs font-mono font-bold text-zinc-800 block mt-0.5">{clientHubIp || '192.168.1.150'}</span>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 p-2 rounded-lg text-center">
                <span className="text-[8px] font-bold text-emerald-650 block uppercase">2. IP Gateway/Roteador</span>
                <span className="text-xs font-mono font-bold text-zinc-800 block mt-0.5">{clientRouterIp || '192.168.1.1'}</span>
              </div>
            </div>
            <p className="text-[8.5px] text-zinc-400 font-mono mt-1 text-center">Subrede Unificada: 255.255.255.0 | DNS de Alta Velocidade (Cloudflare)</p>
          </div>
        </div>

        {/* TOPOLOGY METRICS SUMMARY & PROTOCOLS */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="border border-zinc-200 p-2.5 rounded-lg text-center bg-zinc-50/50">
            <span className="block text-base font-black text-zinc-850">{activeDeviceCount + inactiveDeviceCount}</span>
            <span className="text-[8px] text-zinc-500 uppercase font-black tracking-wider">Dispositivos Mapeados</span>
          </div>
          <div className="border border-zinc-200 p-2.5 rounded-lg text-center bg-zinc-50/50">
            <span className="block text-base font-black text-indigo-600">{totalRooms}</span>
            <span className="text-[8px] text-zinc-500 uppercase font-black tracking-wider">Cômodos Regulados</span>
          </div>
          <div className="border border-zinc-200 p-2.5 rounded-lg text-center bg-zinc-50/50">
            <span className="block text-base font-black text-emerald-600">{nodes.filter(n => n.type === 'device' && n.status === 'active').length}</span>
            <span className="text-[8px] text-zinc-500 uppercase font-black tracking-wider">Dispositivos em Operação</span>
          </div>
        </div>

        {/* ORDERED ROOMS AND RELEVANT DEVICES INVENTORY (Todos Ordenados!) */}
        <div className="space-y-4 mb-6">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-800 border-b border-zinc-300 pb-1 flex items-center gap-1.5 font-sans">
            📋 INVENTÁRIO TÉCNICO DE HARDWARE POR CÔMODOS (ORDEM ALFABÉTICA)
          </h3>

          {/* Loop over sorted rooms */}
          {roomNodes.slice().sort((a,b) => a.label.localeCompare(b.label)).map(room => {
            const roomDevices = nodes.filter(n => n.type === 'device' && n.parentId === room.id).slice().sort((a,b) => a.label.localeCompare(b.label));
            if (roomDevices.length === 0) return null;
            return (
              <div key={room.id} className="border border-zinc-200 rounded-lg overflow-hidden shrink-0 page-break-inside-avoid">
                <div className="bg-zinc-100 p-2 font-black text-[10px] text-zinc-800 uppercase flex justify-between items-center border-b border-zinc-200">
                  <span className="flex items-center gap-1">🏠 AMBIENTE: {room.label}</span>
                  <span className="text-[8px] text-zinc-500 font-mono italic">Área Consolidada</span>
                </div>
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="bg-zinc-50/50 text-[8px] uppercase font-bold text-zinc-500 border-b border-zinc-100">
                      <th className="p-2 pl-3">Rótulo do Equipamento</th>
                      <th className="p-2">Tipo de Hardware</th>
                      <th className="p-2">Tecnologia</th>
                      <th className="p-2">Observações / Insumos do Ponto</th>
                      <th className="p-2 text-right pr-3">Integrado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {roomDevices.map(device => (
                      <tr key={device.id} className="hover:bg-zinc-50/50">
                        <td className="p-2 pl-3 font-bold text-zinc-900">{device.label}</td>
                        <td className="p-2 uppercase text-zinc-500 text-[9px] font-mono">
                          {device.deviceType ? DEVICE_ICONS[device.deviceType] + ' ' + device.deviceType : 'Outro'}
                        </td>
                        <td className="p-2 text-indigo-700 font-black text-[9px]">
                          {device.protocol ? PROTOCOL_ICONS[device.protocol] + ' ' + device.protocol : 'N/A'}
                        </td>
                        <td className="p-2 text-zinc-500 italic max-w-xs truncate">{device.details || 'Conexão estável certificada.'}</td>
                        <td className="p-2 text-right pr-3 font-mono font-bold text-[9px]">
                          {device.connectionDisabled ? (
                            <span className="text-rose-500 font-bold uppercase">[❌ CANAL DESATIVADO]</span>
                          ) : device.status === 'active' ? (
                            <span className="text-emerald-700 font-bold uppercase">[✓ 100% ONLINE]</span>
                          ) : (
                            <span className="text-zinc-400 font-bold uppercase">[OFFLINE]</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Infrastructure/Hub elements */}
          {nodes.filter(n => n.type === 'hub' || n.type === 'group').length > 0 && (
            <div className="border border-zinc-200 rounded-lg overflow-hidden shrink-0 page-break-inside-avoid">
              <div className="bg-zinc-100 p-2 font-black text-[10px] text-zinc-800 uppercase flex justify-between items-center border-b border-zinc-200">
                <span className="flex items-center gap-1">🎛️ BACKBONE DE INFRAESTRUTURA E GATEWAYS</span>
                <span className="text-[8px] text-zinc-500 font-mono italic font-bold">Distribuição Primária</span>
              </div>
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="bg-zinc-50/50 text-[8px] uppercase font-bold text-zinc-500 border-b border-zinc-100">
                    <th className="p-2 pl-3">Central / Nó</th>
                    <th className="p-2">Categoria</th>
                    <th className="p-2">IP Vinculado</th>
                    <th className="p-2">Descrição de Localização</th>
                    <th className="p-2 text-right pr-3">Integrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {nodes.filter(n => n.type === 'hub' || n.type === 'group').slice().sort((a,b) => a.label.localeCompare(b.label)).map(node => (
                    <tr key={node.id} className="hover:bg-zinc-50/50">
                      <td className="p-2 pl-3 font-bold text-zinc-900">{node.label}</td>
                      <td className="p-2 uppercase text-zinc-500 text-[9px] font-mono">{node.type}</td>
                      <td className="p-2 text-zinc-700 font-mono text-[9px] font-bold">{node.type === 'hub' ? (clientHubIp || '192.168.1.150') : 'Rede Mesh Local'}</td>
                      <td className="p-2 text-zinc-500 italic max-w-xs truncate">{node.details || 'Frequência de comunicação exclusiva para automação.'}</td>
                      <td className="p-2 text-right pr-3 font-mono font-bold text-[9px]">
                        {node.status === 'active' ? (
                          <span className="text-emerald-700 font-bold uppercase">[✓ OPERACIONAL]</span>
                        ) : (
                          <span className="text-rose-500 font-bold uppercase">[✗ DESCONECTADO]</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Other/Dangling devices whose parent isn't a room */}
          {nodes.filter(n => n.type === 'device' && (!n.parentId || !roomNodes.some(r => r.id === n.parentId))).length > 0 && (
            <div className="border border-zinc-200 rounded-lg overflow-hidden shrink-0 page-break-inside-avoid">
              <div className="bg-zinc-100 p-2 font-black text-[10px] text-zinc-800 uppercase flex justify-between items-center border-b border-zinc-200">
                <span className="flex items-center gap-1">⚙️ DISPOSITIVOS GLOBAIS / CONEXÕES AVULSAS</span>
                <span className="text-[8px] text-zinc-500 font-mono italic">Acessórios de Rede</span>
              </div>
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="bg-zinc-50/50 text-[8px] uppercase font-bold text-zinc-500 border-b border-zinc-100">
                    <th className="p-2 pl-3">Equipamento</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Protocolo</th>
                    <th className="p-2">Observações</th>
                    <th className="p-2 text-right pr-3">Integrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {nodes.filter(n => n.type === 'device' && (!n.parentId || !roomNodes.some(r => r.id === n.parentId))).slice().sort((a,b) => a.label.localeCompare(b.label)).map(device => (
                    <tr key={device.id} className="hover:bg-zinc-50/50">
                      <td className="p-2 pl-3 font-bold text-zinc-900">{device.label}</td>
                      <td className="p-2 uppercase text-zinc-500 text-[9px] font-mono">
                        {device.deviceType ? DEVICE_ICONS[device.deviceType] + ' ' + device.deviceType : 'Outro'}
                      </td>
                      <td className="p-2 text-zinc-700 font-semibold text-[9px]">
                        {device.protocol ? PROTOCOL_ICONS[device.protocol] + ' ' + device.protocol : 'N/A'}
                      </td>
                      <td className="p-2 text-zinc-500 italic max-w-xs truncate">{device.details || 'Conectado de acordo com as especificações técnicas da rede.'}</td>
                      <td className="p-2 text-right pr-3 font-mono font-bold text-[9px]">
                        {device.connectionDisabled ? (
                          <span className="text-zinc-400 uppercase">[Desconectado]</span>
                        ) : device.status === 'active' ? (
                          <span className="text-emerald-700 font-bold uppercase">[✓ Ativo]</span>
                        ) : (
                          <span className="text-rose-500 font-bold uppercase">[✗ Inativo]</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* IMPLANTATION CHECKLIST STATUS (SITUAÇÃO DO CHECKLIST) */}
        <div className="grid grid-cols-2 gap-4 border border-zinc-200 rounded-xl p-4 bg-zinc-50 mb-6 page-break-inside-avoid">
          <div className="space-y-2">
            <h4 className="text-[9px] uppercase font-extrabold text-zinc-500 tracking-wider">✓ Homologação das Fases do Projeto</h4>
            <div className="space-y-1 text-[10px] font-medium text-zinc-700 leading-normal">
              <p className="flex items-center gap-1.5">
                <span className={checklist.survey ? "text-emerald-600 font-bold" : "text-zinc-300"}>
                  {checklist.survey ? "☑" : "☒"}
                </span> 
                <span className={checklist.survey ? "" : "text-zinc-400 line-through"}>1. Estudo Técnico de Viabilidade Smart Home</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className={checklist.wiring ? "text-emerald-600 font-bold" : "text-zinc-300"}>
                  {checklist.wiring ? "☑" : "☒"}
                </span> 
                <span className={checklist.wiring ? "" : "text-zinc-400 line-through"}>2. Puxada de Neutro &amp; Cabeamentos Técnicos</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className={checklist.hw_installation ? "text-emerald-600 font-bold" : "text-zinc-300"}>
                  {checklist.hw_installation ? "☑" : "☒"}
                </span> 
                <span className={checklist.hw_installation ? "" : "text-zinc-400 line-through"}>3. Instalação Física de Placas &amp; Switches</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className={checklist.pairing ? "text-emerald-600 font-bold" : "text-zinc-300"}>
                  {checklist.pairing ? "☑" : "☒"}
                </span> 
                <span className={checklist.pairing ? "" : "text-zinc-400 line-through"}>4. Pareamento de Protocolos Integrados</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className={checklist.scenes ? "text-emerald-600 font-bold" : "text-zinc-300"}>
                  {checklist.scenes ? "☑" : "☒"}
                </span> 
                <span className={checklist.scenes ? "" : "text-zinc-400 line-through"}>5. Modelagem de Cenas de Conforto &amp; Rotinas</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className={checklist.handover ? "text-emerald-600 font-bold" : "text-zinc-300"}>
                  {checklist.handover ? "☑" : "☒"}
                </span> 
                <span className={checklist.handover ? "" : "text-zinc-400 line-through"}>6. Entrega Técnica do Sistemas e Aceite Completo</span>
              </p>
            </div>
          </div>

          <div className="space-y-2 pl-4 border-l border-zinc-200">
            <h4 className="text-[9px] uppercase font-extrabold text-zinc-500 tracking-wider">📋 Memorial Descritivo do Projeto</h4>
            <p className="text-[10px] text-zinc-650 leading-relaxed italic font-mono whitespace-pre-wrap">
              {clientNotes || 'Nenhuma especificação ou nota complementar gravada para este memorial técnico.'}
            </p>
          </div>
        </div>

        {/* WARRANTY & SYSTEM VALIDATOR SLATE */}
        <div className="border border-zinc-200 rounded-xl p-4 mb-8 bg-zinc-50/50 page-break-inside-avoid">
          <h4 className="text-[9px] uppercase font-extrabold text-indigo-800 tracking-wider mb-2 font-sans">📋 TERMO DE GARANTIA, HOMOLOGAÇÃO E QUALIDADE GERAL</h4>
          <p className="text-[9.5px] text-zinc-600 leading-relaxed">
            Asseguramos que os gateways locais estão operando dentro dos limites de redundância estabelecidos pelo selo regulatório. Foram criados filtros DHCP associados diretamente ao endereço MAC dos principais transdutores de malha. A garantia para todos os barramentos Zigbee instalados é de 12 meses a partir do aceite assinado das partes abaixo descritas.
          </p>
        </div>

        {/* SIGNATURE FIELDS */}
        <div className="pt-8 grid grid-cols-2 gap-12 text-center text-[10px] font-sans page-break-inside-avoid">
          <div className="space-y-2">
            <div className="border-t border-zinc-400 w-4/5 mx-auto" />
            <p className="font-bold text-zinc-800">Engenheiro Geral Integrador</p>
            <p className="text-[8px] text-zinc-400">Selo Técnico de Qualidade Condfy</p>
          </div>
          <div className="space-y-2">
            <div className="border-t border-zinc-400 w-4/5 mx-auto" />
            <p className="font-bold text-zinc-800">Cliente Proprietário Integrado</p>
            <p className="text-[8px] text-zinc-400">Aceite Técnico de Conformidade Smart Home</p>
          </div>
        </div>
      </div>
    </div>
  );
}
