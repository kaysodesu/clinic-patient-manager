# Test Scenarios

Five fictional patients for trying every workflow. **Use only made-up information. Never enter real patient details.**

## Getting started
1. Sign in (or create the administrator account on first run).
2. On **Patient Records Database**, click **Load Test Patients**. This adds the five fictional patients below (it skips any that are already loaded).
3. Everyone in the clinic shares one database, so you see colleagues' changes after refreshing the page.

Each scenario lists the tasks to try and the codes you should see.

---

## 1. Maya Thompson (TEST-001): New patient annual physical with abnormal labs
*34-year-old, new patient, Northwind Health PPO (test)*

- [ ] Find Maya in Patient Records and move her status from **With Doctor** to **Discharged**.
- [ ] In **Visitation Overview**, open her visit and check the codes: preventive visit `99385`, labs `36415` `83036` `80061`, diagnoses `Z00.01` `R73.03` `E66.9` `Z71.3`.
- [ ] Schedule a 3-month follow-up to recheck her A1c.
- [ ] In **HIPAA Secure Records**, write an after-visit summary explaining prediabetes.
- [ ] In **Billing**, find her $25 copay invoice and record a payment.

## 2. Robert Delgado (TEST-002): Uncontrolled diabetes and blood pressure
*58-year-old, established patient, sulfa allergy*

- [ ] Note the **sulfa allergy** and confirm it shows up when prescribing.
- [ ] In **Prescription Ledger**, add a new diabetes medication (e.g., a GLP-1 such as semaglutide). Does the app warn about anything?
- [ ] Check his visit codes: `99214` + `G2211` (ongoing-care add-on), remote monitoring setup `99453` `99454`, diagnoses `E11.65` `I10` `E78.5`.
- [ ] His $35 invoice is **Overdue**. Try setting up a payment plan.
- [ ] Add a progress note about enrolling him in home blood-pressure monitoring.

## 3. Lily Chen (TEST-003): Pediatric strep throat
*7-year-old, brought in by her mother (legal guardian), amoxicillin allergy*

- [ ] In **Patient Portal**, sign in as the guardian (POA) rather than the patient.
- [ ] Prescribe an antibiotic. Because of the **amoxicillin allergy**, the right choice is a non-penicillin option. Does the app help you avoid the allergy?
- [ ] Check the codes: `99213`, rapid strep test `87880`, diagnosis `J02.0`.
- [ ] Send the family a secure message with a school excuse note.

## 4. Jordan Reyes (TEST-004): Telehealth anxiety follow-up
*26-year-old, video visit from home, on sertraline*

- [ ] Check the telehealth visit codes: `98006` (audio-video, established, moderate), `96127` (GAD-7 / PHQ-9 screening), `F41.1`.
- [ ] In **Diagnostic Database → Conditions**, look up *Generalized Anxiety Disorder* and review the treatment guidance.
- [ ] Use the **Marketing / Communications Hub** to send a follow-up reminder by text or email.
- [ ] Write an after-visit summary with sleep-hygiene tips and a CBT referral.

## 5. Evelyn Brooks (TEST-005): Medicare wellness visit, knee arthritis and vaccines
*72-year-old, Original Medicare (test), son is healthcare POA*

- [ ] Check the codes: Annual Wellness Visit `G0439`, high-dose flu `90662`, RSV `90679`, vaccine administration `90471` `90472`, diagnoses `M17.12` `I10` `Z23`.
- [ ] Record a referral to physical therapy for her left knee (try the **Patient Transfer** desk).
- [ ] She takes meloxicam (an NSAID) and has high blood pressure. Add a note flagging this for the doctor.
- [ ] Confirm her son appears as the healthcare power of attorney.

---

## Also try
- [ ] **Processor Intake Portal**: register a brand-new made-up patient from start to finish.
- [ ] **Diagnostic Database** (Administrator or Database Administrator role): search for `telehealth`, `ICD-10` or `99214`, and add a custom code.
- [ ] Use the app on a **phone or tablet** and note anything that is hard to tap or read.
