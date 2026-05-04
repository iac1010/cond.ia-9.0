export type Client = {
  id: string;
  name: string;
  document?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
  locations?: { id: string; name: string }[];
  tower?: string;
  unit?: string;
  vehicles?: string;
  pets?: string;
  cisternVolume?: number;
  reservoirVolume?: number;
};

export type ChecklistItem = {
  id: string;
  task: string;
  category: string;
  clientId?: string;
  clientIds?: string[];
};

export type TicketType = 'PREVENTIVA' | 'CORRETIVA' | 'TAREFA';

export type TicketStatus = 'PENDENTE_APROVACAO' | 'APROVADO' | 'EM_ROTA' | 'AGUARDANDO_MATERIAL' | 'REALIZANDO' | 'CONCLUIDO' | 'REJEITADO';

export type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type QuoteInstallment = {
  id: string;
  description: string;
  value: number;
  dueDate?: string;
};

export type Quote = {
  id: string;
  clientId: string;
  date: string;
  items: QuoteItem[];
  installments?: QuoteInstallment[];
  totalValue: number;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
  observations?: string;
};

export type Receipt = {
  id: string;
  clientId: string;
  date: string;
  value: number;
  description: string;
};

export type Cost = {
  id: string;
  description: string;
  value: number;
  date: string;
  category: string;
};

export type SavingsGoal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  icon: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
};

export type Appointment = {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'TICKET' | 'MEETING' | 'OTHER';
  ticketId?: string;
  notes?: string;
};

export type Ticket = {
  id: string;
  osNumber?: string;
  title?: string;
  type: TicketType;
  status?: TicketStatus;
  maintenanceCategory?: string;
  maintenanceSubcategory?: string;
  clientId?: string;
  date: string;
  technician: string;
  observations: string;
  color?: string;
  reportedBy?: string;
  location?: string;
  photoBefore?: string;
  budgetAmount?: number;
  budgetApproved?: boolean;
  reportedProblem?: string;
  productsForQuote?: string;
  serviceReport?: string;
  checklistResults?: {
    taskId: string;
    status: 'OK' | 'NOK' | 'NA';
    notes: string;
  }[];
  usedMaterials?: {
    itemId?: string;
    name?: string;
    quantity: number;
    price?: number;
  }[];
  images?: string[];
  history?: {
    id: string;
    date: string;
    note: string;
    userName?: string;
  }[];
};

export type CompanyData = {
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  website?: string;
};

export type Product = {
  id: string;
  code?: string;
  name: string;
  description?: string;
  price: number;
  unit?: string;
};

export type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  category: 'LIMPEZA' | 'PISCINA' | 'GERAL' | 'MANUTENCAO' | 'SEGURANCA';
};

export type SupplyItem = {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  lastPrice?: number;
  clientId?: string;
};

export type SupplyQuotation = {
  id: string;
  date: string;
  items: {
    supplyItemId: string;
    quantity: number;
  }[];
  responses: {
    supplierId: string;
    prices: { [supplyItemId: string]: number };
    status: 'PENDING' | 'RECEIVED';
  }[];
  status: 'OPEN' | 'CLOSED';
};

export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export type Payment = {
  id: string;
  clientId: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  reference: string;
};

export type LegalAgreement = {
  id: string;
  clientId: string;
  totalAmount: number;
  installments: number;
  remainingInstallments: number;
  status: 'ACTIVE' | 'COMPLETED' | 'BREACHED';
  startDate: string;
  notes?: string;
};

export type ScheduledMaintenance = {
  id: string;
  clientId: string;
  standardId: string;
  item: string;
  frequency: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
  lastDone?: string;
  nextDate: string;
  status: 'PENDING' | 'DONE' | 'OVERDUE';
  category: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  link?: string;
};

export type ConsumptionReading = {
  id: string;
  clientId: string;
  type: 'WATER' | 'GAS' | 'ENERGY';
  previousValue: number;
  currentValue: number;
  consumption: number;
  date: string;
  unit: string;
  billed: boolean;
};

export type Vote = {
  id: string;
  userId: string;
  userName: string;
  optionId: string;
  timestamp: string;
  signature: string;
};

export type AssemblyOption = {
  id: string;
  text: string;
};

export type Assembly = {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'UPCOMING' | 'ACTIVE' | 'CLOSED';
  options: AssemblyOption[];
  votes: Vote[];
  legalValidityHash: string;
};

export type DigitalFolderItem = {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  date: string;
  amount?: number;
  fileUrl: string;
  status: 'PENDING' | 'VALIDATED' | 'REJECTED';
  signatures: {
    id: string;
    userName: string;
    role: string;
    date: string;
  }[];
};

export type Notice = {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'MAINTENANCE' | 'EVENT' | 'GENERAL' | 'SECURITY';
  tower?: string;
  apartmentLine?: string;
  clientId: string;
};

export type Package = {
  id: string;
  residentName: string;
  apartment: string;
  tower: string;
  carrier: string;
  trackingCode?: string;
  receivedAt: string;
  pickedUpAt?: string;
  status: 'PENDING' | 'PICKED_UP';
  qrCode: string;
  photoUrl?: string;
  clientId?: string;
};

export type Visitor = {
  id: string;
  name: string;
  document?: string;
  type: 'VISITOR' | 'SERVICE_PROVIDER';
  apartment: string;
  tower: string;
  validUntil: string;
  qrCode: string;
  status: 'ACTIVE' | 'EXPIRED' | 'USED';
};

export type CriticalEvent = {
  id: string;
  device: string;
  location: string;
  type: 'PUMP' | 'DOOR' | 'FIRE' | 'ELECTRICAL';
  status: 'NORMAL' | 'ALERT' | 'CRITICAL';
  lastUpdate: string;
  description: string;
};

export type EnergyRecord = {
  month: string;
  consumption: number;
  solarGeneration: number;
  sensorSavings: number;
  costWithoutTech: number;
  actualCost: number;
};

export type DocumentTemplate = {
  id: string;
  title: string;
  category: string;
  description: string;
  legalBasis: string;
  content: string;
  fileUrl?: string;
};

export type Feedback = {
  id: string;
  clientId: string;
  locationId?: string;
  rating: number;
  comment: string;
  userName?: string;
  date: string;
};

export type Reservation = {
  id: string;
  clientId: string;
  areaName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  notes?: string;
};

export type Staff = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  shift: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'FLEXIBLE';
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
};

export type KeyControl = {
  id: string;
  keyName: string;
  location: string;
  status: 'AVAILABLE' | 'BORROWED' | 'LOST';
  borrowedBy?: string;
  borrowedAt?: string;
  returnedAt?: string;
};

export type IotState = {
  pumps: {
    caixa: boolean;
    jardim: boolean;
    auto: boolean;
  };
  lights: {
    cozinha: number;
    sala: number;
    jardim: number;
    todas: boolean;
  };
  alarmActive: boolean;
};

export type Contract = {
  id: string;
  title: string;
  supplierId: string;
  category: string;
  startDate: string;
  endDate: string;
  value: number;
  paymentFrequency: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  notes?: string;
  fileUrl?: string;
};

export type Renovation = {
  id: string;
  clientId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  artFileUrl?: string;
  technicianName?: string;
};

export type Move = {
  id: string;
  clientId: string;
  date: string;
  type: 'IN' | 'OUT';
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  company?: string;
  notes?: string;
};

export type BillingRule = {
  id: string;
  name: string;
  daysBeforeDue: number[];
  daysAfterDue: number[];
  messageTemplate: string;
  active: boolean;
};

export type BudgetForecast = {
  id: string;
  createdAt: string;
  month: string;
  monthlyProjections: {
    month: string;
    value: number;
  }[];
  categories: {
    name: string;
    value: number;
  }[];
  insights: string[];
  confidence: number;
};

export type Sale = {
  id: string;
  clientId: string;
  date: string;
  value: number;
  description: string;
  status: 'PROPOSAL' | 'SALE';
  area: string;
  notes?: string;
};

export interface AppState {
  clients: Client[];
  checklistItems: ChecklistItem[];
  tickets: Ticket[];
  quotes: Quote[];
  receipts: Receipt[];
  costs: Cost[];
  appointments: Appointment[];
  products: Product[];
  suppliers: Supplier[];
  supplyItems: SupplyItem[];
  supplyQuotations: SupplyQuotation[];
  payments: Payment[];
  legalAgreements: LegalAgreement[];
  contracts: Contract[];
  renovations: Renovation[];
  moves: Move[];
  billingRules: BillingRule[];
  budgetForecasts: BudgetForecast[];
  scheduledMaintenances: ScheduledMaintenance[];
  notifications: AppNotification[];
  consumptionReadings: ConsumptionReading[];
  digitalFolder: DigitalFolderItem[];
  assemblies: Assembly[];
  notices: Notice[];
  packages: Package[];
  visitors: Visitor[];
  criticalEvents: CriticalEvent[];
  energyData: EnergyRecord[];
  savingsGoals: SavingsGoal[];
  feedbacks: Feedback[];
  reservations: Reservation[];
  staff: Staff[];
  keys: KeyControl[];
  iotState: IotState;
  sales: Sale[];
  companyLogo: string | null;
  companySignature: string | null;
  backgroundImage: string | null;
  companyData: CompanyData | null;
  companySettingsId: string | null;
  theme: 'light' | 'dark';
  isAuthenticated: boolean;
  menuOrder: string[];
  showBalance: boolean;
  hiddenTiles: string[];
  costCategories: string[];
  tileSizes: { [key: string]: 'small' | 'medium' | 'large' };
  tileOrder: string[] | null;
  documentTemplates: DocumentTemplate[];
  isLoading: boolean;
  whatsappEnabled: boolean;
  biaEnabled: boolean;
  biaOnline: boolean;
  lastSync: string | null;
  
  fetchInitialData: () => Promise<void>;
  syncToSupabase: () => Promise<void>;
  setBiaOnline: (online: boolean) => void;
  setShowBalance: (show: boolean) => void;
  setCompanyLogo: (logo: string | null) => Promise<void>;
  setCompanySignature: (signature: string | null) => Promise<void>;
  setBackgroundImage: (image: string | null) => Promise<void>;
  setCompanyData: (data: CompanyData) => Promise<void>;
  setMenuOrder: (order: string[]) => Promise<void>;
  setTileSizes: (sizes: { [key: string]: 'small' | 'medium' | 'large' }) => Promise<void>;
  setTileOrder: (order: string[]) => Promise<void>;
  toggleTileVisibility: (tileId: string) => void;
  toggleTheme: () => Promise<void>;
  toggleWhatsApp: () => void;
  toggleBia: () => void;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, client: Omit<Client, 'id'>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  addChecklistItem: (item: Omit<ChecklistItem, 'id'>) => Promise<string>;
  updateChecklistItem: (id: string, item: Omit<ChecklistItem, 'id'>) => void;
  deleteChecklistItem: (id: string) => void;
  
  addTicket: (ticket: Omit<Ticket, 'id'>) => void;
  updateTicket: (id: string, ticket: Omit<Ticket, 'id'>) => void;
  deleteTicket: (id: string) => void;

  addQuote: (quote: Omit<Quote, 'id'>) => void;
  updateQuote: (id: string, quote: Omit<Quote, 'id'>) => void;
  deleteQuote: (id: string) => void;

  addReceipt: (receipt: Omit<Receipt, 'id'>) => void;
  updateReceipt: (id: string, receipt: Omit<Receipt, 'id'>) => void;
  deleteReceipt: (id: string) => void;

  addCost: (cost: Omit<Cost, 'id'>) => void;
  updateCost: (id: string, cost: Omit<Cost, 'id'>) => void;
  deleteCost: (id: string) => void;

  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, appointment: Omit<Appointment, 'id'>) => void;
  deleteAppointment: (id: string) => void;

  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Omit<Product, 'id'>) => void;
  deleteProduct: (id: string) => void;
  importProducts: (products: Omit<Product, 'id'>[]) => void;
  
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Omit<Supplier, 'id'>) => void;
  deleteSupplier: (id: string) => void;

  addSupplyItem: (item: Omit<SupplyItem, 'id'>) => void;
  updateSupplyItem: (id: string, item: Omit<SupplyItem, 'id'>) => void;
  deleteSupplyItem: (id: string) => void;
  updateStock: (id: string, quantity: number) => void;

  createQuotation: (items: { supplyItemId: string; quantity: number }[]) => void;
  updateQuotationResponse: (quotationId: string, supplierId: string, prices: { [key: string]: number }) => void;
  
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;

  addLegalAgreement: (agreement: Omit<LegalAgreement, 'id'>) => void;
  updateLegalAgreement: (id: string, agreement: Partial<LegalAgreement>) => void;
  deleteLegalAgreement: (id: string) => void;

  addContract: (contract: Omit<Contract, 'id'>) => void;
  updateContract: (id: string, contract: Partial<Contract>) => void;
  deleteContract: (id: string) => void;

  addRenovation: (renovation: Omit<Renovation, 'id'>) => void;
  updateRenovation: (id: string, renovation: Partial<Renovation>) => void;
  deleteRenovation: (id: string) => void;

  addMove: (move: Omit<Move, 'id'>) => void;
  updateMove: (id: string, move: Partial<Move>) => void;
  deleteMove: (id: string) => void;

  addBillingRule: (rule: Omit<BillingRule, 'id'>) => void;
  updateBillingRule: (id: string, rule: Partial<BillingRule>) => void;
  deleteBillingRule: (id: string) => void;

  addBudgetForecast: (forecast: Omit<BudgetForecast, 'id'>) => void;
  updateBudgetForecast: (id: string, forecast: Partial<BudgetForecast>) => void;
  deleteBudgetForecast: (id: string) => void;

  addScheduledMaintenance: (maintenance: Omit<ScheduledMaintenance, 'id'>) => void;
  updateScheduledMaintenance: (id: string, maintenance: Partial<ScheduledMaintenance>) => void;
  deleteScheduledMaintenance: (id: string) => void;
  generateSchedulesForClient: (clientId: string) => void;
  
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;

  addConsumptionReading: (reading: Omit<ConsumptionReading, 'id'>) => void;
  addDigitalFolderItem: (item: Omit<DigitalFolderItem, 'id' | 'signatures' | 'status'>) => void;
  validateDigitalFolderItem: (id: string, userName: string, role: string) => void;
  addAssembly: (assembly: Omit<Assembly, 'id' | 'votes' | 'legalValidityHash'>) => void;
  castVote: (assemblyId: string, optionId: string, userName: string) => void;
  closeAssembly: (id: string) => void;
  deleteAssembly: (id: string) => void;

  addNotice: (notice: Omit<Notice, 'id' | 'date'>) => void;
  updateNotice: (id: string, notice: Partial<Notice>) => void;
  deleteNotice: (id: string) => void;

  addPackage: (pkg: Omit<Package, 'id' | 'receivedAt' | 'status' | 'qrCode'>) => Promise<Package>;
  pickupPackage: (id: string) => void;
  
  addVisitor: (visitor: Omit<Visitor, 'id' | 'qrCode' | 'status'>) => void;
  revokeVisitor: (id: string) => void;

  updateCriticalEvent: (id: string, status: CriticalEvent['status'], description: string) => void;
  addTicketHistory: (ticketId: string, note: string, userName?: string) => void;
  setEnergyData: (data: EnergyRecord[]) => void;

  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => Promise<void>;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;

  addDocumentTemplate: (template: Omit<DocumentTemplate, 'id'>) => Promise<void>;
  updateDocumentTemplate: (id: string, template: Partial<DocumentTemplate>) => Promise<void>;
  deleteDocumentTemplate: (id: string) => Promise<void>;

  addFeedback: (feedback: Omit<Feedback, 'id' | 'date'>) => void;
  
  addReservation: (reservation: Omit<Reservation, 'id'>) => void;
  updateReservation: (id: string, reservation: Partial<Reservation>) => void;
  deleteReservation: (id: string) => void;
  
  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, staff: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  
  addKey: (key: Omit<KeyControl, 'id'>) => void;
  updateKey: (id: string, key: Partial<KeyControl>) => void;
  deleteKey: (id: string) => void;

  addCostCategory: (category: string) => void;
  deleteCostCategory: (category: string) => void;

  addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;

  updateIotState: (state: {
    pumps?: Partial<IotState['pumps']>;
    lights?: Partial<IotState['lights']>;
    alarmActive?: boolean;
  }) => void;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  updateQuoteStatus: (id: string, status: Quote['status']) => void;
  addWaterReading: (reading: { clientId: string; reading: number; month: string; date: string }) => void;
  addEnergyReading: (reading: { clientId: string; reading: number; month: string; date: string }) => void;
  createBudget: (budget: { title: string; observations: string; budgetAmount: number; clientId?: string }) => void;

  processConsumptionReadingWithAI: (file: File, type: 'WATER' | 'GAS' | 'ENERGY') => Promise<{ value: number; confidence: number }>;
  generateBudgetForecastWithAI: (historicalData: any[]) => Promise<BudgetForecast | null>;

  restoreData: (data: Partial<AppState>) => Promise<void>;
}
