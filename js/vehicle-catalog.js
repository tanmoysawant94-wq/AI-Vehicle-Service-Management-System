const INDIA_VEHICLE_CATALOG = [
    { make: "Maruti Suzuki", aliases: ["Maruti", "Suzuki"], segment: "mass", models: ["Alto", "Alto K10", "S-Presso", "Celerio", "Wagon R", "Swift", "Dzire", "Baleno", "Ignis", "Fronx", "Brezza", "Grand Vitara", "Ertiga", "XL6", "Jimny", "Invicto", "Eeco", "Ciaz", "S-Cross", "Ritz", "Celerio X", "A-Star", "Esteem", "Kizashi"] },
    { make: "Hyundai", segment: "mainstream", models: ["Santro", "Eon", "Grand i10", "Grand i10 Nios", "i10", "i20", "i20 Active", "Aura", "Exter", "Venue", "Creta", "Alcazar", "Verna", "Elantra", "Tucson", "Ioniq 5", "Kona Electric", "Xcent", "Getz", "Accent"] },
    { make: "Tata", segment: "mainstream", models: ["Tiago", "Tigor", "Altroz", "Punch", "Nexon", "Harrier", "Safari", "Curvv", "Sierra", "Nexon EV", "Tiago EV", "Punch EV", "Tigor EV", "Curvv EV", "Harrier EV"] },
    { make: "Mahindra", segment: "mainstream", models: ["Bolero", "Bolero Neo", "Thar", "Thar Roxx", "Scorpio", "Scorpio Classic", "Scorpio N", "XUV 300", "XUV 3XO", "XUV 400", "XUV 500", "XUV 700", "Marazzo", "BE 6", "XEV 9e", "KUV 100", "TUV 300", "Alturas G4", "Verito"] },
    { make: "Toyota", segment: "mainstream", models: ["Fortuner", "Fortuner Legender", "Innova", "Innova Crysta", "Innova HyCross", "Urban Cruiser", "Urban Cruiser Hyryder", "Glanza", "Rumion", "Etios", "Etios Liva", "Corolla Altis", "Camry", "Hilux", "Land Cruiser Prado", "Land Cruiser 300", "Vellfire", "Taisor", "Yaris", "Qualis"] },
    { make: "Kia", segment: "mainstream", models: ["Sonet", "Seltos", "Carens", "Carnival", "EV6", "EV9", "Syros"] },
    { make: "Honda", segment: "mainstream", models: ["Amaze", "City", "Elevate", "Jazz", "Civic", "Accord", "BR-V", "WR-V", "Mobilio", "Brio", "CR-V"] },
    { make: "Renault", segment: "mass", models: ["Kwid", "Triber", "Kiger"] },
    { make: "Nissan", segment: "mainstream", models: ["Magnite", "X-Trail"] },
    { make: "Volkswagen", segment: "premium", models: ["Polo", "Vento", "Virtus", "Taigun", "Tiguan", "Tiguan Allspace", "Jetta", "Passat", "T-Roc", "Beetle"] },
    { make: "Skoda", segment: "premium", models: ["Rapid", "Slavia", "Kushaq", "Kodiaq", "Superb", "Octavia", "Laura", "Yeti", "Fabia"] },
    { make: "MG", segment: "mainstream", models: ["Comet EV", "Astor", "Hector", "Hector Plus", "Gloster", "ZS EV", "Windsor EV", "Cyberster", "M9"] },
    { make: "Citroen", segment: "mainstream", models: ["C3", "eC3", "Basalt", "Aircross", "C5 Aircross"] },
    { make: "Jeep", segment: "premium", models: ["Compass", "Meridian", "Wrangler", "Grand Cherokee"] },
    { make: "Isuzu", segment: "premium", models: ["D-Max", "V-Cross", "MU-X"] },
    { make: "Force Motors", aliases: ["Force"], segment: "mainstream", models: ["Gurkha", "Trax Cruiser", "Urbania"] },
    { make: "BMW", segment: "luxury", models: ["2 Series Gran Coupe", "3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "XM", "iX1", "iX", "i4", "i5", "i7", "Z4"] },
    { make: "Mercedes-Benz", aliases: ["Mercedes", "Benz"], segment: "luxury", models: ["A-Class", "A-Class Limousine", "B-Class", "C-Class", "E-Class", "S-Class", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "G-Class", "EQA", "EQB", "EQE", "EQS", "AMG GT"] },
    { make: "Audi", segment: "luxury", models: ["A4", "A6", "A8 L", "Q3", "Q5", "Q7", "Q8", "Q8 e-tron", "e-tron GT", "S5 Sportback"] },
    { make: "Volvo", segment: "luxury", models: ["XC40", "XC60", "XC90", "EX30", "C40 Recharge", "EC40", "S90"] },
    { make: "Lexus", segment: "luxury", models: ["ES", "NX", "RX", "LX", "LM", "LC 500h"] },
    { make: "Porsche", segment: "luxury", models: ["Macan", "Cayenne", "Panamera", "Taycan", "911"] },
    { make: "BYD", segment: "premium", models: ["Atto 3", "eMAX 7", "Seal", "Sealion 7", "E6"] },
    { make: "Mini", segment: "luxury", models: ["Cooper S", "Countryman", "Convertible"] },
    { make: "Jaguar", segment: "luxury", models: ["F-Pace", "I-Pace", "F-Type"] },
    { make: "Land Rover", segment: "luxury", models: ["Defender", "Discovery Sport", "Range Rover Evoque", "Range Rover Velar", "Range Rover Sport", "Range Rover"] },
    { make: "Tesla", segment: "luxury", models: ["Model 3", "Model Y"] },
    { make: "Aston Martin", segment: "luxury", models: ["DBX", "Vantage"] },
    { make: "Maserati", segment: "luxury", models: ["Grecale", "Levante", "Ghibli"] },
    { make: "Ferrari", segment: "luxury", models: ["Roma", "296 GTB", "Purosangue"] },
    { make: "Lamborghini", segment: "luxury", models: ["Urus", "Revuelto", "Huracan"] },
    { make: "Ford", segment: "mainstream", models: ["Figo", "Aspire", "EcoSport", "Endeavour", "Freestyle", "Mustang", "Fiesta", "Ikon"] },
    { make: "Chevrolet", segment: "mainstream", models: ["Beat", "Sail", "Cruze", "Tavera", "Captiva", "Enjoy", "Spark", "Optra"] },
    { make: "Datsun", segment: "mass", models: ["GO", "GO Plus", "Redi-GO"] },
    { make: "Fiat", segment: "mainstream", models: ["Punto", "Linea", "Avventura", "Urban Cross"] },
    { make: "Mitsubishi", segment: "premium", models: ["Pajero", "Pajero Sport", "Outlander", "Lancer", "Cedia"] }
];

const VEHICLE_PART_CATALOG = [
    { name: "Brake pads", aliases: ["brake pad", "brake pads", "brake-pad", "brake-pad set", "break pad", "break pads"], cost: { mass: [1800, 4500], mainstream: [2500, 8500], premium: [6000, 22000], luxury: [12000, 65000] }, minutes: [45, 90] },
    { name: "Brake discs / rotors", aliases: ["brake disc", "brake discs", "brake rotor", "brake rotors"], cost: { mass: [3500, 9000], mainstream: [5000, 18000], premium: [12000, 45000], luxury: [25000, 150000] }, minutes: [90, 180] },
    { name: "Brake caliper", aliases: ["brake caliper", "brake calliper"], cost: { mass: [4000, 12000], mainstream: [6000, 25000], premium: [18000, 60000], luxury: [35000, 200000] }, minutes: [90, 180] },
    { name: "Headlight assembly", aliases: ["headlight", "headlights", "head lamp", "headlamp", "headlight assembly"], cost: { mass: [3500, 16000], mainstream: [6000, 35000], premium: [18000, 90000], luxury: [45000, 400000] }, minutes: [60, 180] },
    { name: "Tail light assembly", aliases: ["tail light", "tail lights", "tail lamp", "taillight", "taillamp"], cost: { mass: [2500, 12000], mainstream: [4000, 24000], premium: [12000, 65000], luxury: [30000, 250000] }, minutes: [45, 120] },
    { name: "Front bumper", aliases: ["front bumper", "bumper"], cost: { mass: [5000, 18000], mainstream: [8000, 40000], premium: [20000, 100000], luxury: [50000, 350000] }, minutes: [180, 480] },
    { name: "Rear bumper", aliases: ["rear bumper"], cost: { mass: [5000, 18000], mainstream: [8000, 40000], premium: [20000, 100000], luxury: [50000, 350000] }, minutes: [180, 480] },
    { name: "Side mirror", aliases: ["side mirror", "door mirror", "wing mirror", "orvm"], cost: { mass: [1800, 8000], mainstream: [3000, 18000], premium: [10000, 45000], luxury: [20000, 160000] }, minutes: [30, 90] },
    { name: "Windshield", aliases: ["windshield", "windscreen", "front glass"], cost: { mass: [5000, 14000], mainstream: [7000, 25000], premium: [18000, 50000], luxury: [35000, 180000] }, minutes: [120, 240] },
    { name: "Battery", aliases: ["battery", "car battery", "12v battery"], cost: { mass: [4000, 10000], mainstream: [5000, 16000], premium: [9000, 30000], luxury: [15000, 80000] }, minutes: [30, 60] },
    { name: "Alternator", aliases: ["alternator"], cost: { mass: [6000, 16000], mainstream: [8000, 28000], premium: [18000, 60000], luxury: [35000, 180000] }, minutes: [120, 240] },
    { name: "Starter motor", aliases: ["starter motor", "starter"], cost: { mass: [4500, 11000], mainstream: [6000, 18000], premium: [12000, 45000], luxury: [25000, 120000] }, minutes: [90, 180] },
    { name: "Radiator", aliases: ["radiator"], cost: { mass: [5000, 14000], mainstream: [7000, 25000], premium: [16000, 55000], luxury: [30000, 150000] }, minutes: [150, 300] },
    { name: "AC compressor", aliases: ["ac compressor", "air conditioner compressor", "air conditioning compressor"], cost: { mass: [12000, 28000], mainstream: [16000, 45000], premium: [30000, 90000], luxury: [55000, 250000] }, minutes: [180, 360] },
    { name: "AC condenser", aliases: ["ac condenser", "air conditioner condenser"], cost: { mass: [6000, 15000], mainstream: [8000, 25000], premium: [16000, 50000], luxury: [30000, 150000] }, minutes: [120, 240] },
    { name: "Shock absorber", aliases: ["shock absorber", "shocker"], cost: { mass: [2500, 7000], mainstream: [3500, 12000], premium: [8000, 30000], luxury: [18000, 100000] }, minutes: [90, 180] },
    { name: "Suspension strut", aliases: ["suspension strut", "strut"], cost: { mass: [4000, 10000], mainstream: [6000, 18000], premium: [14000, 50000], luxury: [30000, 160000] }, minutes: [120, 240] },
    { name: "Clutch kit", aliases: ["clutch kit", "clutch plate", "clutch"], cost: { mass: [7000, 18000], mainstream: [10000, 32000], premium: [20000, 70000], luxury: [40000, 220000] }, minutes: [240, 480] },
    { name: "Engine oil", aliases: ["engine oil", "motor oil"], cost: { mass: [1200, 3500], mainstream: [1800, 6000], premium: [3500, 12000], luxury: [6000, 25000] }, minutes: [30, 60] },
    { name: "Oil filter", aliases: ["oil filter"], cost: { mass: [250, 900], mainstream: [350, 1400], premium: [700, 3000], luxury: [1200, 8000] }, minutes: [30, 60] },
    { name: "Air filter", aliases: ["air filter", "engine air filter"], cost: { mass: [300, 1200], mainstream: [450, 1800], premium: [900, 4000], luxury: [1800, 10000] }, minutes: [20, 45] },
    { name: "Cabin / AC filter", aliases: ["cabin filter", "ac filter", "pollen filter"], cost: { mass: [350, 1500], mainstream: [500, 2200], premium: [1000, 5000], luxury: [2000, 12000] }, minutes: [20, 45] },
    { name: "Fuel filter", aliases: ["fuel filter"], cost: { mass: [500, 2500], mainstream: [800, 4000], premium: [1800, 9000], luxury: [3500, 22000] }, minutes: [45, 120] },
    { name: "Spark plugs", aliases: ["spark plug", "spark plugs", "glow plug", "glow plugs"], cost: { mass: [600, 3000], mainstream: [900, 5000], premium: [2000, 12000], luxury: [4000, 30000] }, minutes: [45, 120] },
    { name: "Fuel injector", aliases: ["fuel injector", "injector"], cost: { mass: [3000, 10000], mainstream: [4500, 18000], premium: [12000, 45000], luxury: [25000, 150000] }, minutes: [120, 300] },
    { name: "Water pump", aliases: ["water pump"], cost: { mass: [2500, 8000], mainstream: [3500, 13000], premium: [9000, 35000], luxury: [18000, 100000] }, minutes: [180, 360] },
    { name: "Timing belt / chain", aliases: ["timing belt", "timing chain"], cost: { mass: [5000, 16000], mainstream: [7000, 25000], premium: [15000, 60000], luxury: [30000, 180000] }, minutes: [240, 480] },
    { name: "Turbocharger", aliases: ["turbocharger", "turbo"], cost: { mass: [25000, 70000], mainstream: [35000, 120000], premium: [80000, 250000], luxury: [150000, 800000] }, minutes: [360, 720] },
    { name: "Tyre", aliases: ["tyre", "tire", "car tyre", "car tire"], cost: { mass: [3500, 8000], mainstream: [5000, 16000], premium: [10000, 35000], luxury: [18000, 80000] }, minutes: [30, 60] },
    { name: "Alloy wheel", aliases: ["alloy wheel", "wheel rim", "rim"], cost: { mass: [5000, 14000], mainstream: [7000, 25000], premium: [18000, 60000], luxury: [35000, 200000] }, minutes: [30, 90] },
    { name: "Wiper blades", aliases: ["wiper blade", "wiper blades", "windshield wiper", "wipers"], cost: { mass: [400, 1800], mainstream: [600, 2500], premium: [1200, 6000], luxury: [2500, 15000] }, minutes: [10, 30] },
    { name: "Door assembly", aliases: ["car door", "door panel", "door"], cost: { mass: [12000, 35000], mainstream: [18000, 65000], premium: [40000, 150000], luxury: [80000, 500000] }, minutes: [240, 600] },
    { name: "Bonnet / hood", aliases: ["bonnet", "hood"], cost: { mass: [8000, 25000], mainstream: [12000, 45000], premium: [30000, 120000], luxury: [65000, 400000] }, minutes: [180, 420] },
    { name: "Fuel pump", aliases: ["fuel pump"], cost: { mass: [3500, 11000], mainstream: [5000, 18000], premium: [12000, 50000], luxury: [25000, 150000] }, minutes: [120, 240] },
    { name: "Exhaust / catalytic converter", aliases: ["exhaust", "catalytic converter", "catalytic convertor"], cost: { mass: [8000, 30000], mainstream: [12000, 50000], premium: [30000, 120000], luxury: [60000, 400000] }, minutes: [180, 420] },
    { name: "Wheel bearing", aliases: ["wheel bearing"], cost: { mass: [2500, 7000], mainstream: [3500, 12000], premium: [8000, 30000], luxury: [16000, 90000] }, minutes: [90, 180] },
    { name: "CV axle / drive shaft", aliases: ["cv axle", "drive shaft", "driveshaft"], cost: { mass: [5000, 15000], mainstream: [7000, 25000], premium: [16000, 60000], luxury: [30000, 180000] }, minutes: [120, 240] },
    { name: "Power window regulator", aliases: ["window regulator", "power window", "window motor"], cost: { mass: [2500, 7000], mainstream: [3500, 12000], premium: [8000, 35000], luxury: [16000, 100000] }, minutes: [90, 180] },
    { name: "Parking sensor", aliases: ["parking sensor", "reverse sensor"], cost: { mass: [1000, 4000], mainstream: [1500, 7000], premium: [4000, 18000], luxury: [8000, 50000] }, minutes: [45, 120] },
    { name: "Front camera / ADAS sensor", aliases: ["adas sensor", "front camera", "radar sensor"], cost: { mass: [8000, 30000], mainstream: [12000, 50000], premium: [30000, 120000], luxury: [60000, 350000] }, minutes: [90, 240] },
    { name: "EV traction battery", aliases: ["ev battery", "traction battery", "high voltage battery"], cost: { mass: [120000, 450000], mainstream: [250000, 900000], premium: [500000, 1800000], luxury: [900000, 5000000] }, minutes: [240, 600] },
    { name: "EV drive motor", aliases: ["ev motor", "electric motor", "drive motor"], cost: { mass: [80000, 250000], mainstream: [150000, 550000], premium: [350000, 1200000], luxury: [650000, 3000000] }, minutes: [240, 600] }
];

function normalizeCatalogText(value) {
    return " " + String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ") + " ";
}

function findIndiaVehiclePart(query) {
    const normalized = normalizeCatalogText(query);
    const make = INDIA_VEHICLE_CATALOG.find(function (entry) {
        return [entry.make].concat(entry.aliases || []).some(function (alias) {
            return normalized.includes(normalizeCatalogText(alias));
        });
    });
    const models = [];
    INDIA_VEHICLE_CATALOG.forEach(function (entry) {
        entry.models.forEach(function (model) {
            models.push({ name: model, make: entry.make, segment: entry.segment });
        });
    });
    models.sort(function (a, b) {
        return b.name.length - a.name.length;
    });
    const vehicle = models.find(function (entry) {
        return normalized.includes(normalizeCatalogText(entry.name)) &&
            (!make || entry.make === make.make);
    }) || (make ? { name: "", make: make.make, segment: make.segment } : null);

    const parts = VEHICLE_PART_CATALOG.slice().sort(function (a, b) {
        return Math.max.apply(null, b.aliases.map(function (alias) { return alias.length; })) -
            Math.max.apply(null, a.aliases.map(function (alias) { return alias.length; }));
    });
    const part = parts.find(function (entry) {
        return entry.aliases.some(function (alias) {
            return normalized.includes(normalizeCatalogText(alias));
        });
    });

    return vehicle && part ? { vehicle: vehicle, part: part } : null;
}

function calculateIndiaRepairEstimate(part, segment) {
    const labourRatesPerHour = {
        mass: [600, 1000],
        mainstream: [800, 1400],
        premium: [1200, 2200],
        luxury: [1800, 3500]
    };
    const otherChargeRates = {
        mass: { percentage: [0.05, 0.08], minimum: [300, 500] },
        mainstream: { percentage: [0.05, 0.08], minimum: [400, 700] },
        premium: { percentage: [0.05, 0.08], minimum: [600, 1000] },
        luxury: { percentage: [0.05, 0.08], minimum: [1000, 1800] }
    };
    const labourRate = labourRatesPerHour[segment];
    const otherRate = otherChargeRates[segment];
    if (!labourRate || !otherRate || !part.cost[segment] || !part.minutes) {
        throw new Error("An estimate is not available for this vehicle segment or part.");
    }

    const roundUpToHundred = function (amount) {
        return Math.ceil(amount / 100) * 100;
    };
    const parts = part.cost[segment];
    const labour = [
        roundUpToHundred(part.minutes[0] * labourRate[0] / 60),
        roundUpToHundred(part.minutes[1] * labourRate[1] / 60)
    ];
    const other = [
        Math.max(otherRate.minimum[0], roundUpToHundred(parts[0] * otherRate.percentage[0])),
        Math.max(otherRate.minimum[1], roundUpToHundred(parts[1] * otherRate.percentage[1]))
    ];

    return {
        parts: parts,
        labour: labour,
        other: other,
        total: [
            parts[0] + labour[0] + other[0],
            parts[1] + labour[1] + other[1]
        ]
    };
}

function formatIndiaRupeeRange(range) {
    return "₹" + range[0].toLocaleString("en-IN") + "–₹" + range[1].toLocaleString("en-IN");
}

function diagnoseVehicleSymptoms(symptoms) {
    const text = symptoms.toLowerCase();
    const hasAny = function (terms) {
        return terms.some(function (term) {
            return text.includes(term);
        });
    };

    if (hasAny(["overheat", "overheating", "engine hot", "temperature is high"]) &&
        hasAny(["coolant", "coolant leak", "leaking coolant", "radiator leak", "leaking"])) {
        return {
            issue: "Radiator/Cooling System Problem",
            confidence: 85,
            action: "Inspect the radiator, hoses, coolant level, and cooling system for leaks."
        };
    }
    if (hasAny(["overheat", "overheating", "engine hot", "temperature is high"])) {
        return {
            issue: "Possible Cooling System Problem",
            confidence: 76,
            action: "Inspect coolant level, radiator, fan, thermostat, and water pump."
        };
    }
    if (hasAny(["engine noise", "knocking", "rattling", "ticking noise", "tapping noise"])) {
        return {
            issue: "Unusual Engine Noise",
            confidence: 72,
            action: "Check engine oil and arrange an engine inspection; stop driving if the noise is severe or an oil warning appears."
        };
    }
    if (hasAny(["low mileage", "poor mileage", "fuel economy", "fuel efficiency", "high fuel consumption", "uses too much fuel"])) {
        return {
            issue: "Reduced Fuel Efficiency",
            confidence: 70,
            action: "Check tyre pressure, air filter, spark plugs, wheel alignment, and engine diagnostic codes."
        };
    }
    if (hasAny(["brake squeal", "brakes squealing", "grinding when braking", "brake noise"])) {
        return {
            issue: "Possible Brake Pad/Brake System Wear",
            confidence: 78,
            action: "Arrange a prompt brake inspection. Avoid driving if braking feels reduced or unsafe."
        };
    }
    if (hasAny(["battery weak", "weak battery", "won't start", "wont start", "slow cranking", "clicking when starting"])) {
        return {
            issue: "Possible Battery or Charging System Problem",
            confidence: 74,
            action: "Test the battery, terminals, alternator output, and starter system."
        };
    }
    return null;
}

function getIndiaVehiclePartAnswer(query) {
    const match = findIndiaVehiclePart(query);
    if (!match) {
        return null;
    }
    const estimate = calculateIndiaRepairEstimate(match.part, match.vehicle.segment);
    const vehicleName = match.vehicle.name
        ? match.vehicle.make + " " + match.vehicle.name
        : match.vehicle.make + " (model not specified)";
    const part = match.part;
    return `
        <strong>🚘 ${vehicleName} — ${part.name}</strong>
        <br><br>
        <strong>Indicative repair estimate:</strong>
        <br>Parts: ${formatIndiaRupeeRange(estimate.parts)}
        <br>Labour: ${formatIndiaRupeeRange(estimate.labour)}
        <br>Other charges: ${formatIndiaRupeeRange(estimate.other)}
        <br><strong>Estimated total: ${formatIndiaRupeeRange(estimate.total)}</strong>
        <br>
        <strong>Typical fitting time:</strong> ${part.minutes[0]}–${part.minutes[1]} minutes
        <br>
        <strong>Repair or replace:</strong> A mechanic must inspect the part to decide.
        <br><br>
        ⚠️ Estimated price — final cost depends on vehicle condition, city, garage, labour rate, and parts selected. GST or other taxes may be additional.
        <br><br>
        This is a broad India-market estimate, not a confirmed OEM quote or live supplier price.
        Price and compatibility depend on model year, variant, VIN, and genuine/aftermarket choice.
        Share those details with a service centre before ordering.
    `;
}
