/* Fanlight Dental: practice data. Everything here is fictional.
   Phone numbers use Ofcom's drama range; the email uses the reserved .example domain. */
window.FANLIGHT = {
  name: 'Fanlight Dental',
  phone: '01632 960 214',
  phoneHref: 'tel:+441632960214',
  email: 'hello@fanlightdental.example',
  address: ['4 Saddlers Row', 'Frome', 'Somerset', 'BA11 1NQ'],

  // Opening hours by JS weekday (0 = Sunday). Times in minutes from midnight.
  hours: {
    0: null,
    1: [8 * 60, 18 * 60],
    2: [8 * 60, 19 * 60 + 30],
    3: [8 * 60, 18 * 60],
    4: [8 * 60, 18 * 60],
    5: [8 * 60, 16 * 60],
    6: [9 * 60, 13 * 60],
  },
  lunch: [13 * 60, 14 * 60],

  team: {
    clare: { name: 'Dr Clare Ashby', short: 'Clare' },
    rohan: { name: 'Dr Rohan Mehta', short: 'Rohan' },
    jan: { name: 'Jan Whitlock', short: 'Jan' },
    megan: { name: 'Megan Price', short: 'Megan' },
  },

  reasons: {
    checkup: {
      label: 'Check-up',
      meta: '30 min · £54',
      icon: 'mirror',
      mins: 30, price: 54,
      newLabel: 'New patient check-up', newMins: 45, newPrice: 72,
      with: ['clare', 'rohan'],
      hintNew: 'Your first visit is 45 minutes (£72): a full check, any X-rays you need, and a written plan with prices.',
      hintExisting: 'A routine check with your dentist. If you’re on the Fanlight Plan it’s already covered.',
    },
    hygiene: {
      label: 'Hygiene visit',
      meta: '30 min · £78',
      icon: 'drop',
      mins: 30, price: 78,
      with: ['jan', 'megan'],
      hintNew: 'You can see our hygienists without a check-up first. Jan or Megan will clean, polish and show you what to focus on at home.',
      hintExisting: 'A clean and polish with Jan or Megan. Covered by the Fanlight Plan.',
    },
    emergency: {
      label: 'Emergency',
      meta: '20 min · £90 · same or next working day',
      icon: 'aid',
      mins: 20, price: 90,
      with: ['clare', 'rohan'],
      emergency: true,
      hintNew: 'We keep slots free every day for people in pain, registered with us or not. The £90 covers the assessment, X-rays and pain relief; any treatment is quoted first. If swelling is affecting your breathing or swallowing, call 999.',
      hintExisting: 'We keep slots free every day for people in pain. Plan members pay nothing for the assessment. If swelling is affecting your breathing or swallowing, call 999.',
    },
    consult: {
      label: 'Consultation',
      meta: '45 min · £60 · aligners, implants or whitening',
      icon: 'chat',
      mins: 45, price: 60,
      with: ['rohan'],
      hintNew: 'A 45-minute chat with Dr Rohan Mehta, with a 3D scan if it’s for aligners. The £60 comes off your treatment if you go ahead.',
      hintExisting: 'A 45-minute chat with Dr Rohan Mehta. The £60 comes off your treatment if you go ahead.',
    },
  },

  // Slots we hold back for emergencies on each open day.
  emergencySlots: { weekday: ['08:30', '08:50', '14:00', '14:20'], saturday: ['09:10', '11:30'] },
};
