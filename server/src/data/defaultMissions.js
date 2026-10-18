/**
 * Approved Initial Mission Catalogue — AquaLoop Phase 3B
 * Matches GAME_ECONOMY.md approved specifications.
 */

export const DEFAULT_MISSIONS = [
  // ── Learning Track ──────────────────────────────────────────────────────────
  {
    slug: 'learn-water-footprint-101',
    title: 'The Hidden Water in Food & Everyday Goods',
    description:
      'Learn about virtual water footprints and how household consumption choices affect water usage.',
    category: 'learning',
    difficulty: 'easy',
    baseXP: 40,
    bonusXP: 0,
    estimatedLitresSavedPerDay: 15,
    verificationType: 'quiz',
    prerequisites: [],
    quizQuestions: [
      {
        questionId: 'q1',
        prompt: 'What does the term "virtual water" refer to?',
        options: [
          'Water displayed in computer simulations',
          'The volume of freshwater used to produce food and consumer goods',
          'Water purified by reverse osmosis systems',
          'Atmospheric moisture that has not yet condensed into rain',
        ],
        correctOptionIndex: 1,
      },
      {
        questionId: 'q2',
        prompt: 'Approximately how much water is embedded in producing a single kilogram of rice in India?',
        options: [
          'About 100 litres',
          'About 500 litres',
          'About 2,500 to 4,000 litres',
          'Less than 50 litres',
        ],
        correctOptionIndex: 2,
      },
      {
        questionId: 'q3',
        prompt: 'Which dietary habit generally carries the lowest overall freshwater footprint?',
        options: [
          'Plant-rich, locally-grown, seasonal produce',
          'Heavy industrial beef and dairy consumption',
          'Imported processed packaged foods',
          'Excessive bottled mineral water consumption',
        ],
        correctOptionIndex: 0,
      },
      {
        questionId: 'q4',
        prompt: 'How can households directly reduce their indirect water footprint?',
        options: [
          'Leaving taps running while washing dishes',
          'Minimizing food waste and purchasing durable goods',
          'Using double water when boiling vegetables',
          'Watering gardens at noon under direct sunlight',
        ],
        correctOptionIndex: 1,
      },
      {
        questionId: 'q5',
        prompt: 'Which everyday textile requires the largest volume of agricultural irrigation water?',
        options: [
          'Recycled polyester',
          'Raw conventional cotton',
          'Organic linen',
          'Synthetic nylon',
        ],
        correctOptionIndex: 1,
      },
    ],
  },
  {
    slug: 'learn-groundwater-crisis',
    title: "India's Aquifers & Rainwater Harvesting",
    description:
      'Explore groundwater dynamics, extraction rates across peninsular and northern aquifers, and recharge wells.',
    category: 'learning',
    difficulty: 'medium',
    baseXP: 60,
    bonusXP: 0,
    estimatedLitresSavedPerDay: 25,
    verificationType: 'quiz',
    prerequisites: ['learn-water-footprint-101'],
    quizQuestions: [
      {
        questionId: 'q1',
        prompt: "Why is India considered the world's largest extractor of groundwater?",
        options: [
          'Extensive canal systems that drain all rivers',
          'Over 60% of irrigation and 85% of rural domestic drinking water rely on borewells',
          'Groundwater is solely exported to neighbouring countries',
          'Industrial cooling towers consume 95% of national rainfall',
        ],
        correctOptionIndex: 1,
      },
      {
        questionId: 'q2',
        prompt: 'What is a percolation pit or recharge well primarily designed to do?',
        options: [
          'Evaporate stormwater into the upper atmosphere',
          'Direct rooftop and surface rainwater into unconfined aquifer layers',
          'Store greywater from toilets',
          'Pump water out of the ground at maximum speed',
        ],
        correctOptionIndex: 1,
      },
      {
        questionId: 'q3',
        prompt: 'What environmental disaster frequently follows prolonged over-extraction of deep aquifers?',
        options: [
          'Land subsidence and irreversible loss of aquifer storage capacity',
          'Sudden flash floods in the desert',
          'Increased freshwater springs',
          'Excessive glacier growth in mountains',
        ],
        correctOptionIndex: 0,
      },
      {
        questionId: 'q4',
        prompt: 'In urban rainwater harvesting, what is the role of a "first flush" diverter?',
        options: [
          'To heat the harvested rainwater before storage',
          'To discard the initial runoff containing roof dust, leaves, and bird droppings',
          'To add chlorine tablets to the tank',
          'To measure the pH of ambient rainfall',
        ],
        correctOptionIndex: 1,
      },
      {
        questionId: 'q5',
        prompt: 'Which Indian national platform provides open satellite and well telemetry on water reserves?',
        options: [
          'India-WRIS (Water Resources Information System)',
          'AquaLeak Global Tracker',
          'RainfallNow Free API',
          'HydroPay Commerce',
        ],
        correctOptionIndex: 0,
      },
    ],
  },
  {
    slug: 'learn-urban-water-cycle',
    title: 'Stormwater, Greywater, and Blackwater Management',
    description:
      'Master the distinction between domestic wastewater streams and how decentralized treatment protects lakes.',
    category: 'learning',
    difficulty: 'hard',
    baseXP: 90,
    bonusXP: 0,
    estimatedLitresSavedPerDay: 35,
    verificationType: 'quiz',
    prerequisites: ['learn-groundwater-crisis'],
    quizQuestions: [
      {
        questionId: 'q1',
        prompt: 'What is the key difference between greywater and blackwater?',
        options: [
          'Greywater is rainwater; blackwater is river water',
          'Greywater comes from sinks/showers/laundry; blackwater comes from toilets and carries pathogens',
          'Greywater has zero chemicals; blackwater contains industrial lead',
          'Greywater is completely drinkable without boiling',
        ],
        correctOptionIndex: 1,
      },
      {
        questionId: 'q2',
        prompt: 'How can domestic RO (Reverse Osmosis) reject water be safely utilized?',
        options: [
          'Infant formula preparation',
          'Mop floors, flush toilets, and wash outdoor surfaces',
          'Direct injection into deep borewells without filtering',
          'Cooking soup and drinking water',
        ],
        correctOptionIndex: 1,
      },
      {
        questionId: 'q3',
        prompt: 'What role do urban wetlands and retention lakes play in the urban water cycle?',
        options: [
          'They increase the speed of urban stormwater into storm sewers',
          'They act as natural sponges, filtering pollutants and buffering against urban flooding',
          'They solely serve as disposal dumps for construction debris',
          'They completely block all groundwater infiltration',
        ],
        correctOptionIndex: 1,
      },
      {
        questionId: 'q4',
        prompt: 'In a dual-plumbing residential building, what is recycled treated wastewater used for?',
        options: [
          'Toilet flushing and landscape irrigation',
          'Kitchen sink drinking taps',
          'Bathroom shower heads',
          'Swimming pool refills',
        ],
        correctOptionIndex: 0,
      },
      {
        questionId: 'q5',
        prompt: 'What is the primary danger of connecting untreated sewer lines to city storm drains?',
        options: [
          'It makes rainwater smell like ocean salt',
          'Severe contamination of receiving urban waterbodies and toxic foam formation',
          'It completely stops rain from falling',
          'It decreases atmospheric temperature by 10 degrees',
        ],
        correctOptionIndex: 1,
      },
    ],
  },

  // ── Action Track (Home & Habit) ─────────────────────────────────────────────
  {
    slug: 'act-bucket-bath',
    title: 'Switch Shower to Bucket Bath',
    description:
      'Use a standard 15-20L bucket instead of an overhead shower, saving up to 45 litres per bath.',
    category: 'action',
    difficulty: 'easy',
    baseXP: 25,
    bonusXP: 0,
    estimatedLitresSavedPerDay: 45,
    verificationType: 'self_report',
    prerequisites: [],
  },
  {
    slug: 'act-aerator-install',
    title: 'Install Low-Flow Tap Aerator',
    description:
      'Screw a water-saving aerator onto your kitchen or bathroom faucet to reduce water flow by 50% without losing pressure.',
    category: 'action',
    difficulty: 'easy',
    baseXP: 35,
    bonusXP: 50,
    estimatedLitresSavedPerDay: 30,
    verificationType: 'photo_proof',
    prerequisites: [],
  },
  {
    slug: 'act-fix-dripping-tap',
    title: 'Repair Dripping Tap / Washer',
    description:
      'Replace a worn rubber washer or cartridge on a leaky faucet. A single leak can waste 60 litres every day.',
    category: 'action',
    difficulty: 'medium',
    baseXP: 50,
    bonusXP: 75,
    estimatedLitresSavedPerDay: 60,
    verificationType: 'photo_proof',
    prerequisites: [],
  },
  {
    slug: 'act-greywater-divert',
    title: 'Reuse RO Reject / AC Condensate',
    description:
      'Collect pure air conditioner condensate or RO reject drain water in buckets to water balcony plants or mop floors.',
    category: 'action',
    difficulty: 'medium',
    baseXP: 45,
    bonusXP: 60,
    estimatedLitresSavedPerDay: 25,
    verificationType: 'photo_proof',
    prerequisites: [],
  },
  {
    slug: 'act-mulch-garden',
    title: 'Mulch Soil Beds to Retain Moisture',
    description:
      'Spread dry leaves, coconut husk, or bark chips over plant pots and garden soil to reduce evaporation loss.',
    category: 'action',
    difficulty: 'medium',
    baseXP: 40,
    bonusXP: 50,
    estimatedLitresSavedPerDay: 20,
    verificationType: 'photo_proof',
    prerequisites: [],
  },
  {
    slug: 'act-rainwater-catchment',
    title: 'Set Up Rainwater Harvesting Barrel',
    description:
      'Position a clean collection drum under a rooftop downspout with a wire mesh filter to capture monsoonal rains.',
    category: 'action',
    difficulty: 'hard',
    baseXP: 80,
    bonusXP: 120,
    estimatedLitresSavedPerDay: 200,
    verificationType: 'photo_proof',
    prerequisites: [],
  },

  // ── Civic Track (Community Water Monitoring) ────────────────────────────────
  {
    slug: 'civ-report-leak',
    title: 'Report Public Pipeline Leak',
    description:
      'Document and geo-tag an active public water supply or pipeline leak in your neighbourhood for municipal intervention.',
    category: 'civic',
    difficulty: 'medium',
    baseXP: 40,
    bonusXP: 60,
    estimatedLitresSavedPerDay: 500,
    verificationType: 'civic_report',
    prerequisites: [],
  },
  {
    slug: 'civ-water-quality-audit',
    title: 'Community Water Source Audit',
    description:
      'Document the condition of a local lake, open well, or public water fountain, noting cleanliness and water clarity.',
    category: 'civic',
    difficulty: 'hard',
    baseXP: 50,
    bonusXP: 75,
    estimatedLitresSavedPerDay: 100,
    verificationType: 'civic_report',
    prerequisites: [],
  },
]
