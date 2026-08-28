export interface GenreOption {
  id: string;
  label: string;
  keywords: string[];
}

/**
 * YouTube Studio の動画「カテゴリ」でクリエイターが設定できる公式ジャンル15種。
 * 順序は YouTube のカテゴリ ID 順（1, 2, 10, 15, 17, 19, 20, 22, 23, 24,
 * 25, 26, 27, 28, 29）。ラベルは YouTube の日本語 UI に合わせている。
 */
export const GENRES: GenreOption[] = [
  {
    id: "film-animation",
    label: "映画・アニメーション",
    keywords: ["映画", "アニメ", "アニメーション", "短編", "film", "anime"],
  },
  {
    id: "autos-vehicles",
    label: "自動車・乗り物",
    keywords: ["自動車", "車", "カー", "バイク", "車両", "car", "bike", "vehicle"],
  },
  {
    id: "music",
    label: "音楽",
    keywords: ["音楽", "歌", "楽曲", "ミュージック", "シング", "music", "song"],
  },
  {
    id: "pets-animals",
    label: "ペット・動物",
    keywords: ["ペット", "動物", "犬", "猫", "野生", "pet", "animal"],
  },
  {
    id: "sports",
    label: "スポーツ",
    keywords: ["スポーツ", "筋トレ", "トレーニング", "野球", "サッカー", "運動", "sport"],
  },
  {
    id: "travel-events",
    label: "旅行・イベント",
    keywords: ["旅行", "旅", "観光", "イベント", "グルメ", "ホテル", "travel"],
  },
  {
    id: "gaming",
    label: "ゲーム",
    keywords: ["ゲーム", "実況", "プレイ", "配信", "攻略", "gaming", "game"],
  },
  {
    id: "people-blogs",
    label: "ブログ・人物",
    keywords: ["ブログ", "日常", "生活", "vlog", "blog", "人物"],
  },
  {
    id: "comedy",
    label: "コメディ",
    keywords: ["コメディ", "お笑い", "ギャグ", "ネタ", "大喜利", "comedy"],
  },
  {
    id: "entertainment",
    label: "エンターテインメント",
    keywords: ["エンタメ", "エンターテインメント", "バラエティ", "リアクション", "話題", "entertainment"],
  },
  {
    id: "news-politics",
    label: "ニュース・政治",
    keywords: ["ニュース", "政治", "社会", "報道", "時事", "news"],
  },
  {
    id: "howto-style",
    label: "ハウツー・スタイル",
    keywords: ["ハウツー", "作り方", "方法", "DIY", "料理", "メイク", "ヘア", "howto", "style"],
  },
  {
    id: "education",
    label: "教育",
    keywords: ["教育", "解説", "講座", "学習", "勉強", "授業", "education", "tutorial"],
  },
  {
    id: "science-technology",
    label: "科学・テクノロジー",
    keywords: ["科学", "テクノロジー", "tech", "プログラミング", "AI", "スマホ", "パソコン", "PC", "ガジェット"],
  },
  {
    id: "nonprofits-activism",
    label: "非営利団体・活動",
    keywords: ["非営利", "NPO", "支援", "活動", "社会貢献", "ボランティア"],
  },
];

export function resolveGenre(value: string): GenreOption | undefined {
  return GENRES.find((g) => g.label === value);
}

/** タイトル・概要欄などのテキストに、選択ジャンルの語が含まれるか（子文字列一致・小文字化）。 */
export function findGenreKeyword(genre: string, texts: string[]): string | null {
  const g = resolveGenre(genre);
  if (!g) return null;
  return findGenreKeywordByOption(g, texts);
}

export function findGenreKeywordByOption(genre: GenreOption, texts: string[]): string | null {
  const joined = texts.join(" ").toLowerCase();
  for (const kw of genre.keywords) {
    if (joined.includes(kw.toLowerCase())) return kw;
  }
  return null;
}