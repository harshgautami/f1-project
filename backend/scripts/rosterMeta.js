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

// Team facts (2026 grid) by constructorId. firstEntry, worldChampionships and
// the team principal are NOT here: the first two are computed from the API and
// the principal is read from the management entry in TEAM_STAFF.
const TEAM_META = {
  red_bull: {
    fullName: "Oracle Red Bull Racing",
    base: "Milton Keynes, United Kingdom",
    powerUnit: "Red Bull Ford",
  },
  ferrari: {
    fullName: "Scuderia Ferrari HP",
    base: "Maranello, Italy",
    powerUnit: "Ferrari",
  },
  mercedes: {
    fullName: "Mercedes-AMG PETRONAS F1 Team",
    base: "Brackley, United Kingdom",
    powerUnit: "Mercedes",
  },
  mclaren: {
    fullName: "McLaren Formula 1 Team",
    base: "Woking, United Kingdom",
    powerUnit: "Mercedes",
  },
  aston_martin: {
    fullName: "Aston Martin Aramco F1 Team",
    base: "Silverstone, United Kingdom",
    powerUnit: "Honda",
  },
  alpine: {
    fullName: "BWT Alpine F1 Team",
    base: "Enstone, United Kingdom",
    powerUnit: "Mercedes",
  },
  williams: {
    fullName: "Atlassian Williams Racing",
    base: "Grove, United Kingdom",
    powerUnit: "Mercedes",
  },
  rb: {
    fullName: "Visa Cash App Racing Bulls F1 Team",
    base: "Faenza, Italy",
    powerUnit: "Red Bull Ford",
  },
  haas: {
    fullName: "MoneyGram Haas F1 Team",
    base: "Kannapolis, United States",
    powerUnit: "Ferrari",
  },
  audi: {
    fullName: "Audi Revolut F1 Team",
    base: "Hinwil, Switzerland",
    powerUnit: "Audi",
  },
  cadillac: {
    fullName: "Cadillac Formula 1 Team",
    base: "Fishers, Indiana, United States",
    powerUnit: "Ferrari",
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
      "experience": ""
    },
    {
      "name": "Andrea Landi",
      "role": "Head of Performance",
      "department": "aerodynamics",
      "nationality": "Italian",
      "experience": "Ex-Ferrari Deputy Head of Vehicle Performance; joined July 2026"
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
      "experience": ""
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
      "experience": ""
    },
    {
      "name": "Fabio Montecchi",
      "role": "Chief Project Engineer",
      "department": "mechanical",
      "nationality": "Italian",
      "experience": ""
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
      "experience": ""
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
      "experience": ""
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
      "role": "Technical Director, Engineering",
      "department": "mechanical",
      "nationality": "British",
      "experience": ""
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
    },
    {
      "name": "Piers Thynne",
      "role": "Chief Operating Officer",
      "department": "management",
      "nationality": "British",
      "experience": ""
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
      "role": "Senior Race Engineer (Fernando Alonso)",
      "department": "strategy",
      "nationality": "British",
      "experience": ""
    },
    {
      "name": "Gary Gannon",
      "role": "Race Engineer (Lance Stroll)",
      "department": "strategy",
      "nationality": "British",
      "experience": ""
    },
    {
      "name": "Lawrence Stroll",
      "role": "Executive Chairman / Owner",
      "department": "management",
      "nationality": "Canadian",
      "experience": ""
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
      "experience": ""
    },
    {
      "name": "Josh Peckett",
      "role": "Race Engineer (Pierre Gasly)",
      "department": "strategy",
      "nationality": "British",
      "experience": ""
    },
    {
      "name": "Stuart Barlow",
      "role": "Race Engineer (Franco Colapinto)",
      "department": "strategy",
      "nationality": "British",
      "experience": ""
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
      "experience": ""
    },
    {
      "name": "James Urwin",
      "role": "Race Engineer (Alex Albon)",
      "department": "strategy",
      "nationality": "British",
      "experience": ""
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
      "name": "Guillaume Cattelani",
      "role": "Deputy Technical Director (Performance)",
      "department": "mechanical",
      "nationality": "French",
      "experience": ""
    },
    {
      "name": "Andrea Landi",
      "role": "Deputy Technical Director",
      "department": "mechanical",
      "nationality": "Italian",
      "experience": ""
    },
    {
      "name": "Alexandre Iliopoulos",
      "role": "Race Engineer (Liam Lawson)",
      "department": "strategy",
      "nationality": "",
      "experience": ""
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
      "experience": ""
    },
    {
      "name": "Mark Lowe",
      "role": "Sporting Director",
      "department": "management",
      "nationality": "British",
      "experience": ""
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
      "experience": ""
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
      "experience": ""
    },
    {
      "name": "Alessandro Cinelli",
      "role": "Head of Aerodynamics",
      "department": "aerodynamics",
      "nationality": "Italian",
      "experience": ""
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
      "experience": ""
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
      "role": "Technical Advisor",
      "department": "management",
      "nationality": "Japanese",
      "experience": ""
    }
  ]
};

/** Team principal for a constructor name, read from its management staff. */
function teamPrincipalFor(constructorName) {
  const staff = TEAM_STAFF[constructorName] || [];
  const mgmt = staff.filter((m) => m.department === "management");
  const tp = mgmt.find((m) => /team principal/i.test(m.role)) || mgmt[0];
  return tp ? tp.name : "";
}

module.exports = { TEAM_COLORS, TEAM_META, TEAM_STAFF, teamPrincipalFor };
