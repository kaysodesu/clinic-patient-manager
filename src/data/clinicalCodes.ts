// Reference code set for a primary-care / private-practice clinic (beta).
// Descriptions are plain-language summaries, not official CPT® descriptors. CPT® is a
// registered trademark of the American Medical Association. Verify every code against the
// current licensed CPT®, HCPCS and ICD-10-CM code books and payer rules before billing.

export type CodeSystem = 'ICD-10-CM' | 'CPT' | 'HCPCS';

export interface ClinicalCode {
  code: string;
  description: string;
  category: string;
  system?: CodeSystem;
}

/** Bump when the built-in code set changes so saved copies are refreshed. */
export const CODE_SET_VERSION = '2026.1';
export const CODE_SET_LABEL = 'ICD-10-CM FY2026 · CPT® 2026 · HCPCS 2026';

const icd = (code: string, description: string, category: string): ClinicalCode =>
  ({ code, description, category, system: 'ICD-10-CM' });
const cpt = (code: string, description: string, category: string): ClinicalCode =>
  ({ code, description, category, system: 'CPT' });
const hcpcs = (code: string, description: string, category: string): ClinicalCode =>
  ({ code, description, category, system: 'HCPCS' });

const DX_CHRONIC = 'Diagnoses: Chronic Conditions';
const DX_ACUTE = 'Diagnoses: Acute & Infectious';
const DX_MENTAL = 'Diagnoses: Behavioral Health';
const DX_MSK = 'Diagnoses: Musculoskeletal & Pain';
const DX_SYMPTOM = 'Diagnoses: Signs & Symptoms';
const DX_Z = 'Diagnoses: Preventive & Status (Z codes)';
const EM = 'Office & Outpatient Visits (E/M)';
const TELE = 'Telehealth & Virtual Care';
const PREV = 'Preventive & Wellness Visits';
const CARE = 'Care Management & Remote Monitoring';
const LAB = 'In-Office Labs & Point-of-Care Tests';
const PROC = 'Office Procedures & Injections';
const VAX = 'Vaccines & Immunizations';
const IMG = 'Imaging Referrals';
const REHAB = 'Physical Therapy & Rehab';

export const clinicalCodes: ClinicalCode[] = [
  // ---------------- ICD-10-CM DIAGNOSES ----------------
  icd('I10', 'Essential (primary) hypertension', DX_CHRONIC),
  icd('E11.9', 'Type 2 diabetes without complications', DX_CHRONIC),
  icd('E11.65', 'Type 2 diabetes with hyperglycemia', DX_CHRONIC),
  icd('R73.03', 'Prediabetes', DX_CHRONIC),
  icd('E78.5', 'Hyperlipidemia, unspecified', DX_CHRONIC),
  icd('E66.9', 'Obesity, unspecified', DX_CHRONIC),
  icd('E03.9', 'Hypothyroidism, unspecified', DX_CHRONIC),
  icd('E55.9', 'Vitamin D deficiency, unspecified', DX_CHRONIC),
  icd('D64.9', 'Anemia, unspecified', DX_CHRONIC),
  icd('J45.909', 'Asthma, unspecified, uncomplicated', DX_CHRONIC),
  icd('J45.901', 'Asthma, unspecified, with acute exacerbation', DX_CHRONIC),
  icd('K21.9', 'Gastro-esophageal reflux disease without esophagitis', DX_CHRONIC),
  icd('G43.909', 'Migraine, unspecified, not intractable', DX_CHRONIC),
  icd('F17.210', 'Nicotine dependence, cigarettes, uncomplicated', DX_CHRONIC),

  icd('J06.9', 'Acute upper respiratory infection, unspecified', DX_ACUTE),
  icd('J02.0', 'Streptococcal pharyngitis', DX_ACUTE),
  icd('J02.9', 'Acute pharyngitis, unspecified', DX_ACUTE),
  icd('J01.90', 'Acute sinusitis, unspecified', DX_ACUTE),
  icd('H66.90', 'Otitis media, unspecified, unspecified ear', DX_ACUTE),
  icd('U07.1', 'COVID-19', DX_ACUTE),
  icd('J10.1', 'Influenza (identified virus) with other respiratory manifestations', DX_ACUTE),
  icd('N39.0', 'Urinary tract infection, site not specified', DX_ACUTE),
  icd('L30.9', 'Dermatitis, unspecified', DX_ACUTE),

  icd('F41.1', 'Generalized anxiety disorder', DX_MENTAL),
  icd('F32.A', 'Depression, unspecified', DX_MENTAL),
  icd('F33.1', 'Major depressive disorder, recurrent, moderate', DX_MENTAL),

  icd('M54.50', 'Low back pain, unspecified', DX_MSK),
  icd('M17.12', 'Primary osteoarthritis, left knee', DX_MSK),
  icd('M25.561', 'Pain in right knee', DX_MSK),

  icd('R05.9', 'Cough, unspecified', DX_SYMPTOM),
  icd('R50.9', 'Fever, unspecified', DX_SYMPTOM),
  icd('R51.9', 'Headache, unspecified', DX_SYMPTOM),
  icd('R07.9', 'Chest pain, unspecified', DX_SYMPTOM),
  icd('R53.83', 'Other fatigue', DX_SYMPTOM),

  icd('Z00.00', 'General adult exam without abnormal findings', DX_Z),
  icd('Z00.01', 'General adult exam with abnormal findings', DX_Z),
  icd('Z00.129', 'Routine child health exam without abnormal findings', DX_Z),
  icd('Z23', 'Encounter for immunization', DX_Z),
  icd('Z13.31', 'Encounter for screening for depression', DX_Z),
  icd('Z71.3', 'Dietary counseling and surveillance', DX_Z),
  icd('Z79.84', 'Long-term (current) use of oral hypoglycemic drugs', DX_Z),
  icd('Z87.891', 'Personal history of nicotine dependence', DX_Z),

  // ---------------- OFFICE VISITS (2021+ E/M: level by medical decision making or total time) ----------------
  cpt('99202', 'New patient office visit, straightforward MDM (15+ min)', EM),
  cpt('99203', 'New patient office visit, low MDM (30+ min)', EM),
  cpt('99204', 'New patient office visit, moderate MDM (45+ min)', EM),
  cpt('99205', 'New patient office visit, high MDM (60+ min)', EM),
  cpt('99211', 'Established patient visit, minimal (may not need a physician)', EM),
  cpt('99212', 'Established patient office visit, straightforward MDM (10+ min)', EM),
  cpt('99213', 'Established patient office visit, low MDM (20+ min)', EM),
  cpt('99214', 'Established patient office visit, moderate MDM (30+ min)', EM),
  cpt('99215', 'Established patient office visit, high MDM (40+ min)', EM),
  cpt('99417', 'Prolonged outpatient service, each additional 15 min (CPT)', EM),
  hcpcs('G2212', 'Prolonged outpatient service, each additional 15 min (Medicare)', EM),
  hcpcs('G2211', 'Visit complexity add-on for ongoing longitudinal care', EM),

  // ---------------- TELEHEALTH (CPT 2025+ codes) ----------------
  cpt('98000', 'Telehealth audio-video visit, new patient, straightforward', TELE),
  cpt('98001', 'Telehealth audio-video visit, new patient, low complexity', TELE),
  cpt('98002', 'Telehealth audio-video visit, new patient, moderate complexity', TELE),
  cpt('98003', 'Telehealth audio-video visit, new patient, high complexity', TELE),
  cpt('98004', 'Telehealth audio-video visit, established patient, straightforward', TELE),
  cpt('98005', 'Telehealth audio-video visit, established patient, low complexity', TELE),
  cpt('98006', 'Telehealth audio-video visit, established patient, moderate complexity', TELE),
  cpt('98007', 'Telehealth audio-video visit, established patient, high complexity', TELE),
  cpt('98008', 'Telehealth audio-only visit, new patient, straightforward', TELE),
  cpt('98012', 'Telehealth audio-only visit, established patient, straightforward', TELE),
  cpt('98013', 'Telehealth audio-only visit, established patient, low complexity', TELE),
  cpt('98016', 'Brief virtual check-in with established patient (5-10 min)', TELE),

  // ---------------- PREVENTIVE & WELLNESS ----------------
  cpt('99385', 'Preventive visit, new patient, age 18-39', PREV),
  cpt('99386', 'Preventive visit, new patient, age 40-64', PREV),
  cpt('99387', 'Preventive visit, new patient, age 65+', PREV),
  cpt('99393', 'Preventive visit, established patient, age 5-11', PREV),
  cpt('99395', 'Preventive visit, established patient, age 18-39', PREV),
  cpt('99396', 'Preventive visit, established patient, age 40-64', PREV),
  cpt('99397', 'Preventive visit, established patient, age 65+', PREV),
  hcpcs('G0438', 'Medicare Annual Wellness Visit, initial', PREV),
  hcpcs('G0439', 'Medicare Annual Wellness Visit, subsequent', PREV),
  hcpcs('G0444', 'Annual depression screening (Medicare)', PREV),
  cpt('96127', 'Brief standardized behavioral assessment (e.g., PHQ-9, GAD-7)', PREV),
  cpt('99406', 'Tobacco cessation counseling, 3-10 min', PREV),
  cpt('99497', 'Advance care planning, first 30 min', PREV),

  // ---------------- CARE MANAGEMENT & REMOTE MONITORING ----------------
  cpt('99490', 'Chronic care management by clinical staff, first 20 min/month', CARE),
  cpt('99439', 'Chronic care management by clinical staff, each additional 20 min', CARE),
  cpt('99491', 'Chronic care management by physician/QHP, first 30 min/month', CARE),
  cpt('99487', 'Complex chronic care management, first 60 min/month', CARE),
  cpt('99424', 'Principal care management (single high-risk condition), first 30 min', CARE),
  cpt('99484', 'Behavioral health integration care management, 20+ min/month', CARE),
  cpt('99495', 'Transitional care after discharge, moderate complexity (contact in 2 days)', CARE),
  cpt('99496', 'Transitional care after discharge, high complexity (seen within 7 days)', CARE),
  cpt('99453', 'Remote patient monitoring: device setup and patient education', CARE),
  cpt('99454', 'Remote patient monitoring: device supply with daily readings, per 30 days', CARE),
  cpt('99457', 'Remote patient monitoring management, first 20 min/month', CARE),
  cpt('99458', 'Remote patient monitoring management, each additional 20 min', CARE),

  // ---------------- IN-OFFICE LABS & POINT-OF-CARE ----------------
  cpt('36415', 'Routine venipuncture (blood draw)', LAB),
  cpt('85025', 'Complete blood count (CBC) with differential, automated', LAB),
  cpt('80053', 'Comprehensive metabolic panel (CMP)', LAB),
  cpt('80048', 'Basic metabolic panel (BMP)', LAB),
  cpt('80061', 'Lipid panel', LAB),
  cpt('83036', 'Hemoglobin A1c', LAB),
  cpt('84443', 'Thyroid stimulating hormone (TSH)', LAB),
  cpt('82306', 'Vitamin D, 25-hydroxy', LAB),
  cpt('82947', 'Glucose, quantitative, blood', LAB),
  cpt('82962', 'Glucose by home-use monitoring device (fingerstick)', LAB),
  cpt('81002', 'Urinalysis, non-automated, without microscopy (dipstick)', LAB),
  cpt('81003', 'Urinalysis, automated, without microscopy', LAB),
  cpt('81025', 'Urine pregnancy test', LAB),
  cpt('87880', 'Rapid strep A antigen test', LAB),
  cpt('87804', 'Rapid influenza antigen test', LAB),
  cpt('87811', 'Rapid COVID-19 (SARS-CoV-2) antigen test', LAB),
  cpt('87635', 'COVID-19 (SARS-CoV-2) PCR / amplified probe test', LAB),
  cpt('93000', 'Electrocardiogram (ECG), 12-lead with interpretation and report', LAB),
  cpt('94010', 'Spirometry', LAB),
  cpt('94760', 'Pulse oximetry, single measurement', LAB),

  // ---------------- OFFICE PROCEDURES & INJECTIONS ----------------
  cpt('96372', 'Therapeutic/diagnostic injection, intramuscular or subcutaneous', PROC),
  cpt('94640', 'Nebulizer / inhalation treatment', PROC),
  cpt('69210', 'Removal of impacted earwax with instruments, one ear', PROC),
  cpt('10060', 'Incision and drainage of abscess, simple', PROC),
  cpt('12001', 'Simple laceration repair, 2.5 cm or less', PROC),
  cpt('11102', 'Tangential (shave) skin biopsy, single lesion', PROC),
  cpt('17110', 'Destruction of benign lesions such as warts, up to 14', PROC),
  cpt('20610', 'Joint injection or aspiration, major joint, without ultrasound', PROC),
  hcpcs('J3301', 'Triamcinolone acetonide injection, per 10 mg', PROC),
  hcpcs('J1030', 'Methylprednisolone acetate injection, 40 mg', PROC),
  hcpcs('J0696', 'Ceftriaxone sodium injection, per 250 mg', PROC),

  // ---------------- VACCINES & IMMUNIZATIONS ----------------
  cpt('90471', 'Immunization administration, first vaccine', VAX),
  cpt('90472', 'Immunization administration, each additional vaccine', VAX),
  cpt('90656', 'Influenza vaccine, trivalent, preservative-free, 0.5 mL, IM', VAX),
  cpt('90662', 'Influenza vaccine, high-dose (increased antigen), IM', VAX),
  cpt('90653', 'Influenza vaccine, adjuvanted, IM', VAX),
  cpt('91320', 'COVID-19 vaccine, Pfizer-BioNTech 30 mcg (age 12+), IM', VAX),
  cpt('91322', 'COVID-19 vaccine, Moderna 50 mcg (age 12+), IM', VAX),
  cpt('90678', 'RSV vaccine, RSVpreF (Abrysvo), IM', VAX),
  cpt('90679', 'RSV vaccine, RSVPreF3 adjuvanted (Arexvy), IM', VAX),
  cpt('90677', 'Pneumococcal conjugate vaccine, 20-valent (PCV20), IM', VAX),
  cpt('90715', 'Tdap vaccine (tetanus, diphtheria, pertussis), age 7+, IM', VAX),
  cpt('90750', 'Zoster (shingles) recombinant vaccine, adjuvanted, IM', VAX),
  cpt('90651', 'HPV vaccine, 9-valent, IM', VAX),

  // ---------------- IMAGING REFERRALS ----------------
  cpt('71046', 'Chest x-ray, 2 views', IMG),
  cpt('73562', 'Knee x-ray, 3 views', IMG),
  cpt('72100', 'Lumbar spine x-ray, 2-3 views', IMG),
  cpt('76700', 'Abdominal ultrasound, complete', IMG),
  cpt('77067', 'Screening mammogram, both breasts, with CAD', IMG),
  cpt('71271', 'Low-dose CT for lung cancer screening', IMG),
  cpt('70450', 'CT head or brain without contrast', IMG),
  cpt('73721', 'MRI of lower extremity joint without contrast', IMG),
  cpt('77080', 'DXA bone density study, axial skeleton', IMG),

  // ---------------- PHYSICAL THERAPY & REHAB ----------------
  cpt('97161', 'Physical therapy evaluation, low complexity', REHAB),
  cpt('97162', 'Physical therapy evaluation, moderate complexity', REHAB),
  cpt('97163', 'Physical therapy evaluation, high complexity', REHAB),
  cpt('97110', 'Therapeutic exercise, each 15 min', REHAB),
  cpt('97140', 'Manual therapy techniques, each 15 min', REHAB),
  cpt('97530', 'Therapeutic activities, each 15 min', REHAB),
  cpt('97116', 'Gait training, each 15 min', REHAB),
];
