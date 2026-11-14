import { Patient, Invoice, FAQItem } from '../types';

export const initialPatients: Patient[] = [];

export const initialInvoices: Invoice[] = [];

export const initialFAQs: FAQItem[] = [
  {
    id: "faq-1",
    question: "How do I process custom insurance secondary coverage?",
    answer: "During the intake check-in process, note the primary insurance provider in the Insurance Billing section. For secondary insurance, log details under Doctor/Staff Notes or contact billing department directly to submit a double claim.",
    category: "Insurance"
  },
  {
    id: "faq-2",
    question: "What is the policy for unresolved over-the-counter medication declarations?",
    answer: "All OTC medications, including vitamins and herbal supplements, must be listed clearly under the Medical Questionnaire. They are cross-referenced by the attending physician for drug-drug interactions with newly prescribed treatment plans.",
    category: "Intake"
  },
  {
    id: "faq-3",
    question: "When are invoices marked as 'Overdue'?",
    answer: "Invoices are marked as Overdue automatically if they remain unpaid after the 30-day payment slot expires. Patients receive email alerts and automated text reminders on days 31, 45, and 60.",
    category: "Billing"
  },
  {
    id: "faq-4",
    question: "Can I do installment payments for large deductibles?",
    answer: "Yes, our clinic supports 3, 6, and 12-month interest-free installment plans for patient copays and deductibles that exceed $500. Select 'Installment Agreement' under 'Billing and Payment Settings'.",
    category: "Billing"
  },
  {
    id: "faq-5",
    question: "How do I update emergency contact details?",
    answer: "Select your patient tile, click 'Edit Profile', navigate to the Emergency Contact tab, edit the active phone numbers or emails, and click 'Save Changes'. Updates synchronize with the primary medical ledger in real-time.",
    category: "General"
  }
];
