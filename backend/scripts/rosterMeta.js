/* ---------------------------------------------------------------------------
   Curated roster metadata that no results API supplies.

   Everything race-related (calendar, results, standings, driver careers) comes
   from the Jolpica API in sync.js. The three maps below are the hand-maintained
   remainder, keyed by Jolpica's constructorId (colours, team facts) or the
   constructor's API name (staff). Update them when the grid changes.
   --------------------------------------------------------------------------- */

// Jolpica doesn't supply team colours; map by constructorId.
const TEAM_COLORS = {
  red_bull: "#3671C6",
  ferrari: "#E8002D",
  mercedes: "#27F4D2",
  mclaren: "#FF8000",
  aston_martin: "#229971",
  alpine: "#0093CC",
  williams: "#64C4FF",
  rb: "#6692FF",
  sauber: "#52E252",
  audi: "#00D5B8",
  haas: "#B6BABD",
  cadillac: "#C69A5A",
};

// Team facts (2026 grid) by constructorId. `mediaSlug` is the team's folder on
// media.formula1.com (driver photos + logos). firstEntry, worldChampionships and
// the team principal are NOT here: the first two are computed from the API and
// the principal is read from the management entry in TEAM_STAFF.
const TEAM_META = {
  red_bull: {
    fullName: "Oracle Red Bull Racing",
    base: "Milton Keynes, United Kingdom",
    powerUnit: "Red Bull Ford",
    chassis: "RB22",
    mediaSlug: "redbullracing",
  },
  ferrari: {
    fullName: "Scuderia Ferrari HP",
    base: "Maranello, Italy",
    powerUnit: "Ferrari",
    chassis: "SF-26",
    mediaSlug: "ferrari",
  },
  mercedes: {
    fullName: "Mercedes-AMG PETRONAS F1 Team",
    base: "Brackley, United Kingdom",
    powerUnit: "Mercedes",
    chassis: "W17",
    mediaSlug: "mercedes",
  },
  mclaren: {
    fullName: "McLaren Formula 1 Team",
    base: "Woking, United Kingdom",
    powerUnit: "Mercedes",
    chassis: "MCL40",
    mediaSlug: "mclaren",
  },
  aston_martin: {
    fullName: "Aston Martin Aramco F1 Team",
    base: "Silverstone, United Kingdom",
    powerUnit: "Honda",
    chassis: "AMR26",
    mediaSlug: "astonmartin",
  },
  alpine: {
    fullName: "BWT Alpine F1 Team",
    base: "Enstone, United Kingdom",
    powerUnit: "Mercedes",
    chassis: "A526",
    mediaSlug: "alpine",
  },
  williams: {
    fullName: "Atlassian Williams Racing",
    base: "Grove, United Kingdom",
    powerUnit: "Mercedes",
    chassis: "FW48",
    mediaSlug: "williams",
  },
  rb: {
    fullName: "Visa Cash App Racing Bulls F1 Team",
    base: "Faenza, Italy",
    powerUnit: "Red Bull Ford",
    chassis: "VCARB 03",
    mediaSlug: "racingbulls",
  },
  haas: {
    fullName: "MoneyGram Haas F1 Team",
    base: "Kannapolis, United States",
    powerUnit: "Ferrari",
    chassis: "VF-26",
    mediaSlug: "haasf1team",
  },
  audi: {
    fullName: "Audi Revolut F1 Team",
    base: "Hinwil, Switzerland",
    powerUnit: "Audi",
    chassis: "R26",
    mediaSlug: "audi",
  },
  cadillac: {
    fullName: "Cadillac Formula 1 Team",
    base: "Fishers, Indiana, United States",
    powerUnit: "Ferrari",
    chassis: "MAC-26",
    mediaSlug: "cadillac",
  },
};

// Curated current-season staff keyed by the API constructor NAME. Populated
// from research; safe to extend. Empty entries are simply skipped.
const TEAM_STAFF = {
  "Red Bull": [
    {
      "name": "Laurent Mekies",
      "role": "Team Principal & CEO",
      "department": "management",
      "nationality": "French",
      "experience": "20+ years in motorsport; RBR TP since July 2025"
    },
    {
      "name": "Pierre Wache",
      "role": "Technical Director",
      "department": "mechanical",
      "nationality": "French",
      "experience": "With Red Bull since 2013"
    },
    {
      "name": "Ben Waterhouse",
      "role": "Chief Performance and Design Engineer",
      "department": "mechanical",
      "nationality": "British",
      "experience": "Ex-Toro Rosso deputy TD; back at Red Bull since 2017"
    },
    {
      "name": "Andrea Landi",
      "role": "Head of Performance",
      "department": "aerodynamics",
      "nationality": "Italian",
      "experience": "Ex-Racing Bulls deputy TD; joined Red Bull July 2026"
    },
    {
      "name": "Gianpiero Lambiase",
      "role": "Head of Race Engineering / Race Engineer (Verstappen)",
      "department": "strategy",
      "nationality": "British",
      "experience": "10+ years engineering Verstappen"
    },
    {
      "name": "Richard Wood",
      "role": "Race Engineer (Hadjar)",
      "department": "strategy",
      "nationality": "British",
      "experience": "At Red Bull since 2012"
    }
  ],
  "Ferrari": [
    {
      "name": "Frederic Vasseur",
      "role": "Team Principal",
      "department": "management",
      "nationality": "French",
      "experience": "Ferrari TP since 2023"
    },
    {
      "name": "Jerome D'Ambrosio",
      "role": "Deputy Team Principal",
      "department": "management",
      "nationality": "Belgian",
      "experience": "Ex-F1 driver, 3 Formula E wins; Ferrari DTP since Oct 2024"
    },
    {
      "name": "Loic Serra",
      "role": "Technical Director (Chassis)",
      "department": "mechanical",
      "nationality": "French",
      "experience": "Joined from Mercedes"
    },
    {
      "name": "Diego Tondi",
      "role": "Head of Aerodynamics",
      "department": "aerodynamics",
      "nationality": "Italian",
      "experience": "At Ferrari since 2007; head of aero since 2024"
    },
    {
      "name": "Fabio Montecchi",
      "role": "Chief Project Engineer",
      "department": "mechanical",
      "nationality": "Italian",
      "experience": "At Ferrari since 2003; ex-deputy chief designer"
    },
    {
      "name": "Bryan Bozzi",
      "role": "Race Engineer (Leclerc)",
      "department": "strategy",
      "nationality": "Italian",
      "experience": "Leclerc's engineer since 2024"
    }
  ],
  "Mercedes": [
    {
      "name": "Toto Wolff",
      "role": "Team Principal & CEO",
      "department": "management",
      "nationality": "Austrian",
      "experience": "Mercedes TP since 2013"
    },
    {
      "name": "James Allison",
      "role": "Technical Director",
      "department": "mechanical",
      "nationality": "British",
      "experience": "30+ years in F1"
    },
    {
      "name": "Andrew Shovlin",
      "role": "Trackside Engineering Director",
      "department": "strategy",
      "nationality": "British",
      "experience": "Button's race engineer for his 2009 title"
    },
    {
      "name": "Peter Bonnington",
      "role": "Head of Race Engineering / Race Engineer (Antonelli)",
      "department": "strategy",
      "nationality": "British",
      "experience": "Six titles engineering Hamilton"
    },
    {
      "name": "Marcus Dudley",
      "role": "Race Engineer (Russell)",
      "department": "strategy",
      "nationality": "British",
      "experience": "Russell's engineer since 2023"
    },
    {
      "name": "Matt Deane",
      "role": "Chief Mechanic",
      "department": "pitstop",
      "nationality": "British",
      "experience": "Also heads race-team garage operations"
    }
  ],
  "McLaren": [
    {
      "name": "Andrea Stella",
      "role": "Team Principal",
      "department": "management",
      "nationality": "Italian",
      "experience": "20+ years in F1; 2024 & 2025 Constructors' title-winning boss"
    },
    {
      "name": "Peter Prodromou",
      "role": "Technical Director, Aerodynamics",
      "department": "aerodynamics",
      "nationality": "British",
      "experience": "30+ years in F1 aero"
    },
    {
      "name": "Neil Houldey",
      "role": "Technical Director, Applied Engineering",
      "department": "mechanical",
      "nationality": "British",
      "experience": "McLaren engineer since 2006; ex-Lola"
    },
    {
      "name": "Rob Marshall",
      "role": "Chief Designer",
      "department": "mechanical",
      "nationality": "British",
      "experience": "Ex-Red Bull chief engineering officer"
    },
    {
      "name": "Will Joseph",
      "role": "Race Engineer (Lando Norris) / Director of Race Engineering",
      "department": "strategy",
      "nationality": "British",
      "experience": "20 years at McLaren"
    },
    {
      "name": "Tom Stallard",
      "role": "Race Engineer (Oscar Piastri)",
      "department": "strategy",
      "nationality": "British",
      "experience": "Long-serving McLaren race engineer; 2008 Olympic rowing silver medallist"
    }
  ],
  "Aston Martin": [
    {
      "name": "Adrian Newey",
      "role": "Team Principal / Managing Technical Partner",
      "department": "management",
      "nationality": "British",
      "experience": "Most successful car designer in F1 history"
    },
    {
      "name": "Enrico Cardile",
      "role": "Chief Technical Officer",
      "department": "mechanical",
      "nationality": "Italian",
      "experience": "Former Ferrari technical director; joined July 2025"
    },
    {
      "name": "Andy Cowell",
      "role": "Chief Strategy Officer",
      "department": "strategy",
      "nationality": "British",
      "experience": "Ex-Mercedes HPP MD; former team principal/CEO"
    },
    {
      "name": "Chris Cronin",
      "role": "Senior Race Engineer (Fernando Alonso) / Chief Engineer, Trackside",
      "department": "strategy",
      "nationality": "British",
      "experience": "Ex-Vettel race engineer"
    },
    {
      "name": "Gary Gannon",
      "role": "Senior Race Engineer (Lance Stroll)",
      "department": "strategy",
      "nationality": "American",
      "experience": "Ex-Haas and Virgin engineer; started in CART"
    },
    {
      "name": "Lawrence Stroll",
      "role": "Executive Chairman / Owner",
      "department": "management",
      "nationality": "Canadian",
      "experience": "Aston Martin Lagonda executive chairman since 2020"
    }
  ],
  "Alpine F1 Team": [
    {
      "name": "Flavio Briatore",
      "role": "Executive Advisor (de facto team boss)",
      "department": "management",
      "nationality": "Italian",
      "experience": "Former championship-winning Benetton/Renault boss"
    },
    {
      "name": "Steve Nielsen",
      "role": "Managing Director",
      "department": "management",
      "nationality": "British",
      "experience": "Ex-F1/FIA sporting director; former Enstone sporting director"
    },
    {
      "name": "David Sanchez",
      "role": "Executive Technical Director",
      "department": "mechanical",
      "nationality": "French",
      "experience": "Former Ferrari and McLaren senior technical figure"
    },
    {
      "name": "David Wheater",
      "role": "Technical Director, Aerodynamics",
      "department": "aerodynamics",
      "nationality": "British",
      "experience": "Ex-Williams aero director; at Benetton/Renault from 2000"
    },
    {
      "name": "Josh Peckett",
      "role": "Race Engineer (Pierre Gasly)",
      "department": "strategy",
      "nationality": "British",
      "experience": "Engineered Ocon's 2021 Hungary win; Gasly's since 2025"
    },
    {
      "name": "Stuart Barlow",
      "role": "Race Engineer (Franco Colapinto)",
      "department": "strategy",
      "nationality": "British",
      "experience": "Le Mans winner with Audi Joest; at Enstone since 2019"
    }
  ],
  "Williams": [
    {
      "name": "James Vowles",
      "role": "Team Principal",
      "department": "management",
      "nationality": "British",
      "experience": "20+ years in F1 (ex-Mercedes Motorsport Strategy Director)"
    },
    {
      "name": "Pat Fry",
      "role": "Chief Technical Officer",
      "department": "mechanical",
      "nationality": "British",
      "experience": "30+ years in F1 (McLaren, Ferrari, Alpine)"
    },
    {
      "name": "Adam Kenyon",
      "role": "Head of Aerodynamics",
      "department": "aerodynamics",
      "nationality": "British",
      "experience": "Ex-Red Bull and Mercedes aerodynamicist"
    },
    {
      "name": "Sven Smeets",
      "role": "Sporting Director",
      "department": "management",
      "nationality": "Belgian",
      "experience": "At Williams since 2021"
    },
    {
      "name": "Dave Robson",
      "role": "Head of Vehicle Performance",
      "department": "strategy",
      "nationality": "British",
      "experience": "Long-serving Williams senior engineer"
    },
    {
      "name": "Gaetan Jego",
      "role": "Race Engineer (Carlos Sainz)",
      "department": "strategy",
      "nationality": "French",
      "experience": "At Williams since 2020; Sainz's engineer since 2025"
    },
    {
      "name": "James Urwin",
      "role": "Race Engineer (Alex Albon)",
      "department": "strategy",
      "nationality": "British",
      "experience": "At Williams since 2014; Albon's engineer since 2022"
    },
    {
      "name": "Piers Thynne",
      "role": "Chief Optimisation and Planning Officer",
      "department": "management",
      "nationality": "British",
      "experience": "Ex-McLaren COO (2023–26); joined Williams 2026"
    }
  ],
  "RB F1 Team": [
    {
      "name": "Alan Permane",
      "role": "Team Principal",
      "department": "management",
      "nationality": "British",
      "experience": "30+ years in F1 (ex-Renault/Alpine Sporting Director)"
    },
    {
      "name": "Tim Goss",
      "role": "Chief Technical Officer",
      "department": "mechanical",
      "nationality": "British",
      "experience": "Ex-McLaren and FIA technical director"
    },
    {
      "name": "Dan Fallows",
      "role": "Technical Director",
      "department": "mechanical",
      "nationality": "British",
      "experience": "Ex-Aston Martin TD; ex-Red Bull head of aero"
    },
    {
      "name": "Alexandre Iliopoulos",
      "role": "Race Engineer (Liam Lawson)",
      "department": "strategy",
      "nationality": "Greek",
      "experience": "At Faenza since 2016; ex-Michelin engineer"
    }
  ],
  "Haas F1 Team": [
    {
      "name": "Ayao Komatsu",
      "role": "Team Principal",
      "department": "management",
      "nationality": "Japanese",
      "experience": "20+ years in F1; TP since 2024"
    },
    {
      "name": "Andrea De Zordo",
      "role": "Technical Director",
      "department": "mechanical",
      "nationality": "Italian",
      "experience": "Ex-Minardi, Red Bull, McLaren, Ferrari; Haas TD since 2024"
    },
    {
      "name": "Mark Lowe",
      "role": "Sporting Director",
      "department": "management",
      "nationality": "British",
      "experience": "Haas sporting director since Jan 2025"
    },
    {
      "name": "Laura Mueller",
      "role": "Race Engineer (Esteban Ocon)",
      "department": "strategy",
      "nationality": "German",
      "experience": "First female F1 race engineer (2025)"
    },
    {
      "name": "Ronan O'Hare",
      "role": "Race Engineer (Oliver Bearman)",
      "department": "strategy",
      "nationality": "British",
      "experience": "Ex-Brawn, Mercedes, Toro Rosso, Williams"
    }
  ],
  "Audi": [
    {
      "name": "Jonathan Wheatley",
      "role": "Team Principal",
      "department": "management",
      "nationality": "British",
      "experience": "Ex-Red Bull Sporting Director; Sauber/Audi TP since April 2025"
    },
    {
      "name": "Mattia Binotto",
      "role": "Head of Audi F1 Project (COO & CTO)",
      "department": "management",
      "nationality": "Italian",
      "experience": "30+ years in F1 (ex-Ferrari Team Principal)"
    },
    {
      "name": "James Key",
      "role": "Technical Director (Chassis)",
      "department": "mechanical",
      "nationality": "British",
      "experience": "25+ years in F1"
    },
    {
      "name": "Stefan Dreyer",
      "role": "Chief Technical Officer, Power Unit",
      "department": "mechanical",
      "nationality": "German",
      "experience": "Audi Sport engine engineer turned F1 PU chief"
    },
    {
      "name": "Alessandro Cinelli",
      "role": "Head of Aerodynamics",
      "department": "aerodynamics",
      "nationality": "Italian",
      "experience": "17 years at Ferrari; at Sauber since 2019"
    },
    {
      "name": "Giampaolo Dall'Ara",
      "role": "Head of Race Engineering",
      "department": "strategy",
      "nationality": "Italian",
      "experience": "20+ years at Sauber"
    },
    {
      "name": "Iñaki Rueda",
      "role": "Sporting Director",
      "department": "management",
      "nationality": "Spanish",
      "experience": "ex-Ferrari Head of Race Strategy"
    },
    {
      "name": "Stefano Sordo",
      "role": "Performance Director",
      "department": "strategy",
      "nationality": "Italian",
      "experience": "Ex-McLaren director of vehicle performance"
    }
  ],
  "Cadillac F1 Team": [
    {
      "name": "Graeme Lowdon",
      "role": "Team Principal",
      "department": "management",
      "nationality": "British",
      "experience": "ex-Virgin/Marussia F1"
    },
    {
      "name": "Nick Chester",
      "role": "Technical Director",
      "department": "mechanical",
      "nationality": "British",
      "experience": "25+ years (ex-Enstone/Renault)"
    },
    {
      "name": "Pat Symonds",
      "role": "Chief Technical Officer",
      "department": "mechanical",
      "nationality": "British",
      "experience": "40+ years in F1"
    },
    {
      "name": "Rob White",
      "role": "Chief Operating Officer",
      "department": "management",
      "nationality": "British",
      "experience": "ex-Renault power unit"
    },
    {
      "name": "Xavi Marcos",
      "role": "Chief Race Engineer",
      "department": "strategy",
      "nationality": "Spanish",
      "experience": "ex-Ferrari race engineer"
    },
    {
      "name": "Jon Tomlinson",
      "role": "Head of Aerodynamics",
      "department": "aerodynamics",
      "nationality": "British",
      "experience": "ex-Enstone aerodynamicist"
    },
    {
      "name": "Naoki Tokunaga",
      "role": "Senior Strategic Advisor",
      "department": "management",
      "nationality": "Japanese",
      "experience": "Ex-Renault F1 engine technical director"
    }
  ]
};

// Official lap length (km) per Jolpica circuitId. Where a layout changed inside
// the history window the value is a list of [firstSeason, km] steps.
const CIRCUIT_KM = {
  albert_park: [[0, 5.303], [2022, 5.278]],
  americas: 5.513,
  bahrain: 5.412,
  baku: 6.003,
  buddh: 5.125,
  catalunya: [[0, 4.655], [2021, 4.675], [2023, 4.657]],
  hockenheimring: 4.574,
  hungaroring: 4.381,
  imola: 4.909,
  interlagos: 4.309,
  istanbul: 5.338,
  jeddah: 6.174,
  losail: [[0, 5.38], [2023, 5.419]],
  madring: 5.416,
  marina_bay: [[0, 5.065], [2018, 5.063], [2023, 4.94]],
  miami: 5.412,
  monaco: 3.337,
  monza: 5.793,
  mugello: 5.245,
  nurburgring: 5.148,
  portimao: 4.653,
  red_bull_ring: 4.318,
  ricard: 5.842,
  rodriguez: 4.304,
  sepang: 5.543,
  shanghai: 5.451,
  silverstone: 5.891,
  sochi: 5.848,
  spa: 7.004,
  suzuka: 5.807,
  valencia: 5.419,
  vegas: 6.201,
  villeneuve: 4.361,
  yas_marina: [[0, 5.554], [2021, 5.281]],
  yeongam: 5.615,
  zandvoort: 4.259,
};

/** "5.278 km" for a circuit in a given season ("" when unknown). */
function circuitLengthFor(circuitId, season) {
  const v = CIRCUIT_KM[circuitId];
  if (v == null) return "";
  const km = Array.isArray(v) ? v.filter(([from]) => season >= from).at(-1)[1] : v;
  return `${km.toFixed(3)} km`;
}

/** Team principal for a constructor name, read from its management staff. */
function teamPrincipalFor(constructorName) {
  const staff = TEAM_STAFF[constructorName] || [];
  const mgmt = staff.filter((m) => m.department === "management");
  const tp = mgmt.find((m) => /team principal/i.test(m.role)) || mgmt[0];
  return tp ? tp.name : "";
}

module.exports = { TEAM_COLORS, TEAM_META, TEAM_STAFF, CIRCUIT_KM, teamPrincipalFor, circuitLengthFor };
