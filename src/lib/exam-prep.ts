// Exam pattern, syllabus and an original practice set for the exam landing pages (/<slug>).
// Every exam has its own questions written for its own sections; never copy a set between exams.
// Patterns follow the most recent official notifications; the page tells readers to confirm them there.

export type PatternRow = { section: string; questions: number | string; marks: number | string };

export type ExamStage = {
  name: string;
  rows?: PatternRow[];
  duration?: string;
  note?: string;
};

export type PracticeQuestion = {
  section: string;
  q: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
};

export type ExamPrep = {
  /** Marks per correct answer and marks deducted per wrong answer in the practice set (mirrors the real exam). */
  marking: { correct: number; wrong: number };
  markingNote: string;
  stages: ExamStage[];
  syllabus: { section: string; topics: string[] }[];
  practice: PracticeQuestion[];
};

export const EXAM_PREP: Record<string, ExamPrep> = {
  "ssc-gd": {
    marking: { correct: 2, wrong: 0.25 },
    markingNote: "2 marks for each correct answer, 0.25 marks deducted for each wrong answer.",
    stages: [
      {
        name: "Computer Based Examination (CBE)",
        duration: "60 minutes",
        rows: [
          { section: "General Intelligence & Reasoning", questions: 20, marks: 40 },
          { section: "General Knowledge & General Awareness", questions: 20, marks: 40 },
          { section: "Elementary Mathematics", questions: 20, marks: 40 },
          { section: "English / Hindi", questions: 20, marks: 40 },
        ],
      },
      { name: "Physical Efficiency Test (PET) & Physical Standard Test (PST)", note: "Qualifying race and height/chest measurement." },
      { name: "Detailed Medical Examination & Document Verification" },
    ],
    syllabus: [
      { section: "General Intelligence & Reasoning", topics: ["Analogies", "Similarities and differences", "Coding-decoding", "Number and letter series", "Odd one out", "Directions and distance", "Blood relations", "Non-verbal reasoning"] },
      { section: "General Knowledge & General Awareness", topics: ["Indian history and culture", "Geography of India", "Indian Constitution and polity", "Economy basics", "Sports, awards and books", "Current events", "Armed and police forces of India"] },
      { section: "Elementary Mathematics", topics: ["Number system", "Percentage", "Ratio and proportion", "Average", "Profit and loss", "Discount", "Simple interest", "Time and work", "Time, speed and distance", "Mensuration basics"] },
      { section: "English / Hindi", topics: ["Spelling and vocabulary", "Synonyms and antonyms", "Fill in the blanks", "Error spotting", "Idioms and phrases", "Reading comprehension"] },
    ],
    practice: [
      { section: "Reasoning", q: "Find the missing number: 3, 7, 15, 31, ?", options: ["47", "62", "63", "64"], answer: 2, explanation: "Each term is double the previous term plus 1: 31 × 2 + 1 = 63." },
      { section: "Reasoning", q: "In a certain code, TABLE is written as UBCMF. How is CHAIR written in that code?", options: ["DIBJS", "DGBJS", "BGZHQ", "DIBKS"], answer: 0, explanation: "Every letter moves one step forward: C→D, H→I, A→B, I→J, R→S, giving DIBJS." },
      { section: "Reasoning", q: "Which one is the odd one out?", options: ["Rifle", "Pistol", "Sword", "Carbine"], answer: 2, explanation: "Rifle, pistol and carbine are firearms; a sword is a bladed weapon." },
      { section: "General Awareness", q: "Which is the largest Central Armed Police Force (CAPF) of India by strength?", options: ["BSF", "CRPF", "CISF", "ITBP"], answer: 1, explanation: "The Central Reserve Police Force (CRPF) has the largest strength among the CAPFs." },
      { section: "General Awareness", q: "The Border Security Force (BSF) guards India's borders with which countries?", options: ["China and Nepal", "Pakistan and Bangladesh", "Myanmar only", "Bhutan and Nepal"], answer: 1, explanation: "BSF guards the India–Pakistan and India–Bangladesh borders. ITBP guards the China border, SSB the Nepal and Bhutan borders, and Assam Rifles the Myanmar border." },
      { section: "General Awareness", q: "Article 51A of the Indian Constitution deals with:", options: ["Fundamental Rights", "Directive Principles", "Fundamental Duties", "Emergency provisions"], answer: 2, explanation: "Article 51A in Part IVA lists the Fundamental Duties of citizens." },
      { section: "Elementary Mathematics", q: "A shopkeeper buys an article for ₹400 and sells it for ₹460. What is the profit percentage?", options: ["12%", "15%", "16%", "60%"], answer: 1, explanation: "Profit = 460 − 400 = ₹60. Profit % = 60 ÷ 400 × 100 = 15%." },
      { section: "Elementary Mathematics", q: "If 20% of a number is 45, what is the number?", options: ["180", "200", "225", "250"], answer: 2, explanation: "20% of x = 45, so x = 45 × 100 ÷ 20 = 225." },
      { section: "English", q: "Choose the correctly spelt word.", options: ["Neccessary", "Necessary", "Necesary", "Neccesary"], answer: 1, explanation: "The correct spelling is 'Necessary': one 'c' and double 's'." },
      { section: "Hindi", q: "'सूर्य' का पर्यायवाची शब्द कौन-सा है?", options: ["दिनकर", "शशि", "जलज", "अनल"], answer: 0, explanation: "दिनकर का अर्थ सूर्य है। शशि = चंद्रमा, जलज = कमल, अनल = आग।" },
    ],
  },

  "ssc-cgl": {
    marking: { correct: 2, wrong: 0.5 },
    markingNote: "Tier 1: 2 marks for each correct answer, 0.5 marks deducted for each wrong answer.",
    stages: [
      {
        name: "Tier 1 (Computer Based, qualifying)",
        duration: "60 minutes",
        rows: [
          { section: "General Intelligence & Reasoning", questions: 25, marks: 50 },
          { section: "General Awareness", questions: 25, marks: 50 },
          { section: "Quantitative Aptitude", questions: 25, marks: 50 },
          { section: "English Comprehension", questions: 25, marks: 50 },
        ],
      },
      {
        name: "Tier 2 (Computer Based, merit)",
        note: "Paper I for all posts: Mathematical Abilities, Reasoning & General Intelligence, English Language & Comprehension, General Awareness, Computer Knowledge Module and Data Entry Speed Test. Paper II (Statistics) for JSO and Paper III (General Studies – Finance & Economics) for AAO.",
      },
      { name: "Document Verification / Skill Test (where applicable)" },
    ],
    syllabus: [
      { section: "General Intelligence & Reasoning", topics: ["Analogy", "Classification", "Series", "Coding-decoding", "Blood relations", "Syllogism", "Seating arrangement", "Venn diagrams", "Embedded and mirror images"] },
      { section: "General Awareness", topics: ["History", "Geography", "Polity", "Economy", "General science", "Static GK", "Current affairs"] },
      { section: "Quantitative Aptitude", topics: ["Percentage, ratio, average", "Profit, loss and discount", "Simple and compound interest", "Time and work, speed and distance", "Algebra", "Geometry", "Trigonometry", "Mensuration", "Data interpretation"] },
      { section: "English Comprehension", topics: ["Reading comprehension", "Cloze test", "Error spotting", "Sentence improvement", "Synonyms and antonyms", "Idioms", "One-word substitution", "Active-passive and narration"] },
    ],
    practice: [
      { section: "Reasoning", q: "Doctor : Hospital :: Teacher : ?", options: ["Book", "School", "Student", "Classroom board"], answer: 1, explanation: "A doctor works in a hospital; a teacher works in a school." },
      { section: "Reasoning", q: "A is the brother of B. B is the daughter of C. C is the wife of D. How is A related to D?", options: ["Son", "Brother", "Nephew", "Father"], answer: 0, explanation: "B is the daughter of C and D (C is D's wife). A is B's brother, so A is the son of D." },
      { section: "Reasoning", q: "Find the next term: AZ, BY, CX, ?", options: ["DV", "DW", "EW", "DX"], answer: 1, explanation: "The first letter moves forward (A, B, C, D) and the second moves backward (Z, Y, X, W): DW." },
      { section: "General Awareness", q: "Who is known as the 'Father of the Indian Constitution'?", options: ["Jawaharlal Nehru", "Rajendra Prasad", "B. R. Ambedkar", "Sardar Patel"], answer: 2, explanation: "Dr. B. R. Ambedkar chaired the Drafting Committee of the Constituent Assembly." },
      { section: "General Awareness", q: "In which year was the Reserve Bank of India established?", options: ["1935", "1947", "1949", "1950"], answer: 0, explanation: "RBI was set up on 1 April 1935 under the RBI Act, 1934, and nationalised in 1949." },
      { section: "General Awareness", q: "Which Article of the Constitution abolishes untouchability?", options: ["Article 14", "Article 15", "Article 17", "Article 21"], answer: 2, explanation: "Article 17 abolishes untouchability and forbids its practice in any form." },
      { section: "Quantitative Aptitude", q: "A train 240 m long passes a pole in 12 seconds. What is its speed in km/h?", options: ["60", "66", "72", "80"], answer: 2, explanation: "Speed = 240 ÷ 12 = 20 m/s = 20 × 18/5 = 72 km/h." },
      { section: "Quantitative Aptitude", q: "What is the simple interest on ₹5,000 at 8% per annum for 3 years?", options: ["₹1,000", "₹1,200", "₹1,250", "₹1,400"], answer: 1, explanation: "SI = P × R × T ÷ 100 = 5000 × 8 × 3 ÷ 100 = ₹1,200." },
      { section: "Quantitative Aptitude", q: "If x + 1/x = 4, find the value of x² + 1/x².", options: ["12", "14", "16", "18"], answer: 1, explanation: "Square both sides: x² + 2 + 1/x² = 16, so x² + 1/x² = 14." },
      { section: "English Comprehension", q: "Choose the antonym of 'Abundant'.", options: ["Plentiful", "Scarce", "Ample", "Huge"], answer: 1, explanation: "'Abundant' means available in large quantity; its opposite is 'Scarce'." },
    ],
  },

  "bihar-police-constable": {
    marking: { correct: 1, wrong: 0 },
    markingNote: "1 mark for each correct answer. Check the current CSBC notification for negative marking.",
    stages: [
      {
        name: "Written Examination (OMR, qualifying)",
        duration: "2 hours",
        rows: [
          { section: "Hindi, English, Mathematics, Science, Social Science and General Knowledge / Current Affairs (Class 12 level)", questions: 100, marks: 100 },
        ],
        note: "Candidates must score the minimum qualifying marks (30% as per recent notifications) to be called for the PET.",
      },
      { name: "Physical Efficiency Test (PET)", note: "Running, high jump and shot put; the final merit list is based on PET marks." },
      { name: "Document Verification & Medical" },
    ],
    syllabus: [
      { section: "Hindi", topics: ["पर्यायवाची और विलोम शब्द", "संधि और समास", "मुहावरे और लोकोक्तियाँ", "वाक्य शुद्धि", "अपठित गद्यांश"] },
      { section: "English", topics: ["Grammar basics", "Prepositions and tenses", "Vocabulary", "Sentence correction", "Comprehension"] },
      { section: "Mathematics", topics: ["Number system", "HCF and LCM", "Percentage", "Ratio", "Time and work", "Profit and loss", "Simple and compound interest", "Mensuration"] },
      { section: "Science", topics: ["Physics: motion, force, electricity", "Chemistry: acids, bases, common compounds", "Biology: human body, nutrition, diseases"] },
      { section: "Social Science", topics: ["History of India and Bihar", "Geography of India and Bihar", "Indian polity", "Economy basics"] },
      { section: "General Knowledge / Current Affairs", topics: ["Bihar GK", "National and international events", "Sports and awards", "Important days"] },
    ],
    practice: [
      { section: "Hindi", q: "'अग्नि' का पर्यायवाची शब्द कौन-सा है?", options: ["अनल", "अनिल", "नीर", "समीर"], answer: 0, explanation: "अनल का अर्थ आग है। अनिल और समीर = हवा, नीर = पानी।" },
      { section: "English", q: "Fill in the blank: She has been living here ___ 2015.", options: ["for", "since", "from", "by"], answer: 1, explanation: "'Since' is used with a point in time (2015); 'for' is used with a period of time." },
      { section: "Mathematics", q: "What is the LCM of 12 and 18?", options: ["6", "24", "36", "72"], answer: 2, explanation: "12 = 2² × 3 and 18 = 2 × 3². LCM = 2² × 3² = 36." },
      { section: "Mathematics", q: "A can finish a work in 10 days and B in 15 days. In how many days can they finish it together?", options: ["5", "6", "8", "12.5"], answer: 1, explanation: "Work per day = 1/10 + 1/15 = 5/30 = 1/6, so together they take 6 days." },
      { section: "General Knowledge", q: "Bihar Diwas is celebrated every year on:", options: ["26 January", "22 March", "15 August", "1 November"], answer: 1, explanation: "Bihar was carved out of the Bengal Presidency on 22 March 1912, celebrated as Bihar Diwas." },
      { section: "Social Science", q: "Which river is called the 'Sorrow of Bihar'?", options: ["Ganga", "Son", "Kosi", "Gandak"], answer: 2, explanation: "The Kosi often changes its course and causes floods, so it is called the Sorrow of Bihar." },
      { section: "Social Science", q: "Nalanda Mahavihara was founded during the rule of which dynasty?", options: ["Maurya", "Gupta", "Pala", "Mughal"], answer: 1, explanation: "Nalanda was founded in the 5th century CE under the Gupta ruler Kumaragupta I; the Palas later patronised it." },
      { section: "Science", q: "What is the chemical formula of common salt?", options: ["NaCl", "KCl", "NaOH", "CaCO₃"], answer: 0, explanation: "Common salt is sodium chloride, NaCl." },
      { section: "Science", q: "Deficiency of which vitamin causes scurvy?", options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], answer: 2, explanation: "Scurvy is caused by a lack of Vitamin C (ascorbic acid)." },
      { section: "Social Science", q: "The Governor of a state in India is appointed by:", options: ["The Chief Minister", "The President of India", "The Prime Minister", "The Chief Justice of India"], answer: 1, explanation: "Under Article 155, the Governor is appointed by the President." },
    ],
  },

  "bihar-stet": {
    marking: { correct: 1, wrong: 0 },
    markingNote: "1 mark for each correct answer and no negative marking (as per recent BSEB notifications).",
    stages: [
      {
        name: "Computer Based Test – Paper 1 (Secondary, Classes 9–10) or Paper 2 (Senior Secondary, Classes 11–12)",
        duration: "2 hours 30 minutes",
        rows: [
          { section: "Subject concerned (the subject you want to teach)", questions: 100, marks: 100 },
          { section: "Teaching Aptitude / B.Ed. (pedagogy)", questions: 50, marks: 50 },
        ],
        note: "Qualifying marks as per recent notifications: General 50%, BC 45.5%, EBC 42.5%, SC/ST/Divyang/Women 40%.",
      },
    ],
    syllabus: [
      { section: "Subject concerned", topics: ["Content of the chosen subject at secondary / senior secondary level (as per the official subject-wise syllabus)"] },
      { section: "Teaching Aptitude / Pedagogy", topics: ["Child development and learning theories (Piaget, Vygotsky, Bruner, Gardner)", "Teaching methods and teaching aids", "Assessment and evaluation (formative, summative, CCE)", "Inclusive education", "Classroom management", "NCF 2005, RTE Act 2009 and NEP 2020", "Educational psychology and motivation"] },
    ],
    practice: [
      { section: "Teaching Aptitude", q: "Who proposed the theory of Multiple Intelligences?", options: ["Jean Piaget", "Howard Gardner", "B. F. Skinner", "Lev Vygotsky"], answer: 1, explanation: "Howard Gardner proposed the theory of Multiple Intelligences in 1983." },
      { section: "Teaching Aptitude", q: "According to Piaget, the formal operational stage begins at about which age?", options: ["Birth to 2 years", "2 to 7 years", "7 to 11 years", "11 years and above"], answer: 3, explanation: "Piaget's formal operational stage, with abstract reasoning, starts at around 11–12 years." },
      { section: "Teaching Aptitude", q: "The concept of the 'Zone of Proximal Development' is associated with:", options: ["Lev Vygotsky", "Jean Piaget", "Ivan Pavlov", "Erik Erikson"], answer: 0, explanation: "Vygotsky described the ZPD as the gap between what a learner can do alone and with guidance." },
      { section: "Teaching Aptitude", q: "Formative assessment is mainly used to:", options: ["Grade students at the end of the year", "Monitor learning during teaching and give feedback", "Select students for admission", "Award certificates"], answer: 1, explanation: "Formative assessment happens during instruction to find learning gaps and guide teaching." },
      { section: "Teaching Aptitude", q: "Which of these is an audio-visual teaching aid?", options: ["Blackboard", "Radio broadcast", "Educational video", "Wall chart"], answer: 2, explanation: "A video uses both sound and pictures. Radio is audio only; blackboard and charts are visual only." },
      { section: "Teaching Aptitude", q: "The RTE Act, 2009 provides free and compulsory education to children of which age group?", options: ["3–6 years", "6–14 years", "6–18 years", "14–18 years"], answer: 1, explanation: "The Right of Children to Free and Compulsory Education Act covers children aged 6 to 14 years." },
      { section: "Teaching Aptitude", q: "In Bloom's taxonomy (cognitive domain), which is the lowest level?", options: ["Evaluating", "Applying", "Understanding", "Remembering (Knowledge)"], answer: 3, explanation: "The levels rise from Remembering to Understanding, Applying, Analysing, Evaluating and Creating." },
      { section: "Teaching Aptitude", q: "A student learns best through hands-on activities and movement. This learning style is:", options: ["Visual", "Auditory", "Kinesthetic", "Reading/writing"], answer: 2, explanation: "Kinesthetic learners understand best by doing, touching and moving." },
      { section: "Teaching Aptitude", q: "The National Curriculum Framework (NCF) 2005 recommends that school learning should be:", options: ["Based mainly on rote memorisation", "Connected to life outside school", "Limited to textbooks", "Examination-centred"], answer: 1, explanation: "One of NCF 2005's guiding principles is connecting knowledge to life outside the school." },
      { section: "Teaching Aptitude", q: "Inclusive education means:", options: ["Separate schools for children with disabilities", "Educating children with and without disabilities together in regular classrooms", "Education only for gifted children", "Home schooling for all"], answer: 1, explanation: "Inclusive education places all children, including those with disabilities, in the same regular classrooms with support." },
    ],
  },

  "rrb-ntpc": {
    marking: { correct: 1, wrong: 1 / 3 },
    markingNote: "1 mark for each correct answer, 1/3 mark deducted for each wrong answer.",
    stages: [
      {
        name: "CBT 1 (screening)",
        duration: "90 minutes",
        rows: [
          { section: "General Awareness", questions: 40, marks: 40 },
          { section: "Mathematics", questions: 30, marks: 30 },
          { section: "General Intelligence & Reasoning", questions: 30, marks: 30 },
        ],
      },
      {
        name: "CBT 2 (merit)",
        duration: "90 minutes",
        rows: [
          { section: "General Awareness", questions: 50, marks: 50 },
          { section: "Mathematics", questions: 35, marks: 35 },
          { section: "General Intelligence & Reasoning", questions: 35, marks: 35 },
        ],
      },
      { name: "Typing Skill Test / Computer Based Aptitude Test (post-wise)", note: "Followed by document verification and medical examination." },
    ],
    syllabus: [
      { section: "General Awareness", topics: ["Current events", "Indian Railways and transport", "History and freedom struggle", "Geography", "Polity and governance", "Economy", "General science", "Famous personalities", "Computers basics"] },
      { section: "Mathematics", topics: ["Number system", "Decimals and fractions", "LCM and HCF", "Ratio and proportion", "Percentage", "Mensuration", "Time and work", "Speed and distance", "Interest", "Profit and loss", "Algebra", "Geometry and trigonometry", "Statistics"] },
      { section: "General Intelligence & Reasoning", topics: ["Analogies", "Series completion", "Coding-decoding", "Mathematical operations", "Relationships", "Syllogism", "Jumbling", "Venn diagrams", "Puzzles", "Directions", "Statement–conclusion"] },
    ],
    practice: [
      { section: "General Awareness", q: "India's first passenger train ran on 16 April 1853 between:", options: ["Howrah and Hooghly", "Bori Bunder (Bombay) and Thane", "Madras and Arcot", "Delhi and Agra"], answer: 1, explanation: "The first passenger train ran 34 km from Bori Bunder in Bombay to Thane." },
      { section: "General Awareness", q: "The headquarters of the North Central Railway zone is at:", options: ["Jabalpur", "Gorakhpur", "Prayagraj", "Hajipur"], answer: 2, explanation: "North Central Railway is headquartered at Prayagraj. Jabalpur is WCR, Gorakhpur NER and Hajipur ECR." },
      { section: "General Awareness", q: "Who was the first woman President of India?", options: ["Indira Gandhi", "Pratibha Patil", "Sarojini Naidu", "Droupadi Murmu"], answer: 1, explanation: "Pratibha Patil served as the 12th President (2007–2012), the first woman in the office." },
      { section: "General Awareness", q: "What is the SI unit of electric current?", options: ["Volt", "Ohm", "Ampere", "Watt"], answer: 2, explanation: "Electric current is measured in amperes (A)." },
      { section: "Mathematics", q: "Two numbers are in the ratio 3 : 5 and their sum is 64. What is the larger number?", options: ["24", "32", "40", "48"], answer: 2, explanation: "Total parts = 8, so one part = 64 ÷ 8 = 8. Larger number = 5 × 8 = 40." },
      { section: "Mathematics", q: "Successive discounts of 10% and 20% are equal to a single discount of:", options: ["28%", "30%", "25%", "32%"], answer: 0, explanation: "Price after both = 0.90 × 0.80 = 0.72 of the original, so the single discount is 28%." },
      { section: "Mathematics", q: "√1764 = ?", options: ["38", "42", "44", "46"], answer: 1, explanation: "42 × 42 = 1764." },
      { section: "Reasoning", q: "Statements: All pens are books. All books are tables. Conclusions: I. All pens are tables. II. Some tables are pens.", options: ["Only I follows", "Only II follows", "Both I and II follow", "Neither follows"], answer: 2, explanation: "Pens ⊂ books ⊂ tables, so all pens are tables (I), and therefore some tables are pens (II)." },
      { section: "Reasoning", q: "Find the odd one out: 121, 144, 169, 191", options: ["121", "144", "169", "191"], answer: 3, explanation: "121, 144 and 169 are perfect squares (11², 12², 13²); 191 is not." },
      { section: "Reasoning", q: "Ravi walks 5 km north, turns right and walks 3 km, then turns right again and walks 5 km. Where is he from the starting point?", options: ["3 km West", "3 km East", "5 km North", "8 km East"], answer: 1, explanation: "North 5 km, right (east) 3 km, right (south) 5 km brings him back level with the start, 3 km to the east." },
    ],
  },

  "rrb-group-d": {
    marking: { correct: 1, wrong: 1 / 3 },
    markingNote: "1 mark for each correct answer, 1/3 mark deducted for each wrong answer.",
    stages: [
      {
        name: "Computer Based Test (CBT)",
        duration: "90 minutes",
        rows: [
          { section: "General Science", questions: 25, marks: 25 },
          { section: "Mathematics", questions: 25, marks: 25 },
          { section: "General Intelligence & Reasoning", questions: 30, marks: 30 },
          { section: "General Awareness & Current Affairs", questions: 20, marks: 20 },
        ],
      },
      { name: "Physical Efficiency Test (PET)", note: "Weight lifting and running; qualifying." },
      { name: "Document Verification & Medical Examination" },
    ],
    syllabus: [
      { section: "General Science", topics: ["Physics: motion, work and energy, electricity, light, sound", "Chemistry: atoms, acids and bases, metals and non-metals, carbon compounds", "Life science: cells, human body, nutrition, diseases (Class 10 level)"] },
      { section: "Mathematics", topics: ["Number system", "BODMAS", "Decimals and fractions", "LCM and HCF", "Ratio and proportion", "Percentage", "Mensuration", "Time and work", "Speed and distance", "Simple and compound interest", "Profit and loss", "Algebra", "Geometry", "Elementary statistics"] },
      { section: "General Intelligence & Reasoning", topics: ["Analogies", "Alphabetical and number series", "Coding-decoding", "Mathematical operations", "Relationships", "Syllogism", "Venn diagrams", "Data interpretation", "Directions", "Decision making"] },
      { section: "General Awareness & Current Affairs", topics: ["Science and technology", "Sports", "Culture", "Personalities", "Economics", "Politics", "Current events"] },
    ],
    practice: [
      { section: "General Science", q: "Which gas is the most abundant in the Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Argon"], answer: 1, explanation: "Nitrogen makes up about 78% of the atmosphere; oxygen is about 21%." },
      { section: "General Science", q: "Newton's first law of motion is also known as the law of:", options: ["Acceleration", "Inertia", "Gravitation", "Action and reaction"], answer: 1, explanation: "The first law says a body stays at rest or in uniform motion unless a force acts on it: the law of inertia." },
      { section: "General Science", q: "Which organ of the human body produces insulin?", options: ["Liver", "Kidney", "Pancreas", "Stomach"], answer: 2, explanation: "Insulin is made by the beta cells of the islets of Langerhans in the pancreas." },
      { section: "General Science", q: "What is the pH of pure water at 25°C?", options: ["0", "5", "7", "14"], answer: 2, explanation: "Pure water is neutral, with a pH of 7 at 25°C." },
      { section: "Mathematics", q: "A number increased by 25% becomes 150. What is the number?", options: ["112.5", "120", "125", "130"], answer: 1, explanation: "1.25 × x = 150, so x = 150 ÷ 1.25 = 120." },
      { section: "Mathematics", q: "What is the area of a circle of radius 7 cm? (Take π = 22/7)", options: ["44 cm²", "144 cm²", "154 cm²", "308 cm²"], answer: 2, explanation: "Area = πr² = 22/7 × 7 × 7 = 154 cm²." },
      { section: "Mathematics", q: "What is the HCF of 36 and 48?", options: ["6", "8", "12", "144"], answer: 2, explanation: "36 = 2² × 3² and 48 = 2⁴ × 3. HCF = 2² × 3 = 12." },
      { section: "Reasoning", q: "Complete the series: 2, 6, 12, 20, 30, ?", options: ["36", "40", "42", "48"], answer: 2, explanation: "The terms are 1×2, 2×3, 3×4, 4×5, 5×6, so the next is 6×7 = 42." },
      { section: "Reasoning", q: "If CAT = 24 and DOG = 26 (adding the positions of the letters in the alphabet), then BAT = ?", options: ["22", "23", "24", "25"], answer: 1, explanation: "B = 2, A = 1, T = 20, so BAT = 2 + 1 + 20 = 23." },
      { section: "General Awareness", q: "Who is popularly called the 'Missile Man of India'?", options: ["Homi J. Bhabha", "Vikram Sarabhai", "A. P. J. Abdul Kalam", "C. V. Raman"], answer: 2, explanation: "Dr. A. P. J. Abdul Kalam led India's missile development programme." },
    ],
  },
};

export function getExamPrep(slug: string): ExamPrep | undefined {
  return EXAM_PREP[slug];
}

export type PracticeScore = { correct: number; wrong: number; skipped: number; score: number; maxScore: number };

/** Scores a practice attempt with the exam's own marking scheme. `answers[i]` is the chosen option index or null. */
export function scorePractice(prep: Pick<ExamPrep, "marking" | "practice">, answers: (number | null)[]): PracticeScore {
  let correct = 0;
  let wrong = 0;
  prep.practice.forEach((q, i) => {
    const a = answers[i];
    if (a === null || a === undefined) return;
    if (a === q.answer) correct += 1;
    else wrong += 1;
  });
  const skipped = prep.practice.length - correct - wrong;
  const score = Math.round((correct * prep.marking.correct - wrong * prep.marking.wrong) * 100) / 100;
  return { correct, wrong, skipped, score, maxScore: prep.practice.length * prep.marking.correct };
}
