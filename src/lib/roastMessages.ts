export const roastMessages = {
  ar: {
    warning: [
      'يسطا... ٨٠٪ من ميزانيتك راحت وإنت لسه في منتص الشهر؟',
      'ماشي برافو، المصاريف شغّالة بقوة وفلوسك بتهرب منك 🏃',
      'أنا مش بحكم، بس الأرقام بتحكم عليك دلوقتي',
      'تمام، ٨٠٪ راحت. الباقي بيبص عليك وهو خايف',
      'حلو، الميزانية بتتسرق وإنت مبسوط؟',
      'صاحبي الفلوس مش بتستناك، هي بتمشي لوحدها',
    ],
    exceeded: [
      'تجاوزت الميزانية؟ ولا كأنها كانت موجودة أصلاً 🙄',
      'الميزانية قالت "أنا مش قادرة أكمل كده" وطلعت',
      'برافو عليك، كسرت الرقم القياسي في الصرف',
      'فلوس الشهر الجاي بتبص عليك دلوقتي وهي بتعيط',
      'ما شاء الله، الميزانية انهارت بشكل رسمي. نهنئ ولا نعزي؟',
      'يسطا، المحفظة بتقولك "أنا تعبت منك"',
      'الميزانية اتوفت. ربنا يرحمها. إنا لله وإنا إليه راجعون',
    ],
    bigSpend: [
      'دفعة واحدة كده؟ قلبي وقف 💸',
      'هههه اوكي، دفعت إيه بالظبط؟ مفيش مشكلة بس أنا عايز أعرف',
      'هذا المبلغ كان يكفيك أسبوع، بس يلا',
      'مش حكم، بس ده مبلغ كبير شوية مش كده؟',
      'أوكي، صرفتها. خد نفس وارجع للموضوع',
      'واحدة دي؟ المحفظة بتصرخ بهدوء',
      'يا كلب البحر',
    ],
    onTrack: [
      'صاحبي بيوفر! أنا فخور فيك 💪',
      'الأرقام حلوة، استمر كده',
      'شايف إنك بتتحكم في مصاريفك؟ دي إنجاز',
      'كمّل كده وهتوصل للعربية اللي عايزها',
      'يا سلام، واحد بيوفر فعلاً. نادر الأيام دي',
    ],
  },
  en: {
    warning: [
      "Bro... 80% of your budget is gone and the month isn't even half over?",
      "The money is leaving faster than your motivation to track it 🏃",
      "No judgment, but the numbers are absolutely judging you right now",
      "80% spent. The remaining 20% is scared.",
      "Impressive spending velocity. Not in a good way.",
      "Your budget is on life support. Just so you know.",
    ],
    exceeded: [
      "Budget? What budget? Apparently it was just a suggestion 🙄",
      "Your budget has left the chat.",
      "Congratulations on setting a new personal record. Not the kind you frame.",
      "Next month's money is watching this happen in horror.",
      "The budget has officially collapsed. Moment of silence.",
      "Your wallet just texted me asking for help.",
      "Budget: deceased. Cause of death: unclear but suspicious.",
    ],
    bigSpend: [
      "One transaction? My heart stopped. 💸",
      "Okay what exactly did you just buy? No judgment, I'm just curious",
      "That amount could've lasted you a week. But sure.",
      "Not judging, but that's a lot in one shot, no?",
      "Okay, it's done. Take a breath. We move.",
      "One purchase. Bold move. Questionable, but bold.",
    ],
    onTrack: [
      "Look at you saving money! Proud of you 💪",
      "Numbers looking good. Keep this up.",
      "You're actually in control of your spending. That's rare.",
      "Keep going like this and that car is closer than you think.",
      "Saving money in this economy? Respect.",
    ],
  },
};

export type RoastScenario = 'warning' | 'exceeded' | 'bigSpend' | 'onTrack';

export function getRoast(
  scenario: RoastScenario,
  language: 'ar' | 'en'
): string {
  const messages = roastMessages[language][scenario];
  return messages[Math.floor(Math.random() * messages.length)];
}