// Popular exams that get their own landing page at /<slug>. Add an entry to create a new page.
// `search` is matched against post and quiz titles (every word must appear).

export type Exam = {
  slug: string;
  name: string;
  search: string;
  body: string;
  about: string;
};

export const EXAMS: Exam[] = [
  {
    slug: "ssc-cgl",
    name: "SSC CGL",
    search: "SSC CGL",
    body: "Staff Selection Commission (SSC)",
    about:
      "The SSC Combined Graduate Level (CGL) exam recruits graduates for Group B and Group C posts in central government ministries, departments and offices, such as Assistant Section Officer, Inspector (Income Tax, GST, Excise) and Auditor.",
  },
  {
    slug: "ssc-chsl",
    name: "SSC CHSL",
    search: "SSC CHSL",
    body: "Staff Selection Commission (SSC)",
    about:
      "The SSC Combined Higher Secondary Level (CHSL) exam is for 12th-pass candidates and fills posts such as Lower Division Clerk, Junior Secretariat Assistant and Data Entry Operator in central government offices.",
  },
  {
    slug: "ssc-gd",
    name: "SSC GD Constable",
    search: "SSC GD",
    body: "Staff Selection Commission (SSC)",
    about:
      "The SSC GD Constable exam is for 10th-pass candidates and recruits Constables (General Duty) for central armed police forces such as BSF, CISF, CRPF, ITBP and SSB, and Rifleman in Assam Rifles.",
  },
  {
    slug: "ssc-mts",
    name: "SSC MTS",
    search: "SSC MTS",
    body: "Staff Selection Commission (SSC)",
    about:
      "The SSC Multi-Tasking (Non-Technical) Staff and Havaldar exam is for 10th-pass candidates and fills Group C posts in central government departments and CBIC/CBN.",
  },
  {
    slug: "ssc-cpo",
    name: "SSC CPO",
    search: "SSC CPO",
    body: "Staff Selection Commission (SSC)",
    about:
      "The SSC CPO exam recruits graduates as Sub-Inspectors in Delhi Police and the central armed police forces.",
  },
  {
    slug: "upsc-cse",
    name: "UPSC Civil Services",
    search: "UPSC Civil",
    body: "Union Public Service Commission (UPSC)",
    about:
      "The UPSC Civil Services Examination selects candidates for the IAS, IPS, IFS and other central services through three stages: Preliminary exam, Main exam and Personality Test (interview).",
  },
  {
    slug: "ibps-po",
    name: "IBPS PO",
    search: "IBPS PO",
    body: "Institute of Banking Personnel Selection (IBPS)",
    about:
      "The IBPS PO exam recruits Probationary Officers / Management Trainees for participating public sector banks through a preliminary exam, main exam and interview.",
  },
  {
    slug: "ibps-clerk",
    name: "IBPS Clerk",
    search: "IBPS Clerk",
    body: "Institute of Banking Personnel Selection (IBPS)",
    about:
      "The IBPS Clerk exam recruits Customer Service Associates (clerks) for participating public sector banks through a preliminary and a main exam.",
  },
  {
    slug: "sbi-po",
    name: "SBI PO",
    search: "SBI PO",
    body: "State Bank of India (SBI)",
    about:
      "The SBI PO exam recruits Probationary Officers for the State Bank of India through preliminary, main and interview stages.",
  },
  {
    slug: "rrb-ntpc",
    name: "RRB NTPC",
    search: "RRB NTPC",
    body: "Railway Recruitment Boards (RRB)",
    about:
      "The RRB NTPC exam recruits candidates for Non-Technical Popular Category posts in Indian Railways, such as Clerk, Station Master, Goods Guard and Commercial Apprentice, for both graduate and 12th-pass levels.",
  },
  {
    slug: "rrb-group-d",
    name: "RRB Group D",
    search: "Group D",
    body: "Railway Recruitment Boards / Cells (RRB/RRC)",
    about:
      "The Railway Group D (Level 1) exam recruits 10th-pass or ITI candidates for posts such as Track Maintainer and Assistant in various Indian Railways departments.",
  },
  {
    slug: "rrb-alp",
    name: "RRB ALP",
    search: "RRB ALP",
    body: "Railway Recruitment Boards (RRB)",
    about:
      "The RRB ALP exam recruits Assistant Loco Pilots for Indian Railways through computer-based tests, an aptitude test and document verification.",
  },
  {
    slug: "ctet",
    name: "CTET",
    search: "CTET",
    body: "Central Board of Secondary Education (CBSE)",
    about:
      "CTET (Central Teacher Eligibility Test) is conducted by CBSE to certify candidates as eligible to teach Classes I–V (Paper 1) and Classes VI–VIII (Paper 2).",
  },
  {
    slug: "up-police-constable",
    name: "UP Police Constable",
    search: "UP Police",
    body: "Uttar Pradesh Police Recruitment and Promotion Board (UPPRPB)",
    about:
      "UP Police Constable recruitment is conducted by UPPRPB for constable posts in Uttar Pradesh Police through a written exam, document verification and physical tests.",
  },
  {
    slug: "bihar-police-constable",
    name: "Bihar Police Constable",
    search: "Bihar Police",
    body: "Central Selection Board of Constable (CSBC), Bihar",
    about:
      "Bihar Police Constable recruitment is conducted by CSBC Bihar through a written exam followed by a physical efficiency test.",
  },
];

export function getExam(slug: string) {
  return EXAMS.find((e) => e.slug === slug);
}
