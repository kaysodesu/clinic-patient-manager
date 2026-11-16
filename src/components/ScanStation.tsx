import React, { useState, useRef, useEffect } from 'react';
import { Patient, ITEvent } from '../types';
import { 
  QrCode, Scan, ShieldCheck, AlertCircle, Sparkles, ArrowRight, CheckCircle2, 
  SearchCheck, FileText, Fingerprint, Volume2, VolumeX, ShieldAlert, AlertTriangle, HelpCircle
} from 'lucide-react';

interface ScanStationProps {
  patients: Patient[];
  onSelectPatientId: (id: string) => void;
  onSetScannedIntakeData: (data: Partial<Patient> | null) => void;
  onSetActiveView: (view: any) => void;
  onLogITEvent: (type: ITEvent['type'], details: string, author?: string, status?: ITEvent['status']) => void;
}

export default function ScanStation({
  patients,
  onSelectPatientId,
  onSetScannedIntakeData,
  onSetActiveView,
  onLogITEvent
}: ScanStationProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [isHoveredZone, setIsHoveredZone] = useState(false);
  const [insuranceQueryState, setInsuranceQueryState] = useState<'idle' | 'querying' | 'resolved'>('idle');

  const scanIntervalRef = useRef<any>(null);

  // Play a beautiful synthetic beep or buzzer using the native Web Audio API
  const playSound = (type: 'success' | 'double_success' | 'error' | 'scan_laser') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'success') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'double_success') {
        // High double beep for existing record matches
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain1.gain.setValueAtTime(0.06, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.1);

        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.setValueAtTime(1320, ctx.currentTime); // E6
          gain2.gain.setValueAtTime(0.06, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.15);
        }, 120);
      } else if (type === 'scan_laser') {
        // Sci-Fi sweep sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, ctx.currentTime); // Low buzz
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Audio Context blocked or failed to initialize", e);
    }
  };

  // Mock document database to test scan triggers
  const mockScannableDocuments = [
    {
      id: "doc-license-penelope",
      label: "Penelope Rose Vance (Driver's License)",
      type: "license",
      barcode: "ID_PENELOPE_VANCE_8a82f",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      patientName: "Penelope Vance",
      insuranceAttached: {
        providerName: "Providence Health Plan",
        policyNo: "PR-2831902",
        groupNo: "GRP-PROV12",
        policyHolderName: "Penelope Vance",
        policyHolderDoB: "1993-08-11",
        individualDeductible: 1200,
        deductibleMet: 850,
        copayAmount: 20
      },
      personalInfo: {
        firstName: "Penelope",
        lastName: "Vance",
        dateOfBirth: "1993-08-11",
        gender: "Female",
        phone: "(555) 555-0103",
        email: "p.vance_design@example.com",
        address: "904 Cascade Rd",
        city: "Portland",
        state: "OR",
        zipCode: "97219",
        ssnLast4: "4581"
      }
    },
    {
      id: "doc-passport-johnathan",
      label: "Johnathan Scott Miller (Passport)",
      type: "passport",
      barcode: "PASS_US_JM_71a03",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      patientName: "Johnathan Miller",
      insuranceAttached: {
        providerName: "Regence BlueCross",
        policyNo: "BC-9218201",
        groupNo: "GRP-BC99",
        policyHolderName: "Johnathan Miller",
        policyHolderDoB: "1978-05-19",
        individualDeductible: 3000,
        deductibleMet: 400,
        copayAmount: 45
      },
      personalInfo: {
        firstName: "Johnathan",
        lastName: "Miller",
        dateOfBirth: "1978-05-19",
        gender: "Male",
        phone: "(555) 555-0191",
        email: "j_miller_ops@example.com",
        address: "142 Oakridge Ln",
        city: "Portland",
        state: "OR",
        zipCode: "97205",
        ssnLast4: "2910"
      }
    },
    {
      id: "doc-state-id-arthur",
      label: "Arthur Timothy Dent (State ID Card)",
      type: "state_id",
      barcode: "ID_ARTHUR_DENT_42a42",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      patientName: "Arthur Dent",
      insuranceAttached: {
        providerName: "UnitedHealth Group",
        policyNo: "UH-42424242",
        groupNo: "GRP-UH-GALAXY",
        policyHolderName: "Arthur Dent",
        policyHolderDoB: "1982-03-11",
        individualDeductible: 4200,
        deductibleMet: 42,
        copayAmount: 42
      },
      personalInfo: {
        firstName: "Arthur",
        lastName: "Dent",
        dateOfBirth: "1982-03-11",
        gender: "Male",
        phone: "(555) 555-0142",
        email: "adent_prefect@example.com",
        address: "42 Towel Lane",
        city: "Portland",
        state: "OR",
        zipCode: "97210",
        ssnLast4: "4242"
      }
    }
  ];

  const handleApplyScan = (docData: typeof mockScannableDocuments[0]) => {
    if (isScanning) return;
    
    setIsScanning(true);
    setScanProgress(0);
    setScanMessage(`Positioning document reference: "${docData.label}" ...`);
    setScanResult(null);
    setInsuranceQueryState('idle');
    playSound('scan_laser');

    // Simulate scanning animation duration
    const duration = 1800;
    const steps = 40;
    const stepTime = duration / steps;
    let step = 0;

    scanIntervalRef.current = setInterval(() => {
      step++;
      const progress = Math.min(100, Math.floor((step / steps) * 100));
      setScanProgress(progress);
      
      if (progress < 30) {
        setScanMessage(`Aligning holographic scan bounds...`);
      } else if (progress < 60) {
        setScanMessage(`Decrypting embedded checksum barcodes (${docData.barcode})...`);
      } else if (progress < 90) {
        setScanMessage(`Verifying security integrity and reading MRZ data...`);
      } else {
        setScanMessage(`Finishing file packet extraction...`);
      }

      if (progress === 100) {
        clearInterval(scanIntervalRef.current);
        processParsedResult(docData);
      }
    }, stepTime);
  };

  const processParsedResult = (docData: any) => {
    setIsScanning(false);
    
    // Check if barcode implies an existing patient
    // If it starts with PATIENT_ or we matches ID in patient database
    let matchedPatient: Patient | undefined = undefined;

    if (docData.type === 'wristband') {
      const parsedId = docData.barcode.replace('PATIENT_', '');
      matchedPatient = patients.find(p => p.id === parsedId);
      if (!matchedPatient) {
        // A wristband carries no demographics, so there is nothing to pre-fill
        setScanResult(null);
        alert(`No registered patient matches wristband ${parsedId}. Register the patient through the intake portal first.`);
        return;
      }
    } else {
      // It is a card (driver's license / state id / passport)
      // Check if patient name exists in patients array to prevent duplicate registration
      matchedPatient = patients.find(p => 
        p.personalInfo.firstName.toLowerCase() === docData.personalInfo.firstName.toLowerCase() &&
        p.personalInfo.lastName.toLowerCase() === docData.personalInfo.lastName.toLowerCase()
      );
    }

    if (matchedPatient) {
      // Existing patient detected!
      playSound('double_success');
      setScanResult({
        status: 'MATCHED_EXISTING',
        patient: matchedPatient,
        documentType: docData.type,
        summary: `Match identified in clinical index. Patient ${matchedPatient.personalInfo.firstName} ${matchedPatient.personalInfo.lastName} has active records state: "${matchedPatient.status}".`
      });
      onLogITEvent(
        'INTAKE_UPDATE', 
        `Barcoded scan matched ACTIVE client registry: ${matchedPatient.personalInfo.firstName} ${matchedPatient.personalInfo.lastName} (ID: ${matchedPatient.id}).`,
         'PORTAL_SCANNER', 
         'SUCCESS'
      );
    } else {
      // New patient detected! We need to query SSN database for insurance
      playSound('success');
      setScanResult({
        status: 'NEW_UNREGISTED',
        personalInfo: docData.personalInfo,
        documentType: docData.type,
        insurance: docData.insuranceAttached,
        summary: `Extracted new identity: ${docData.personalInfo.firstName} ${docData.personalInfo.lastName}. Preparing secure insurance lookup.`
      });

      // Simulate Real time Social Security query for insurance coverage lookup!
      setInsuranceQueryState('querying');
      setTimeout(() => {
        setInsuranceQueryState('resolved');
        playSound('success');
        onLogITEvent(
          'INTAKE_UPDATE', 
          `Holographic document decrypter matched Social Security database with SSN tag: ***-**-${docData.personalInfo.ssnLast4}. Connected insurance profile retrieved: ${docData.insuranceAttached.providerName}, Contract ID: ${docData.insuranceAttached.policyNo}. Ready for intake.`,
          'FEDERAL_SS_LOOKUP',
          'SUCCESS'
        );
      }, 1500);
    }
  };

  // Allow raw barcode codes to simulate laser reader gun swipes!
  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    // Search doc database or patient database for matching barcode
    const cleanedCode = manualCode.trim().toUpperCase();
    
    // Find matching mock document or patient
    const matchedDoc = mockScannableDocuments.find(d => 
      d.barcode.toUpperCase() === cleanedCode || 
      d.barcode.replace('PATIENT_', '').toUpperCase() === cleanedCode
    );

    if (matchedDoc) {
      handleApplyScan(matchedDoc);
    } else {
      // Check if it is directly a patient ID
      const directlyFoundPatient = patients.find(p => p.id.toUpperCase() === cleanedCode);
      if (directlyFoundPatient) {
        // Construct a wrapper doc
        const wrapperDoc = {
          id: `doc-wristband-${directlyFoundPatient.id}`,
          label: `${directlyFoundPatient.personalInfo.firstName}'s Wristband`,
          type: "wristband",
          barcode: `PATIENT_${directlyFoundPatient.id}`,
          badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
          patientName: `${directlyFoundPatient.personalInfo.firstName} ${directlyFoundPatient.personalInfo.lastName}`,
          desc: `Instantly scanned wristband ${directlyFoundPatient.id}`,
          insuranceAttached: undefined,
          personalInfo: undefined
        };
        handleApplyScan(wrapperDoc);
      } else {
        playSound('error');
        alert(`❌ Invalid Scanner Signal: Barcode code "${manualCode}" unrecognized. Try clicking a template document card, or inputting an existing patient ID like "TEST-001".`);
        onLogITEvent(
          'LOGIN_ERROR', 
          `Manual barcode reader entry vetoed for sequence "${manualCode}". System returned empty set.`, 
          'BARCODE_READER_ERROR', 
          'ERROR'
        );
      }
    }
    setManualCode('');
  };

  // Navigates and binds state
  const handleProceedWithScanResult = () => {
    if (!scanResult) return;

    if (scanResult.status === 'MATCHED_EXISTING') {
      // Focus database view and active ID
      onSelectPatientId(scanResult.patient.id);
      onSetActiveView('database');
    } else {
      // Populate intake panel and navigate
      const constructedPatientData: Partial<Patient> = {
        personalInfo: {
          firstName: scanResult.personalInfo.firstName,
          lastName: scanResult.personalInfo.lastName,
          dateOfBirth: scanResult.personalInfo.dateOfBirth,
          gender: scanResult.personalInfo.gender,
          phone: scanResult.personalInfo.phone,
          email: scanResult.personalInfo.email,
          address: scanResult.personalInfo.address,
          city: scanResult.personalInfo.city,
          state: scanResult.personalInfo.state,
          zipCode: scanResult.personalInfo.zipCode
        },
        insuranceBilling: {
          providerName: scanResult.insurance.providerName,
          policyNo: scanResult.insurance.policyNo,
          groupNo: scanResult.insurance.groupNo,
          policyHolderName: scanResult.insurance.policyHolderName,
          policyHolderDoB: scanResult.insurance.policyHolderDoB,
          individualDeductible: scanResult.insurance.individualDeductible,
          deductibleMet: scanResult.insurance.deductibleMet,
          copayAmount: scanResult.insurance.copayAmount
        },
        currentVisit: {
          symptoms: "Patient admitted via digital scanner ID encryption. Secondary inspection required.",
          duration: "Onset today",
          severity: "Mild",
          department: "General Practice"
        },
        emergencyContact: {
          fullName: "Liaison pending verification",
          relationship: "Pending",
          phone: scanResult.personalInfo.phone
        }
      };

      onSetScannedIntakeData(constructedPatientData);
      onSetActiveView('intake');
    }

    // Reset fields
    setScanResult(null);
    setScanProgress(0);
    setInsuranceQueryState('idle');
  };

  return (
    <div id="scan-station-module" className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-6 relative">
      
      {/* Background neon accents */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-rose-500/5 blur-2xl rounded-full pointer-events-none" />

      {/* Title / Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-900/40 border border-teal-500/20 text-teal-400 rounded-xl">
            <QrCode className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-100 tracking-wide uppercase">ID & wristband scanner</h3>
              <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded text-[9px] font-mono font-bold">RFID v4.4 Active</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Scan patients' wristbands, driver's licenses, state IDs, or passport barcodes to retrieve registries instantly.</p>
          </div>
        </div>

        {/* Control utility */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              soundEnabled 
                ? 'bg-slate-800 border-slate-700 text-teal-400' 
                : 'bg-slate-850 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? "Mute beep sound" : "Enable beep sound"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px] hidden sm:inline">{soundEnabled ? "Audio On" : "Audio Off"}</span>
          </button>
        </div>
      </div>

      {/* Body with simulation grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* Left pane: Visual Laser scan window */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 flex items-center gap-1.5">
            <Scan className="w-3 h-3 text-teal-400" />
            Laser Scan Aperture
          </span>

          {/* Scanner view screen */}
          <div 
            id="bar-code-scan-target-area"
            onMouseEnter={() => setIsHoveredZone(true)}
            onMouseLeave={() => setIsHoveredZone(false)}
            className={`h-56 rounded-2xl bg-slate-950 border relative overflow-hidden flex flex-col justify-center items-center transition-all duration-300 ${
              isScanning 
                ? 'border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.15)] bg-slate-950' 
                : isHoveredZone 
                ? 'border-slate-700 bg-slate-950/80' 
                : 'border-slate-800/80 bg-slate-950/40'
            }`}
          >
            {/* Pulsing sweeping laser line */}
            {isScanning && (
              <div className="absolute left-0 right-0 h-0.5 bg-teal-500 shadow-[0_0_8px_#14b8a6] animate-[bounce_2s_infinite] z-10" />
            )}

            {/* Glowing guide target box */}
            <div className={`w-64 h-32 rounded-xl border border-dashed flex flex-col items-center justify-center p-4 transition-all duration-300 ${
              isScanning 
                ? 'border-teal-500/80 bg-teal-500/5' 
                : 'border-slate-800 bg-slate-900/30'
            }`}>
              {isScanning ? (
                <div className="text-center space-y-3">
                  <div className="flex gap-1 justify-center">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
                  </div>
                  <strong className="text-teal-400 tracking-wide text-xs uppercase font-mono block">Scanning Document...</strong>
                  <div className="w-48 bg-slate-800 h-1 rounded-full overflow-hidden mx-auto">
                    <div className="h-full bg-teal-500 rounded-full transition-all duration-100" style={{ width: `${scanProgress}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono mt-1">{scanProgress}% - {scanMessage}</p>
                </div>
              ) : scanResult ? (
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" strokeWidth={2.5} />
                  <strong className="text-slate-100 text-xs block font-bold">Extracted Checklist Success!</strong>
                  <p className="text-[9px] text-slate-400 font-mono italic max-w-[200px] truncate mx-auto">Barcode: {scanResult.patient?.id || "Prepopulated Document Entry"}</p>
                </div>
              ) : (
                <div className="text-center text-slate-500 space-y-2 pointer-events-none select-none">
                  <QrCode className="w-10 h-10 text-slate-700 mx-auto stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-400">Position document here</p>
                  <p className="text-[9px] text-slate-500 font-mono">Select a fast template document below or swipe scanner code</p>
                </div>
              )}
            </div>

            {/* Corner guide brackets */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-slate-800" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-slate-800" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-slate-800" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-slate-800" />
          </div>

          {/* Quick Hardware simulation scanner gun form link */}
          <form onSubmit={handleManualCodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Scan className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Hardware Barcode Swipe (e.g. TEST-001)"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pl-8 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-700 transition-all font-bold"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 font-bold px-4 rounded-xl text-xs flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            >
              Swipe Laser
            </button>
          </form>
        </div>

        {/* Right pane: Document choices & scanned outcome */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          
          {/* Result card or Template selector */}
          {scanResult ? (
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
              
              {/* Outcome Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono tracking-widest uppercase font-black px-2 py-0.5 rounded border ${
                    scanResult.status === 'MATCHED_EXISTING' 
                      ? 'bg-teal-900/30 border-teal-800 text-teal-400' 
                      : 'bg-amber-900/30 border-amber-800 text-amber-400'
                  }`}>
                    {scanResult.documentType} read success
                  </span>
                  <span className="text-[10px] text-slate-500">•</span>
                  <span className="text-xs text-slate-300 font-semibold">{scanResult.patient ? 'Active File Found' : 'Identity Decrypted'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setScanResult(null); setInsuranceQueryState('idle'); }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Clear Scanner
                </button>
              </div>

              {/* Parsing Data Fields */}
              <div className="space-y-3.5">
                {scanResult.status === 'MATCHED_EXISTING' ? (
                  /* Existing matched profile metadata overview */
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Patient Name</span>
                      <strong className="text-sm text-white block mt-0.5">
                        {scanResult.patient.personalInfo.firstName} {scanResult.patient.personalInfo.lastName}
                      </strong>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Dossier File ID</span>
                      <strong className="text-sm font-mono text-teal-400 block mt-0.5">{scanResult.patient.id}</strong>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Date of Birth</span>
                      <span className="text-xs text-slate-300 block font-mono mt-0.5">{scanResult.patient.personalInfo.dateOfBirth}</span>
                    </div>
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Active Intake Status</span>
                      <span className="text-xs text-slate-200 block mt-0.5 font-bold flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          scanResult.patient.status === 'In Processing' ? 'bg-blue-400' :
                          scanResult.patient.status === 'Triage' ? 'bg-amber-400 animate-pulse' :
                          scanResult.patient.status === 'With Doctor' ? 'bg-purple-400' : 'bg-slate-400'
                        }`} />
                        {scanResult.patient.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Decrypted new patient license/passport elements */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850">
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">First Name</span>
                        <strong className="text-xs text-slate-200 block">{scanResult.personalInfo.firstName}</strong>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850">
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">Last Name</span>
                        <strong className="text-xs text-slate-200 block">{scanResult.personalInfo.lastName}</strong>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850">
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">Date of Birth</span>
                        <strong className="text-xs text-slate-200 font-mono block">{scanResult.personalInfo.dateOfBirth}</strong>
                      </div>
                      <div className="col-span-2 bg-slate-900/40 p-2 rounded-lg border border-slate-850">
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">Street Address</span>
                        <span className="text-xs text-slate-350 block max-w-full truncate">{scanResult.personalInfo.address}, {scanResult.personalInfo.city}</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850">
                        <span className="text-[8px] text-slate-500 uppercase block font-bold font-mono">Linked SSN getLastLast</span>
                        <span className="text-xs text-slate-400 font-mono font-bold block">***-**-{scanResult.personalInfo.ssnLast4}</span>
                      </div>
                    </div>

                    {/* Social Security Number connected Insurance lookup simulator */}
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-3">
                      <div className="flex items-center gap-2 justify-between">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Registry SSN Insurance Gateway:</span>
                        {insuranceQueryState === 'querying' && (
                          <span className="text-[10px] text-teal-400 animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                            Fetching Federal Eligibility Hub...
                          </span>
                        )}
                        {insuranceQueryState === 'resolved' && (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 font-sans">
                            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                            Coverage Verified & Decrypted
                          </span>
                        )}
                      </div>

                      {insuranceQueryState === 'querying' ? (
                        <div className="p-3 text-center text-xs text-slate-500 space-y-2 mt-1">
                          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden">
                            <div className="bg-teal-500 h-full animate-[shimmer_1.5s_infinite] w-2/3" />
                          </div>
                          <span className="text-[9px] font-mono text-slate-450 uppercase block">Calling Provider Database matching card social security...</span>
                        </div>
                      ) : insuranceQueryState === 'resolved' ? (
                        <div className="mt-2.5 grid grid-cols-2 md:grid-cols-3 gap-2 border-t border-slate-900 pt-2 animate-in fade-in duration-300">
                          <div className="bg-slate-900/60 p-2 rounded border border-slate-850">
                            <span className="text-[8px] text-slate-500 uppercase block">Provider</span>
                            <strong className="text-[11px] text-emerald-400 block">{scanResult.insurance.providerName}</strong>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded border border-slate-850">
                            <span className="text-[8px] text-slate-500 uppercase block">Policy Carrier #</span>
                            <span className="text-[11px] text-slate-300 font-mono font-bold block">{scanResult.insurance.policyNo}</span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded border border-slate-850">
                            <span className="text-[8px] text-slate-500 uppercase block">Group Carrier #</span>
                            <span className="text-[11px] text-slate-300 font-mono block">{scanResult.insurance.groupNo}</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-850 italic">
                  <Fingerprint className="w-4 h-4 inline text-teal-400 mr-1.5 shrink-0 align-sub animate-pulse" />
                  {scanResult.summary}
                </p>
              </div>

              {/* Action route button */}
              <button
                type="button"
                onClick={handleProceedWithScanResult}
                disabled={insuranceQueryState === 'querying'}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold tracking-wide py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all text-center cursor-pointer"
              >
                <span>
                  {scanResult.status === 'MATCHED_EXISTING' 
                    ? `Retrieve ${scanResult.patient.personalInfo.firstName}'s Dossier Records File` 
                    : `Prepopulate ${scanResult.personalInfo.firstName}'s info into New patient intake`
                  }
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          ) : (
            /* Choose a document to simulate scan */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block">Select Demo Scan Document Templates</span>
                <span className="text-[9px] text-slate-500 italic block font-mono">Simulates physical desk swipe</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                {mockScannableDocuments.map(doc => (
                  <button
                    type="button"
                    key={doc.id}
                    onClick={() => handleApplyScan(doc)}
                    className="p-3 bg-slate-950/30 border border-slate-800 text-left rounded-xl hover:bg-slate-950/80 hover:border-slate-700 transition-all flex flex-col justify-between gap-1 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-slate-200 font-bold text-xs truncate max-w-[150px] group-hover:text-teal-400 transition-colors">
                        {doc.patientName}
                      </span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded border uppercase font-mono font-bold leading-none ${doc.badgeColor}`}>
                        {doc.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">Barcode: {doc.barcode}</span>
                    <p className="text-[9px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      Simulate admission card scan to auto-fill demographic forms.
                    </p>
                  </button>
                ))}
              </div>

              {/* Hardware instruction */}
              <div className="bg-slate-950/20 border border-slate-850 p-3 rounded-xl flex gap-3 text-xs leading-relaxed text-slate-400">
                <HelpCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block text-[11px] mb-0.5">Physical Gun Integration</span>
                  Swiping a physical barcode scanner at the clinic terminal triggers a keyboard input string ending with <code className="bg-slate-900 px-1 py-0.5 rounded text-teal-400 font-mono">Enter</code>. Enter a manual passcode id above like <code className="bg-slate-900 px-1 py-0.5 rounded text-teal-400 font-mono">TEST-001</code> to inspect immediate ledger synchronicity!
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
