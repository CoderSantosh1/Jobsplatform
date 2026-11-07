import type { Section } from "@/lib/slug";

// Short, practical guides shown under each list page. They give readers (and Google) real content
// even when a section has only a few posts, so the page is not a thin "soft 404".
export type SectionGuide = {
  heading: string;
  steps: string[];
  faqs: { q: string; a: string }[];
};

/** Guide shown under /news. */
export const NEWS_GUIDE: SectionGuide = {
  heading: "How to Use Exam News",
  steps: [
    "Open a news post to read the update: a new notification, a date change, a vacancy change or an exam announcement.",
    "Check the date the news was posted; older updates may have been replaced by a newer notice.",
    "Confirm every date, fee and vacancy on the official website or notification before you act on it.",
    "For an open recruitment, follow the link to the job post on this site to find the eligibility and the official apply link.",
    "Bookmark the official website of the exams you are preparing for and check it regularly.",
  ],
  faqs: [
    { q: "Is the news on this page official?", a: "No. We summarise announcements from official notices and websites. The official notice is always the final source." },
    { q: "An exam date in the news has changed. Which one is right?", a: "The latest official notice. Exam bodies often revise schedules, so check the official website for the current date." },
    { q: "Can I apply for a job from a news post?", a: "No. Applications are made only on the official website of the recruiting body." },
  ],
};

export const SECTION_GUIDES: Record<Exclude<Section, "news">, SectionGuide> = {
  jobs: {
    heading: "How to Apply for a Government Job",
    steps: [
      "Open the job post and read the official notification linked on it.",
      "Check eligibility: educational qualification, age limit on the cut-off date and any physical standards.",
      "Register on the official website with a working mobile number and email address.",
      "Fill in the form, upload your photo and signature in the size asked, and pay the fee if one applies.",
      "Submit before the last date and save a printout of the confirmation page.",
    ],
    faqs: [
      { q: "Is applying through this site possible?", a: "No. We only link to the official website; every application is made there." },
      { q: "What does (Closed) next to a job mean?", a: "The last date to apply has passed. The page stays up so you can follow the admit card, answer key and result." },
      { q: "How do I get age relaxation?", a: "Reserved categories usually get relaxation as per government rules; the notification lists the exact years." },
    ],
  },
  results: {
    heading: "How to Check a Sarkari Result",
    steps: [
      "Open the result post and use the direct link, or go to the official website of the exam body.",
      "Find the result link for your exam and year on the home page or in the results section.",
      "Enter your roll number or registration number and date of birth, if asked.",
      "Download the result or merit list PDF and search it for your roll number.",
      "Note the next stage (document verification, physical test, interview) and its dates.",
    ],
    faqs: [
      { q: "The official site is not opening. What should I do?", a: "Result days bring heavy traffic. Try again after some time or early in the morning." },
      { q: "Where do I find the cut-off marks?", a: "Cut-off marks are usually released with the result or soon after on the official website." },
      { q: "What happens after the result?", a: "Qualified candidates move to the next stage given in the notification; keep checking for the schedule." },
    ],
  },
  "admit-cards": {
    heading: "How to Download an Admit Card",
    steps: [
      "Open the admit card post and use the download link, or visit the official website.",
      "Log in with your registration number and password or date of birth.",
      "Check your name, photo, signature, exam date, reporting time and centre address.",
      "Download and print the admit card on A4 paper.",
      "Carry the printout and a valid original photo ID to the exam centre.",
    ],
    faqs: [
      { q: "I forgot my registration number.", a: "Use the 'Forgot registration number' option on the official login page; it is usually sent to your email or mobile." },
      { q: "There is a mistake on my admit card.", a: "Contact the exam body's helpline or email given in the notification before the exam date." },
      { q: "Is a colour printout required?", a: "Most exams accept a clear black-and-white printout unless the instructions say otherwise." },
    ],
  },
  "answer-keys": {
    heading: "How to Use an Answer Key",
    steps: [
      "Download the official answer key and your response sheet from the exam body's website.",
      "Match each of your answers with the key, question by question.",
      "Calculate your score: add marks for correct answers and subtract negative marking for wrong ones.",
      "If an answer in the key looks wrong, raise an online objection with proof before the last date (a fee may apply).",
      "Wait for the final answer key; the result is prepared from it.",
    ],
    faqs: [
      { q: "What is a provisional answer key?", a: "The first key released for checking. Candidates can challenge it before the final key is published." },
      { q: "Do I get the objection fee back?", a: "Many exam bodies refund it if your objection is accepted; check the notice for the rule." },
      { q: "Can my score change after the final key?", a: "Yes. Questions may be dropped or answers changed, which can raise or lower scores." },
      { q: "Where do I find my response sheet?", a: "Exam bodies that publish answer keys online usually show your recorded answers after you log in with your registration number; the notice explains how." },
      { q: "Is the answer key the same for every shift?", a: "Exams held in several shifts often have a separate key or question set per shift. Use the key for your own shift and set code." },
    ],
  },
  admissions: {
    heading: "How to Apply for University and College Admission",
    steps: [
      "Read the admission notice: courses, seats, eligibility and the selection method (merit or entrance test).",
      "Keep your mark sheets, certificates, category certificate and photo ready in the required format.",
      "Register on the official admission portal and fill in the form carefully.",
      "Pay the application fee and submit before the last date.",
      "Track merit lists, counselling and fee deposit dates after applying.",
    ],
    faqs: [
      { q: "Is admission based on an entrance exam?", a: "It depends on the course and institute; the notice states whether selection is by merit or by a test." },
      { q: "Can I apply to more than one course?", a: "Most portals allow several course choices in one form; check the notice for limits." },
      { q: "What documents are checked at counselling?", a: "Usually mark sheets, ID proof, category and domicile certificates, and photographs." },
      { q: "What if I miss the last date?", a: "Late applications are normally not accepted. Some portals open a short late-fee window or a later round; the official notice says if they do." },
      { q: "How do I know if I got a seat?", a: "Seat allotment or merit lists are published on the official portal. Log in or check the list for your application number, then pay the fee and report by the given date." },
      { q: "Can I change my course or college after allotment?", a: "Many counselling processes allow upgrades or a choice change in later rounds. The rules differ by institute, so read the counselling notice." },
    ],
  },
};
