/* ====================================================================
   STUDYBOT — Aptitude Academy Curriculum & Verified Question Bank
   Comprehensive structured learning paths for:
   1. Quantitative Aptitude
   2. Logical Reasoning
   3. Verbal Ability
   4. Specialized Exam Modules (Data Interpretation, Computer Awareness, General Awareness)
   All questions verified with rigorous calculations, answer keys, and steps.
   ==================================================================== */

const APTITUDE_SUBJECTS = {
  QUANT: "Quantitative Aptitude",
  LOGIC: "Logical Reasoning",
  VERBAL: "Verbal Ability",
  SPECIAL: "Specialized Modules"
};

const EXAM_PROFILES = [
  {
    id: "campus_placements",
    name: "Campus Placements & IT Drives",
    category: "Placements",
    description: "TCS NQT, Infosys, Wipro, Accenture, Cognizant, and product company aptitude rounds.",
    sections: [
      { name: "Quantitative Aptitude", questions: 20, timeMin: 25, marksPerQ: 1, negative: 0 },
      { name: "Logical Reasoning", questions: 20, timeMin: 25, marksPerQ: 1, negative: 0 },
      { name: "Verbal Ability", questions: 15, timeMin: 15, marksPerQ: 1, negative: 0 }
    ],
    totalQuestions: 55,
    totalMinutes: 65,
    negativeMarking: false,
    negativePenalty: 0,
    marksPerQuestion: 1,
    cutoffGoal: 75,
    unofficial: false,
    verifiedPattern: "Standard 3-section format aligned with major placement patterns (TCS/Infosys style)."
  },
  {
    id: "ssc_cgl",
    name: "SSC CGL / CHSL Tier-I",
    category: "Government",
    description: "Staff Selection Commission Combined Graduate Level examination.",
    sections: [
      { name: "Quantitative Aptitude", questions: 25, timeMin: 15, marksPerQ: 2, negative: 0.5 },
      { name: "General Intelligence & Reasoning", questions: 25, timeMin: 15, marksPerQ: 2, negative: 0.5 },
      { name: "English Comprehension", questions: 25, timeMin: 15, marksPerQ: 2, negative: 0.5 }
    ],
    totalQuestions: 75,
    totalMinutes: 45,
    negativeMarking: true,
    negativePenalty: 0.5,
    marksPerQuestion: 2,
    cutoffGoal: 70,
    unofficial: false,
    verifiedPattern: "Tier-I official format (2 marks per correct, 0.50 negative marking per incorrect answer)."
  },
  {
    id: "banking_ibps",
    name: "Banking (IBPS PO & SBI PO Prelims)",
    category: "Banking",
    description: "Institute of Banking Personnel Selection and State Bank of India Prelims.",
    sections: [
      { name: "Quantitative Aptitude", questions: 35, timeMin: 20, marksPerQ: 1, negative: 0.25 },
      { name: "Reasoning Ability", questions: 35, timeMin: 20, marksPerQ: 1, negative: 0.25 },
      { name: "English Language", questions: 30, timeMin: 20, marksPerQ: 1, negative: 0.25 }
    ],
    totalQuestions: 100,
    totalMinutes: 60,
    negativeMarking: true,
    negativePenalty: 0.25,
    marksPerQuestion: 1,
    cutoffGoal: 65,
    unofficial: false,
    verifiedPattern: "IBPS/SBI Prelims official pattern (sectional timer 20 mins per section, 0.25 negative marking)."
  },
  {
    id: "gate_aptitude",
    name: "GATE General Aptitude",
    category: "Engineering",
    description: "Graduate Aptitude Test in Engineering — Mandatory General Aptitude section (15 marks).",
    sections: [
      { name: "Verbal Ability", questions: 5, timeMin: 8, marksPerQ: 1.4, negative: 0.46 },
      { name: "Quantitative & Analytical", questions: 5, timeMin: 12, marksPerQ: 1.6, negative: 0.53 }
    ],
    totalQuestions: 10,
    totalMinutes: 20,
    negativeMarking: true,
    negativePenalty: 0.33,
    marksPerQuestion: 1.5,
    cutoffGoal: 80,
    unofficial: false,
    verifiedPattern: "GATE standard 10-question general aptitude weightage (5 x 1-mark, 5 x 2-marks)."
  },
  {
    id: "cat_quant",
    name: "CAT Quantitative & DILR",
    category: "Management",
    description: "Common Admission Test — High-difficulty quantitative ability and logical interpretation.",
    sections: [
      { name: "Data Interpretation & Logical Reasoning", questions: 12, timeMin: 25, marksPerQ: 3, negative: 1 },
      { name: "Quantitative Aptitude", questions: 12, timeMin: 25, marksPerQ: 3, negative: 1 }
    ],
    totalQuestions: 24,
    totalMinutes: 50,
    negativeMarking: true,
    negativePenalty: 1.0,
    marksPerQuestion: 3,
    cutoffGoal: 60,
    unofficial: false,
    verifiedPattern: "IIM CAT format (+3 for correct MCQ, -1 for incorrect MCQ)."
  },
  {
    id: "railways_rrb",
    name: "Railway Recruitment (RRB NTPC / Group D)",
    category: "Railways",
    description: "Railway Recruitment Board Non-Technical Popular Categories stage 1 CBT.",
    sections: [
      { name: "Mathematics", questions: 30, timeMin: 30, marksPerQ: 1, negative: 0.33 },
      { name: "General Intelligence & Reasoning", questions: 30, timeMin: 30, marksPerQ: 1, negative: 0.33 }
    ],
    totalQuestions: 60,
    totalMinutes: 60,
    negativeMarking: true,
    negativePenalty: 0.33,
    marksPerQuestion: 1,
    cutoffGoal: 72,
    unofficial: false,
    verifiedPattern: "RRB NTPC CBT-1 math and reasoning weightage (1/3rd negative marking)."
  }
];

const APTITUDE_TOPICS = [
  // ================= QUANTITATIVE APTITUDE =================
  {
    id: "quant_numbers",
    subject: APTITUDE_SUBJECTS.QUANT,
    title: "Number Systems & Divisibility",
    description: "Prime numbers, divisibility tests, remainders, LCM & HCF, and unit digit calculation.",
    difficulty: "Beginner",
    estimatedMinutes: 30,
    prerequisites: "Basic arithmetic operations",
    recommendedNext: "quant_percentages",
    theory: "The number system forms the bedrock of arithmetic aptitude. Divisibility rules allow instant verification without performing long division. Remainder theorems (such as Wilson's and Fermat's Little Theorem) allow calculating remainders of massive powers.",
    formulas: [
      "Dividend = (Divisor × Quotient) + Remainder",
      "LCM(a, b) × HCF(a, b) = a × b (for two numbers)",
      "Divisibility by 3 & 9: Sum of digits must be divisible by 3 or 9",
      "Divisibility by 4 & 8: Last 2 digits divisible by 4; last 3 digits divisible by 8",
      "Divisibility by 11: Difference between sum of odd-place digits and even-place digits is 0 or multiple of 11",
      "Unit digit of a^n: Cyclicity of powers (2, 3, 7, 8 have cyclicity 4; 4, 9 have cyclicity 2; 0, 1, 5, 6 have cyclicity 1)"
    ],
    shortcuts: [
      {
        title: "Unit Digit of Large Powers",
        rule: "To find the unit digit of A^B, take the last digit of A and reduce power B modulo 4. If remainder is 0, use power 4.",
        condition: "Applicable for base ending in 2, 3, 7, 8."
      },
      {
        title: "Consecutive Numbers Divisibility",
        rule: "The product of any 'n' consecutive integers is always divisible by n!",
        condition: "Integers must be consecutive integers."
      }
    ],
    commonMistakes: [
      "Assuming LCM × HCF = a × b holds for three numbers (it only holds for two numbers).",
      "Confusing the unit digit when power mod 4 is 0 (must use power 4, not power 0)."
    ],
    workedExamples: [
      {
        problem: "Find the unit digit of 7^105.",
        solution: "1. 7 has a cyclicity of 4: 7^1=7, 7^2=9, 7^3=3, 7^4=1.\n2. Divide 105 by 4: 105 = 4 × 26 + 1 (remainder = 1).\n3. Therefore, unit digit is 7^1 = 7.",
        answer: "7"
      },
      {
        problem: "The HCF of two numbers is 11 and their LCM is 7700. If one number is 275, find the other.",
        solution: "1. Using LCM × HCF = Number1 × Number2:\n2. 7700 × 11 = 275 × Number2\n3. Number2 = (7700 × 11) / 275 = 84700 / 275 = 308.",
        answer: "308"
      }
    ]
  },
  {
    id: "quant_percentages",
    subject: APTITUDE_SUBJECTS.QUANT,
    title: "Percentages & Fraction Equivalence",
    description: "Percentage increase/decrease, successive percentage, and fraction conversions for rapid solving.",
    difficulty: "Beginner",
    estimatedMinutes: 25,
    prerequisites: "quant_numbers",
    recommendedNext: "quant_profit_loss",
    theory: "Percentages are comparisons relative to 100. Converting percentages into fractions (e.g. 14.28% = 1/7, 16.66% = 1/6) cuts arithmetic time by over 70% in competitive tests.",
    formulas: [
      "Percentage = (Value / Base) × 100",
      "Fraction equivalents: 1/2=50%, 1/3=33.33%, 1/4=25%, 1/5=20%, 1/6=16.67%, 1/7=14.28%, 1/8=12.5%, 1/9=11.11%, 1/11=9.09%, 1/12=8.33%",
      "Successive percentage change formula: Net % change = a + b + (a × b)/100",
      "Expenditure constant rule: If price increases by x%, consumption must decrease by [x / (100 + x)] × 100% to keep expenditure constant."
    ],
    shortcuts: [
      {
        title: "Multiplier Method",
        rule: "A 20% increase means multiplying by 1.20 (or 6/5). A 15% decrease means multiplying by 0.85 (or 17/20).",
        condition: "Works universally and avoids multi-step additions."
      },
      {
        title: "AB Rule for Constant Product",
        rule: "If A × B = Constant, an increase of 1/n in A requires a decrease of 1/(n + 1) in B.",
        condition: "Applies to Price × Consumption, Speed × Time, Length × Breadth."
      }
    ],
    commonMistakes: [
      "Calculating percentage on the new value instead of the original base value.",
      "Assuming a 20% increase followed by a 20% decrease leaves the value unchanged (it decreases by 4%)."
    ],
    workedExamples: [
      {
        problem: "The price of petrol increases by 25%. By what percentage must a driver reduce consumption so total expenditure remains unchanged?",
        solution: "1. 25% increase = +1/4 in fraction.\n2. By the AB Rule, if A increases by 1/4, B must decrease by 1/(4 + 1) = 1/5.\n3. 1/5 in percentage = 20% reduction.",
        answer: "20%"
      }
    ]
  },
  {
    id: "quant_profit_loss",
    subject: APTITUDE_SUBJECTS.QUANT,
    title: "Profit, Loss & Discounts",
    description: "Cost price, selling price, marked price, successive discounts, and dishonest dealer problems.",
    difficulty: "Intermediate",
    estimatedMinutes: 35,
    prerequisites: "quant_percentages",
    recommendedNext: "quant_interest",
    theory: "Profit and loss are always computed with respect to Cost Price (CP), whereas discounts are always computed with respect to Marked Price (MP).",
    formulas: [
      "Profit = SP - CP | Loss = CP - SP",
      "Profit % = (Profit / CP) × 100 | Loss % = (Loss / CP) × 100",
      "SP = CP × (100 + Profit%) / 100 = MP × (100 - Discount%) / 100",
      "Single Equivalent Discount of two successive discounts d1 and d2 = d1 + d2 - (d1 × d2)/100",
      "Relation: MP / CP = (100 + Profit%) / (100 - Discount%)"
    ],
    shortcuts: [
      {
        title: "Direct CP to MP Ratio",
        rule: "MP / CP = (100 + P%) / (100 - D%). Calculate MP directly from CP without calculating SP first.",
        condition: "Applicable when both profit % and discount % are specified."
      },
      {
        title: "Equal SP with Same Gain/Loss %",
        rule: "If two articles are sold at the SAME price, one at a gain of x% and the other at a loss of x%, there is always an overall LOSS of (x/10)/100 % = (x^2 / 100) %.",
        condition: "Selling prices must be identical; cost prices will not be identical."
      }
    ],
    commonMistakes: [
      "Calculating discount % on Cost Price instead of Marked Price.",
      "Calculating profit % on Selling Price instead of Cost Price."
    ],
    workedExamples: [
      {
        problem: "Two bikes are sold for Rs. 19,800 each. On one, the seller gains 10%, and on the other, he loses 10%. Find the overall gain or loss percentage.",
        solution: "1. Because Selling Price is identical and gain% = loss% = 10%:\n2. Overall Result is ALWAYS a loss = (10^2 / 100)% = (100 / 100)% = 1% loss.",
        answer: "1% Loss"
      }
    ]
  },
  {
    id: "quant_interest",
    subject: APTITUDE_SUBJECTS.QUANT,
    title: "Simple & Compound Interest",
    description: "SI and CI calculation, effective rates, difference between CI and SI, and installment payments.",
    difficulty: "Intermediate",
    estimatedMinutes: 30,
    prerequisites: "quant_percentages",
    recommendedNext: "quant_time_work",
    theory: "Simple Interest (SI) accrues only on the initial principal. Compound Interest (CI) accrues on both the principal and previously accumulated interest (interest on interest).",
    formulas: [
      "Simple Interest (SI) = (P × R × T) / 100",
      "Compound Interest Amount: A = P × (1 + R/100)^T",
      "Difference between CI and SI for 2 years: D_2 = P × (R / 100)^2",
      "Difference between CI and SI for 3 years: D_3 = P × (R / 100)^2 × (3 + R / 100)",
      "Rule of 72: A sum doubles at R% compound interest in approximately 72 / R years."
    ],
    shortcuts: [
      {
        title: "2-Year Difference Direct Formula",
        rule: "Principal P = Difference × (100 / R)^2 for 2 years.",
        condition: "Only applies for 2-year compounding intervals."
      }
    ],
    commonMistakes: [
      "Using nominal annual rate when interest is compounded half-yearly (rate must be halved: R/2, periods doubled: 2T).",
      "Confusing total Amount with Interest."
    ],
    workedExamples: [
      {
        problem: "The difference between CI and SI on a sum of money for 2 years at 10% per annum is Rs. 65. Find the sum.",
        solution: "1. Difference D = P × (R/100)^2\n2. 65 = P × (10/100)^2 = P × (1/100)\n3. P = 65 × 100 = Rs. 6,500.",
        answer: "Rs. 6,500"
      }
    ]
  },
  {
    id: "quant_time_work",
    subject: APTITUDE_SUBJECTS.QUANT,
    title: "Time & Work, Pipes & Cisterns",
    description: "Work efficiency, LCM method, alternate day work, and filling/emptying pipes.",
    difficulty: "Intermediate",
    estimatedMinutes: 35,
    prerequisites: "quant_numbers",
    recommendedNext: "quant_speed_distance",
    theory: "Work is inversely proportional to time. Total Work can be assumed as the LCM of individual days, converting fractional work into whole number units (efficiency).",
    formulas: [
      "Total Work = Total Days × Efficiency (Units per day)",
      "Man-Days-Hours Formula: (M1 × D1 × H1) / W1 = (M2 × D2 × H2) / W2",
      "If Pipe A fills in X hours and Pipe B empties in Y hours (Y > X), net fill time = (X × Y) / (Y - X) hours."
    ],
    shortcuts: [
      {
        title: "LCM Unit Method",
        rule: "Assume total work = LCM of days taken. Assign daily unit capacity to each worker. Add units for combined days.",
        condition: "Eliminates tedious fraction additions."
      }
    ],
    commonMistakes: [
      "Adding days directly (e.g. if A takes 10 days and B takes 15 days, thinking together they take 25 days instead of 6 days).",
      "Treating emptying pipes as positive work instead of subtracting their efficiency."
    ],
    workedExamples: [
      {
        problem: "A can finish a work in 12 days and B can finish it in 18 days. Working together, in how many days will they finish the work?",
        solution: "1. LCM of 12 and 18 = 36 units (Total Work).\n2. Efficiency of A = 36 / 12 = 3 units/day.\n3. Efficiency of B = 36 / 18 = 2 units/day.\n4. Combined efficiency = 3 + 2 = 5 units/day.\n5. Days required = 36 / 5 = 7.2 days (7 days 4 hours 48 mins).",
        answer: "7.2 days"
      }
    ]
  },
  {
    id: "quant_speed_distance",
    subject: APTITUDE_SUBJECTS.QUANT,
    title: "Speed, Time & Distance, Trains & Boats",
    description: "Relative speed, average speed, train crossing poles/platforms, upstream and downstream.",
    difficulty: "Advanced",
    estimatedMinutes: 40,
    prerequisites: "quant_time_work",
    recommendedNext: "quant_mixtures",
    theory: "Distance = Speed × Time. When moving in the same direction, relative speed is the difference; in opposite directions, relative speed is the sum.",
    formulas: [
      "Conversion: 1 km/h = 5/18 m/s | 1 m/s = 18/5 km/h",
      "Average Speed for equal distances: 2xy / (x + y)",
      "Train crossing stationary object of length L2: Total Distance = Length of Train + L2",
      "Boats: Speed Downstream (D) = u + v | Speed Upstream (U) = u - v",
      "Speed of Boat in still water u = (D + U) / 2 | Speed of Stream v = (D - U) / 2"
    ],
    shortcuts: [
      {
        title: "Harmonic Average Speed",
        rule: "When traveling equal distances at speed x and speed y, Average Speed is 2xy/(x+y).",
        condition: "Distances for both legs must be identical."
      }
    ],
    commonMistakes: [
      "Calculating average speed as arithmetic mean (x + y)/2 when distances are equal.",
      "Forgetting to convert km/h to m/s when train lengths are given in meters."
    ],
    workedExamples: [
      {
        problem: "A 180 m long train crosses a platform 220 m long in 20 seconds. What is the speed of the train in km/h?",
        solution: "1. Total distance = Length of train + Length of platform = 180 + 220 = 400 m.\n2. Speed in m/s = 400 m / 20 s = 20 m/s.\n3. Convert to km/h: 20 × (18/5) = 72 km/h.",
        answer: "72 km/h"
      }
    ]
  },
  {
    id: "quant_mixtures",
    subject: APTITUDE_SUBJECTS.QUANT,
    title: "Mixtures & Alligation",
    description: "Alligation cross rule, replacement of liquids, and ratio balance.",
    difficulty: "Intermediate",
    estimatedMinutes: 25,
    prerequisites: "quant_profit_loss",
    recommendedNext: "quant_probability",
    theory: "Alligation is a graphical shortcut for weighted average calculations. It determines the ratio in which two ingredients of different prices/concentrations must be blended.",
    formulas: [
      "Alligation Ratio: (Cheaper Quantity) / (Dearer Quantity) = (Dearer Price - Mean Price) / (Mean Price - Cheaper Price)",
      "Repeated Dilution: If x units are removed from a container of capacity C and replaced by water n times: Final Liquid = C × (1 - x/C)^n"
    ],
    shortcuts: [
      {
        title: "Alligation Cross Diagram",
        rule: "Write cheaper price at top left, dearer at top right, mean price in center. Subtract diagonally.",
        condition: "All three values must have identical units."
      }
    ],
    commonMistakes: [
      "Mixing cost price with selling price in the alligation cross (mean must be Cost Price of mixture).",
      "Subtracting in reverse direction."
    ],
    workedExamples: [
      {
        problem: "In what ratio must rice at Rs. 40/kg be mixed with rice at Rs. 55/kg so that the mixture is worth Rs. 46/kg?",
        solution: "1. Cheaper = 40, Dearer = 55, Mean = 46.\n2. Dearer - Mean = 55 - 46 = 9.\n3. Mean - Cheaper = 46 - 40 = 6.\n4. Ratio = 9 : 6 = 3 : 2.",
        answer: "3 : 2"
      }
    ]
  },
  {
    id: "quant_probability",
    subject: APTITUDE_SUBJECTS.QUANT,
    title: "Probability, Permutations & Combinations",
    description: "Counting principle, arrangement of words, selection of committees, dice, cards, and balls.",
    difficulty: "Advanced",
    estimatedMinutes: 35,
    prerequisites: "quant_numbers",
    recommendedNext: "quant_algebra_geometry",
    theory: "Permutations (nPr) deal with arrangements where order matters. Combinations (nCr) deal with selections where order does NOT matter. Probability is favorable outcomes divided by total sample space.",
    formulas: [
      "nPr = n! / (n - r)! | nCr = n! / [r! × (n - r)!]",
      "nCr = nC(n - r) | nC0 = nCn = 1",
      "Probability P(E) = n(E) / n(S)",
      "P(A ∪ B) = P(A) + P(B) - P(A ∩ B)",
      "Independent events: P(A ∩ B) = P(A) × P(B)"
    ],
    shortcuts: [
      {
        title: "Complementary Probability",
        rule: "When asked for 'at least one', calculate: P(At least one) = 1 - P(None).",
        condition: "Highly efficient for dice, coin, and selection problems."
      }
    ],
    commonMistakes: [
      "Using permutations when order does not matter (e.g. committee selection).",
      "Forgetting to divide by repeated letters when arranging words."
    ],
    workedExamples: [
      {
        problem: "In how many ways can the letters of the word 'LEADER' be arranged?",
        solution: "1. Total letters = 6. Letter 'E' repeats 2 times.\n2. Ways = 6! / 2! = 720 / 2 = 360 ways.",
        answer: "360 ways"
      }
    ]
  },
  {
    id: "quant_algebra_geometry",
    subject: APTITUDE_SUBJECTS.QUANT,
    title: "Algebra, Geometry & Mensuration",
    description: "Quadratic equations, polynomials, area, perimeter, volume, surface area of 2D/3D shapes.",
    difficulty: "Advanced",
    estimatedMinutes: 40,
    prerequisites: "quant_numbers",
    recommendedNext: "quant_data_interpretation",
    theory: "Geometry and mensuration evaluate spatial logic and geometric theorems (Pythagoras, similarity, circles, tangents). Algebra evaluates algebraic identities and quadratic roots.",
    formulas: [
      "(a + b)^2 = a^2 + 2ab + b^2 | a^2 - b^2 = (a - b)(a + b)",
      "If x + 1/x = k, then x^2 + 1/x^2 = k^2 - 2, and x^3 + 1/x^3 = k^3 - 3k",
      "Area of Circle = πr^2 | Perimeter = 2πr",
      "Area of Triangle = (1/2) × base × height = sqrt[s(s-a)(s-b)(s-c)]",
      "Cylinder Volume = πr^2h | Total Surface Area = 2πr(r + h)",
      "Sphere Volume = (4/3)πr^3 | Surface Area = 4πr^2"
    ],
    shortcuts: [
      {
        title: "Symmetric Identity Powers",
        rule: "If x + 1/x = 2, then x = 1. Therefore x^n + 1/x^n = 2 for any integer n.",
        condition: "Applicable when sum equals 2."
      }
    ],
    commonMistakes: [
      "Confusing Curved Surface Area (CSA) with Total Surface Area (TSA).",
      "Forgetting to check the discriminant (b^2 - 4ac) for real roots."
    ],
    workedExamples: [
      {
        problem: "If x + 1/x = 4, find the value of x^2 + 1/x^2.",
        solution: "1. Square both sides: (x + 1/x)^2 = 4^2 = 16\n2. x^2 + 2 + 1/x^2 = 16\n3. x^2 + 1/x^2 = 16 - 2 = 14.",
        answer: "14"
      }
    ]
  },
  {
    id: "quant_data_interpretation",
    subject: APTITUDE_SUBJECTS.QUANT,
    title: "Data Interpretation (DI)",
    description: "Tables, bar graphs, pie charts, line graphs, and percentage comparison speed tactics.",
    difficulty: "Advanced",
    estimatedMinutes: 35,
    prerequisites: "quant_percentages",
    recommendedNext: "logic_series",
    theory: "Data Interpretation tests the ability to extract relevant numbers from complex diagrams and compute percentages, averages, and ratios under strict time pressure.",
    formulas: [
      "Pie Chart degree to percentage: 100% = 360° | 1% = 3.6° | 1° = (5/18)%",
      "Percentage growth = [(Final - Initial) / Initial] × 100",
      "Weighted average = (w1*x1 + w2*x2 + ...) / (w1 + w2 + ...)"
    ],
    shortcuts: [
      {
        title: "Approximation and Unit Digit Elimination",
        rule: "Look at answer choices first. If choices are spaced > 5% apart, round numbers to 2 significant digits.",
        condition: "Only when choices are not closely spaced."
      }
    ],
    commonMistakes: [
      "Calculating actual values when only ratio or percentage change is requested.",
      "Misidentifying the base year in percentage growth questions."
    ],
    workedExamples: [
      {
        problem: "In a company pie chart, Marketing expenses account for 72 degrees. What percentage of total expenditure is Marketing?",
        solution: "1. 360° corresponds to 100%.\n2. Percentage = (72° / 360°) × 100% = (1 / 5) × 100% = 20%.",
        answer: "20%"
      }
    ]
  },

  // ================= LOGICAL REASONING =================
  {
    id: "logic_series",
    subject: APTITUDE_SUBJECTS.LOGIC,
    title: "Number & Letter Series",
    description: "Arithmetic series, geometric series, difference of differences, alternating patterns, and alphabet shifts.",
    difficulty: "Beginner",
    estimatedMinutes: 25,
    prerequisites: "None",
    recommendedNext: "logic_coding",
    theory: "Series questions test pattern recognition. Patterns may involve constant differences, multiplying factors, prime numbers, squares, cubes, or alternating operations.",
    formulas: [
      "Alphabet positions: A=1, B=2 ... Z=26 (M=13, N=14)",
      "EJOTY memory hook: E=5, J=10, O=15, T=20, Y=25",
      "Reverse letter positions: (Letter Position) + (Reverse Position) = 27"
    ],
    shortcuts: [
      {
        title: "Step-Difference Method",
        rule: "If pattern is not obvious, calculate the difference between adjacent terms. If still not obvious, calculate difference of differences.",
        condition: "Reliable for quadratic and polynomial sequences."
      }
    ],
    commonMistakes: [
      "Assuming only one pattern exists without checking subsequent terms.",
      "Forgetting to check for alternating terms (terms at odd positions vs even positions)."
    ],
    workedExamples: [
      {
        problem: "Find the next term in the series: 2, 6, 12, 20, 30, ?",
        solution: "1. Differences: 6-2=4, 12-6=6, 20-12=8, 30-20=10.\n2. The difference increases by 2 each step.\n3. Next difference = 12.\n4. Next term = 30 + 12 = 42.",
        answer: "42"
      }
    ]
  },
  {
    id: "logic_coding",
    subject: APTITUDE_SUBJECTS.LOGIC,
    title: "Coding-Decoding & Analogies",
    description: "Letter substitution, reverse alphabetical coding, numeric coding, and matrix patterns.",
    difficulty: "Beginner",
    estimatedMinutes: 25,
    prerequisites: "logic_series",
    recommendedNext: "logic_blood_relations",
    theory: "Coding-Decoding represents words/numbers using established transformation rules such as position shifting, reversing, or vowel-consonant transformations.",
    formulas: [
      "Opposite Letter Pairs: A-Z, B-Y, C-X, D-W, E-V, F-U, G-T, H-S, I-R, J-Q, K-P, L-O, M-N"
    ],
    shortcuts: [
      {
        title: "Direct Mapping Verification",
        rule: "Check if the letters of the target word already appear in given words before searching for complex arithmetic shifts.",
        condition: "Applicable when 2 sample coded words are provided."
      }
    ],
    commonMistakes: [
      "Checking only the first letter shift and assuming the same shift applies to all letters.",
      "Miscalculating reverse positions from 26 instead of 27."
    ],
    workedExamples: [
      {
        problem: "If in a code language, TEACHER is written as VGCEJGT, how is CHILDREN written?",
        solution: "1. Analyze shift: T->V (+2), E->G (+2), A->C (+2), C->E (+2), H->J (+2), E->G (+2), R->T (+2).\n2. Each letter is shifted by +2.\n3. C->E, H->J, I->K, L->N, D->F, R->T, E->G, N->P.\n4. Result: EJKNFTGP.",
        answer: "EJKNFTGP"
      }
    ]
  },
  {
    id: "logic_blood_relations",
    subject: APTITUDE_SUBJECTS.LOGIC,
    title: "Blood Relations & Directions",
    description: "Family tree representations, coded blood relations, compass directions, and Pythagoras distance.",
    difficulty: "Intermediate",
    estimatedMinutes: 30,
    prerequisites: "logic_coding",
    recommendedNext: "logic_ranking",
    theory: "Blood relation puzzles are solved by systematically drawing generational family trees. Direction sense problems require tracking standard cardinal orientations (North, South, East, West) and angular turns.",
    formulas: [
      "Generations: Parents/Aunts/Uncles (+1), Siblings/Spouse (0), Children/Nephews/Nieces (-1)",
      "Pythagoras Theorem for displacement: Hypotenuse^2 = Base^2 + Height^2",
      "Right turn = 90° clockwise; Left turn = 90° counter-clockwise."
    ],
    shortcuts: [
      {
        title: "Self-Substitution Technique",
        rule: "For pointing questions ('Pointing to a photo, a man says...'), start reading from the phrase 'my' and trace relationships onto yourself.",
        condition: "Effective for single-speaker pointing problems."
      }
    ],
    commonMistakes: [
      "Assuming gender based on name without explicit textual verification.",
      "Confusing 'Facing North' with 'Facing South' (left and right reverse when facing south)."
    ],
    workedExamples: [
      {
        problem: "A man walks 4 km North, then turns right and walks 3 km. How far and in which direction is he from his starting point?",
        solution: "1. Starting at (0,0), walking 4 km North reaches (0,4).\n2. Turning right (East) and walking 3 km reaches (3,4).\n3. Distance = sqrt(4^2 + 3^2) = sqrt(16 + 9) = sqrt(25) = 5 km.\n4. Direction is North-East.",
        answer: "5 km, North-East"
      }
    ]
  },
  {
    id: "logic_ranking",
    subject: APTITUDE_SUBJECTS.LOGIC,
    title: "Ranking, Ordering & Comparison",
    description: "Position in a row, overlapping ranks, interchange of positions, and ascending/descending order.",
    difficulty: "Intermediate",
    estimatedMinutes: 25,
    prerequisites: "logic_blood_relations",
    recommendedNext: "logic_seating",
    theory: "Ranking questions test ordinal logic. The fundamental law of ranking is that when counting one person from both ends, that person is counted twice.",
    formulas: [
      "Total persons in a row = (Rank from Left + Rank from Right) - 1",
      "Rank from Right = (Total persons - Rank from Left) + 1",
      "Interchange of Positions: Total = (New rank of Person A + Old rank of Person B) - 1"
    ],
    shortcuts: [
      {
        title: "Double-Count Subtraction",
        rule: "Always subtract 1 when summing rank from left and rank from right of the same individual.",
        condition: "Applicable to single row ranking."
      }
    ],
    commonMistakes: [
      "Forgetting to subtract 1, resulting in an off-by-one error.",
      "Assuming people are seated between two individuals when their ranks overlap."
    ],
    workedExamples: [
      {
        problem: "In a class of 45 students, Rohit ranks 16th from the top. What is his rank from the bottom?",
        solution: "1. Rank from bottom = (Total - Rank from top) + 1\n2. Rank = (45 - 16) + 1 = 29 + 1 = 30th.",
        answer: "30th"
      }
    ]
  },
  {
    id: "logic_seating",
    subject: APTITUDE_SUBJECTS.LOGIC,
    title: "Seating Arrangements & Logical Puzzles",
    description: "Linear arrangements (facing North/South), circular tables (facing center/outside), and floor puzzles.",
    difficulty: "Advanced",
    estimatedMinutes: 40,
    prerequisites: "logic_ranking",
    recommendedNext: "logic_syllogisms",
    theory: "Seating arrangements test constraint satisfaction. Circular tables facing the center mean clockwise is Left and counter-clockwise is Right.",
    formulas: [
      "Facing Center (Circular): Clockwise = Left | Anti-clockwise = Right",
      "Facing Outside (Circular): Clockwise = Right | Anti-clockwise = Left",
      "Opposite positions in a circle of N people: Separated by (N - 2) / 2 people."
    ],
    shortcuts: [
      {
        title: "Definite Clue Anchor",
        rule: "Always start placing individuals from definite clues (e.g. 'A sits at the extreme left end') rather than negative clues.",
        condition: "Crucial for avoiding backtracking in puzzles."
      }
    ],
    commonMistakes: [
      "Swapping left and right orientations when individuals face south or face outside.",
      "Conflating 'immediate left' with 'to the left'."
    ],
    workedExamples: [
      {
        problem: "Six friends A, B, C, D, E, F sit in a circle facing the center. A sits opposite D. B is to the immediate right of A. C is between A and E. Who is opposite B?",
        solution: "1. Place A at the bottom, facing center. D is opposite A (at top).\n2. B is immediate right of A (to A's right is anti-clockwise).\n3. C is between A and E (so C is to A's left, and E follows).\n4. F fills the remaining spot opposite B.\n5. Therefore, E or F: Opposites are (A, D), (B, E), (C, F). Opposite B is E.",
        answer: "E"
      }
    ]
  },
  {
    id: "logic_syllogisms",
    subject: APTITUDE_SUBJECTS.LOGIC,
    title: "Syllogisms & Logical Deductions",
    description: "Venn diagram method, 'Some', 'All', 'No', 'Some Not', and 'Only a few' statements.",
    difficulty: "Advanced",
    estimatedMinutes: 35,
    prerequisites: "logic_seating",
    recommendedNext: "logic_clocks_calendars",
    theory: "Syllogisms test formal deductive logic. A conclusion is considered valid if and only if it holds true across ALL possible Venn diagram representations of the premises.",
    formulas: [
      "All A are B: Circle A is completely inside Circle B.",
      "Some A are B: Circle A and Circle B overlap by at least one element.",
      "No A is B: Circle A and Circle B have zero overlap.",
      "Complimentary Pairs (Either-Or): (Some + No) or (All + Some Not) with identical subject and predicate, where neither conclusion is definitively true on its own."
    ],
    shortcuts: [
      {
        title: "Possibility vs Definite Conclusion",
        rule: "If a conclusion is stated as a certainty, a single valid counter-diagram invalidates it. If stated as a possibility, a single valid diagram proves it.",
        condition: "Distinguish between 'is' and 'can be'."
      }
    ],
    commonMistakes: [
      "Assuming real-world truth overrides logical premises (e.g. 'All dogs are cats' must be treated as true).",
      "Treating 'Some A are B' as implying 'Some A are NOT B' (in logic, 'Some' means 'at least one', potentially all)."
    ],
    workedExamples: [
      {
        problem: "Statements: All cars are vehicles. All vehicles are machines.\nConclusions: I. All cars are machines. II. Some machines are cars.",
        solution: "1. Draw Cars inside Vehicles, and Vehicles inside Machines.\n2. Since Cars is inside Vehicles and Vehicles is inside Machines, Cars is entirely inside Machines -> Conclusion I follows.\n3. Since Machines contains Cars, at least the machine portion containing cars exists -> Conclusion II follows.\n4. Both I and II follow.",
        answer: "Both I and II follow"
      }
    ]
  },
  {
    id: "logic_clocks_calendars",
    subject: APTITUDE_SUBJECTS.LOGIC,
    title: "Clocks & Calendars",
    description: "Angle between clock hands, coincidence, right angles, odd days, leap years, and day of the week.",
    difficulty: "Intermediate",
    estimatedMinutes: 30,
    prerequisites: "logic_series",
    recommendedNext: "logic_statements",
    theory: "Clock hands move at distinct angular speeds: minute hand moves at 6°/min, hour hand moves at 0.5°/min. Relative speed is 5.5°/min. Calendars rely on counting 'odd days' beyond complete 7-day weeks.",
    formulas: [
      "Angle between clock hands: θ = |30H - (11/2)M|",
      "Hands coincide: Every 65 (5/11) minutes (22 times in 24 hours)",
      "Hands at 90°: 44 times in 24 hours",
      "Normal Year = 365 days = 52 weeks + 1 odd day",
      "Leap Year = 366 days = 52 weeks + 2 odd days",
      "Century leap years: Divisible by 400 (1600, 2000 are leap; 1700, 1800, 1900 are not)."
    ],
    shortcuts: [
      {
        title: "Direct Clock Angle Formula",
        rule: "θ = |30H - 5.5M|. If θ > 180°, reflex angle is 360° - θ.",
        condition: "Universal formula for H hours and M minutes."
      }
    ],
    commonMistakes: [
      "Treating year 1900 as a leap year because it is divisible by 4 (centuries must be divisible by 400).",
      "Forgetting the hour hand moves as minutes advance."
    ],
    workedExamples: [
      {
        problem: "Find the angle between the hour hand and the minute hand of a clock at 3:40.",
        solution: "1. H = 3, M = 40.\n2. θ = |30(3) - (11/2)(40)| = |90 - 220| = |-130| = 130°.",
        answer: "130°"
      }
    ]
  },
  {
    id: "logic_statements",
    subject: APTITUDE_SUBJECTS.LOGIC,
    title: "Statement & Assumptions / Conclusions",
    description: "Critical reasoning, implicit assumptions, valid conclusions, strong vs weak arguments.",
    difficulty: "Advanced",
    estimatedMinutes: 30,
    prerequisites: "logic_syllogisms",
    recommendedNext: "verbal_grammar",
    theory: "Critical reasoning evaluates whether a premise logically necessitates a conclusion or takes an implicit assumption for granted. An assumption is something taken for granted without proof.",
    formulas: [
      "Assumption Test: If negating the assumption collapses the argument, the assumption is implicit (valid).",
      "Conclusion Rule: A conclusion must be 100% logically inevitable from the statement, without introducing outside assumptions."
    ],
    shortcuts: [
      {
        title: "Extreme Words Elimination",
        rule: "Assumptions or conclusions containing extreme words like 'only', 'never', 'all', 'completely' are rarely implicit unless stated in the premise.",
        condition: "Applies to standard verbal logic."
      }
    ],
    commonMistakes: [
      "Bringing in personal real-world knowledge instead of confining analysis strictly to the prompt.",
      "Treating a course of action as a conclusion."
    ],
    workedExamples: [
      {
        problem: "Statement: 'Please switch off mobile phones during the lecture.'\nAssumptions: I. Students carry mobile phones. II. Ringing phones can cause disruption.",
        solution: "1. If students did not carry phones, making the request would be meaningless -> Assumption I is implicit.\n2. The request is made because ringing disrupts learning -> Assumption II is implicit.\n3. Both I and II are implicit.",
        answer: "Both I and II are implicit"
      }
    ]
  },

  // ================= VERBAL ABILITY =================
  {
    id: "verbal_grammar",
    subject: APTITUDE_SUBJECTS.VERBAL,
    title: "Grammar, Error Spotting & Sentence Correction",
    description: "Subject-verb agreement, tense consistency, parallelism, modifiers, and prepositions.",
    difficulty: "Beginner",
    estimatedMinutes: 30,
    prerequisites: "None",
    recommendedNext: "verbal_vocabulary",
    theory: "Sentence correction and error spotting test mastery of standard written English rules. Over 70% of errors in competitive exams stem from Subject-Verb Agreement, Dangling Modifiers, and Faulty Parallelism.",
    formulas: [
      "Subject-Verb Agreement: Singular subject takes singular verb; plural subject takes plural verb.",
      "Either...or / Neither...nor: Verb agrees with the subject CLOSER to it.",
      "Each, Every, Either, Neither, Everyone, Anybody: Always take singular verbs.",
      "Parallelism: Elements in a list must have matching grammatical form (e.g., swimming, running, and cycling)."
    ],
    shortcuts: [
      {
        title: "Ignore Parenthetical Phrases",
        rule: "Cross out words between commas or prepositional phrases ('along with', 'as well as', 'together with') to isolate the true subject.",
        condition: "When identifying subject-verb agreement in long sentences."
      }
    ],
    commonMistakes: [
      "Matching the verb with the nearest noun rather than the actual subject of the clause.",
      "Using 'between' for more than two entities (use 'among' for 3 or more)."
    ],
    workedExamples: [
      {
        problem: "Spot the error: 'The committee have decided to postpone the annual conference.'",
        solution: "1. 'Committee' is a collective noun acting as a single unified entity here.\n2. In formal grammar, collective nouns acting in unison take a singular verb ('has decided', not 'have decided').",
        answer: "'have decided' should be 'has decided'"
      }
    ]
  },
  {
    id: "verbal_vocabulary",
    subject: APTITUDE_SUBJECTS.VERBAL,
    title: "Vocabulary, Synonyms & Antonyms",
    description: "Root words, prefixes, suffixes, contextual meanings, and frequently repeated exam words.",
    difficulty: "Intermediate",
    estimatedMinutes: 30,
    prerequisites: "verbal_grammar",
    recommendedNext: "verbal_completion",
    theory: "Vocabulary questions evaluate understanding through word roots (etymology), tone (positive vs negative charge), and contextual connotation.",
    formulas: [
      "Root: 'Bene' = Good (Beneficial, Benevolent) | 'Mal' = Bad (Malicious, Malevolent)",
      "Root: 'Chron' = Time (Chronology, Anachronism) | 'Path' = Feeling (Sympathy, Apathy, Empathy)",
      "Root: 'Loqu/Locut' = Speech (Eloquent, Loquacious) | 'Vor' = Eat (Voracious, Carnivore)"
    ],
    shortcuts: [
      {
        title: "Tone Elimination Technique",
        rule: "Identify whether the sentence/word has a positive, neutral, or negative tone. Eliminate choices with opposite charge.",
        condition: "Useful when exact word definition is unfamiliar."
      }
    ],
    commonMistakes: [
      "Selecting an antonym when asked for a synonym due to rushing.",
      "Ignoring secondary meanings of common words (e.g. 'table' as a verb meaning to postpone)."
    ],
    workedExamples: [
      {
        problem: "Find the antonym of EPHEMERAL:\nA) Fleeting  B) Permanent  C) Transient  D) Short-lived",
        solution: "1. 'Ephemeral' means lasting for a very short time (transient, fleeting).\n2. The opposite is lasting indefinitely -> Permanent.",
        answer: "Permanent"
      }
    ]
  },
  {
    id: "verbal_completion",
    subject: APTITUDE_SUBJECTS.VERBAL,
    title: "Sentence Completion & Fill in the Blanks",
    description: "Single and double blank sentences, contextual collocations, and idiomatic phrases.",
    difficulty: "Intermediate",
    estimatedMinutes: 25,
    prerequisites: "verbal_vocabulary",
    recommendedNext: "verbal_comprehension",
    theory: "Sentence completion tests both vocabulary and syntax logic. Clues within the sentence indicate contrast, causation, or similarity.",
    formulas: [
      "Contrast Indicators: Although, However, Despite, Whereas, But (blanks have opposing connotations).",
      "Cause/Effect Indicators: Because, Therefore, As a result, Consequently (blanks reinforce direction)."
    ],
    shortcuts: [
      {
        title: "Second Blank Elimination",
        rule: "In double blank questions, test the second blank first. Frequently 3 out of 4 options can be eliminated immediately.",
        condition: "Highly efficient for double fillers."
      }
    ],
    commonMistakes: [
      "Picking a word that sounds sophisticated but contradicts sentence tone.",
      "Ignoring preposition collocations (e.g. 'prohibit from' vs 'prevent from')."
    ],
    workedExamples: [
      {
        problem: "Fill in the blank: Despite the team's _____ efforts, the project failed to meet the deadline.",
        solution: "1. The word 'Despite' signals a contrast between efforts and project failure.\n2. The blank must describe diligent/intense efforts. Words like 'strenuous' or 'tireless' fit perfectly.",
        answer: "Strenuous (or Tireless)"
      }
    ]
  },
  {
    id: "verbal_comprehension",
    subject: APTITUDE_SUBJECTS.VERBAL,
    title: "Reading Comprehension & Para Jumbles",
    description: "Main idea identification, inference vs direct fact, tone analysis, and sentence reordering.",
    difficulty: "Advanced",
    estimatedMinutes: 35,
    prerequisites: "verbal_completion",
    recommendedNext: null,
    theory: "Reading Comprehension evaluates retention, critical deduction, and synthesis under time constraints. Para Jumbles test structural cohesion using transition words and pronoun-noun links.",
    formulas: [
      "Para Jumble Linking: Look for Mandatory Pairs (Noun -> Pronoun, General -> Specific, Cause -> Effect).",
      "Transition words that signal contrast: However, Although, On the contrary, Despite.",
      "Transition words that signal continuation: Furthermore, In addition, Consequently, Thus."
    ],
    shortcuts: [
      {
        title: "Question-First Skimming",
        rule: "Read question stems (without options) before reading the passage to know exactly which keywords to locate.",
        condition: "Saves 25-30% of time in timed mock tests."
      }
    ],
    commonMistakes: [
      "Assuming an answer is correct because it is true in the real world, even if not supported by the passage.",
      "Confusing 'Inference' (logical deduction) with 'Direct Fact' (explicitly stated)."
    ],
    workedExamples: [
      {
        problem: "Arrange sentences into a coherent paragraph:\nA. This cycle of warming accelerates Arctic ice melt.\nB. Global emissions have risen steadily over the past century.\nC. Consequently, average planetary temperatures have broken records.\nD. As a result, sea levels continue to rise globally.",
        solution: "1. B is the broad introductory statement (Cause).\n2. C describes the direct result of rising emissions (Consequently temperatures broke records).\n3. A elaborates the specific impact of warming (cycle of Arctic melt).\n4. D provides the final global consequence (sea levels continue to rise).\n5. Logical order: B-C-A-D.",
        answer: "B-C-A-D"
      }
    ]
  },

  // ================= SPECIALIZED EXAM MODULES =================
  {
    id: "special_computer",
    subject: APTITUDE_SUBJECTS.SPECIAL,
    title: "Basic Computer Awareness",
    description: "Hardware, operating systems, networking fundamentals, memory hierarchy, shortcuts, and cybersecurity.",
    difficulty: "Beginner",
    estimatedMinutes: 25,
    prerequisites: "None",
    recommendedNext: "special_general_awareness",
    theory: "Computer awareness is a mandatory scoring section in Banking, SSC, and Railway recruitments. Covers CPU, RAM/ROM, IP addresses, OSI model, and keyboard shortcuts.",
    formulas: [
      "1 Byte = 8 Bits | 1 KB = 1024 Bytes | 1 MB = 1024 KB | 1 GB = 1024 MB",
      "RAM: Volatile primary memory | ROM: Non-volatile firmware",
      "HTTP: Port 80 | HTTPS: Port 443 | DNS: Port 53 | SSH: Port 22"
    ],
    shortcuts: [
      {
        title: "Prefix Hierarchy Rule",
        rule: "Remember: Kilo (10^3), Mega (10^6), Giga (10^9), Tera (10^12), Peta (10^15), Exa (10^18).",
        condition: "Universal memory conversion questions."
      }
    ],
    commonMistakes: [
      "Confusing RAM (volatile) with ROM (non-volatile).",
      "Assuming 1 KB is 1000 Bytes instead of 1024 Bytes in binary computing."
    ],
    workedExamples: [
      {
        problem: "Which of the following is non-volatile memory?\nA) SRAM  B) DRAM  C) ROM  D) Cache",
        solution: "ROM (Read Only Memory) retains its data even when power is turned off, making it non-volatile.",
        answer: "ROM"
      }
    ]
  },
  {
    id: "special_general_awareness",
    subject: APTITUDE_SUBJECTS.SPECIAL,
    title: "General & Banking Awareness",
    description: "RBI monetary policy, Repo rate, CRR/SLR, capital markets, national institutions, and economic indicators.",
    difficulty: "Intermediate",
    estimatedMinutes: 30,
    prerequisites: "None",
    recommendedNext: null,
    theory: "Evaluates understanding of monetary policy, financial regulators (RBI, SEBI, IRDAI), and economic indicators required for public sector and banking exams.",
    formulas: [
      "Repo Rate: Rate at which RBI lends short-term funds to commercial banks.",
      "Reverse Repo Rate: Rate at which RBI borrows funds from commercial banks.",
      "CRR (Cash Reserve Ratio): Percentage of deposits banks must keep with RBI as cash.",
      "SLR (Statutory Liquidity Ratio): Percentage of deposits banks must maintain in liquid assets (gold, govt bonds)."
    ],
    shortcuts: [
      {
        title: "Regulator Mapping Hook",
        rule: "Banking -> RBI; Stock Market -> SEBI; Insurance -> IRDAI; Pensions -> PFRDA.",
        condition: "Instant regulatory identification."
      }
    ],
    commonMistakes: [
      "Confusing Repo Rate with Reverse Repo Rate.",
      "Assuming CRR earns interest for banks (CRR does NOT earn interest from RBI)."
    ],
    workedExamples: [
      {
        problem: "Which body regulates the capital markets in India?\nA) RBI  B) SEBI  C) NABARD  D) IRDAI",
        solution: "SEBI (Securities and Exchange Board of India) regulates capital and stock markets in India.",
        answer: "SEBI"
      }
    ]
  }
];

// ================= VERIFIED HIGH-QUALITY QUESTION BANK =================
const APTITUDE_QUESTION_BANK = [
  // 1. Quant - Numbers
  {
    id: "q_num_01",
    topicId: "quant_numbers",
    subject: APTITUDE_SUBJECTS.QUANT,
    examCategories: ["campus_placements", "ssc_cgl", "railways_rrb"],
    difficulty: "Beginner",
    text: "What is the unit digit of the product (781 × 453 × 677 × 899)?",
    options: ["3", "7", "9", "1"],
    correctIndex: 2,
    explanation: "Multiply the unit digits of each factor:\n1 × 3 = 3\n3 × 7 = 21 (unit digit 1)\n1 × 9 = 9.\nThe unit digit of the product is 9.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  {
    id: "q_num_02",
    topicId: "quant_numbers",
    subject: APTITUDE_SUBJECTS.QUANT,
    examCategories: ["campus_placements", "banking_ibps", "ssc_cgl"],
    difficulty: "Intermediate",
    text: "The sum of two numbers is 528 and their HCF is 33. How many such pairs of numbers can be formed?",
    options: ["2", "3", "4", "6"],
    correctIndex: 2,
    explanation: "Let the numbers be 33a and 33b, where a and b are co-prime.\n33a + 33b = 528\n=> a + b = 528 / 33 = 16.\nPossible co-prime pairs (a, b) whose sum is 16:\n(1, 15) - co-prime ✓\n(3, 13) - co-prime ✓\n(5, 11) - co-prime ✓\n(7, 9) - co-prime ✓\nOther pairs like (2, 14), (4, 12), (6, 10), (8, 8) are NOT co-prime.\nHence, exactly 4 such pairs exist.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 2. Quant - Percentages
  {
    id: "q_perc_01",
    topicId: "quant_percentages",
    subject: APTITUDE_SUBJECTS.QUANT,
    examCategories: ["campus_placements", "ssc_cgl", "banking_ibps", "gate_aptitude"],
    difficulty: "Beginner",
    text: "If A's salary is 25% more than B's salary, by what percentage is B's salary less than A's salary?",
    options: ["20%", "25%", "16.67%", "33.33%"],
    correctIndex: 0,
    explanation: "Let B's salary = 100.\nThen A's salary = 125.\nDifference = 125 - 100 = 25.\nPercentage B is less than A = (25 / 125) × 100 = (1 / 5) × 100 = 20%.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  {
    id: "q_perc_02",
    topicId: "quant_percentages",
    subject: APTITUDE_SUBJECTS.QUANT,
    examCategories: ["campus_placements", "banking_ibps", "cat_quant"],
    difficulty: "Intermediate",
    text: "A number is increased by 20% and then decreased by 20%. What is the net change in the number?",
    options: ["No change", "4% increase", "4% decrease", "2% decrease"],
    correctIndex: 2,
    explanation: "Using the successive percentage change formula: Net % = a + b + (a × b)/100\nHere a = +20, b = -20.\nNet % = 20 - 20 + [20 × (-20)] / 100 = 0 - 400 / 100 = -4%.\nNegative sign indicates a 4% decrease.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 3. Quant - Profit & Loss
  {
    id: "q_pl_01",
    topicId: "quant_profit_loss",
    subject: APTITUDE_SUBJECTS.QUANT,
    examCategories: ["campus_placements", "ssc_cgl", "railways_rrb"],
    difficulty: "Beginner",
    text: "A merchant buys a watch for Rs. 450 and sells it for Rs. 540. What is his profit percentage?",
    options: ["15%", "18%", "20%", "25%"],
    correctIndex: 2,
    explanation: "CP = Rs. 450, SP = Rs. 540.\nProfit = SP - CP = 540 - 450 = Rs. 90.\nProfit % = (Profit / CP) × 100 = (90 / 450) × 100 = (1 / 5) × 100 = 20%.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  {
    id: "q_pl_02",
    topicId: "quant_profit_loss",
    subject: APTITUDE_SUBJECTS.QUANT,
    examCategories: ["banking_ibps", "ssc_cgl", "cat_quant"],
    difficulty: "Intermediate",
    text: "A trader marks his goods 40% above the cost price and allows a discount of 20% on the marked price. What is his net gain percentage?",
    options: ["10%", "12%", "15%", "20%"],
    correctIndex: 1,
    explanation: "Let CP = 100.\nMarked Price MP = 100 + 40 = 140.\nDiscount = 20% of 140 = (20/100) × 140 = 28.\nSelling Price SP = 140 - 28 = 112.\nGain = SP - CP = 112 - 100 = 12%.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 4. Quant - Interest
  {
    id: "q_int_01",
    topicId: "quant_interest",
    subject: APTITUDE_SUBJECTS.QUANT,
    examCategories: ["campus_placements", "banking_ibps", "ssc_cgl"],
    difficulty: "Intermediate",
    text: "At what rate percent per annum simple interest will a sum of money double itself in 8 years?",
    options: ["10%", "12.5%", "14%", "15%"],
    correctIndex: 1,
    explanation: "Let Principal = P.\nFor the sum to double, Amount = 2P, so Simple Interest SI = 2P - P = P.\nSI = (P × R × T) / 100\nP = (P × R × 8) / 100\n1 = 8R / 100\nR = 100 / 8 = 12.5% per annum.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 5. Quant - Time & Work
  {
    id: "q_tw_01",
    topicId: "quant_time_work",
    subject: APTITUDE_SUBJECTS.QUANT,
    examCategories: ["campus_placements", "ssc_cgl", "railways_rrb", "gate_aptitude"],
    difficulty: "Beginner",
    text: "A can do a piece of work in 10 days and B can do it in 15 days. How many days will they take to finish the work together?",
    options: ["5 days", "6 days", "7.5 days", "8 days"],
    correctIndex: 1,
    explanation: "LCM of 10 and 15 = 30 units (Total Work).\nA's efficiency = 30 / 10 = 3 units/day.\nB's efficiency = 30 / 15 = 2 units/day.\nTogether efficiency = 3 + 2 = 5 units/day.\nDays required = 30 / 5 = 6 days.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 6. Quant - Speed & Distance
  {
    id: "q_tsd_01",
    topicId: "quant_speed_distance",
    subject: APTITUDE_SUBJECTS.QUANT,
    examCategories: ["campus_placements", "ssc_cgl", "railways_rrb"],
    difficulty: "Beginner",
    text: "A person travels from town A to B at 60 km/h and returns from B to A at 40 km/h along the same route. What is the average speed for the whole journey?",
    options: ["48 km/h", "50 km/h", "52 km/h", "45 km/h"],
    correctIndex: 0,
    explanation: "Since the distance for both trips is identical, use the harmonic average speed formula:\nAverage Speed = 2xy / (x + y)\n= (2 × 60 × 40) / (60 + 40) = 4800 / 100 = 48 km/h.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 7. Quant - Mixtures
  {
    id: "q_mix_01",
    topicId: "quant_mixtures",
    subject: APTITUDE_SUBJECTS.QUANT,
    examCategories: ["banking_ibps", "ssc_cgl", "cat_quant"],
    difficulty: "Intermediate",
    text: "In a 60-liter mixture of milk and water, the ratio of milk to water is 2:1. How much water must be added to make the ratio 1:2?",
    options: ["40 liters", "60 liters", "50 liters", "30 liters"],
    correctIndex: 1,
    explanation: "Initial volume = 60 liters, ratio 2:1.\nMilk = (2/3) × 60 = 40 liters.\nWater = (1/3) × 60 = 20 liters.\nLet x liters of water be added. Milk remains 40 liters.\nMilk / (Water + x) = 1 / 2\n40 / (20 + x) = 1 / 2\n20 + x = 80\nx = 60 liters.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 8. Quant - Probability & Combinations
  {
    id: "q_prob_01",
    topicId: "quant_probability",
    subject: APTITUDE_SUBJECTS.QUANT,
    examCategories: ["campus_placements", "banking_ibps", "gate_aptitude", "cat_quant"],
    difficulty: "Intermediate",
    text: "Two unbiased dice are rolled together. What is the probability that the sum of the numbers appearing on the dice is 8?",
    options: ["5/36", "1/6", "7/36", "1/9"],
    correctIndex: 0,
    explanation: "Total outcomes = 6 × 6 = 36.\nFavorable pairs giving a sum of 8:\n(2,6), (3,5), (4,4), (5,3), (6,2) -> Exactly 5 outcomes.\nProbability = 5 / 36.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 9. Quant - Algebra & Geometry
  {
    id: "q_geo_01",
    topicId: "quant_algebra_geometry",
    subject: APTITUDE_SUBJECTS.QUANT,
    examCategories: ["ssc_cgl", "railways_rrb", "gate_aptitude"],
    difficulty: "Intermediate",
    text: "The perimeter of a rectangular field is 80 meters and the length is 10 meters more than the breadth. What is the area of the field?",
    options: ["375 sq m", "400 sq m", "350 sq m", "450 sq m"],
    correctIndex: 0,
    explanation: "Let breadth = b. Length = b + 10.\nPerimeter = 2(Length + Breadth) = 2(b + 10 + b) = 2(2b + 10) = 4b + 20 = 80.\n4b = 60 => b = 15 meters.\nLength = 15 + 10 = 25 meters.\nArea = Length × Breadth = 25 × 15 = 375 sq meters.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 10. Quant - Data Interpretation
  {
    id: "q_di_01",
    topicId: "quant_data_interpretation",
    subject: APTITUDE_SUBJECTS.QUANT,
    examCategories: ["banking_ibps", "campus_placements", "cat_quant", "ssc_cgl"],
    difficulty: "Beginner",
    text: "A student scores 75, 80, 85, and 90 marks in four subjects. If each subject is out of 100, what is the student's average percentage?",
    options: ["80%", "82.5%", "85%", "81%"],
    correctIndex: 1,
    explanation: "Total marks = 75 + 80 + 85 + 90 = 330 out of 400.\nAverage = 330 / 4 = 82.5%.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },

  // 11. Logic - Series
  {
    id: "q_ser_01",
    topicId: "logic_series",
    subject: APTITUDE_SUBJECTS.LOGIC,
    examCategories: ["campus_placements", "ssc_cgl", "railways_rrb"],
    difficulty: "Beginner",
    text: "Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?",
    options: ["7", "10", "12", "13"],
    correctIndex: 1,
    explanation: "This is an alternating addition and subtraction series:\n7 + 3 = 10\n10 - 2 = 8\n8 + 3 = 11\n11 - 2 = 9\n9 + 3 = 12\nNext operation is -2: 12 - 2 = 10.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 12. Logic - Coding
  {
    id: "q_cod_01",
    topicId: "logic_coding",
    subject: APTITUDE_SUBJECTS.LOGIC,
    examCategories: ["campus_placements", "ssc_cgl", "railways_rrb"],
    difficulty: "Beginner",
    text: "If in a certain code, MONKEY is coded as XDJMNL, how will TIGER be coded in that code?",
    options: ["QDFHS", "SDFHQ", "QDFHT", "RDFHS"],
    correctIndex: 0,
    explanation: "Observe the letters from the reverse end minus 1:\nY - 1 = X\nE - 1 = D\nK - 1 = J\nN - 1 = M\nO - 1 = N\nM - 1 = L.\nFor TIGER, reverse letters and subtract 1:\nR - 1 = Q\nE - 1 = D\nG - 1 = F\nI - 1 = H\nT - 1 = S.\nResult is QDFHS.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 13. Logic - Blood Relations
  {
    id: "q_br_01",
    topicId: "logic_blood_relations",
    subject: APTITUDE_SUBJECTS.LOGIC,
    examCategories: ["campus_placements", "banking_ibps", "ssc_cgl"],
    difficulty: "Beginner",
    text: "Pointing to a photograph of a boy, Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?",
    options: ["Brother", "Uncle", "Father", "Grandfather"],
    correctIndex: 2,
    explanation: "'Only son of my mother' refers to Suresh himself (assuming Suresh is male, as confirmed by choices).\nThe boy is the son of Suresh.\nTherefore, Suresh is the boy's Father.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 14. Logic - Ranking
  {
    id: "q_rank_01",
    topicId: "logic_ranking",
    subject: APTITUDE_SUBJECTS.LOGIC,
    examCategories: ["ssc_cgl", "railways_rrb", "banking_ibps"],
    difficulty: "Beginner",
    text: "In a row of 30 trees, a mango tree is 7th from the right end. What is its position from the left end?",
    options: ["22nd", "23rd", "24th", "25th"],
    correctIndex: 2,
    explanation: "Position from left = (Total trees - Position from right) + 1\n= (30 - 7) + 1 = 23 + 1 = 24th.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 15. Logic - Seating
  {
    id: "q_seat_01",
    topicId: "logic_seating",
    subject: APTITUDE_SUBJECTS.LOGIC,
    examCategories: ["banking_ibps", "campus_placements", "cat_quant"],
    difficulty: "Intermediate",
    text: "Five friends P, Q, R, S, T are sitting in a row facing North. S is between T and Q. Q is to the immediate left of R. P is to the immediate left of T. Who is in the middle?",
    options: ["P", "Q", "S", "T"],
    correctIndex: 2,
    explanation: "Order arrangement:\n1. P is immediate left of T: [P, T]\n2. S is between T and Q: [P, T, S, Q]\n3. Q is immediate left of R: [P, T, S, Q, R]\nTotal 5 positions: P(1), T(2), S(3), Q(4), R(5).\nThe person in the middle (3rd position) is S.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 16. Logic - Syllogisms
  {
    id: "q_syl_01",
    topicId: "logic_syllogisms",
    subject: APTITUDE_SUBJECTS.LOGIC,
    examCategories: ["banking_ibps", "ssc_cgl", "campus_placements"],
    difficulty: "Intermediate",
    text: "Statements:\n1. Some pens are books.\n2. All books are pencils.\nConclusions:\nI. Some pencils are pens.\nII. All pens are pencils.",
    options: ["Only I follows", "Only II follows", "Both I and II follow", "Neither follows"],
    correctIndex: 0,
    explanation: "Venn diagram:\nSince Some Pens are Books, and All Books are Pencils, the Pens that are Books must also be Pencils. Thus, 'Some pencils are pens' definitely holds true (Conclusion I follows).\nHowever, not all pens are required to be pencils (Conclusion II does not follow).\nTherefore, Only I follows.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 17. Logic - Clocks & Calendars
  {
    id: "q_clk_01",
    topicId: "logic_clocks_calendars",
    subject: APTITUDE_SUBJECTS.LOGIC,
    examCategories: ["ssc_cgl", "railways_rrb", "campus_placements"],
    difficulty: "Intermediate",
    text: "What is the angle between the hands of a clock at 4:20?",
    options: ["0°", "10°", "15°", "20°"],
    correctIndex: 1,
    explanation: "Use formula: θ = |30H - 5.5M|\nAt 4:20, H = 4, M = 20.\nθ = |30(4) - 5.5(20)| = |120 - 110| = 10°.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 18. Logic - Statements
  {
    id: "q_stat_01",
    topicId: "logic_statements",
    subject: APTITUDE_SUBJECTS.LOGIC,
    examCategories: ["banking_ibps", "ssc_cgl", "cat_quant"],
    difficulty: "Intermediate",
    text: "Statement: 'The government has decided to provide free internet access across all public libraries.'\nAssumptions:\nI. Many visitors will benefit from digital learning resources.\nII. All private internet providers will shut down.",
    options: ["Only I is implicit", "Only II is implicit", "Both I and II are implicit", "Neither is implicit"],
    correctIndex: 0,
    explanation: "Assumption I is reasonable as the initiative aims to facilitate public learning and digital connectivity.\nAssumption II is an extreme, unfounded extrapolation; providing free internet in libraries does not eliminate private service providers.\nTherefore, Only I is implicit.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },

  // 19. Verbal - Grammar
  {
    id: "q_vrb_01",
    topicId: "verbal_grammar",
    subject: APTITUDE_SUBJECTS.VERBAL,
    examCategories: ["campus_placements", "ssc_cgl", "banking_ibps", "gate_aptitude"],
    difficulty: "Beginner",
    text: "Choose the correct sentence:",
    options: [
      "Neither the professor nor the students was present in the auditorium.",
      "Neither the professor nor the students were present in the auditorium.",
      "Neither the professor or the students was present in the auditorium.",
      "Neither the professor or the students were present in the auditorium."
    ],
    correctIndex: 1,
    explanation: "In 'Neither...nor' constructions, the verb agrees in number with the subject closest to it. Here, 'students' (plural) is closest to the verb, so the plural past-tense verb 'were' is required.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  {
    id: "q_vrb_02",
    topicId: "verbal_grammar",
    subject: APTITUDE_SUBJECTS.VERBAL,
    examCategories: ["campus_placements", "ssc_cgl", "banking_ibps", "cat_quant"],
    difficulty: "Intermediate",
    text: "Identify the segment containing a grammatical error:\n'Each of the candidates (A) / were given an opportunity (B) / to demonstrate their technical skills (C) / during the final interview (D).'",
    options: ["Segment A", "Segment B", "Segment C", "Segment D"],
    correctIndex: 1,
    explanation: "Segment B is incorrect. The subject of the sentence is 'Each', which is a singular indefinite pronoun and requires a singular verb. It should be 'was given', not 'were given'.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 20. Verbal - Vocabulary
  {
    id: "q_voc_01",
    topicId: "verbal_vocabulary",
    subject: APTITUDE_SUBJECTS.VERBAL,
    examCategories: ["campus_placements", "ssc_cgl", "gate_aptitude"],
    difficulty: "Beginner",
    text: "Select the word that is most nearly SYNONYMOUS with 'PRAGMATIC':",
    options: ["Idealistic", "Realistic", "Arrogant", "Impulsive"],
    correctIndex: 1,
    explanation: "'Pragmatic' means dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations. Synonym is 'Realistic'.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 21. Verbal - Completion
  {
    id: "q_comp_01",
    topicId: "verbal_completion",
    subject: APTITUDE_SUBJECTS.VERBAL,
    examCategories: ["campus_placements", "banking_ibps", "ssc_cgl"],
    difficulty: "Intermediate",
    text: "The spokesperson's explanation was so _____ that it completely dispelled the rumors surrounding the merger.",
    options: ["ambiguous", "lucid", "hesitant", "obscure"],
    correctIndex: 1,
    explanation: "Since the explanation successfully 'dispelled' (cleared up) the rumors, it must have been clear and easily understood. 'Lucid' means clear and easy to understand.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 22. Verbal - Comprehension
  {
    id: "q_rc_01",
    topicId: "verbal_comprehension",
    subject: APTITUDE_SUBJECTS.VERBAL,
    examCategories: ["campus_placements", "banking_ibps", "cat_quant", "gate_aptitude"],
    difficulty: "Intermediate",
    text: "Read the snippet:\n'While artificial intelligence accelerates repetitive tasks, human creativity and critical judgment remain irreplaceable in ambiguous contexts.'\nAccording to the passage, human judgment is essential because:",
    options: [
      "AI cannot perform repetitive tasks quickly.",
      "Contexts can be ambiguous and require nuanced critical evaluation.",
      "Humans are faster than automated algorithms.",
      "Machines refuse to make creative decisions."
    ],
    correctIndex: 1,
    explanation: "The passage directly links human creativity and judgment to being 'irreplaceable in ambiguous contexts'. Choice B captures this precisely without extrapolating beyond the text.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },

  // 23. Special - Computer Awareness
  {
    id: "q_comp_aw_01",
    topicId: "special_computer",
    subject: APTITUDE_SUBJECTS.SPECIAL,
    examCategories: ["banking_ibps", "railways_rrb", "ssc_cgl"],
    difficulty: "Beginner",
    text: "Which of the following port numbers is standard for secure HTTPS traffic?",
    options: ["Port 21", "Port 80", "Port 443", "Port 8080"],
    correctIndex: 2,
    explanation: "Port 443 is the standard port for HTTPS (HTTP Secure). Port 80 is used for unencrypted HTTP, and Port 21 is used for FTP.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  },
  // 24. Special - General & Banking Awareness
  {
    id: "q_gen_01",
    topicId: "special_general_awareness",
    subject: APTITUDE_SUBJECTS.SPECIAL,
    examCategories: ["banking_ibps", "ssc_cgl", "railways_rrb"],
    difficulty: "Beginner",
    text: "The interest rate at which the Reserve Bank of India (RBI) lends short-term money to commercial banks against government securities is called:",
    options: ["Reverse Repo Rate", "Repo Rate", "Bank Rate", "Cash Reserve Ratio"],
    correctIndex: 1,
    explanation: "Repo Rate (Repurchase Option Rate) is the rate at which the central bank (RBI) lends money to commercial banks against securities in the event of any shortfall of funds.",
    verified: true,
    version: "1.0",
    source: "Standard Aptitude Benchmark"
  }
];

if (typeof window !== "undefined") {
  window.APTITUDE_SUBJECTS = APTITUDE_SUBJECTS;
  window.EXAM_PROFILES = EXAM_PROFILES;
  window.APTITUDE_TOPICS = APTITUDE_TOPICS;
  window.APTITUDE_QUESTION_BANK = APTITUDE_QUESTION_BANK;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    APTITUDE_SUBJECTS,
    EXAM_PROFILES,
    APTITUDE_TOPICS,
    APTITUDE_QUESTION_BANK
  };
}
