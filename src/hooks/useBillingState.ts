import { useState, useEffect } from 'react';
import { Invoice } from '../types';
import { initialInvoices } from '../data/mockPatients';

export function useBillingState() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('clinic_invoices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse clinic_invoices from local storage:', e);
      }
    }
    return initialInvoices;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await fetch('/api/invoices');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setInvoices(data);
            localStorage.setItem('clinic_invoices', JSON.stringify(data));
          } else {
            // Seed API
            const currentList = invoices.length > 0 ? invoices : initialInvoices;
            setInvoices(currentList);
            localStorage.setItem('clinic_invoices', JSON.stringify(currentList));
            await fetch('/api/invoices', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(currentList)
            });
          }
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        console.warn('Failed to load invoices from API, using local storage fallback:', err);
        const saved = localStorage.getItem('clinic_invoices');
        if (saved) {
          setInvoices(JSON.parse(saved));
        } else {
          setInvoices(initialInvoices);
          localStorage.setItem('clinic_invoices', JSON.stringify(initialInvoices));
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadInvoices();
  }, []);

  // Persist every change (including ones made via setInvoices) once the initial load is done
  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('clinic_invoices', JSON.stringify(invoices));
    fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoices)
    }).catch(e => console.warn('Failed to persist invoices to Express API server:', e));
  }, [invoices, isLoading]);

  const syncInvoicesList = async (updatedList: Invoice[]) => {
    setInvoices(updatedList);
    localStorage.setItem('clinic_invoices', JSON.stringify(updatedList));
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList)
      });
    } catch (e) {
      console.warn('Failed to sync invoices to Express API:', e);
    }
  };

  const addInvoice = async (invoice: Invoice) => {
    const updated = [...invoices, invoice];
    await syncInvoicesList(updated);
  };

  const updateInvoice = async (id: string, updatedFields: Partial<Invoice>) => {
    const updated = invoices.map(inv => inv.id === id ? { ...inv, ...updatedFields } : inv);
    await syncInvoicesList(updated);
  };

  const deleteInvoice = async (id: string) => {
    const updated = invoices.filter(inv => inv.id !== id);
    await syncInvoicesList(updated);
  };

  return {
    invoices,
    setInvoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    isLoading
  };
}
