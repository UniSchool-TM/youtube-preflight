export type Severity = "good" | "warning" | "critical" | "info";

export interface Reason {
  type: Severity;
  text: string;
}

export interface ScorePart {
  earned: number;
  max: number;
}

export interface ScoreCategory {
  key: string;
  label: string;
  max: number;
  earned: number;
  severity: Severity;
  reasons: Reason[];
}

export interface DiagnosisInput {
  title: string;
  description: string;
  durationRaw: string;
  durationSeconds: number | null;
  genre: string;
  target: string;
  thumbnailText: string;
  chaptersRaw: string;
  hashtagsRaw: string;
  thumbnail: ThumbnailFile | null;
}

export interface ThumbnailFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  width?: number;
  height?: number;
}

export interface DominantColor {
  hex: string;
  rgb: [number, number, number];
  hsl: [number, number, number];
  ratio: number; // 0-1 proportion of pixels
}

export interface LuminanceHistogram {
  bins: number[]; // 16 bins 0-15 (each bin 16 luma levels)
  mean: number;
}

export interface ThumbnailAnalysis {
  width: number;
  height: number;
  aspectRatio: number;
  format: string;
  fileSize: number;
  totalPixels: number;
  avgBrightness: number; // 0-1
  avgSaturation: number; // 0-1
  contrast: number; // 0-1 (std of luma normalized)
  edgeAmount: number; // 0-1
  edgesPerPixel: number;
  dominantColors: DominantColor[];
  luminanceHistogram: number[];
  sampledWidth: number;
  sampledHeight: number;
  errors: string[];
}

export interface TitleToken {
  text: string;
  start: number;
  end: number;
  importance: number;
  reason: string[];
}

export interface TitleCharacterCounts {
  total: number;
  japanese: number;
  kanji: number;
  hiragana: number;
  katakana: number;
  alnum: number;
  digits: number;
  letters: number;
  symbols: number;
  emoji: number;
  whitespace: number;
}

export interface TitleStructure {
  squareBrackets: boolean;
  cornerBrackets: boolean;
  parens: boolean;
  exclamation: boolean;
  question: boolean;
  colon: boolean;
  hasDigits: boolean;
  isQuestionForm: boolean;
  hasExclamationMark: boolean;
  repeatedChar: boolean;
  repeatedSequences: string[];
}

export interface TitleOveruseIssue {
  key: string;
  label: string;
  detail: string;
  severity: Severity;
}

export interface TitleAnalysis {
  raw: string;
  counts: TitleCharacterCounts;
  tokens: TitleToken[];
  structure: TitleStructure;
  overuseIssues: TitleOveruseIssue[];
  repeatedWords: { word: string; count: number }[];
  frontInfoRatio: number; // 0-1
  frontInfoReason: string;
  words: string[];
}

export interface TitleSimulationRow {
  device: string;
  label: string;
  visibleChars: number;
  truncated: boolean;
  hiddenImportantWords: string[];
}

export interface UrlInfo {
  raw: string;
  scheme: string;
  host: string;
  isHttps: boolean;
  normalized: string;
}

export interface DescriptionAnalysis {
  length: number;
  lineCount: number;
  urlCount: number;
  hashtagCount: number;
  mentionCount: number;
  emptyLineCount: number;
  maxConsecutiveEmptyLines: number;
  emojiCount: number;
  firstLineLength: number;
  lineWidths: number[];
  trailingWhitespace: boolean;
  unnaturalWhitespace: boolean;
  urls: UrlInfo[];
  duplicateUrls: string[];
  nonHttpsCount: number;
  hashtagDensity: number;
  warnings: { label: string; severity: Severity; detail: string }[];
}

export interface Chapter {
  timeSeconds: number;
  timeLabel: string;
  title: string;
  raw: string;
}

export interface ChapterAnalysis {
  chapters: Chapter[];
  totalCount: number;
  invalidLines: string[];
  startsAtZero: boolean;
  isAscending: boolean;
  hasDuplicates: boolean;
  duplicateTimes: string[];
  exceedsDuration: boolean;
  missingTitles: number;
  minGap: number | null;
  tooShortGap: boolean;
  warnings: { label: string; severity: Severity; detail: string }[];
}

export interface HashtagItem {
  tag: string;
  length: number;
  hasJapanese: boolean;
  hasEnglish: boolean;
  hasDigits: boolean;
  hasSpecial: boolean;
}

export interface HashtagAnalysis {
  tags: HashtagItem[];
  count: number;
  duplicates: string[];
  uniqueCount: number;
  totalChars: number;
  maxLength: number;
  warnings: { label: string; severity: Severity; detail: string }[];
}

export interface DurationAnalysis {
  raw: string;
  seconds: number | null;
  valid: boolean;
  errors: string[];
}

export interface TitleThumbnailRelation {
  hasTitle: boolean;
  hasThumbnailText: boolean;
  thumbnailTextWords: string[];
  exactMatches: string[];
  overlapRatio: number; // 0-1
  digitMatches: string[];
  duplicateRole: boolean;
  messages: Reason[];
}

export type ChecklistStatus = "pass" | "critical" | "warning" | "info" | "unset";

export interface ChecklistItem {
  key: string;
  label: string;
  status: ChecklistStatus;
  detail: string;
}

export interface DiagnosisSummary {
  critical: number;
  warning: number;
  info: number;
  pass: number;
  unset: number;
}

export interface DiagnosisResult {
  id: string;
  createdAt: number;
  input: DiagnosisInput;
  thumbnail: ThumbnailAnalysis | null;
  title: TitleAnalysis | null;
  description: DescriptionAnalysis | null;
  chapters: ChapterAnalysis | null;
  hashtags: HashtagAnalysis | null;
  duration: DurationAnalysis | null;
  relation: TitleThumbnailRelation | null;
  scores: ScoreCategory[];
  totalScore: number;
  checklist: ChecklistItem[];
  summary: DiagnosisSummary;
  privacyNote: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  title: string;
  totalScore: number;
  warningCount: number;
  criticalCount: number;
  hasThumbnail: boolean;
  thumbnailId: string | null;
  input: DiagnosisInput;
  result: DiagnosisResult;
}

export type ThemePreference = "light" | "dark" | "auto";

export interface AppSettings {
  theme: ThemePreference;
  historyEnabled: boolean;
}