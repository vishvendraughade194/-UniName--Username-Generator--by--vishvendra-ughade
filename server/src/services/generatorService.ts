import { nanoid } from 'nanoid';
import nlp from 'compromise';
import natural from 'natural';
// Local English stopword list to avoid external dependency resolution issues
const DEFAULT_STOPWORDS = new Set([
  'a','an','the','and','or','but','if','then','else','when','at','by','for','in','of','on','to','up','with','as','is','it','its','be','am','are','was','were','been','being','do','does','did','doing','have','has','had','having','i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','they','them','their','theirs','themselves','this','that','these','those','there','here','from'
]);

type GenerateParams = {
  name: string;
  birthDate: string;
  word?: string;
  style?: string;
  count?: number;
  maxLength?: number;
  avoidNumbers?: boolean;
  avoidUnderscore?: boolean;
};

const tokenizer = new natural.WordTokenizer();

function normalize(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMeaningfulWords(text: string): string[] {
  const normalized = normalize(text);
  const tokens: string[] = tokenizer.tokenize(normalized.toLowerCase()) as unknown as string[];
  const withoutStops = tokens.filter((t: string) => !DEFAULT_STOPWORDS.has(t));
  const stemmed = withoutStops.map((t: string) => natural.PorterStemmer.stem(t));
  return Array.from(new Set<string>(stemmed)).filter((t: string) => t.length >= 2);
}

function nameVariants(name: string): string[] {
  const doc = nlp(name);
  const given = doc.people().firstNames().out('array') as string[];
  const last = doc.people().lastNames().out('array') as string[];
  const tokens = extractMeaningfulWords(name);
  const initials = tokens.map((t) => t[0]).join('');
  const combos = [
    ...given,
    ...last,
    tokens.join(''),
    tokens.join('_'),
    initials,
  ]
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  return Array.from(new Set(combos));
}

function birthDateVariants(birthDate: string): string[] {
  const digits = birthDate.replace(/\D/g, '');
  if (!digits) return [];
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  const last2 = year.slice(-2);
  return Array.from(
    new Set([
      year,
      last2,
      `${day}${month}`,
      `${month}${day}`,
      `${day}${month}${last2}`,
      `${month}${day}${last2}`,
    ].filter(Boolean))
  );
}

function wordVariants(word?: string): string[] {
  if (!word) return [];
  const words = extractMeaningfulWords(word);
  return [
    ...words,
    ...words.map((w) => `${w}s`),
    ...words.map((w) => `${w}x`),
  ];
}

function stylize(base: string, style: string): string[] {
  const clean = base.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const styles: Record<string, (s: string) => string> = {
    plain: (s) => s,
    leet: (s) => s.replace(/a/g, '4').replace(/e/g, '3').replace(/i/g, '1').replace(/o/g, '0').replace(/s/g, '5'),
    camel: (s) => s.replace(/(^|[_\-])(\w)/g, (_, __, c) => c.toUpperCase()),
    dots: (s) => s.split('').join('.'),
    waves: (s) => `~${s}~`,
    smart: (s) => s,
  };
  const chosen = styles[style] || styles.smart;
  return Array.from(new Set([clean, chosen(clean)]));
}

export function generateUsernames(params: GenerateParams): string[] {
  const { name, birthDate, word = '', style = 'smart', count = 10, maxLength = 24, avoidNumbers = false, avoidUnderscore = false } = params;
  const names = nameVariants(name);
  const dates = birthDateVariants(birthDate);
  const words = wordVariants(word);

  const bases: string[] = [];
  for (const n of names) {
    for (const d of dates) {
      bases.push(`${n}${d}`);
      bases.push(`${n}_${d}`);
    }
    for (const w of words) {
      bases.push(`${n}${w}`);
      bases.push(`${n}_${w}`);
    }
  }
  if (bases.length === 0) bases.push(name.toLowerCase());

  const candidates = new Set<string>();
  for (const base of bases) {
    for (const s of stylize(base, style)) {
      candidates.add(s);
      candidates.add(`${s}${Math.floor(Math.random() * 999)}`);
      candidates.add(`${s}_${nanoid(4)}`);
    }
  }

  let list = Array.from(candidates)
    .map((u) => u.replace(/__+/g, '_'))
    .filter((u) => u.length >= 3 && u.length <= maxLength)
    .slice(0, count * 5);

  // Heuristic ranking: prefer readable + includes user tokens
  const tokens = new Set([...extractMeaningfulWords(name), ...extractMeaningfulWords(word)]);
  let scored = list
    .map((u) => {
      const score =
        (/[a-z]/.test(u) ? 1 : 0) +
        (/[0-9]/.test(u) ? 0.2 : 0) +
        ([...tokens].some((t) => u.includes(t)) ? 1 : 0) +
        (/_/.test(u) ? 0.1 : 0);
      return { u, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.u);

  // Apply user filters at the end
  if (avoidNumbers) {
    scored = scored.filter((u) => !/[0-9]/.test(u));
  }
  if (avoidUnderscore) {
    scored = scored.filter((u) => !/_/.test(u));
  }

  return Array.from(new Set(scored)).slice(0, count);
}


