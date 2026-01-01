export interface LanguageData {
  accents: {
    [accent: string]: string[];
  };
}

export const LANGUAGE_ACCENT_DIALECT: Record<string, LanguageData> = {
  English: {
    accents: {
      'American': ['General', 'Southern', 'New York', 'Midwest', 'Californian', 'Texan', 'Boston'],
      'British': ['RP', 'Cockney', 'Yorkshire', 'Scottish', 'Welsh', 'Manchester'],
      'Australian': ['General', 'Broad', 'Cultivated'],
      'Indian': ['General', 'Hindi-influenced', 'Tamil-influenced'],
      'Canadian': ['General', 'Quebec English'],
    },
  },
  Spanish: {
    accents: {
      'Mexican': ['General', 'Northern', 'Chilango', 'Yucatan'],
      'Castilian': ['Madrid', 'Andalusian'],
      'Argentine': ['Rioplatense', 'Cordobés'],
      'Colombian': ['Bogotá', 'Paisa', 'Costeño'],
    },
  },
  French: {
    accents: {
      'Parisian': ['Standard', 'Suburban'],
      'Canadian French': ['Québécois', 'Acadian'],
      'Belgian': ['Brussels', 'Walloon'],
      'Swiss': ['Geneva', 'Lausanne'],
    },
  },
  German: {
    accents: {
      'Standard (Hochdeutsch)': ['Northern', 'Central'],
      'Bavarian': ['Munich', 'Austrian'],
      'Swiss German': ['Zurich', 'Bern'],
    },
  },
  Hindi: {
    accents: {
      'Standard': ['Delhi', 'Lucknow'],
      'Bihari': ['General'],
      'Punjabi-influenced': ['General'],
    },
  },
  Mandarin: {
    accents: {
      'Standard (Putonghua)': ['Beijing', 'Northern'],
      'Taiwanese': ['General'],
      'Southern': ['Shanghai-influenced'],
    },
  },
  Japanese: {
    accents: {
      'Standard (Tokyo)': ['General', 'Formal', 'Casual'],
      'Kansai': ['Osaka', 'Kyoto'],
    },
  },
  Korean: {
    accents: {
      'Standard (Seoul)': ['General', 'Formal', 'Casual'],
      'Busan': ['General'],
    },
  },
  Arabic: {
    accents: {
      'Modern Standard': ['General'],
      'Egyptian': ['Cairo', 'Alexandria'],
      'Levantine': ['Lebanese', 'Syrian', 'Jordanian'],
      'Gulf': ['Saudi', 'Emirati'],
    },
  },
  Portuguese: {
    accents: {
      'Brazilian': ['São Paulo', 'Rio de Janeiro', 'Bahian'],
      'European': ['Lisbon', 'Porto'],
    },
  },
  Italian: {
    accents: {
      'Standard': ['Milan', 'Rome'],
      'Sicilian': ['General'],
      'Tuscan': ['Florence'],
    },
  },
  Russian: {
    accents: {
      'Standard (Moscow)': ['General'],
      'St. Petersburg': ['General'],
    },
  },
};

export const LANGUAGES = Object.keys(LANGUAGE_ACCENT_DIALECT);

export function getAccentsForLanguage(language: string): string[] {
  const data = LANGUAGE_ACCENT_DIALECT[language];
  return data ? Object.keys(data.accents) : [];
}

export function getDialectsForAccent(language: string, accent: string): string[] {
  const data = LANGUAGE_ACCENT_DIALECT[language];
  return data?.accents[accent] || [];
}
