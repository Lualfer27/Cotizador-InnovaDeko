
export interface QuotationOption {
  id: string;
  name: string;
  discountEnabled: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number | string;
}

export interface QuotationItem {
  id: string;
  optionId?: string;
  zone: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Attachment {
  id: string;
  file: File | null;
  previewUrl: string;
  title?: string;
  description: string;
}

export interface ClientData {
  name: string;
  date: string;
  quotationNo: string;
  quotationNoLabel: string;
  language: string;
  currency: string;
  includeDecimals: boolean;
  terms: string;
  signatureText: string;
  multipleOptions?: boolean;
  quotationOptions?: QuotationOption[];
  discountEnabled: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number | string;
  showClientId: boolean;
  clientIdType: 'Documento' | 'CRIB' | 'NIT' | 'Pasaporte';
  clientIdValue: string;
  introText: string;
  companyName: string;
  companySubtitle: string;
  documentTitle: string;
  // Title customization
  showDocumentTitle: boolean;
  documentTitleColor: string;
  documentTitleAlign: 'left' | 'center' | 'right';
  documentTitleFont: string;
  documentTitleFontSize: number;
  // Header customization
  companyNameFont: string;
  companyNameFontSize: number;
  companySubtitleFont: string;
  companySubtitleFontSize: number;
  showPaymentInfo: boolean;
  paymentInfoText: string;
  showObservations: boolean;
  observationsText: string;
  showConditions: boolean;
  showClientSignature: boolean;
  showSellerSignature: boolean;
  clientSignatureText: string;
  showClientInfo: boolean;
  showTotals: boolean;
}

export interface QuotationRecord {
  id: string;
  fileName: string;
  savedAt: string;
  data: {
    clientData: ClientData;
    items: QuotationItem[];
    attachments: Attachment[];
    zones: string[];
    companyLogo: string | null;
  };
}
