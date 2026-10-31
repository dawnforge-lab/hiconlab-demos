/*
 * Scripted replies for "Ask the counter". No live AI: each reply is matched by
 * keywords and streamed in by app.js. Specs and prices follow data.js and the
 * source datasheets (polyester resin is not for damp holes or cracked concrete,
 * PEX needs a pipe insert at every joint, and so on).
 *
 * Text format: blank line between blocks, "- " for list items, **bold**.
 */
(function () {
  'use strict';

  var PHONE = '0114 496 0372';

  var ANSWERS = {
    concrete: {
      lookups: ['Searching chemical anchors · concrete screws', 'Checking stock and lead times'],
      text: [
        'For a heavy bracket into solid concrete, a resin anchor with threaded rod is usually the best bet. Which resin depends on the hole:',
        '- **Polyester resin** (TR-CA-PE380, £8.95) is fine for dry holes in sound, uncracked concrete. It cures in 45 minutes at 20°C.\n- If the hole could be damp, or the concrete is cracked, polyester isn’t suitable. That needs the **vinylester resin** (TR-CA-VE380, £14.50), which is out of stock at the moment: about 7 working days.\n- For a lighter bracket, **7.5 × 80mm concrete screws** (TR-CS-7580, £19.50 for 50) go into a 6mm hole with no resin at all.',
        'I can’t give you a load rating for your bracket. If it’s holding anything structural, check the datasheet or ask an engineer. Is the hole likely to be dry?',
      ].join('\n\n'),
      cards: ['TR-CA-PE380', 'TR-CA-VE380', 'TR-CS-7580'],
      why: {
        'TR-CA-PE380': 'Dry holes, uncracked concrete. In stock.',
        'TR-CA-VE380': 'Damp holes and cracked concrete.',
        'TR-CS-7580': 'Lighter loads, no resin, 6mm hole.',
      },
      chips: [
        { label: 'It’s dry', to: 'dry' },
        { label: 'It might be damp', to: 'damp' },
        { label: 'What else do I need?', to: 'concreteKit' },
        { label: 'How long to cure?', to: 'cure' },
      ],
    },

    dry: {
      lookups: ['Checking specs · TR-CA-PE380', 'Checking stock'],
      text: [
        'Good, then the **polyester resin** (TR-CA-PE380, £8.95) will do the job, as long as the concrete is sound and not cracked. It’s in stock.',
        '- Set **M10 threaded rod** (FT-TR-ZP-M10, £4.18 a metre) in a 12mm hole, drilled with a **12mm SDS Plus bit** (TR-SD-12, £6.20).\n- Clean the hole twice with a brush and blow pump before you inject.\n- Leave it 45 minutes at 20°C before you load it, and longer in the cold.',
      ].join('\n\n'),
      cards: ['TR-CA-PE380', 'FT-TR-ZP-M10', 'TR-SD-12'],
      why: {
        'TR-CA-PE380': 'Dry holes, sound concrete. In stock.',
        'FT-TR-ZP-M10': 'Cut to length for the bracket.',
        'TR-SD-12': 'The right hole size for M10 rod.',
      },
      chips: [
        { label: 'What else will I need?', to: 'concreteKit' },
        { label: 'Delivery to site?', to: 'delivery' },
      ],
    },

    concreteKit: {
      lookups: ['Finding accessories for TR-CA-PE380 · M10 rod', 'Checking stock'],
      text: [
        'Going with the polyester resin and M10 rod, here’s the rest of the kit:',
        '- **Heavy-duty sealant gun** (FT-CG-HD, £12.95). The 26:1 thrust makes thick resin much easier to push, especially in the cold. A standard gun fits, but you’ll feel it.\n- **SDS Plus 12mm bit** (TR-SD-12, £6.20). M10 rod needs a 12mm hole. It won’t fit a keyless chuck, so you’ll need an SDS drill.\n- **M10 threaded rod** (FT-TR-ZP-M10, £4.18 a metre), cut to length, with M10 nuts and washers. Outside, use A2 stainless rod and fittings instead.',
        'Before you inject, clean the hole twice with a brush and blow pump, and pump the first 10cm of resin to waste until the colour is even. The resin, gun, bit and a metre of rod come to £32.28 ex VAT; a box each of zinc M10 nuts and washers adds £11.00.',
      ].join('\n\n'),
      cards: ['FT-CG-HD', 'TR-SD-12', 'FT-TR-ZP-M10'],
      why: {
        'FT-CG-HD': '26:1 thrust for thick resin.',
        'TR-SD-12': 'The right hole size for M10 rod.',
        'FT-TR-ZP-M10': 'Cut to length. Use A2 outdoors.',
      },
      chips: [
        { label: 'The hole might be damp', to: 'damp' },
        { label: 'How long before I can load it?', to: 'cure' },
        { label: 'Delivery to site?', to: 'delivery' },
      ],
    },

    damp: {
      lookups: ['Checking stock · TR-CA-VE380', 'Searching alternatives for damp holes'],
      text: [
        'Then polyester is out. It isn’t rated for damp holes, and resin that cures badly won’t hold.',
        '- **Vinylester resin** (TR-CA-VE380, £14.50) is the right product: damp holes and cracked concrete are both fine. It’s out of stock, back in about 7 working days. You can order it now and it’ll go out as soon as it lands.\n- If you can’t wait, **7.5 × 80mm concrete screws** (TR-CS-7580, £19.50 for 50) don’t rely on a cure and are rated for cracked and uncracked concrete. They’re zinc plated, so fine under cover, but not my pick for a fully exposed bracket.',
        'Vinylester cures in 90 minutes at 20°C and about 6 hours at 5°C, so plan around the weather. Outside, pair it with **A2 stainless rod** (FT-TR-A2-M10, £10.03).',
      ].join('\n\n'),
      cards: ['TR-CA-VE380', 'TR-CS-7580', 'FT-TR-A2-M10'],
      why: {
        'TR-CA-VE380': 'Rated for damp holes and cracked concrete.',
        'TR-CS-7580': 'In stock now. Best under cover.',
        'FT-TR-A2-M10': 'Stainless for outdoor fixings.',
      },
      chips: [
        { label: 'What else will I need?', to: 'concreteKit' },
        { label: 'Delivery to site?', to: 'delivery' },
      ],
    },

    vinylester: {
      lookups: ['Checking stock · TR-CA-VE380', 'Searching alternatives · chemical anchors'],
      text: [
        'The **vinylester resin** (TR-CA-VE380, £14.50) is out of stock at the moment, back in about 7 working days. You can order it now and it’ll go out as soon as it lands.',
        '- If you need something today, the **polyester resin** (TR-CA-PE380, £8.95) is in stock, but only for dry holes in sound, uncracked concrete. It isn’t suitable for damp holes or cracked concrete, so it’s not a straight swap.\n- For lighter loads, **7.5 × 80mm concrete screws** (TR-CS-7580, £19.50 for 50) need no resin and are rated for cracked and uncracked concrete.',
        'Is the hole dry, and is the concrete sound?',
      ].join('\n\n'),
      cards: ['TR-CA-VE380', 'TR-CA-PE380', 'TR-CS-7580'],
      why: {
        'TR-CA-VE380': 'Damp holes and cracked concrete.',
        'TR-CA-PE380': 'In stock. Dry, uncracked concrete only.',
        'TR-CS-7580': 'In stock. No resin needed.',
      },
      chips: [
        { label: 'It’s dry', to: 'dry' },
        { label: 'The hole might be damp', to: 'damp' },
      ],
    },

    cure: {
      lookups: ['Reading datasheets · TR-CA-PE380 · TR-CA-VE380'],
      text: [
        'It depends on the resin and the temperature. Don’t load the fixing until the full cure time has passed:',
        '- **Polyester** (TR-CA-PE380): 45 minutes at 20°C. Allow longer in the cold and check the chart on the cartridge.\n- **Vinylester** (TR-CA-VE380): 90 minutes at 20°C, about 6 hours at 5°C.',
        'Store cartridges between 5°C and 25°C, out of direct sun, so they dispense properly on the day.',
      ].join('\n\n'),
      cards: ['TR-CA-PE380', 'TR-CA-VE380'],
      why: {
        'TR-CA-PE380': '45 min at 20°C.',
        'TR-CA-VE380': '90 min at 20°C, 6 hours at 5°C.',
      },
      chips: [
        { label: 'What else will I need?', to: 'concreteKit' },
        { label: 'The hole might be damp', to: 'damp' },
      ],
    },

    bolts: {
      lookups: ['Searching hex bolts · M10 × 50mm', 'Checking stock'],
      text: [
        'We’ve got M10 × 50mm hex bolts in two finishes, both in boxes of 50:',
        '- **Zinc plated grade 8.8** (FT-HB-ZP-M1050, £9.90). High tensile, for dry, indoor jobs.\n- **A2 stainless** (FT-HB-A2-M1050, £23.76). Resists corrosion outside or in damp spots, though it isn’t as strong as 8.8.',
        'Use a matching nut, with a washer under the nut and the head. Where are they going?',
      ].join('\n\n'),
      cards: ['FT-HB-ZP-M1050', 'FT-HB-A2-M1050', 'FT-HN-ZP-M10'],
      why: {
        'FT-HB-ZP-M1050': 'Grade 8.8, dry and indoor.',
        'FT-HB-A2-M1050': 'Stainless for outdoor or damp.',
        'FT-HN-ZP-M10': 'Matching nuts for the zinc bolts.',
      },
      chips: [
        { label: 'They’re going outside on a coastal site', to: 'coastal' },
        { label: 'Delivery to site?', to: 'delivery' },
      ],
    },

    coastal: {
      lookups: ['Checking specs · A2 stainless', 'Searching matching nuts and washers'],
      text: [
        'Yes, that changes things. Salt air eats zinc plating, so go stainless:',
        '- **A2 stainless bolts** (FT-HB-A2-M1050, £23.76 for 50).\n- **A2 nuts** (FT-HN-A2-M10, £16.90 for 100) and **A2 washers** (FT-WA-A2-M10, £9.50 for 100). Keep everything A2: stainless bolts with zinc nuts outdoors will corrode where they touch.',
        'Right on the seafront, in splash zones or near pools, A4 marine-grade stainless is the better choice. We don’t stock A4, but the sales team can source it to order. A2 also has a lower tensile strength than 8.8, so check with your engineer if the joint is structural.',
      ].join('\n\n'),
      cards: ['FT-HB-A2-M1050', 'FT-HN-A2-M10', 'FT-WA-A2-M10'],
      why: {
        'FT-HB-A2-M1050': 'A2-70 stainless, box of 50.',
        'FT-HN-A2-M10': 'Matching A2 nuts.',
        'FT-WA-A2-M10': 'Matching A2 washers.',
      },
      chips: [
        { label: 'Can you get A4?', to: 'a4' },
        { label: 'Delivery to site?', to: 'delivery' },
      ],
    },

    a4: {
      lookups: ['Searching catalogue · A4 stainless', 'Searching help pages · special orders'],
      text: [
        'A4 isn’t a stock line, but the sales team can source it to order. Give them the size, length and quantity and they’ll come back with a price and lead time.',
        'Call ' + PHONE + ' (7am to 5pm weekdays, 8am to 12pm Saturday), or email sales@fettle.example.co.uk. Special orders can’t be returned, so double-check the sizes first.',
      ].join('\n\n'),
      cards: [],
      chips: [{ label: 'Delivery to site?', to: 'delivery' }],
    },

    pex: {
      lookups: ['Searching push-fit fittings · 15mm', 'Checking compatibility · PEX'],
      text: [
        'For 15mm PEX to a radiator, use push-fit fittings and put a pipe insert in every joint:',
        '- **15mm push-fit elbow** (CV-PF-ELB15, £3.20). No heat needed, and it can be taken apart later.\n- **15mm pipe inserts** (CV-PI-15, £3.50 for 10). Required in every PEX joint, otherwise the pipe can collapse and leak. Not needed on copper.\n- **15mm TRV** (CV-RV-TRV15, £11.95). It has a 15mm compression inlet, so fit an insert there too.',
        'Solder fittings are for copper only, so don’t use them on PEX. And keep PEX at least a metre from the boiler: use copper for that first metre.',
      ].join('\n\n'),
      cards: ['CV-PF-ELB15', 'CV-PI-15', 'CV-RV-TRV15'],
      why: {
        'CV-PF-ELB15': 'No heat, rated 6 bar at 95°C.',
        'CV-PI-15': 'One in every PEX joint.',
        'CV-RV-TRV15': '15mm compression, bi-directional.',
      },
      chips: [
        { label: 'How far apart do the clips go?', to: 'clips' },
        { label: 'Do you have the PEX pipe?', to: 'pexPipe' },
      ],
    },

    clips: {
      lookups: ['Reading datasheet · CV-PC-15'],
      text: [
        'PEX needs far more support than copper. On horizontal runs, clip 15mm PEX every 0.3m; 15mm copper only needs one every 1.2m.',
        '- **15mm pipe clips** (CV-PC-15, £2.40 for 20). A 6m run of PEX takes about 20.',
      ].join('\n\n'),
      cards: ['CV-PC-15', 'CV-PX-15'],
      why: { 'CV-PC-15': 'Pack of 20, fits copper and PEX.', 'CV-PX-15': '50m coil with oxygen barrier.' },
      chips: [{ label: 'Do you have the PEX pipe?', to: 'pexPipe' }],
    },

    pexPipe: {
      lookups: ['Searching pipe · PEX 15mm', 'Checking stock'],
      text: [
        'Yes: **15mm PEX barrier pipe** (CV-PX-15, £39.50 for a 50m coil). It has an oxygen barrier for heating and is rated 6 bar at 95°C.',
        'Keep bends to at least 8 times the pipe diameter, so about 120mm for 15mm, and keep the coil out of direct sun.',
      ].join('\n\n'),
      cards: ['CV-PX-15', 'CV-PI-15', 'CV-PF-ELB15'],
      why: { 'CV-PX-15': 'Long coil, fewer joints.', 'CV-PI-15': 'One per joint.', 'CV-PF-ELB15': 'Push-fit, no heat.' },
      chips: [{ label: 'How far apart do the clips go?', to: 'clips' }],
    },

    delivery: {
      lookups: ['Searching help pages · delivery'],
      text: [
        'Delivery to UK mainland addresses is **free on orders over £75 ex VAT**, otherwise £7.95.',
        '- Order before **2pm, Monday to Friday**, and it goes out the same day for next working day delivery.\n- Timed delivery before 10am is £14.95.\n- The Scottish Highlands, Northern Ireland, the Isle of Man and the Channel Islands take 2 to 4 working days, with a £19.95 surcharge.',
        'You can also click and collect from our Attercliffe Road counter, usually within the hour for stock items.',
      ].join('\n\n'),
      cards: [],
      chips: [
        { label: 'Click and collect', to: 'collect' },
        { label: 'Can I return opened silicone?', to: 'returns' },
      ],
    },

    returns: {
      lookups: ['Searching help pages · returns'],
      text: [
        'Unused items in their original packaging can come back within 30 days for a refund or credit.',
        'Opened sealants, adhesives and chemical anchors can’t be returned unless they’re faulty, for hygiene and safety reasons. The same goes for cut cable, cut pipe and special orders.',
      ].join('\n\n'),
      cards: [],
      chips: [{ label: 'Delivery to site?', to: 'delivery' }],
    },

    collect: {
      lookups: ['Searching help pages · click and collect'],
      text: [
        'Order online and collect from the Attercliffe Road counter, usually within the hour for items in stock there. We’ll text and email when it’s ready and hold it for 5 working days.',
        'Bring your order number, and your account number if you’re on a trade account. The counter is open 6.30am to 5pm weekdays and 7am to 12pm on Saturday.',
      ].join('\n\n'),
      cards: [],
      chips: [{ label: 'Delivery to site?', to: 'delivery' }],
    },

    consumerUnit: {
      lookups: ['Searching consumer units · RCBOs', 'Checking trade-only lines'],
      text: [
        'Consumer units and RCBOs are trade only, so you’ll need a trade account to order them. For a kitchen ring and a shower:',
        '- **10 way metal consumer unit** (OW-CU-10W, £82.00). 100A main switch, steel enclosure, non-combustible as required for homes.\n- **32A RCBO** (OW-RB-32A, £19.50) for the ring main.\n- **40A RCBO** (OW-RB-40A, £19.50) for the shower, but match it to the shower’s rating and the cable.',
        'They’re Type A 30mA, B curve, and fit Ohmway units only. This is a job for a qualified electrician, certified to BS 7671.',
      ].join('\n\n'),
      cards: ['OW-CU-10W', 'OW-RB-32A', 'OW-RB-40A'],
      why: {
        'OW-CU-10W': '10 ways, 100A main switch.',
        'OW-RB-32A': 'Ring main.',
        'OW-RB-40A': 'Shower, if the rating matches.',
      },
      chips: [{ label: 'How do I open a trade account?', to: 'trade' }],
    },

    trade: {
      lookups: ['Searching help pages · trade accounts'],
      text: [
        'Apply online with your company details and two trade references. Approval normally takes 2 working days.',
        'Once you’re approved you’ll see trade prices, can buy trade-only lines like consumer units and RCBOs, and can apply for 30-day credit.',
      ].join('\n\n'),
      cards: [],
      chips: [{ label: 'Delivery to site?', to: 'delivery' }],
    },

    shower: {
      lookups: ['Searching sealants · sanitary', 'Checking stock'],
      text: [
        'Use **sanitary silicone**: it has a fungicide to resist mould. General purpose silicone isn’t meant for wet areas.',
        '- **Sanitary silicone, white** (TK-SI-SANW, £4.95) or **clear** (TK-SI-SANC, £4.95).\n- A **sealant gun** if you haven’t got one. The standard gun (FT-CG-STD, £3.50) is fine for silicone.',
        'Surfaces need to be clean, dry and free of old sealant. Tool it within 5 minutes and keep water off it for 24 hours. It can’t be painted.',
      ].join('\n\n'),
      cards: ['TK-SI-SANW', 'TK-SI-SANC', 'FT-CG-STD'],
      why: {
        'TK-SI-SANW': 'Fungicide, white.',
        'TK-SI-SANC': 'Fungicide, clear.',
        'FT-CG-STD': 'Fine for silicone.',
      },
      chips: [{ label: 'Can I return opened silicone?', to: 'returns' }],
    },

    order: {
      lookups: ['Searching help pages · orders'],
      text: [
        'Sorry about that. I can’t see orders from here, but the sales team can.',
        'Call ' + PHONE + ' (7am to 5pm weekdays, 8am to 12pm Saturday) or email sales@fettle.example.co.uk with your order number. Your dispatch email also has a tracking link.',
      ].join('\n\n'),
      cards: [],
      chips: [{ label: 'Delivery to site?', to: 'delivery' }],
    },

    load: {
      lookups: ['Reading datasheets', 'Searching help pages · technical support'],
      text: [
        'That figure isn’t in our product data, and I won’t guess a load rating.',
        'Our technical team can help with product suitability on ' + PHONE + ', 8am to 4pm weekdays. They can’t do structural calculations, so for anything structural you’ll need an engineer.',
      ].join('\n\n'),
      cards: [],
      chips: [],
    },

    pushfitGas: {
      lookups: ['Reading datasheet · CV-PF-ELB15', 'Searching fittings · gas'],
      text: [
        'No. Our push-fit fittings are for water and heating only: they’re **not suitable for gas or oil**, whatever the pressure.',
        '- For gas, use **copper tube** with **solder ring fittings** (CV-SR-ELB15, £1.40), which are approved for natural gas and LPG.\n- On threaded gas joints, use **yellow gas PTFE tape** (CV-PT-YEL, £1.45), 10 or more turns.',
        'Gas work must be done by a Gas Safe registered engineer.',
      ].join('\n\n'),
      cards: ['CV-SR-ELB15', 'CV-CT-15', 'CV-PT-YEL'],
      why: {
        'CV-SR-ELB15': 'Approved for natural gas and LPG.',
        'CV-CT-15': 'Table X copper, suitable for gas.',
        'CV-PT-YEL': 'Gas rated to BS EN 751-3.',
      },
      chips: [{ label: '15mm PEX to a radiator', to: 'pex' }],
    },

    a2a4: {
      lookups: ['Reading datasheets · A2 stainless', 'Searching catalogue · A4'],
      text: [
        'Both are austenitic stainless steel. The difference is how they cope with salt and chlorides:',
        '- **A2** (304 grade) is the everyday stainless for outdoor and damp spots. It’s what we stock, for example the A2 M10 × 50mm bolts (FT-HB-A2-M1050, £23.76 for 50).\n- **A4** (316 grade) adds molybdenum, so it resists salt spray, pools and coastal splash zones much better. We don’t stock A4, but the sales team can source it to order.',
        'Both are a little weaker than grade 8.8 carbon steel, so check with your engineer if the joint is structural.',
      ].join('\n\n'),
      cards: ['FT-HB-A2-M1050', 'FT-HN-A2-M10', 'FT-WA-A2-M10'],
      why: {
        'FT-HB-A2-M1050': 'A2-70 stainless, box of 50.',
        'FT-HN-A2-M10': 'Matching A2 nuts.',
        'FT-WA-A2-M10': 'Matching A2 washers.',
      },
      chips: [{ label: 'Can you get A4?', to: 'a4' }],
    },

    plugDrill: {
      lookups: ['Reading datasheets · wall plugs', 'Matching screw sizes'],
      text: [
        'Our wall plugs are colour coded by drill size:',
        '- **Red plugs** (FT-WP-RED, £1.35 for 100) need a **6mm masonry drill** and take 3.5 to 5.0mm screws.\n- **Brown plugs** (FT-WP-BRN, £1.60 for 100) need a **7mm drill** and take 4.5 to 6.0mm screws.',
        'Drill 5mm deeper than the plug, push it in flush and drive the screw. A 5.0mm screw such as our 5.0 × 50mm woodscrews (FT-WS-5050) fits either. Online we only list 10mm and 12mm SDS bits, so for a 6mm hole you’ll need a standard 6mm masonry bit; the counter can help.',
      ].join('\n\n'),
      cards: ['FT-WP-RED', 'FT-WP-BRN', 'FT-WS-5050'],
      why: {
        'FT-WP-RED': '6mm drill, 3.5 to 5.0mm screws.',
        'FT-WP-BRN': '7mm drill, 4.5 to 6.0mm screws.',
        'FT-WS-5050': 'Fits red or brown plugs.',
      },
      chips: [{ label: 'Delivery to site?', to: 'delivery' }],
    },

    saturday: {
      lookups: ['Searching help pages · delivery', 'Searching help pages · opening hours'],
      text: [
        'We don’t deliver on Saturdays. Orders placed before 2pm Monday to Friday go out for next working day delivery, so an order placed on Friday arrives on Monday.',
        'If you need parts on a Saturday, click and collect from our Attercliffe Road counter, open 7am to 12pm. Stock items are usually ready within the hour.',
      ].join('\n\n'),
      cards: [],
      chips: [
        { label: 'Click and collect', to: 'collect' },
        { label: 'Is delivery free?', to: 'delivery' },
      ],
    },

    vinylDamp: {
      lookups: ['Reading datasheet · TR-CA-VE380', 'Checking stock'],
      text: [
        'Yes. The **vinylester resin** (TR-CA-VE380, £14.50) is rated for damp holes and for cracked concrete, so it’s the right one for that job.',
        '- Clean the hole twice with a brush and blow pump, and pump the first 10cm of resin to waste.\n- Cure time is 90 minutes at 20°C and about 6 hours at 5°C. Don’t load it before then.\n- Outside, set it with **A2 stainless rod** (FT-TR-A2-M10, £10.03 a metre).',
        'It’s out of stock at the moment, back in about 7 working days. You can order it now and it’ll go out as soon as it lands.',
      ].join('\n\n'),
      cards: ['TR-CA-VE380', 'FT-TR-A2-M10', 'FT-CG-HD'],
      why: {
        'TR-CA-VE380': 'Rated for damp holes and cracked concrete.',
        'FT-TR-A2-M10': 'Stainless for outdoor fixings.',
        'FT-CG-HD': '26:1 thrust for thick resin.',
      },
      chips: [
        { label: 'Anything in stock today?', to: 'vinylester' },
        { label: 'Delivery to site?', to: 'delivery' },
      ],
    },

    polyDamp: {
      lookups: ['Reading datasheet · TR-CA-PE380'],
      text: [
        'No. The **polyester resin** (TR-CA-PE380, £8.95) is only for dry holes in sound, uncracked concrete. In a damp hole or cracked concrete it won’t cure and hold properly.',
        '- For damp or cracked, you need the **vinylester resin** (TR-CA-VE380, £14.50). It’s out of stock, back in about 7 working days.\n- If you can’t wait, **7.5 × 80mm concrete screws** (TR-CS-7580, £19.50 for 50) don’t rely on a cure and are rated for cracked and uncracked concrete.',
      ].join('\n\n'),
      cards: ['TR-CA-VE380', 'TR-CS-7580', 'TR-CA-PE380'],
      why: {
        'TR-CA-VE380': 'Damp holes and cracked concrete.',
        'TR-CS-7580': 'In stock. No resin needed.',
        'TR-CA-PE380': 'Dry, uncracked concrete only.',
      },
      chips: [{ label: 'Delivery to site?', to: 'delivery' }],
    },

    brick: {
      lookups: ['Searching fixings · brick and block', 'Checking stock'],
      text: [
        'For a bracket on a brick wall, it depends on the weight:',
        '- **Light to medium:** **brown wall plugs** (FT-WP-BRN, £1.60 for 100) in a 7mm hole, with **5.0 × 50mm woodscrews** (FT-WS-5050, £6.20 for 200).\n- **Heavier:** **6.0 × 60mm concrete screws** (TR-CS-6060, £12.50 for 50) cut their own thread in brick and block. Drill 5mm, no plug needed.\n- **Heavy, in solid brick:** resin anchor with threaded rod. Hollow block needs mesh sleeves, which we don’t list online.',
        'Fix into the brick itself, not the mortar joint. I can’t give load ratings, so for anything structural check the datasheet or ask an engineer.',
      ].join('\n\n'),
      cards: ['FT-WP-BRN', 'FT-WS-5050', 'TR-CS-6060'],
      why: {
        'FT-WP-BRN': '7mm drill, 4.5 to 6.0mm screws.',
        'FT-WS-5050': 'Fits brown or red plugs.',
        'TR-CS-6060': 'No plug, 5mm hole.',
      },
      chips: [
        { label: 'What size hole for concrete screws?', to: 'screwHole' },
        { label: 'Delivery to site?', to: 'delivery' },
      ],
    },

    screwHole: {
      lookups: ['Reading datasheets · TR-CS-6060 · TR-CS-7580'],
      text: [
        'Our concrete screws each have their own drill size:',
        '- **6.0 × 60mm** (TR-CS-6060, £12.50 for 50): **5mm** hole.\n- **7.5 × 80mm** (TR-CS-7580, £19.50 for 50): **6mm** hole.',
        'Drill at least 10mm deeper than the screw goes in, clean the hole out, and drive it with an impact driver. Don’t over-tighten. They can come out and go back in the same hole.',
      ].join('\n\n'),
      cards: ['TR-CS-7580', 'TR-CS-6060'],
      why: { 'TR-CS-7580': '6mm drill.', 'TR-CS-6060': '5mm drill.' },
      chips: [{ label: 'Delivery to site?', to: 'delivery' }],
    },

    openTimes: {
      lookups: ['Searching help pages · opening hours'],
      text: [
        'The Attercliffe Road trade counter is open **6.30am to 5pm, Monday to Friday**, and **7am to 12pm on Saturday**.',
        '- Sales and orders on ' + PHONE + ': 7am to 5pm weekdays, 8am to 12pm Saturday.\n- Technical questions: 8am to 4pm weekdays.',
        'Online orders placed before 2pm on a weekday go out the same day.',
      ].join('\n\n'),
      cards: [],
      chips: [
        { label: 'Click and collect', to: 'collect' },
        { label: 'Is delivery free?', to: 'delivery' },
      ],
    },

    paintSilicone: {
      lookups: ['Reading datasheets · silicone · hybrid polymer'],
      text: [
        'No. Silicone can’t be painted: paint won’t stick to it.',
        'If the joint needs painting, use **hybrid polymer sealant** (TK-HY-WHT, £7.95) instead. It’s paintable once it has skinned, after about 20 minutes, and it bonds to damp surfaces too.',
      ].join('\n\n'),
      cards: ['TK-HY-WHT', 'TK-SI-SANW'],
      why: { 'TK-HY-WHT': 'Paintable after about 20 minutes.', 'TK-SI-SANW': 'Not paintable.' },
      chips: [{ label: 'Seal round a shower tray', to: 'shower' }],
    },

    ppeConcrete: {
      lookups: ['Searching PPE · dust · eyes · hands', 'Checking stock'],
      text: [
        'Drilling concrete throws up silica dust and chips, so cover your lungs, eyes and hands:',
        '- **FFP3 valved masks** (SB-FF-V10, £24.95 for 10) for fine silica dust. A tight-fitting mask needs a face-fit test, and it won’t seal over a beard. They’re out of stock at the moment, back in about 5 working days.\n- **Safety glasses** (SB-SG-CLR, £2.95), EN 166, anti-fog.\n- **Nitrile coated gloves** (SB-NG-L, £14.50 for 10 pairs) for grip on the drill.',
        'Use dust extraction or damp the area down where you can.',
      ].join('\n\n'),
      cards: ['SB-FF-V10', 'SB-SG-CLR', 'SB-NG-L'],
      why: {
        'SB-FF-V10': 'FFP3 for silica dust.',
        'SB-SG-CLR': 'EN 166, anti-fog.',
        'SB-NG-L': 'Grip in dry and oily conditions.',
      },
      chips: [{ label: 'Delivery to site?', to: 'delivery' }],
    },

    wiring: {
      lookups: ['Searching help pages · technical support'],
      text: [
        'I can’t give wiring advice, sorry. Electrical work needs a competent person, and fixed wiring a qualified electrician working to BS 7671.',
        'If you’re after parts, tell me what they are and I’ll check stock, or ring the counter on ' + PHONE + ' (8am to 4pm weekdays for technical questions).',
      ].join('\n\n'),
      cards: [],
      chips: [{ label: 'Opening hours', to: 'openTimes' }],
    },

    hello: {
      lookups: [],
      text: 'Hello. I’m the counter at Fettle. Tell me the job, or the part you’re after, and I’ll check the catalogue, the datasheets and the stock for you.',
      cards: [],
      chips: [
        { label: 'Fix a heavy bracket into concrete', to: 'concrete' },
        { label: '15mm PEX to a radiator', to: 'pex' },
        { label: 'Is delivery free?', to: 'delivery' },
      ],
    },

    offTopic: {
      lookups: [],
      text: 'I can only help with products, orders and delivery from Fettle, so I’ll leave that one to someone else. Is there a job I can help you find parts for?',
      cards: [],
      chips: [
        { label: 'Fix a heavy bracket into concrete', to: 'concrete' },
        { label: '15mm PEX to a radiator', to: 'pex' },
      ],
    },
  };

  // First rule that matches wins. q is lower-case with curly quotes flattened.
  var RULES = [
    { id: 'hello', test: /^(hi|hello|hey|hiya|hullo|morning|afternoon|evening|good (morning|afternoon|evening)|alright|now then|ey up)( there| mate| all)?[!. ]*$/ },
    { id: 'wiring', test: /\bwir(e|es|ed|ing)\b|\brewire\b|\bterminate\b/ },
    { id: 'offTopic', test: /\b(poem|joke|song|weather|football|recipe|story|horoscope)\b/ },
    { id: 'order', test: /(hasn'?t (arrived|come)|not arrived|not turned up|where'?s my order|where is my order|speak to (someone|a person|a human)|talk to (someone|a person|a human)|complain|wrong item|missing (item|order|parts?))/ },
    { id: 'load', test: /(pull[- ]?out|load rating|safe working load|how much (weight|load)|\bkn\b|kilonewton|how much will (it|they) hold)/ },
    { id: 'trade', test: /(trade account|open an account|credit account|account prices?)/ },
    { id: 'consumerUnit', test: /(consumer unit|fuse ?box|fuse ?board|\brcbos?\b|distribution board)/ },
    { id: 'saturday', test: /(saturday|sunday|weekend)/ },
    { id: 'openTimes', test: /((what time|when)\b.*\b(open|close|shut))|opening (times|hours)|open (today|tomorrow|now)|are you open|hours\b.*\bcounter|counter\b.*\bhours/ },
    { id: 'pushfitGas', test: /((push.?fit|speedfit|plastic fitting).*\bgas\b)|(\bgas\b.*(push.?fit|speedfit|plastic fitting))/ },
    { id: 'a2a4', test: /(\ba2\b.*\ba4\b)|(\ba4\b.*\ba2\b)|what is a4|marine grade|difference.*stainless/ },
    { id: 'screwHole', test: /((hole|drill|bit)\b.*\b(concrete screws?|masonry screws?|concrete bolts?|tapcons?|multi.?monti))|((concrete screws?|masonry screws?|concrete bolts?)\b.*\b(hole|drill|bit))/ },
    { id: 'ppeConcrete', test: /\bppe\b|safety (gear|kit|equipment)|protective|(what|which) (should|do) i wear|((mask|respirator|goggles|glasses)\b.*\b(concrete|silica|dust|drill|brick))|((concrete|silica|dust|drill|brick)\b.*\b(mask|respirator|goggles))/ },
    { id: 'paintSilicone', test: /(paint\w*\b.*\b(silicone|mastic|sealant))|((silicone|mastic|sealant)\b.*\bpaint)/ },
    { id: 'vinylDamp', test: /((vinylester|styrene)\b.*\b(damp|wet|crack))|((damp|wet|crack)\w*\b.*\b(vinylester|styrene))/ },
    { id: 'polyDamp', test: /(polyester\b.*\b(damp|wet|crack))|((damp|wet|crack)\w*\b.*\bpolyester)/ },
    { id: 'plugDrill', test: /((drill|bit|hole).*(wall ?plug|rawl ?plug|\bplugs?\b))|((wall ?plug|rawl ?plug|\bplugs?\b).*(drill|bit|hole size))/ },
    { id: 'dry', test: /^(it'?s|the hole is|hole'?s|it is) (dry|bone dry)\b/ },
    { id: 'returns', test: /(return|refund|send (it|them) back|exchange)/ },
    { id: 'collect', test: /(click and collect|click & collect|\bcollect\b|pick ?up|opening hours|open on saturday)/ },
    { id: 'delivery', test: /(deliver|delivery|shipping|postage|next day|when would i get|how soon|dispatch)/ },
    { id: 'a4', test: /\ba4\b.*(get|source|order|stock|have)|(get|source|order|stock|have).*\ba4\b/ },
    { id: 'coastal', test: /(coast|coastal|seaside|salt|marine|sea air|by the sea|seafront)/ },
    { id: 'bolts', test: /(\bm10\b.*\bbolts?\b|\bbolts?\b.*\bm10\b)/ },
    { id: 'cure', test: /(cure|curing|how long before|before i can load|before loading|go off)/ },
    { id: 'vinylester', test: /(vinylester|styrene)/ },
    { id: 'damp', test: /(damp|wet hole|cracked)/ },
    { id: 'concreteKit', test: /(what else|anything else|accessor|kit for|need with).*(resin|anchor|concrete|chemical)|(resin|anchor|chemical).*(what else|need with)/ },
    { id: 'brick', test: /((brick|block ?work|breeze ?block|blockwork)\b.*\b(bracket|fix|fixing|hang|mount|shelf|shelves|attach|screw|tv))|((bracket|fix|fixing|hang|mount|shelf|shelves|attach|tv)\b.*\b(brick|block ?work|breeze ?block))/ },
    { id: 'concrete', test: /((concrete|masonry|brick|block ?work).*(fix|fixing|bracket|anchor|bolt|heavy|hang|mount|secure|attach))|((fix|fixing|bracket|anchor|bolt|heavy|hang|mount|secure|attach).*(concrete|masonry))|chemical anchor|chemfix|resin anchor/ },
    { id: 'clips', test: /((clip|support).*(pex|pipe))|how far apart/ },
    { id: 'pexPipe', test: /(pex|barrier) (pipe|coil)/ },
    { id: 'pex', test: /\bpex\b|plastic pipe/ },
    { id: 'shower', test: /((shower|bath|basin|sink|tray).*(seal|silicone|mastic|sealant))|((seal|silicone|mastic|sealant).*(shower|bath|basin|sink|tray))/ },
  ];

  function match(query) {
    var q = String(query || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
    for (var i = 0; i < RULES.length; i++) if (RULES[i].test.test(q)) return RULES[i].id;
    return null;
  }

  window.FETTLE_ANSWERS = { answers: ANSWERS, match: match, phone: PHONE };
})();
