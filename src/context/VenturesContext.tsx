import React, { createContext, useContext, useState } from 'react';
import { INITIAL_VENTURES } from '../data/venturesData';
import { EnquirySubmission, VentureProject } from '../types/property';

interface VenturesContextValue {
  ventures: VentureProject[];
  enquiries: EnquirySubmission[];
  submitEnquiry: (enquiry: Omit<EnquirySubmission, 'id' | 'createdAt'>) => void;
}

const VenturesContext = createContext<VenturesContextValue | null>(null);

export function VenturesProvider({ children }: { children: React.ReactNode }) {
  const [ventures] = useState<VentureProject[]>(INITIAL_VENTURES);
  const [enquiries, setEnquiries] = useState<EnquirySubmission[]>([]);

  const submitEnquiry = (enquiry: Omit<EnquirySubmission, 'id' | 'createdAt'>) => {
    const item: EnquirySubmission = {
      ...enquiry,
      id: `enq-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setEnquiries((prev) => [item, ...prev]);
  };

  return (
    <VenturesContext.Provider value={{ ventures, enquiries, submitEnquiry }}>
      {children}
    </VenturesContext.Provider>
  );
}

export function useVentures() {
  const ctx = useContext(VenturesContext);
  if (!ctx) throw new Error('useVentures must be used inside VenturesProvider');
  return ctx;
}
