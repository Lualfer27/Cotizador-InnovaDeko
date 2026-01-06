
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Plus, Tag, Building2, Upload, CreditCard, MessageSquare, Settings2, ScrollText, User, RefreshCcw, DollarSign, AlignLeft, AlignCenter, AlignRight, Heading1, Type, LayoutTemplate, ChevronDown, ChevronRight, FileImage, History, Search, Calendar, FolderOpen, Trash2, Eye, Signature, CreditCard as IDIcon, Edit2, Check, X, FilePlus, Percent, UserCheck } from 'lucide-react';
import { ClientData, QuotationItem, Attachment, QuotationRecord } from '../types';

interface SidebarProps {
  clientData: ClientData;
  setClientData: React.Dispatch<React.SetStateAction<ClientData>>;
  onLanguageChange: (language: string) => void;
  zones: string[];
  addZone: (zone: string) => void;
  addItem: (item: Omit<QuotationItem, 'id'>) => void;
  addAttachment: (attachment: Omit<Attachment, 'id'>) => void;
  resetForm: () => void;
  companyLogo: string | null;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetLogo?: () => void;
  // History props
  history: QuotationRecord[];
  onLoadQuotation: (record: QuotationRecord) => void;
  onDeleteQuotation: (id: string) => void;
  onUpdateQuotationName: (id: string, newName: string) => void;
  // Tab props
  activeTab: 'edit' | 'history';
  setActiveTab: (tab: 'edit' | 'history') => void;
}

const BRAND_COLOR = "#EA580C";

const SIDEBAR_TRANSLATIONS: Record<string, any> = {
  'Español': { createZoneTitle: 'CREAR ZONA', general: 'GENERAL', floor: 'PISO', placeholder: 'Ej: Habitación Principal', addZoneBtn: 'AÑADIR ZONA', currency: 'Moneda', attachments: 'Anexos', discount: 'Descuento', sellerSig: 'Firma Vendedor' },
  'Inglés': { createZoneTitle: 'CREATE ZONE', general: 'GENERAL', floor: 'FLOOR', placeholder: 'Ex: Master Bedroom', addZoneBtn: 'ADD ZONE', currency: 'Currency', attachments: 'Attachments', discount: 'Discount', sellerSig: 'Seller Signature' },
  'Holandes': { createZoneTitle: 'MAAK ZONE', general: 'ALGEMEEN', floor: 'VERDIEPING', placeholder: 'Bijv: Hoofdslaapkamer', addZoneBtn: 'ZONE TOEVOEGEN', currency: 'Valuta', attachments: 'Bijlagen', discount: 'Korting', sellerSig: 'Verkoper Handtekening' },
  'Papiamento': { createZoneTitle: 'KREA ZONA', general: 'GENERAL', floor: 'PISO', placeholder: 'Ehem: Kamber Principal', addZoneBtn: 'AÑADI ZONA', currency: 'Moneda', attachments: 'Aneksonan', discount: 'Deskuento', sellerSig: 'Firma Bendedo' }
};

const Sidebar: React.FC<SidebarProps> = ({
  clientData, setClientData, onLanguageChange, zones, addZone, addItem, addAttachment, resetForm, companyLogo, onLogoUpload, onResetLogo,
  history, onLoadQuotation, onDeleteQuotation, onUpdateQuotationName, activeTab, setActiveTab
}) => {
  const [historySearch, setHistorySearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const t = SIDEBAR_TRANSLATIONS[clientData.language] || SIDEBAR_TRANSLATIONS['Español'];

  // State for adding items/zones
  const [zoneSuffix, setZoneSuffix] = useState('');
  const [selectedZone, setSelectedZone] = useState(zones[0] || '');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  
  const [attTitle, setAttTitle] = useState('');
  const [attDesc, setAttDesc] = useState('');
  const [attPreview, setAttPreview] = useState<string | null>(null);
  const [attFile, setAttFile] = useState<File | null>(null);
  
  const [isHeaderCustomOpen, setIsHeaderCustomOpen] = useState(false);
  const [isTitleCustomOpen, setIsTitleCustomOpen] = useState(false);
  const [isSectionsOpen, setIsSectionsOpen] = useState(false);

  // History editing state
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingHistoryValue, setEditingHistoryValue] = useState('');

  const prefixOptions = useMemo(() => {
    const opts = [t.general];
    for (let i = 0; i <= 15; i++) opts.push(`${t.floor} ${i}`);
    return opts;
  }, [t]);

  const [selectedPrefix, setSelectedPrefix] = useState(prefixOptions[0]);

  useEffect(() => { setSelectedPrefix(prefixOptions[0]); }, [prefixOptions]);
  useEffect(() => { if (!selectedZone && zones.length > 0) setSelectedZone(zones[0]); }, [zones, selectedZone]);

  const handleAddZone = () => {
    if (zoneSuffix.trim()) {
      const full = `${selectedPrefix} > ${zoneSuffix.trim().toUpperCase()}`;
      addZone(full); setZoneSuffix(''); setSelectedZone(full);
    }
  };

  const handleAddItem = () => {
    if (itemDesc.trim() && selectedZone) {
      addItem({ zone: selectedZone, description: itemDesc, quantity: parseInt(itemQty) || 1, unitPrice: parseFloat(itemPrice) || 0 });
      setItemDesc(''); setItemQty('1'); setItemPrice('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAttPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddAttachment = () => {
    if (attPreview) {
      addAttachment({
        file: attFile,
        previewUrl: attPreview,
        title: attTitle.trim() || undefined,
        description: attDesc.trim()
      });
      setAttTitle(''); setAttDesc(''); setAttPreview(null); setAttFile(null);
    }
  };

  const startEditingHistory = (record: QuotationRecord) => {
    setEditingHistoryId(record.id);
    setEditingHistoryValue(record.fileName);
  };

  const saveHistoryName = (id: string) => {
    if (editingHistoryValue.trim()) {
      onUpdateQuotationName(id, editingHistoryValue.trim());
    }
    setEditingHistoryId(null);
  };

  const cancelHistoryEditing = () => {
    setEditingHistoryId(null);
  };

  const filteredHistory = useMemo(() => {
    return history.filter(record => {
      const matchesText = record.fileName.toLowerCase().includes(historySearch.toLowerCase());
      const recordDate = new Date(record.savedAt).toISOString().split('T')[0];
      const matchesDateFrom = !dateFrom || recordDate >= dateFrom;
      const matchesDateTo = !dateTo || recordDate <= dateTo;
      return matchesText && matchesDateFrom && matchesDateTo;
    }).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }, [history, historySearch, dateFrom, dateTo]);

  const clientNameTextareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (clientNameTextareaRef.current) {
      clientNameTextareaRef.current.style.height = 'auto';
      clientNameTextareaRef.current.style.height = `${clientNameTextareaRef.current.scrollHeight}px`;
    }
  }, [clientData.name]);

  const brandColors = [BRAND_COLOR, '#EA580C', '#1E293B', '#0F172A', '#10B981', '#059669', '#3B82F6', '#1D4ED8', '#8B5CF6', '#D946EF', '#EF4444', '#B45309', '#000000'];
  const fontOptions = [{ name: 'Syncopate', value: 'Syncopate' }, { name: 'Inter', value: 'Inter' }, { name: 'Playfair Display', value: 'Playfair Display' }, { name: 'Montserrat', value: 'Montserrat' }, { name: 'Roboto', value: 'Roboto' }, { name: 'Oswald', value: 'Oswald' }];

  const ToggleItem = ({ label, icon: Icon, value, onChange }: { label: string, icon: any, value: boolean, onChange: (val: boolean) => void }) => (
    <div className="flex items-center justify-between p-2 hover:bg-slate-100 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <Icon size={14} className={value ? "text-brand" : "text-slate-400"} style={value ? { color: BRAND_COLOR } : {}} />
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{label}</span>
      </div>
      <button 
        onClick={() => onChange(!value)}
        className={`w-8 h-4 rounded-full relative transition-all ${value ? 'bg-brand' : 'bg-slate-300'}`}
        style={value ? { backgroundColor: BRAND_COLOR } : {}}
      >
        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${value ? 'left-4.5' : 'left-0.5'}`} />
      </button>
    </div>
  );

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden no-print">
      <div className="p-6 border-b border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-brand font-bold text-slate-800 tracking-tighter">INNOVADEKO</h2>
          <button 
            onClick={resetForm} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            style={{ backgroundColor: `${BRAND_COLOR}15`, color: BRAND_COLOR }}
            title="Nueva Cotización"
          >
            <FilePlus size={14}/>
            <span>NUEVA</span>
          </button>
        </div>
        
        {/* Tabs System */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button 
             onClick={() => setActiveTab('edit')} 
             className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'edit' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             style={activeTab === 'edit' ? { color: BRAND_COLOR } : {}}
           >
             <Settings2 size={14}/> Configurar
           </button>
           <button 
             onClick={() => setActiveTab('history')} 
             className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'history' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             style={activeTab === 'history' ? { color: BRAND_COLOR } : {}}
           >
             <History size={14}/> Historial
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {activeTab === 'edit' ? (
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <span>Logo Corporativo</span><div className="h-px bg-slate-100 flex-1"></div>
              </div>
              <div className="flex flex-col gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                 <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden p-1">
                         {companyLogo ? <img src={companyLogo} className="w-full h-full object-contain" /> : <Building2 size={24} className="text-slate-300" />}
                     </div>
                     <div className="flex-1 overflow-hidden">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter block">Estado</span>
                        <span className="text-xs font-bold text-slate-600 truncate">{companyLogo?.startsWith('data:') ? 'Personalizado' : 'Predeterminado'}</span>
                     </div>
                 </div>
                 <div className="flex gap-2">
                    <label className="flex-1">
                        <div className="cursor-pointer flex items-center justify-center gap-2 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all"><Upload size={14}/><span>Subir</span></div>
                        <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
                    </label>
                    <button onClick={onResetLogo} className="px-3 py-2 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-2"><RefreshCcw size={14}/><span>Reset</span></button>
                 </div>
              </div>
            </section>

            {/* Personalización Visual */}
            <section className="space-y-4">
                 <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest"><span>Personalización</span><div className="h-px bg-slate-100 flex-1"></div></div>
                 <div className="space-y-2">
                    {/* Header Style Collapsible */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                        <button onClick={() => setIsHeaderCustomOpen(!isHeaderCustomOpen)} className="w-full flex items-center justify-between p-4 hover:bg-slate-100">
                            <div className="flex items-center gap-3"><LayoutTemplate size={16} style={{ color: BRAND_COLOR }}/><span className="text-xs font-black text-slate-700 uppercase tracking-tight">Estilo Encabezado</span></div>
                            {isHeaderCustomOpen ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
                        </button>
                        {isHeaderCustomOpen && (
                            <div className="px-4 pb-5 space-y-6 border-t border-slate-200 pt-4">
                                <div className="space-y-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block">Tipografía Empresa</span>
                                    <select value={clientData.companyNameFont} onChange={(e) => setClientData({...clientData, companyNameFont: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none">{fontOptions.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}</select>
                                    <input type="range" min="12" max="48" value={clientData.companyNameFontSize} onChange={(e) => setClientData({...clientData, companyNameFontSize: parseInt(e.target.value)})} className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" style={{ accentColor: BRAND_COLOR }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Title Style Collapsible */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                        <button onClick={() => setIsTitleCustomOpen(!isTitleCustomOpen)} className="w-full flex items-center justify-between p-4 hover:bg-slate-100">
                            <div className="flex items-center gap-3"><Heading1 size={16} className="text-indigo-500"/><span className="text-xs font-black text-slate-700 uppercase tracking-tight">Estilo Título Doc.</span></div>
                            {isTitleCustomOpen ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
                        </button>
                        {isTitleCustomOpen && (
                            <div className="px-4 pb-5 space-y-4 border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-600">Mostrar Título</span><input type="checkbox" checked={clientData.showDocumentTitle} onChange={(e) => setClientData({...clientData, showDocumentTitle: e.target.checked})} style={{ accentColor: BRAND_COLOR }} className="rounded" /></div>
                                {clientData.showDocumentTitle && (
                                    <>
                                        <select value={clientData.documentTitleFont} onChange={(e) => setClientData({...clientData, documentTitleFont: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none">{fontOptions.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}</select>
                                        <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                                            <button onClick={() => setClientData({...clientData, documentTitleAlign: 'left'})} className={`flex-1 py-1.5 rounded-md flex justify-center ${clientData.documentTitleAlign === 'left' ? 'bg-orange-50' : 'text-slate-400'}`} style={clientData.documentTitleAlign === 'left' ? { color: BRAND_COLOR, backgroundColor: `${BRAND_COLOR}15` } : {}}><AlignLeft size={16}/></button>
                                            <button onClick={() => setClientData({...clientData, documentTitleAlign: 'center'})} className={`flex-1 py-1.5 rounded-md flex justify-center ${clientData.documentTitleAlign === 'center' ? 'bg-orange-50' : 'text-slate-400'}`} style={clientData.documentTitleAlign === 'center' ? { color: BRAND_COLOR, backgroundColor: `${BRAND_COLOR}15` } : {}}><AlignCenter size={16}/></button>
                                            <button onClick={() => setClientData({...clientData, documentTitleAlign: 'right'})} className={`flex-1 py-1.5 rounded-md flex justify-center ${clientData.documentTitleAlign === 'right' ? 'bg-orange-50' : 'text-slate-400'}`} style={clientData.documentTitleAlign === 'right' ? { color: BRAND_COLOR, backgroundColor: `${BRAND_COLOR}15` } : {}}><AlignRight size={16}/></button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">{brandColors.map(c => <button key={c} onClick={() => setClientData({...clientData, documentTitleColor: c})} className={`w-6 h-6 rounded-full border-2 ${clientData.documentTitleColor === c ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}</div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                 </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest"><span>Cliente</span><div className="h-px bg-slate-100 flex-1"></div></div>
              <div className="space-y-3">
                <textarea ref={clientNameTextareaRef} value={clientData.name} onChange={(e) => setClientData({...clientData, name: e.target.value})} placeholder="Nombre del Cliente" rows={1} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none transition-all resize-none overflow-hidden" />
                
                {/* ID Cliente */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase tracking-tight">
                         <IDIcon size={14} className={clientData.showClientId ? "text-brand" : "text-slate-400"} style={clientData.showClientId ? { color: BRAND_COLOR } : {}} />
                         <span>Incluir Identificación</span>
                      </div>
                      <button 
                        onClick={() => setClientData({...clientData, showClientId: !clientData.showClientId})}
                        className={`w-8 h-4 rounded-full relative transition-all ${clientData.showClientId ? 'bg-brand' : 'bg-slate-300'}`}
                        style={clientData.showClientId ? { backgroundColor: BRAND_COLOR } : {}}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${clientData.showClientId ? 'left-4.5' : 'left-0.5'}`} />
                      </button>
                   </div>
                   
                   {clientData.showClientId && (
                     <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <select value={clientData.clientIdType} onChange={(e) => setClientData({...clientData, clientIdType: e.target.value as any})} className="w-24 px-2 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none uppercase">
                          <option value="Documento">CC</option>
                          <option value="CRIB">CRIB</option>
                          <option value="NIT">NIT</option>
                          <option value="Pasaporte">PAS</option>
                        </select>
                        <input type="text" value={clientData.clientIdValue} onChange={(e) => setClientData({...clientData, clientIdValue: e.target.value})} placeholder="Número ID" className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none" />
                      </div>
                   )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <input type="date" value={clientData.date} onChange={(e) => setClientData({...clientData, date: e.target.value})} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none" />
                   <select value={clientData.language} onChange={(e) => onLanguageChange(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none"><option value="Español">Español</option><option value="Holandes">Holandes</option><option value="Papiamento">Papiamento</option><option value="Inglés">Inglés</option></select>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <DollarSign size={14} className="text-slate-400"/><span className="text-xs font-bold text-slate-600 mr-auto">{t.currency}</span>
                    <select value={clientData.currency} onChange={(e) => setClientData({...clientData, currency: e.target.value})} className="bg-transparent text-sm font-bold text-slate-700 outline-none"><option value="USD">USD</option><option value="EUR">EUR</option><option value="COP">COP</option><option value="ANG">ANG</option><option value="Afl.">Afl.</option></select>
                </div>
              </div>
            </section>

            <section className="border p-5 rounded-2xl space-y-4" style={{ backgroundColor: `${BRAND_COLOR}10`, borderColor: `${BRAND_COLOR}30` }}>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND_COLOR }}><Building2 size={14}/><span>Zonas</span></div>
              <div className="flex gap-2">
                <select value={selectedPrefix} onChange={(e) => setSelectedPrefix(e.target.value)} className="w-24 px-2 py-2 bg-white border rounded-lg text-xs outline-none" style={{ borderColor: `${BRAND_COLOR}30` }}>{prefixOptions.map(o => <option key={o} value={o}>{o}</option>)}</select>
                <input type="text" value={zoneSuffix} onChange={(e) => setZoneSuffix(e.target.value)} placeholder="Ej: Sala" className="flex-1 px-3 py-2 bg-white border rounded-lg text-xs outline-none" style={{ borderColor: `${BRAND_COLOR}30` }} />
              </div>
              <button onClick={handleAddZone} className="w-full py-2 text-white rounded-lg text-xs font-black transition-all shadow-md" style={{ backgroundColor: BRAND_COLOR, shadowColor: BRAND_COLOR }}>AÑADIR ZONA</button>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest"><span>Producto</span><div className="h-px bg-slate-100 flex-1"></div></div>
                <div className="space-y-3">
                    <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none">{zones.map(z => <option key={z} value={z}>{z}</option>)}</select>
                    <input type="text" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Descripción" className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none" />
                    <div className="grid grid-cols-2 gap-3">
                        <input type="number" value={itemQty} onChange={(e) => setItemQty(e.target.value)} placeholder="Cant" className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none" />
                        <input type="number" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="Precio" className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none" />
                    </div>
                    <button onClick={handleAddItem} className="w-full py-3 bg-slate-800 hover:bg-black text-white rounded-lg text-xs font-black transition-all">AGREGAR PRODUCTO</button>
                </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest"><span>{t.discount}</span><div className="h-px bg-slate-100 flex-1"></div></div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Percent size={14} style={clientData.discountEnabled ? { color: BRAND_COLOR } : { color: '#94a3b8' }} />
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">Habilitar Descuento</span>
                  </div>
                  <button 
                    onClick={() => setClientData({...clientData, discountEnabled: !clientData.discountEnabled})}
                    className={`w-8 h-4 rounded-full relative transition-all ${clientData.discountEnabled ? 'bg-brand' : 'bg-slate-300'}`}
                    style={clientData.discountEnabled ? { backgroundColor: BRAND_COLOR } : {}}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${clientData.discountEnabled ? 'left-4.5' : 'left-0.5'}`} />
                  </button>
                </div>
                
                {clientData.discountEnabled && (
                  <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                    <select 
                      value={clientData.discountType} 
                      onChange={(e) => setClientData({...clientData, discountType: e.target.value as 'percentage' | 'fixed'})}
                      className="w-24 px-2 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none uppercase"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">Fijo</option>
                    </select>
                    <input 
                      type="number" 
                      value={clientData.discountValue} 
                      onChange={(e) => setClientData({...clientData, discountValue: e.target.value})} 
                      placeholder="Valor" 
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none" 
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest"><span>Configuración de Secciones</span><div className="h-px bg-slate-100 flex-1"></div></div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                    <button onClick={() => setIsSectionsOpen(!isSectionsOpen)} className="w-full flex items-center justify-between p-4 hover:bg-slate-100">
                        <div className="flex items-center gap-3"><Eye size={16} className="text-emerald-500"/><span className="text-xs font-black text-slate-700 uppercase tracking-tight">Activar Secciones</span></div>
                        {isSectionsOpen ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
                    </button>
                    {isSectionsOpen && (
                        <div className="px-2 pb-3 space-y-1 border-t border-slate-200 pt-2">
                            <ToggleItem label="Info. Cliente" icon={User} value={clientData.showClientInfo} onChange={(val) => setClientData({...clientData, showClientInfo: val})} />
                            <ToggleItem label="Cuenta de Pago" icon={CreditCard} value={clientData.showPaymentInfo} onChange={(val) => setClientData({...clientData, showPaymentInfo: val})} />
                            <ToggleItem label="Condiciones" icon={ScrollText} value={clientData.showConditions} onChange={(val) => setClientData({...clientData, showConditions: val})} />
                            
                            <div className="space-y-2">
                                <ToggleItem label="Observaciones" icon={MessageSquare} value={clientData.showObservations} onChange={(val) => setClientData({...clientData, showObservations: val})} />
                                {clientData.showObservations && (
                                    <div className="px-2 pb-2 animate-in fade-in slide-in-from-top-1">
                                        <textarea 
                                            value={clientData.observationsText} 
                                            onChange={(e) => setClientData({...clientData, observationsText: e.target.value})} 
                                            placeholder="Escribe las observaciones aquí..."
                                            rows={3}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] outline-none transition-all resize-none focus:border-brand font-medium"
                                            style={{ '--tw-focus-ring-color': BRAND_COLOR } as any}
                                        />
                                    </div>
                                )}
                            </div>

                            <ToggleItem label="Firma del Vendedor" icon={UserCheck} value={clientData.showSellerSignature} onChange={(val) => setClientData({...clientData, showSellerSignature: val})} />
                            <ToggleItem label="Firma de Cliente" icon={Signature} value={clientData.showClientSignature} onChange={(val) => setClientData({...clientData, showClientSignature: val})} />
                        </div>
                    )}
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest"><span>{t.attachments}</span><div className="h-px bg-slate-100 flex-1"></div></div>
                <div className="space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2"><Type size={14} className="text-slate-400"/><input type="text" value={attTitle} onChange={(e) => setAttTitle(e.target.value)} placeholder="Título (Opcional)" className="flex-1 bg-transparent text-xs font-bold outline-none" /></div>
                    <textarea value={attDesc} onChange={(e) => setAttDesc(e.target.value)} placeholder="Descripción (Opcional)" rows={2} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] outline-none resize-none" />
                    <label className="block w-full cursor-pointer"><div className="flex items-center justify-center gap-2 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-all"><FileImage size={14}/><span>{attPreview ? 'Cambiar Foto' : 'Elegir Foto'}</span></div><input type="file" accept="image/*" className="hidden" onChange={handleFileChange} /></label>
                    <button onClick={handleAddAttachment} disabled={!attPreview} className={`w-full py-2.5 rounded-lg text-[10px] font-black ${attPreview ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>AÑADIR ANEXO</button>
                </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="space-y-4">
               <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest"><span>Buscador & Filtros</span><div className="h-px bg-slate-100 flex-1"></div></div>
               
               <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <input 
                      type="text" 
                      value={historySearch} 
                      onChange={(e) => setHistorySearch(e.target.value)} 
                      placeholder="Buscar por nombre..." 
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2"
                      style={{ '--tw-ring-color': `${BRAND_COLOR}40` } as any}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                     <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Desde</span>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] outline-none" />
                     </div>
                     <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Hasta</span>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-2 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] outline-none" />
                     </div>
                  </div>
               </div>
            </section>

            <section className="space-y-3">
               <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <span>Resultados ({filteredHistory.length})</span>
                  {(dateFrom || dateTo || historySearch) && (
                    <button onClick={() => {setDateFrom(''); setDateTo(''); setHistorySearch('');}} className="hover:underline" style={{ color: BRAND_COLOR }}>Limpiar</button>
                  )}
               </div>
               
               {filteredHistory.length > 0 ? (
                 <div className="space-y-2">
                    {filteredHistory.map(record => (
                      <div key={record.id} className="group bg-slate-50 border border-slate-100 rounded-xl p-4 hover:bg-white hover:shadow-md transition-all" style={{ '--hover-border-color': BRAND_COLOR } as any}>
                        <div className="flex items-start justify-between gap-3">
                           <div className="flex-1 min-w-0">
                              {editingHistoryId === record.id ? (
                                <div className="flex items-center gap-1 mb-1">
                                  <input 
                                    type="text" 
                                    value={editingHistoryValue} 
                                    onChange={(e) => setEditingHistoryValue(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveHistoryName(record.id);
                                      if (e.key === 'Escape') cancelHistoryEditing();
                                    }}
                                    className="flex-1 text-xs font-black text-slate-800 bg-white border rounded px-1 outline-none"
                                    style={{ borderColor: `${BRAND_COLOR}40` }}
                                  />
                                  <button onClick={() => saveHistoryName(record.id)} className="text-emerald-600 hover:text-emerald-700"><Check size={14}/></button>
                                  <button onClick={cancelHistoryEditing} className="text-red-500 hover:text-red-600"><X size={14}/></button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 group/title">
                                  <h4 className="text-xs font-black text-slate-800 truncate mb-1" title={record.fileName}>{record.fileName}</h4>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); startEditingHistory(record); }} 
                                    className="opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-brand transition-all mb-1"
                                    style={{ '--hover-color': BRAND_COLOR } as any}
                                  >
                                    <Edit2 size={10}/>
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                                 <Calendar size={10}/>
                                 <span>{new Date(record.savedAt).toLocaleDateString()}</span>
                              </div>
                           </div>
                           <div className="flex gap-1">
                              <button 
                                onClick={() => onLoadQuotation(record)} 
                                className="p-2 bg-white text-indigo-600 border border-slate-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-100 transition-all"
                                title="Cargar Cotización"
                              >
                                <FolderOpen size={14}/>
                              </button>
                              <button 
                                onClick={() => onDeleteQuotation(record.id)} 
                                className="p-2 bg-white text-red-500 border border-slate-100 rounded-lg hover:bg-red-50 hover:border-red-100 transition-all"
                                title="Eliminar"
                              >
                                <Trash2 size={14}/>
                              </button>
                           </div>
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="py-20 text-center space-y-3">
                    <div className="flex justify-center"><Search size={32} className="text-slate-200"/></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No se encontraron registros</p>
                 </div>
               )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
