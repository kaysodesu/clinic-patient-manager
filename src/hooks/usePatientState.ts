import { useState, useEffect } from 'react';
import { Patient, ClinicRole } from '../types';
import { initialPatients } from '../data/mockPatients';

export function getInitialSeedPatients(): Patient[] {
  // Starts empty: real patients are added through the intake portal.
  return [...initialPatients];
}

export function usePatientState(role: ClinicRole) {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('clinic_patients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse clinic_patients from local storage:', e);
      }
    }
    return getInitialSeedPatients();
  });
  const [activePatientId, setActivePatientId] = useState<string>(() => {
    const saved = localStorage.getItem('clinic_active_patient_id');
    return saved || '';
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await fetch('/api/patients');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPatients(data);
            localStorage.setItem('clinic_patients', JSON.stringify(data));
          } else {
            // API is empty, seed it with what we have
            const currentList = patients.length > 0 ? patients : getInitialSeedPatients();
            setPatients(currentList);
            localStorage.setItem('clinic_patients', JSON.stringify(currentList));
            await fetch('/api/patients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(currentList)
            });
          }
        } else {
          throw new Error('API request failed');
        }
      } catch (err) {
        console.warn('Failed to load patients from API, using localStorage fallback:', err);
        const saved = localStorage.getItem('clinic_patients');
        if (saved) {
          setPatients(JSON.parse(saved));
        } else {
          const basePatients = getInitialSeedPatients();
          setPatients(basePatients);
          localStorage.setItem('clinic_patients', JSON.stringify(basePatients));
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadPatients();
  }, []);

  // Persist every change (including ones made via setPatients) once the initial load is done
  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('clinic_patients', JSON.stringify(patients));
    fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patients)
    }).catch(e => console.warn('Failed to persist patients to Express API server:', e));
  }, [patients, isLoading]);

  // Save changes to patients list locally and trigger API update
  const syncPatientsList = async (updatedList: Patient[]) => {
    setPatients(updatedList);
    localStorage.setItem('clinic_patients', JSON.stringify(updatedList));
    try {
      await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList)
      });
    } catch (e) {
      console.warn('Failed to persist patients update to Express API server:', e);
    }
  };

  const addPatient = async (newPatient: Patient) => {
    const updated = [...patients, newPatient];
    await syncPatientsList(updated);
  };

  const updatePatient = async (id: string, updatedFields: Partial<Patient>) => {
    const updated = patients.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    await syncPatientsList(updated);
  };

  const handleMergePatients = async (masterId: string, dupeId: string) => {
    const masterPatient = patients.find(p => p.id === masterId);
    const dupePatient = patients.find(p => p.id === dupeId);
    if (!masterPatient || !dupePatient) return;

    const mergedNotes = [masterPatient.notes, dupePatient.notes]
      .filter(n => n && n.trim() !== '')
      .join(' | ');

    const mergedFamilyHistory = Array.from(new Set([
      ...(masterPatient.medicalHistory.familyHistory || []),
      ...(dupePatient.medicalHistory.familyHistory || [])
    ]));

    const mergedAllergies = [masterPatient.medicalQuestionnaire.allergies, dupePatient.medicalQuestionnaire.allergies]
      .filter(a => a && a.trim() !== '')
      .join(', ');

    const updatedMaster: Patient = {
      ...masterPatient,
      notes: mergedNotes,
      medicalHistory: {
        ...masterPatient.medicalHistory,
        familyHistory: mergedFamilyHistory
      },
      medicalQuestionnaire: {
        ...masterPatient.medicalQuestionnaire,
        allergies: mergedAllergies
      }
    };

    const updatedPatients = patients
      .map(p => p.id === masterId ? updatedMaster : p)
      .filter(p => p.id !== dupeId);

    await syncPatientsList(updatedPatients);

    try {
      await fetch('/api/patients/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterId, dupeId })
      });
    } catch (e) {
      console.warn('Failed to call merge API on server:', e);
    }

    if (activePatientId === dupeId) {
      setActivePatientId(masterId);
    }
  };

  const activePatient = patients.find(p => p.id === activePatientId) || patients[0] || null;

  useEffect(() => {
    localStorage.setItem('clinic_active_patient_id', activePatientId);
  }, [activePatientId]);

  return {
    patients,
    setPatients,
    activePatientId,
    setActivePatientId,
    activePatient,
    addPatient,
    updatePatient,
    handleMergePatients,
    isLoading
  };
}
