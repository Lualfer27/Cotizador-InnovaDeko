
import React, { useMemo, useRef, useEffect } from 'react';
import { ClientData, QuotationItem, Attachment } from '../types';
import { Trash2, CreditCard, ScrollText, MessageSquare } from 'lucide-react';

interface PreviewProps {
  clientData: ClientData;
  items: QuotationItem[];
  attachments: Attachment[];
  companyLogo: string | null;
  onRemoveItem?: (id: string) => void;
  onUpdateItem?: (id: string, field: keyof QuotationItem, value: any) => void;
  onRemoveAttachment?: (id: string) => void;
  onTermsChange?: (terms: string) => void;
  onSignatureChange?: (signature: string) => void;
  onQuotationNoChange?: (quotationNo: string) => void;
  onQuotationNoLabelChange?: (label: string) => void;
  onDateChange?: (date: string) => void;
  onClientNameChange?: (name: string) => void;
  onClientIdValueChange?: (id: string) => void;
  onIntroTextChange?: (introText: string) => void;
  onCompanyNameChange?: (name: string) => void;
  onCompanySubtitleChange?: (subtitle: string) => void;
  onPaymentInfoChange?: (info: string) => void;
  onObservationsChange?: (obs: string) => void;
  onDocumentTitleChange?: (title: string) => void;
  onClientSignatureTextChange?: (text: string) => void;
  onUpdateDocumentColor?: (color: string) => void;
  isPrintVersion?: boolean;
}

const AutoResizeTextarea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}> = ({ value, onChange, onKeyDown, className, placeholder, style }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const node = textareaRef.current;
    if (node) {
      node.style.height = 'auto';
      node.style.height = `${node.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onInput={adjustHeight}
      className={`w-full bg-transparent border-none p-0 focus:ring-0 resize-none overflow-hidden ${className}`}
      placeholder={placeholder}
      style={style}
      rows={1}
    />
  );
};

const Preview: React.FC<PreviewProps> = ({
  clientData, items, attachments, companyLogo, onRemoveItem, onUpdateItem, onRemoveAttachment, 
  onTermsChange, onSignatureChange, onQuotationNoChange, onQuotationNoLabelChange, onDateChange, onClientNameChange, onClientIdValueChange,
  onIntroTextChange, onCompanyNameChange, onCompanySubtitleChange, onPaymentInfoChange, 
  onObservationsChange, onDocumentTitleChange, onClientSignatureTextChange, isPrintVersion = false
}) => {
  const UI_TRANSLATIONS: Record<string, any> = {
    'Español': { 
      date: 'Fecha de Emisión', client: 'Cliente', subtotal: 'SUBTOTAL', subtotalNet: 'Subtotal Neto', 
      discount: 'Descuento', total: 'Total a Pagar', conditions: 'Condiciones Comerciales', 
      paymentAccount: 'CUENTA DE PAGO', observations: 'OBSERVACIONES', attachments: 'ANEXOS',
      desc: 'DESCRIPCIÓN', qty: 'CANT', unit: 'UNITARIO', itemTotal: 'TOTAL'
    },
    'Inglés': { 
      date: 'Date of Issue', client: 'Client', subtotal: 'SUBTOTAL', subtotalNet: 'Net Subtotal', 
      discount: 'Discount', total: 'Total Payable', conditions: 'Commercial Conditions', 
      paymentAccount: 'PAYMENT ACCOUNT', observations: 'OBSERVATIONS', attachments: 'ATTACHMENTS',
      desc: 'DESCRIPTION', qty: 'QTY', unit: 'UNIT PRICE', itemTotal: 'TOTAL'
    },
    'Holandes': { 
      date: 'Datum van Uitgifte', client: 'Klant', subtotal: 'SUBTOTAAL', subtotalNet: 'Netto Subtotaal', 
      discount: 'Korting', total: 'Totaal te Betalen', conditions: 'Handelsvoorwaarden', 
      paymentAccount: 'BETAALREKENING', observations: 'OPMERKINGEN', attachments: 'BIJLAGEN',
      desc: 'OMSCHRIJVING', qty: 'AANTAL', unit: 'EENHEDSPRIJS', itemTotal: 'TOTAAL'
    },
    'Papiamento': { 
      date: 'Fecha di Emishon', client: 'Kliente', subtotal: 'SUBTOTAL', subtotalNet: 'Subtotal Neto', 
      discount: 'Deskuento', total: 'Total pa Paga', conditions: 'Kondishonnan Komersial', 
      paymentAccount: 'KUENTA DI PAGO', observations: 'OBSERVACIONNAN', attachments: 'ANEKSONAN',
      desc: 'DESKRIPSHON', qty: 'KANTIDAT', unit: 'PREIS UNIDAT', itemTotal: 'TOTAL'
    }
  };

  const t = UI_TRANSLATIONS[clientData.language] || UI_TRANSLATIONS['Español'];

  const hierarchicalItems = useMemo(() => {
    const groups: Record<string, Record<string, QuotationItem[]>> = {};
    items.forEach(item => {
      const parts = item.zone.split('>');
      const mainZone = parts[0].trim().toUpperCase();
      const subZone = parts.length > 1 ? parts[1].trim().toUpperCase() : 'GENERAL';
      if (!groups[mainZone]) groups[mainZone] = {};
      if (!groups[mainZone][subZone]) groups[mainZone][subZone] = [];
      groups[mainZone][subZone].push(item);
    });
    return groups;
  }, [items]);

  const sortedMainZones = useMemo(() => {
    const getFloorNum = (s: string) => {
      const match = s.match(/\d+/);
      if (match) return parseInt(match[0], 10);
      return -1;
    };

    return Object.entries(hierarchicalItems).sort(([zoneA], [zoneB]) => {
      const numA = getFloorNum(zoneA);
      const numB = getFloorNum(zoneB);
      if (numA !== numB) return numA - numB;
      return zoneA.localeCompare(zoneB);
    });
  }, [hierarchicalItems]);

  const subtotalNeto = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  let discountAmount = 0;
  const discountVal = typeof clientData.discountValue === 'string' ? parseFloat(clientData.discountValue) || 0 : clientData.discountValue;
  if (clientData.discountEnabled) {
      discountAmount = clientData.discountType === 'percentage' ? subtotalNeto * (discountVal / 100) : discountVal;
  }
  const totalAPagar = Math.max(0, subtotalNeto - discountAmount);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ' + clientData.currency;
  };

  const containerStyles: React.CSSProperties = {
    width: '794px',
    padding: '60px',
    backgroundColor: '#ffffff',
    color: '#1F2937',
    fontFamily: "'Cobe Regular', sans-serif",
    boxSizing: 'border-box',
    margin: '0',
    display: 'block',
    position: 'relative'
  };

  const textStyle: React.CSSProperties = {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: '1.5',
    display: 'block'
  };

  const bubbleStyle = (borderColor: string, bgColor: string): React.CSSProperties => ({
    backgroundColor: bgColor,
    borderLeft: `5px solid ${borderColor}`,
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
    minHeight: 'fit-content'
  });

  const labelStyle = "font-bold text-gray-400 uppercase text-[9px] tracking-[0.2em] block mb-1";
  const valueStyle = "text-gray-900 leading-tight font-normal text-xl";
  const accentValueStyle = (color: string) => ({
    color: color,
    fontWeight: '900',
    fontSize: '24px',
    letterSpacing: '-0.025em',
    lineHeight: '1'
  });

  const handleTermsKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = e.currentTarget;
      const { selectionStart, value } = textarea;
      const beforeCursor = value.substring(0, selectionStart);
      const lines = beforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      if (currentLine.trim().startsWith('•')) {
        e.preventDefault();
        const afterCursor = value.substring(selectionStart);
        const newValue = beforeCursor + '\n• ' + afterCursor;
        onTermsChange?.(newValue);
        setTimeout(() => {
          textarea.setSelectionRange(selectionStart + 3, selectionStart + 3);
        }, 0);
      }
    }
  };

  return (
    <div 
      id={isPrintVersion ? "quotation-print-target" : "quotation-preview"} 
      style={containerStyles} 
      className={isPrintVersion ? "" : "shadow-2xl"}
    >
      {/* HEADER */}
      <table className="w-full mb-4" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td className="w-32 align-middle" style={{ padding: '0 24px 0 0' }}>
              <div className="w-32 h-32 overflow-hidden rounded-full flex items-center justify-center bg-gray-50">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-[12px] text-gray-400 font-bold uppercase tracking-widest text-center px-2">INNOVADEKO</div>
                )}
              </div>
            </td>
            <td className="align-middle text-left">
              <div className="flex flex-col">
                {isPrintVersion ? (
                  <>
                    <div 
                      className="font-black text-gray-900 tracking-tighter uppercase leading-none"
                      style={{ 
                        fontFamily: `'${clientData.companyNameFont}', sans-serif`,
                        fontSize: `${clientData.companyNameFontSize}px`
                      }}
                    >
                      {clientData.companyName}
                    </div>
                    <div 
                      className="font-bold text-gray-400 uppercase mt-1 tracking-widest"
                      style={{ 
                        fontFamily: `'${clientData.companySubtitleFont}', sans-serif`,
                        fontSize: `${clientData.companySubtitleFontSize}px`
                      }}
                    >
                      {clientData.companySubtitle}
                    </div>
                  </>
                ) : (
                  <>
                    <input 
                      type="text" 
                      value={clientData.companyName} 
                      onChange={(e) => onCompanyNameChange?.(e.target.value)} 
                      className="w-full font-black text-gray-900 tracking-tighter bg-transparent border-none p-0 focus:ring-0 leading-none uppercase" 
                      style={{ 
                        fontFamily: `'${clientData.companyNameFont}', sans-serif`,
                        fontSize: `${clientData.companyNameFontSize}px`
                      }}
                    />
                    <input 
                      type="text" 
                      value={clientData.companySubtitle} 
                      onChange={(e) => onCompanySubtitleChange?.(e.target.value)} 
                      className="w-full font-bold text-gray-400 uppercase bg-transparent border-none p-0 focus:ring-0 mt-1 tracking-widest uppercase" 
                      style={{ 
                        fontFamily: `'${clientData.companySubtitleFont}', sans-serif`,
                        fontSize: `${clientData.companySubtitleFontSize}px`
                      }}
                    />
                  </>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ACCENT LINE */}
      <div 
        className="w-full h-[3px] mb-8" 
        style={{ backgroundColor: clientData.documentTitleColor }}
      ></div>
      
      {/* DOCUMENT TITLE BOX */}
      {clientData.showDocumentTitle && (
        <div 
          className="border-y border-dashed border-gray-200 py-10 mb-12"
          style={{ textAlign: clientData.documentTitleAlign }}
        >
          {isPrintVersion ? (
            <div 
              className="uppercase tracking-tighter leading-none"
              style={{ 
                color: clientData.documentTitleColor,
                fontFamily: `'${clientData.documentTitleFont}', sans-serif`,
                fontSize: `${clientData.documentTitleFontSize}px`,
                fontWeight: 900
              }}
            >
              {clientData.documentTitle}
            </div>
          ) : (
            <input 
              type="text" 
              value={clientData.documentTitle} 
              onChange={(e) => onDocumentTitleChange?.(e.target.value)} 
              className={`w-full uppercase bg-transparent border-none focus:ring-0 p-0 leading-none`}
              style={{ 
                color: clientData.documentTitleColor,
                textAlign: clientData.documentTitleAlign,
                fontFamily: `'${clientData.documentTitleFont}', sans-serif`,
                fontSize: `${clientData.documentTitleFontSize}px`,
                fontWeight: 900
              }} 
            />
          )}
        </div>
      )}

      {clientData.showClientInfo && (
        <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '40px', borderRadius: '16px' }} className="mb-12 shadow-sm">
          <div className="grid grid-cols-2 gap-x-12 gap-y-10 items-end">
            <div className="flex flex-col items-start">
               <div className="w-full">
                {isPrintVersion ? (
                  <span className={labelStyle}>{clientData.quotationNoLabel}</span>
                ) : (
                  <input 
                    type="text" 
                    value={clientData.quotationNoLabel} 
                    onChange={(e) => onQuotationNoLabelChange?.(e.target.value)} 
                    className={`${labelStyle} w-full bg-transparent border-none p-0 focus:ring-0 text-left`}
                  />
                )}
                <div className="mt-1">
                  {isPrintVersion ? (
                    <div style={accentValueStyle(clientData.documentTitleColor)}>{clientData.quotationNo}</div>
                  ) : (
                    <input 
                      type="text" 
                      value={clientData.quotationNo} 
                      onChange={(e) => onQuotationNoChange?.(e.target.value)} 
                      className="w-full bg-transparent border-none p-0 focus:ring-0" 
                      style={accentValueStyle(clientData.documentTitleColor)}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className={labelStyle}>{t.date}</span>
              {isPrintVersion ? (
                <div className="text-gray-900 font-bold text-lg">{clientData.date}</div>
              ) : (
                <input type="date" value={clientData.date} onChange={(e) => onDateChange?.(e.target.value)} className="text-gray-900 font-bold text-lg bg-transparent border-none p-0 focus:ring-0 text-right" />
              )}
            </div>

            <div>
              <span className={labelStyle}>{t.client}</span>
              {isPrintVersion ? (
                <div className={`${valueStyle} whitespace-pre-wrap`}>{clientData.name || "Nombre del Cliente"}</div>
              ) : (
                <AutoResizeTextarea
                  value={clientData.name}
                  onChange={(val) => onClientNameChange?.(val)}
                  className={valueStyle}
                  placeholder="Nombre del Cliente"
                />
              )}
            </div>

            <div className="text-right">
              {clientData.showClientId && (
                 <>
                   <span className={`${labelStyle} text-right`}>{clientData.clientIdType}</span>
                   {isPrintVersion ? (
                     <div className={`${valueStyle} text-right`}>{clientData.clientIdValue || "---"}</div>
                   ) : (
                     <input type="text" value={clientData.clientIdValue} onChange={(e) => onClientIdValueChange?.(e.target.value)} className={`${valueStyle} w-full bg-transparent border-none p-0 focus:ring-0 text-right`} placeholder="Número" />
                   )}
                 </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INTRO TEXT */}
      <div className="mb-14 px-2">
        {isPrintVersion ? (
          <div style={textStyle} className="text-lg text-gray-800 font-medium leading-relaxed">{clientData.introText}</div>
        ) : (
          <AutoResizeTextarea
            value={clientData.introText}
            onChange={(val) => onIntroTextChange?.(val)}
            className="text-lg text-gray-800 font-medium leading-relaxed"
          />
        )}
      </div>

      {/* PRODUCTS ORGANIZADOS */}
      <div className="space-y-14">
        {sortedMainZones.map(([mainZone, subZones]) => (
          <div key={mainZone} className="section-zone">
            {!['GENERAL', 'ALGEMEEN'].includes(mainZone) && (
              <div className="mb-6">
                <h2 className="text-2xl font-brand font-bold uppercase leading-none tracking-tight" style={{ color: clientData.documentTitleColor }}>{mainZone}</h2>
                <div className="w-full h-[1px] mt-2 opacity-20" style={{ backgroundColor: clientData.documentTitleColor }}></div>
              </div>
            )}
            <div className="space-y-10">
              {Object.entries(subZones).map(([subZone, zoneItems]) => {
                const subtotal = (zoneItems as QuotationItem[]).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                return (
                  <div key={subZone} className="subzone-container w-full">
                    {!['GENERAL', 'ALGEMEEN'].includes(subZone) && (
                      <div className="mb-4 border-b border-gray-100 pb-2">
                        <h3 className="text-lg font-bold text-gray-600 uppercase tracking-tight">{subZone}</h3>
                      </div>
                    )}
                    <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="text-white" style={{ backgroundColor: clientData.documentTitleColor }}>
                          <th className="py-4 px-5 text-left font-black uppercase text-[10px] tracking-widest" style={{ width: '55%', fontFamily: 'Turismo CF, sans-serif' }}>{t.desc}</th>
                          <th className="py-4 px-1 text-center font-black uppercase text-[10px] tracking-widest" style={{ width: '10%', fontFamily: 'Turismo CF, sans-serif' }}>{t.qty}</th>
                          <th className="py-4 px-1 text-center font-black uppercase text-[10px] tracking-widest" style={{ width: '15%', fontFamily: 'Turismo CF, sans-serif' }}>{t.unit}</th>
                          <th className="py-4 px-5 text-right font-black uppercase text-[10px] tracking-widest" style={{ width: '20%', fontFamily: 'Turismo CF, sans-serif' }}>{t.itemTotal}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(zoneItems as QuotationItem[]).map((item) => (
                          <tr key={item.id} className="border-b border-gray-50">
                            <td className="py-5 px-5 align-top">
                              {isPrintVersion ? (
                                <div style={textStyle} className="text-[14px] font-medium text-gray-800 leading-snug">{item.description}</div>
                              ) : (
                                <div className="flex flex-col group relative">
                                  <AutoResizeTextarea
                                    value={item.description}
                                    onChange={(val) => onUpdateItem?.(item.id, 'description', val)}
                                    className="text-[14px] font-medium leading-snug"
                                  />
                                  <button onClick={() => onRemoveItem?.(item.id)} className="absolute -left-10 top-0 text-red-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                                </div>
                              )}
                            </td>
                            <td className="py-5 px-1 text-center align-top font-bold text-gray-700 text-sm">{item.quantity}</td>
                            <td className="py-5 px-1 text-center align-top font-bold text-gray-700 text-sm">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-5 px-5 text-right font-black text-gray-900 align-top text-sm">{formatCurrency(item.quantity * item.unitPrice)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 border-t border-gray-100">
                          <td colSpan={3} className="py-4 px-5 text-left font-black text-gray-400 uppercase text-[9px] tracking-widest">{t.subtotal} {subZone}:</td>
                          <td className="py-4 px-5 text-right font-black text-gray-900 text-base">{formatCurrency(subtotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* TOTALS */}
      <table className="w-full mt-16" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td className="w-1/2"></td>
            <td className="w-1/2 align-top">
              <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', padding: '35px', borderRadius: '16px' }}>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="text-[11px] font-black text-blue-600 uppercase tracking-widest pb-3">{t.subtotalNet}</td>
                      <td className="text-right text-xl font-bold text-slate-800 pb-3">{formatCurrency(subtotalNeto)}</td>
                    </tr>
                    {clientData.discountEnabled && (
                      <tr className="border-b border-blue-100">
                        <td className="text-[11px] font-black uppercase tracking-widest text-red-500 pb-4">{t.discount} {clientData.discountType === 'percentage' ? `(${clientData.discountValue}%)` : ''}</td>
                        <td className="text-right text-xl font-bold text-red-500 pb-4">-{formatCurrency(discountAmount)}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="text-sm font-black text-gray-900 uppercase tracking-widest pt-5">{t.total}</td>
                      <td className="text-right text-4xl font-black text-gray-900 pt-5 leading-none">{formatCurrency(totalAPagar)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* FOOTER EDITABLE BLOCKS */}
      <div className="mt-20 space-y-6">
        {clientData.showPaymentInfo && (
          <div style={bubbleStyle(clientData.documentTitleColor, `${clientData.documentTitleColor}10`)}>
             <div className="flex gap-6">
                <CreditCard size={20} style={{ color: clientData.documentTitleColor }} className="flex-shrink-0 mt-1" />
                <div className="flex-1">
                   <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-3 leading-none" style={{ fontFamily: 'Turismo CF, sans-serif' }}>{t.paymentAccount}</h4>
                   {isPrintVersion ? (
                     <div style={textStyle} className="text-[14px] text-gray-800 font-medium leading-relaxed">{clientData.paymentInfoText}</div>
                   ) : (
                     <AutoResizeTextarea
                       value={clientData.paymentInfoText}
                       onChange={(val) => onPaymentInfoChange?.(val)}
                       className="text-[14px] text-gray-800 font-medium"
                     />
                   )}
                </div>
             </div>
          </div>
        )}

        {clientData.showConditions && (
          <div style={bubbleStyle('#94A3B8', '#F8FAFC')}>
             <div className="flex gap-6">
                <ScrollText size={20} className="text-slate-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                   <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-3 leading-none" style={{ fontFamily: 'Turismo CF, sans-serif' }}>{t.conditions}</h4>
                   {isPrintVersion ? (
                     <div style={textStyle} className="text-[12px] text-slate-600 font-medium leading-relaxed">{clientData.terms}</div>
                   ) : (
                     <AutoResizeTextarea
                       value={clientData.terms}
                       onChange={(val) => onTermsChange?.(val)}
                       onKeyDown={handleTermsKeyDown}
                       className="text-[12px] text-slate-600 font-medium leading-relaxed"
                     />
                   )}
                </div>
             </div>
          </div>
        )}

        {clientData.showObservations && (
          <div style={bubbleStyle('#22C55E', '#F0FDF4')}>
             <div className="flex gap-6">
                <MessageSquare size={20} className="text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                   <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-3 leading-none" style={{ fontFamily: 'Turismo CF, sans-serif' }}>{t.observations}</h4>
                   {isPrintVersion ? (
                     <div style={textStyle} className="text-[13px] text-gray-800 font-medium italic leading-relaxed">{clientData.observationsText || "Sin observaciones adicionales."}</div>
                   ) : (
                     <AutoResizeTextarea
                       value={clientData.observationsText}
                       onChange={(val) => onObservationsChange?.(val)}
                       placeholder="Añadir observaciones aquí..."
                       className="text-[13px] text-gray-800 font-medium italic"
                     />
                   )}
                </div>
             </div>
          </div>
        )}
      </div>

      {/* SIGNATURES */}
      {(clientData.showClientSignature || clientData.showSellerSignature) && (
        <table className="w-full mt-24" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              {clientData.showClientSignature && clientData.showSellerSignature ? (
                <>
                  <td className="align-top text-center" style={{ padding: '0 30px 0 0' }}>
                    <div className="border-t-2 border-gray-900 pt-5">
                      {isPrintVersion ? (
                        <div className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none whitespace-pre-wrap">{clientData.clientSignatureText}</div>
                      ) : (
                        <AutoResizeTextarea
                          value={clientData.clientSignatureText}
                          onChange={(val) => onClientSignatureTextChange?.(val)}
                          className="text-center font-black uppercase text-[11px]"
                        />
                      )}
                    </div>
                  </td>
                  <td className="w-16"></td>
                  <td className="align-top text-center" style={{ padding: '0 0 0 30px' }}>
                    <div className="border-t-2 border-gray-900 pt-5">
                      {isPrintVersion ? (
                        <div className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none whitespace-pre-wrap">{clientData.signatureText}</div>
                      ) : (
                        <AutoResizeTextarea
                          value={clientData.signatureText}
                          onChange={(val) => onSignatureChange?.(val)}
                          className="text-center font-black uppercase text-[11px]"
                        />
                      )}
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ width: '50%' }}></td>
                  <td className="align-top text-center">
                    <div className="border-t-2 border-gray-900 pt-5">
                      {clientData.showClientSignature ? (
                        isPrintVersion ? (
                          <div className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none whitespace-pre-wrap">{clientData.clientSignatureText}</div>
                        ) : (
                          <AutoResizeTextarea
                            value={clientData.clientSignatureText}
                            onChange={(val) => onClientSignatureTextChange?.(val)}
                            className="text-center font-black uppercase text-[11px]"
                          />
                        )
                      ) : (
                        isPrintVersion ? (
                          <div className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none whitespace-pre-wrap">{clientData.signatureText}</div>
                        ) : (
                          <AutoResizeTextarea
                            value={clientData.signatureText}
                            onChange={(val) => onSignatureChange?.(val)}
                            className="text-center font-black uppercase text-[11px]"
                          />
                        )
                      )}
                    </div>
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      )}

      {/* ATTACHMENTS */}
      {attachments.length > 0 && (
        <div className="mt-32 pt-20 border-t border-gray-100 block">
          <div className="text-center mb-16 relative">
            <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-gray-200"></div>
            <span className="relative bg-white px-10 text-[10px] font-black text-gray-400 uppercase tracking-[0.6em]">{t.attachments}</span>
          </div>
          
          <div className="columns-2 gap-8 space-y-8">
            {attachments.map((att) => (
              <div 
                key={att.id} 
                className="break-inside-avoid relative group flex flex-col bg-white rounded-2xl border border-gray-100 p-3 shadow-sm transition-all hover:shadow-md"
              >
                <div className="w-full mb-4 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-50">
                  <img 
                    src={att.previewUrl} 
                    alt={att.title || 'Attachment'} 
                    className="w-full h-auto block object-contain" 
                  />
                </div>
                {!isPrintVersion && (
                   <button 
                     onClick={() => onRemoveAttachment?.(att.id)} 
                     className="absolute top-5 right-5 p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-lg opacity-0 group-hover:opacity-100 shadow-xl transition-all hover:bg-red-50 z-10"
                   >
                     <Trash2 size={14}/>
                   </button>
                )}
                <div className="w-full px-2 text-center pb-2">
                  {att.title && (
                    <h4 className="font-black text-gray-900 text-[11px] uppercase mb-1 tracking-wider leading-tight">
                      {att.title}
                    </h4>
                  )}
                  {att.description && (
                    <p className="text-gray-500 text-[10px] font-medium leading-relaxed italic">
                      {att.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Preview;
