
import { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { FileText, Download, Loader2, Save, CheckCircle2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Preview from './components/Preview';
import { ClientData, QuotationItem, Attachment, QuotationRecord } from './types';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

const getUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

const PREDEFINED_LOGO = "https://image2url.com/r2/bucket1/images/1766628777009-c21f4677-8923-4b9d-8c41-006c16f05e6c.png";

const TEXT_TEMPLATES: Record<string, { terms: string; intro: string; subtitle: string; qLabel: string }> = {
  'Español': { terms: "• Vigencia de la cotización: 30 días calendario.\n• El costo total incluye impuestos, importación, materiales /productos e instalación.\n• Condiciones de pago: 50% anticipo, 50% contra entrega.", intro: "Esta cotización comprende la venta e instalación de las cortinas acordadas en la visita de asesoría:", subtitle: "Persianas, Toldos & Cortinas", qLabel: "Cotización No" },
  'Inglés': { terms: "• Quotation validity: 30 calendar days.\n• Total cost includes taxes, import duties, materials/products, and installation.\n• Payment terms: 50% down payment, 50% upon delivery.", intro: "This quotation includes the sale and installation of curtains as agreed during the advisory visit:", subtitle: "Blinds, Shades & Curtains", qLabel: "Quotation No" },
  'Holandes': { terms: "• Geldigheid van de offerte: 30 kalenderdagen.\n• De totale kosten son inclusief belastingen, import, materialen/producten en installatie.\n• Betalingsvoorwaarden: 50% aanbetaling, 50% bij levering.", intro: "Deze offerte omvat de verkoop en installatie van de gordijnen como acordado durante la bishita di asesoría:", subtitle: "Jaloezieën, Zonwering & Gordijnen", qLabel: "Offerte No" },
  'Papiamento': { terms: "• Valididat di e oferta: 30 dia kalender.\n• E kosto total ta inkluí belasting, importashon, materialnan/produktonan i instalashon.\n• Kondishonnan di pago: 50% pago adelantá, 50% ora di entrega.", intro: "E oferta aki ta inkluí e benta i instalashon di e kortinanan akordá durante e bishita di asesoría:", subtitle: "Persiana, Kortina & Zonwering", qLabel: "Oferta No" }
};

const TITLE_TRANSLATIONS: Record<string, string> = { 'Español': 'COTIZACIÓN', 'Inglés': 'QUOTATION', 'Holandes': 'OFFERTE', 'Papiamento': 'OFERTA' };

const safeGetItem = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const safeSetItem = (key: string, val: string) => { try { localStorage.setItem(key, val); } catch {} };

// Reverting to original Orange
const BRAND_COLOR = "#EA580C";
const BRAND_COLOR_HOVER = "#C2410C";

function App() {
  const defaultSignature = "OSCAR DAVID PALACIO\nCC 1039450876";
  const defaultPaymentInfo = "BANCO MCB\nRudolph M A Neuman 331097608";

  const generateId = useCallback(() => {
    const now = new Date();
    const digit = 7 + parseInt(now.getHours().toString().padStart(2, '0').charAt(0));
    return `C-${now.getFullYear()}-${now.getDate().toString().padStart(2, '0')}-${digit}`;
  }, []);

  const [companyLogo, setCompanyLogo] = useState<string | null>(() => safeGetItem('companyLogo') || PREDEFINED_LOGO);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [zones, setZones] = useState<string[]>(['GENERAL > GENERAL']);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'history'>('edit');
  
  const lastSavedRef = useRef<number>(0);
  const lastSavedSnapshotRef = useRef<string>('');

  const [history, setHistory] = useState<QuotationRecord[]>(() => {
    const saved = safeGetItem('quotation_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);

  const [clientData, setClientData] = useState<ClientData>({
    name: '', date: new Date().toISOString().split('T')[0], quotationNo: generateId(),
    quotationNoLabel: TEXT_TEMPLATES['Español'].qLabel,
    language: 'Español', currency: 'USD', includeDecimals: true, terms: TEXT_TEMPLATES['Español'].terms,
    signatureText: defaultSignature, discountEnabled: false, discountType: 'percentage', discountValue: 0,
    showClientId: false, clientIdType: 'Documento', clientIdValue: '',
    introText: TEXT_TEMPLATES['Español'].intro,
    companyName: safeGetItem('companyName') || 'INNOVADEKO',
    companySubtitle: safeGetItem('companySubtitle') || TEXT_TEMPLATES['Español'].subtitle,
    documentTitle: TITLE_TRANSLATIONS['Español'],
    showDocumentTitle: true,
    documentTitleColor: BRAND_COLOR,
    documentTitleAlign: 'center',
    documentTitleFont: 'Syncopate',
    documentTitleFontSize: 48,
    companyNameFont: 'Syncopate',
    companyNameFontSize: 24,
    companySubtitleFont: 'Syncopate',
    companySubtitleFontSize: 11,
    showPaymentInfo: true, paymentInfoText: safeGetItem('paymentInfoText') || defaultPaymentInfo,
    showObservations: false, observationsText: safeGetItem('observationsText') || '',
    showConditions: true,
    showClientSignature: false, 
    showSellerSignature: true,
    clientSignatureText: 'FIRMA DEL CLIENTE\n',
    showClientInfo: true,
    showTotals: true,
    multipleOptions: false,
    quotationOptions: [
      { id: 'opt1', name: 'Opción 1', discountEnabled: false, discountType: 'percentage', discountValue: 0 },
      { id: 'opt2', name: 'Opción 2', discountEnabled: false, discountType: 'percentage', discountValue: 0 }
    ],
  });

  const generateFileName = useCallback(() => {
    const title = (clientData.showDocumentTitle && clientData.documentTitle.trim()) ? clientData.documentTitle.trim() : "";
    const name = clientData.name.trim();
    const date = clientData.date;

    if (title) return `${title}_${name || 'SIN_NOMBRE'}_${date}`;
    if (name) return `CARTA_${name}_${date}`;
    return `DOC.INNOVA DEKO_${date}`;
  }, [clientData]);

  const saveToHistory = useCallback((silent = false) => {
    const currentSnapshot = JSON.stringify({
      clientData,
      items,
      attachments: attachments.map(a => ({ id: a.id, title: a.title, desc: a.description, preview: a.previewUrl })),
      zones,
      companyLogo
    });

    if (currentSnapshot === lastSavedSnapshotRef.current) {
      if (!silent) {
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
      }
      return;
    }

    const fileName = generateFileName();
    const newRecord: QuotationRecord = {
      id: getUUID(),
      fileName,
      savedAt: new Date().toISOString(),
      data: {
        clientData,
        items,
        attachments,
        zones,
        companyLogo
      }
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    safeSetItem('quotation_history', JSON.stringify(updatedHistory));
    
    lastSavedRef.current = Date.now();
    lastSavedSnapshotRef.current = currentSnapshot;

    if (!silent) {
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }
  }, [clientData, items, attachments, zones, companyLogo, history, generateFileName]);

  const updateQuotationName = (id: string, newName: string) => {
    const updatedHistory = history.map(record => 
      record.id === id ? { ...record, fileName: newName } : record
    );
    setHistory(updatedHistory);
    safeSetItem('quotation_history', JSON.stringify(updatedHistory));
  };

  const loadFromHistory = (record: QuotationRecord) => {
    setConfirmDialog({
      isOpen: true,
      message: '¿Cargar esta cotización? Se abrirá en el editor y se perderán los cambios actuales no guardados.',
      onConfirm: () => {
        setClientData(record.data.clientData);
        setItems(record.data.items);
        setAttachments(record.data.attachments);
        setZones(record.data.zones);
        setCompanyLogo(record.data.companyLogo);
        if (record.data.companyLogo) safeSetItem('companyLogo', record.data.companyLogo);
        
        lastSavedSnapshotRef.current = JSON.stringify({
          clientData: record.data.clientData,
          items: record.data.items,
          attachments: record.data.attachments.map(a => ({ id: a.id, title: a.title, desc: a.description, preview: a.previewUrl })),
          zones: record.data.zones,
          companyLogo: record.data.companyLogo
        });

        setActiveTab('edit');
        const sidebarContainer = document.querySelector('.custom-scrollbar');
        if (sidebarContainer) sidebarContainer.scrollTo({ top: 0, behavior: 'smooth' });
        
        setConfirmDialog(null);
      }
    });
  };

  const deleteFromHistory = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      message: '¿Estás seguro de eliminar este registro del historial?',
      onConfirm: () => {
        const updated = history.filter(r => r.id !== id);
        setHistory(updated);
        safeSetItem('quotation_history', JSON.stringify(updated));
        setConfirmDialog(null);
      }
    });
  };

  const translateContent = async (newLanguage: string) => {
    const hasItems = items.length > 0;
    const hasCustomZones = zones.length > 1 || (zones[0] !== 'GENERAL > GENERAL' && zones[0] !== 'ALGEMEEN > ALGEMEEN');
    
    if (!hasItems && !hasCustomZones) return;
    
    setIsTranslating(true);
    try {
      const sourceLang = clientData.language;
      const zonesData = zones;
      const itemsData = items.map(i => ({ id: i.id, description: i.description, zone: i.zone }));

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceLang,
          targetLang: newLanguage,
          zones: zonesData,
          items: itemsData
        })
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const translated = await response.json();
      
      if (translated.zones && Array.isArray(translated.zones)) {
        setZones(translated.zones);
      }
      
      if (translated.items && Array.isArray(translated.items)) {
        setItems(prev => prev.map(item => {
          const trans = translated.items.find((ti: any) => ti.id === item.id);
          return trans ? { ...item, description: trans.description, zone: trans.zone } : item;
        }));
      }
    } catch (error) { 
      console.error("AI Translation error:", error);
      alert("Error during translation. Please check the API configuration.");
    } finally { 
      setIsTranslating(false); 
    }
  };

  useEffect(() => {
    safeSetItem('companyName', clientData.companyName);
    safeSetItem('companySubtitle', clientData.companySubtitle);
    safeSetItem('paymentInfoText', clientData.paymentInfoText);
    safeSetItem('observationsText', clientData.observationsText);
  }, [clientData]);

  const resetForm = () => {
    if (confirm('¿Deseas iniciar una nueva cotización? Se borrarán todos los datos actuales y se reiniciarán las zonas.')) {
        setItems([]); 
        setAttachments([]); 
        setZones(['GENERAL > GENERAL']); 
        setClientData(prev => ({
          ...prev, 
          name: '', 
          date: new Date().toISOString().split('T')[0], 
          quotationNo: generateId(),
          discountEnabled: false, 
          discountValue: 0, 
          showClientId: false, 
          clientIdValue: '',
          observationsText: '', 
          showObservations: false,
          showSellerSignature: true, 
          showClientSignature: false,
          introText: TEXT_TEMPLATES[prev.language]?.intro || prev.introText,
          terms: TEXT_TEMPLATES[prev.language]?.terms || prev.terms,
          documentTitleColor: BRAND_COLOR,
          showTotals: true
        }));
        setActiveTab('edit');
        lastSavedRef.current = 0; 
        lastSavedSnapshotRef.current = ''; 
    }
  };

  const exportToPDF = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    // Ensure we clean up ANY previous debris before starting
    const existingContainer = document.getElementById('print-container-wrapper');
    if (existingContainer) {
      try {
        document.body.removeChild(existingContainer);
      } catch (e) {
        console.warn("Cleanup warning:", e);
      }
    }

    try {
      const now = Date.now();
      if (now - lastSavedRef.current > 10000) {
        saveToHistory(true); 
      }

      const fileName = generateFileName();
      
      // Create fresh container with specific ID
      const printContainer = document.createElement('div');
      printContainer.id = 'print-container-wrapper';
      printContainer.style.position = 'fixed'; 
      printContainer.style.left = '-9999px'; 
      printContainer.style.top = '0'; 
      printContainer.style.width = '794px'; 
      printContainer.style.background = 'white'; 
      document.body.appendChild(printContainer);

      const root = createRoot(printContainer);
      root.render(<Preview clientData={clientData} items={items} attachments={attachments} companyLogo={companyLogo} isPrintVersion={true} />);
      
      // Increased buffer time for stability
      await new Promise(resolve => setTimeout(resolve, 3000));
      await document.fonts.ready;

      const element = printContainer.querySelector('#quotation-print-target') as HTMLElement;
      if (!element) { 
        throw new Error("Render element not found");
      }

      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff', 
        width: 794, 
        windowWidth: 794,
        logging: false // Disable logging to save memory
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const imgWidthMm = 210; 
      const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [imgWidthMm, imgHeightMm] });
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthMm, imgHeightMm, undefined, 'FAST');
      pdf.save(`${fileName}.pdf`);

      // Immediate cleanup after success
      setTimeout(() => {
        try {
          root.unmount();
          if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
          }
        } catch (cleanupErr) {
          console.error("Cleanup error", cleanupErr);
        }
      }, 100);

    } catch (err) { 
      console.error("PDF Export Error:", err);
      alert("Error al generar el PDF. Por favor intente de nuevo."); 
      
      // Cleanup on error attempt
      const wrapper = document.getElementById('print-container-wrapper');
      if (wrapper && document.body.contains(wrapper)) {
        document.body.removeChild(wrapper);
      }
    } finally { 
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden font-sans">
      <div className="w-[380px] h-full shadow-2xl z-20 no-print flex-shrink-0 bg-white border-r border-slate-200">
        <Sidebar
          activeTab={activeTab} setActiveTab={setActiveTab}
          clientData={clientData} setClientData={setClientData} 
          onLanguageChange={(l) => {
            setClientData(prev => ({ 
              ...prev, language: l, introText: TEXT_TEMPLATES[l]?.intro || prev.introText, 
              companySubtitle: TEXT_TEMPLATES[l]?.subtitle || prev.companySubtitle, 
              documentTitle: TITLE_TRANSLATIONS[l] || prev.documentTitle,
              quotationNoLabel: TEXT_TEMPLATES[l]?.qLabel || prev.quotationNoLabel,
              terms: TEXT_TEMPLATES[l]?.terms || prev.terms
            }));
            translateContent(l);
          }}
          zones={zones} addZone={(z) => setZones([...zones, z])} 
          addItem={(i) => setItems([...items, { ...i, id: getUUID() }])}
          addAttachment={(a) => setAttachments([...attachments, { ...a, id: getUUID() }])}
          resetForm={resetForm}
          companyLogo={companyLogo}
          onLogoUpload={(e) => {
             const file = e.target.files?.[0];
             if (file) {
               const reader = new FileReader();
               reader.onloadend = () => { setCompanyLogo(reader.result as string); safeSetItem('companyLogo', reader.result as string); };
               reader.readAsDataURL(file);
             }
          }}
          onResetLogo={() => { setCompanyLogo(PREDEFINED_LOGO); safeSetItem('companyLogo', PREDEFINED_LOGO); }}
          history={history}
          onLoadQuotation={loadFromHistory}
          onDeleteQuotation={deleteFromHistory}
          onUpdateQuotationName={updateQuotationName}
        />
      </div>

      <div className="flex-1 flex flex-col h-full bg-[#E2E8F0]">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 no-print shadow-sm z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg shadow-md" style={{ backgroundColor: BRAND_COLOR }}><FileText size={20} className="text-white"/></div>
             <div className="flex flex-col">
                <span className="text-slate-900 text-[11px] font-black uppercase tracking-widest leading-none">Generador Profesional</span>
                <span className="text-slate-400 text-[9px] font-bold uppercase mt-1 tracking-widest">InnovaDeko v2.5</span>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            {isTranslating && (
              <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 animate-pulse">
                <Loader2 size={14} className="text-indigo-600 animate-spin"/>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Traduciendo con IA...</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button 
                onClick={() => saveToHistory(false)}
                disabled={isGeneratingPdf}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition-all ${showSaveSuccess ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} ${isGeneratingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {showSaveSuccess ? <CheckCircle2 size={16}/> : <Save size={16}/>}
                <span>{showSaveSuccess ? 'GUARDADO' : 'GUARDAR'}</span>
              </button>

              <button 
                onClick={exportToPDF}
                disabled={isGeneratingPdf} 
                className="group flex items-center gap-3 px-8 py-3 text-white rounded-xl text-xs font-black shadow-lg transition-all hover:scale-[1.02] disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                style={{ backgroundColor: BRAND_COLOR, boxShadow: `0 10px 15px -3px rgba(234, 88, 12, 0.3)` }}
                onMouseEnter={(e) => { if(!isGeneratingPdf) e.currentTarget.style.backgroundColor = BRAND_COLOR_HOVER }}
                onMouseLeave={(e) => { if(!isGeneratingPdf) e.currentTarget.style.backgroundColor = BRAND_COLOR }}
              >
                {isGeneratingPdf ? <Loader2 size={16} className="animate-spin"/> : <Download size={16} className="group-hover:animate-bounce"/>}
                <span>{isGeneratingPdf ? 'GENERANDO...' : 'GENERAR PDF'}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar flex justify-center items-start">
          <div className="transform scale-[0.55] sm:scale-[0.6] md:scale-[0.7] lg:scale-[0.8] xl:scale-[0.9] origin-top pb-32">
             <Preview 
               clientData={clientData} items={items} attachments={attachments} companyLogo={companyLogo}
               onRemoveItem={(id) => setItems(items.filter(i => i.id !== id))}
               onUpdateItem={(id, field, value) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))}
               onRemoveAttachment={(id) => setAttachments(attachments.filter(a => a.id !== id))}
               onTermsChange={(terms) => setClientData({ ...clientData, terms })}
               onIntroTextChange={(introText) => setClientData({ ...clientData, introText })}
               onCompanyNameChange={(name) => setClientData({ ...clientData, companyName: name })}
               onCompanySubtitleChange={(subtitle) => setClientData({ ...clientData, companySubtitle: subtitle })}
               onPaymentInfoChange={(info) => setClientData({ ...clientData, paymentInfoText: info })}
               onUpdateDocumentColor={(color) => setClientData({ ...clientData, documentTitleColor: color })}
               onObservationsChange={(obs) => setClientData({ ...clientData, observationsText: obs })}
               onDocumentTitleChange={(title) => setClientData({ ...clientData, documentTitle: title })}
               onClientSignatureTextChange={(text) => setClientData({ ...clientData, clientSignatureText: text })}
               onSignatureChange={(text) => setClientData({ ...clientData, signatureText: text })}
               onQuotationNoChange={(no) => setClientData({ ...clientData, quotationNo: no })}
               onQuotationNoLabelChange={(label) => setClientData({ ...clientData, quotationNoLabel: label })}
               onDateChange={(date) => setClientData({ ...clientData, date })}
               onClientNameChange={(name) => setClientData({ ...clientData, name })}
               onClientIdValueChange={(val) => setClientData({ ...clientData, clientIdValue: val })}
             />
          </div>
        </main>
      </div>

      {/* Modern Confirm Dialog Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-500 mb-4">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Confirmar Acción</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex border-t border-slate-100 justify-end gap-3">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 font-black text-white rounded-xl transition-colors text-sm shadow-md"
                style={{ backgroundColor: BRAND_COLOR }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
