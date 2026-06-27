'use strict';

const { z } = require('zod');

const registerPatient = z.object({
  full_name: z.string().trim().min(1, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerDelegate = registerPatient;

const registerClinician = z.object({
  full_name: z.string().trim().min(1, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email address'),
  job_title: z.string().trim().optional(),
  organisation: z.string().trim().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const login = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

const carePlan = z.object({
  usual_analgesia: z.string().trim().optional(),
  opioid_tolerance: z.string().trim().optional(),
  first_line_drug: z.string().trim().optional(),
  first_line_dose: z.string().trim().optional(),
  first_line_route: z.string().trim().optional(),
  breakthrough_drug: z.string().trim().optional(),
  breakthrough_dose: z.string().trim().optional(),
  max_24h_dose: z.string().trim().optional(),
  drugs_to_avoid: z.string().trim().optional(),
  allergies: z.string().trim().optional(),
  adverse_reactions: z.string().trim().optional(),
  baseline_bp: z.string().trim().optional(),
  baseline_hr: z.string().trim().optional(),
  baseline_spo2: z.string().trim().optional(),
  baseline_temp: z.string().trim().optional(),
  baseline_resp_rate: z.string().trim().optional(),
  baseline_hb: z.string().trim().optional(),
  escalation_plan: z.string().trim().optional(),
  named_consultant: z.string().trim().optional(),
  named_consultant_contact: z.string().trim().optional(),
  preferred_hospital: z.string().trim().optional(),
  additional_notes: z.string().trim().optional(),
});

const feedback = z.object({
  episode_date: z.string().trim().optional(),
  fft_rating: z
    .enum(['very_good', 'good', 'neither', 'poor', 'very_poor', 'dont_know', ''])
    .optional(),
  free_text: z.string().trim().optional(),
});

/** Flattens a ZodError into { field: message } for the error-summary component. */
function fieldErrors(zodError) {
  const out = {};
  for (const issue of zodError.issues) {
    const key = issue.path[0] || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

module.exports = {
  registerPatient,
  registerDelegate,
  registerClinician,
  login,
  carePlan,
  feedback,
  fieldErrors,
};
