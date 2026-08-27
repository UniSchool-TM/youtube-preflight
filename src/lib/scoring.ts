import type {
  ChapterAnalysis,
  DescriptionAnalysis,
  HashtagAnalysis,
  Reason,
  ScoreCategory,
  Severity,
  ThumbnailAnalysis,
  TitleAnalysis,
  TitleThumbnailRelation,
  DurationAnalysis,
} from "@/types";

const GOOD = "good";
const WARNING = "warning";
const CRITICAL = "critical";
const INFO = "info";

function part(label: string, earned: number, max: number, text: string, type: Severity = GOOD): Reason {
  const sign = earned > 0 ? `+${earned}点` : "±0点";
  return { type, text: `${label}: ${text}（${sign} / ${max}点）` };
}

function ratioSeverity(earned: number, max: number): Severity {
  const r = max === 0 ? 0 : earned / max;
  if (r >= 0.85) return GOOD;
  if (r >= 0.5) return WARNING;
  return CRITICAL;
}

function placeholder(earned: number, max: number, type: Severity, text: string): ScoreCategory {
  void earned;
  return {
    key: "",
    label: "",
    max,
    earned: 0,
    severity: type,
    reasons: [{ type, text }],
  };
}

/* ------------------------------------------------------------------ */
/* Thumbnail (30)                                                      */
/* ------------------------------------------------------------------ */

export function scoreThumbnail(a: ThumbnailAnalysis | null): ScoreCategory {
  if (!a) {
    return placeholder(0, 30, CRITICAL, "サムネイルが未設定です。30点満点中0点となります");
  }
  let earned = 0;
  const reasons: Reason[] = [];

  // 1. Resolution (5)
  if (a.width >= 1280 && a.height >= 720) {
    earned += 5;
    reasons.push(part("解像度", 5, 5, `1280x720 以上の推奨解像度（実際: ${a.width}x${a.height}）`));
  } else if (a.width >= 960 && a.height >= 540) {
    earned += 4;
    reasons.push(part("解像度", 4, 5, `1280x720 未満ですが HD 相当です（実際: ${a.width}x${a.height}）`, WARNING));
  } else if (a.width >= 640 && a.height >= 360) {
    earned += 3;
    reasons.push(part("解像度", 3, 5, `やや低解像度です（実際: ${a.width}x${a.height}）。1280x720 を推奨`, WARNING));
  } else if (a.width >= 320) {
    earned += 1;
    reasons.push(part("解像度", 1, 5, `低解像度です（実際: ${a.width}x${a.height}）。拡大されると粗く見えます`, CRITICAL));
  } else {
    reasons.push(part("解像度", 0, 5, "解像度が著しく低いです", CRITICAL));
  }

  // 2. Aspect ratio (5)
  const target = 16 / 9;
  const diff = Math.abs(a.aspectRatio - target);
  if (diff <= 0.05) {
    earned += 5;
    reasons.push(part("比率", 5, 5, `16:9 に近い比率です（実測: ${a.aspectRatio.toFixed(3)}）`));
  } else if (diff <= 0.15) {
    earned += 4;
    reasons.push(part("比率", 4, 5, `16:9 からややずれています（実測: ${a.aspectRatio.toFixed(3)}）`, WARNING));
  } else if (diff <= 0.3) {
    earned += 2;
    reasons.push(part("比率", 2, 5, `16:9 と異なる比率です。トリミングを検討してください（実測: ${a.aspectRatio.toFixed(3)}）`, CRITICAL));
  } else {
    reasons.push(part("比率", 0, 5, "16:9 から大きく外れています。動画プレイヤー表示と乖離します", CRITICAL));
  }

  // 3. File size (3)
  const mb = a.fileSize / 1024 / 1024;
  if (a.fileSize === 0) {
    reasons.push(part("容量", 0, 3, "ファイルサイズを取得できませんでした", WARNING));
  } else if (mb <= 2) {
    earned += 3;
    reasons.push(part("容量", 3, 3, `2MB 以下です（実際: ${mb.toFixed(2)}MB）`));
  } else if (mb <= 5) {
    earned += 2;
    reasons.push(part("容量", 2, 3, `やや大きめです（実際: ${mb.toFixed(2)}MB）。2MB 以内を推奨`, WARNING));
  } else if (mb <= 10) {
    earned += 1;
    reasons.push(part("容量", 1, 3, `大きめです（実際: ${mb.toFixed(2)}MB）`, WARNING));
  } else {
    earned += 0;
    reasons.push(part("容量", 0, 3, `10MB を超えています（実際: ${mb.toFixed(2)}MB）。圧縮を推奨`, CRITICAL));
  }

  // 4. Brightness (4)
  const b = a.avgBrightness;
  if (b >= 0.35 && b <= 0.75) {
    earned += 4;
    reasons.push(part("明るさ", 4, 4, `適正な明るさです（平均輝度: ${(b * 100).toFixed(0)}%）`));
  } else if ((b >= 0.3 && b < 0.35) || (b > 0.75 && b <= 0.8)) {
    earned += 3;
    reasons.push(part("明るさ", 3, 4, `明るさがやや${b < 0.35 ? "暗" : "明る"}めです（平均輝度: ${(b * 100).toFixed(0)}%）`, WARNING));
  } else if ((b >= 0.22 && b < 0.3) || (b > 0.8 && b <= 0.88)) {
    earned += 2;
    reasons.push(part("明るさ", 2, 4, `平均輝度が${b < 0.3 ? "かなり低い" : "かなり高い"}です（${(b * 100).toFixed(0)}%）`, WARNING));
  } else if (b < 0.22) {
    earned += 1;
    reasons.push(part("明るさ", 1, 4, `画像が暗すぎます。小さい表示では内容が確認しにくい可能性が高いです`, CRITICAL));
  } else {
    reasons.push(part("明るさ", 1, 4, "画像が明るすぎます。白飛びすると文字や被写体が消えます", WARNING));
  }

  // 5. Contrast (5)
  const c = a.contrast;
  if (c >= 0.16 && c <= 0.42) {
    earned += 5;
    reasons.push(part("コントラスト", 5, 5, `良好なコントラストです（分散指標: ${c.toFixed(2)}）`));
  } else if (c >= 0.1 && c < 0.16) {
    earned += 3;
    reasons.push(part("コントラスト", 3, 5, `コントラストがやや低いです。小さい表示では視認性が低下する可能性があります（指標: ${c.toFixed(2)}）`, WARNING));
  } else if (c > 0.42 && c <= 0.55) {
    earned += 3;
    reasons.push(part("コントラスト", 3, 5, "コントラストが高めです（指標: " + c.toFixed(2) + "）", WARNING));
  } else if (c > 0.55) {
    earned += 2;
    reasons.push(part("コントラスト", 2, 5, "コントラストが非常に高く、ディテールが潰れている可能性があります（指標: " + c.toFixed(2) + "）", WARNING));
  } else {
    earned += 1;
    reasons.push(part("コントラスト", 1, 5, "コントラストが低いため、小さい表示では視認性が低下する可能性があります", CRITICAL));
  }

  // 6. Saturation (3)
  const s = a.avgSaturation;
  if (s >= 0.16 && s <= 0.7) {
    earned += 3;
    reasons.push(part("彩度", 3, 3, `彩度は適正です（平均彩度: ${(s * 100).toFixed(0)}%）`));
  } else if (s >= 0.08 && s < 0.16) {
    earned += 2;
    reasons.push(part("彩度", 2, 3, "彩度が低めです。色の印象が弱くなる可能性があります（平均彩度: " + (s * 100).toFixed(0) + "%）", WARNING));
  } else if (s > 0.7 && s <= 0.88) {
    earned += 2;
    reasons.push(part("彩度", 2, 3, "彩度が高めです。極端な原色使いはチラつきの原因になることがあります（平均彩度: " + (s * 100).toFixed(0) + "%）", WARNING));
  } else if (s > 0.88) {
    earned += 1;
    reasons.push(part("彩度", 1, 3, "彩度が非常に高いです（平均彩度: " + (s * 100).toFixed(0) + "%）", WARNING));
  } else {
    earned += 1;
    reasons.push(part("彩度", 1, 3, "彩度が非常に低く、ほぼ無彩色です（平均彩度: " + (s * 100).toFixed(0) + "%）", WARNING));
  }

  // 7. Info density via edges (3)
  const e = a.edgesPerPixel;
  if (e >= 0.14 && e <= 0.4) {
    earned += 3;
    reasons.push(part("情報量", 3, 3, `適正な情報量です（エッジ量指標: ${e.toFixed(2)}）`));
  } else if (e >= 0.08 && e < 0.14) {
    earned += 2;
    reasons.push(part("情報量", 2, 3, `エッジ量が少なめです。要素が少なく情報量が少ない可能性があります（指標: ${e.toFixed(2)}）`, WARNING));
  } else if (e > 0.4 && e <= 0.55) {
    earned += 2;
    reasons.push(part("情報量", 2, 3, "エッジ量が多いため情報過多の可能性があります（指標: " + e.toFixed(2) + "）", WARNING));
  } else if (e < 0.08) {
    earned += 1;
    reasons.push(part("情報量", 1, 3, "エッジ量が極端に少ないです（指標: " + e.toFixed(2) + "）。平坦な画像の可能性があります", WARNING));
  } else {
    earned += 1;
    reasons.push(part("情報量", 1, 3, "エッジ量が極端に多く、文字や被写体が密集している可能性があります（指標: " + e.toFixed(2) + "）", WARNING));
  }

  // 8. Technical (2)
  earned += 2;
  reasons.push(part("解析成功", 2, 2, "画像のデコード・解析に成功し、データを取得できました"));

  return { key: "thumbnail", label: "サムネイル", max: 30, earned, severity: ratioSeverity(earned, 30), reasons };
}

/* ------------------------------------------------------------------ */
/* Title (25)                                                          */
/* ------------------------------------------------------------------ */

export function scoreTitle(a: TitleAnalysis | null): ScoreCategory {
  if (!a || a.raw.trim().length === 0) {
    return placeholder(0, 25, CRITICAL, "タイトルが未入力です。25点満点中0点となります");
  }
  let earned = 0;
  const reasons: Reason[] = [];
  const n = a.counts.total;

  // Length (5)
  if (n === 0) reasons.push(part("長さ", 0, 5, "タイトルが空です", CRITICAL));
  else if (n >= 20 && n <= 60) {
    earned += 5;
    reasons.push(part("長さ", 5, 5, `適切な長さです（${n} 文字）`));
  } else if ((n >= 10 && n < 20) || (n > 60 && n <= 80)) {
    earned += 4;
    reasons.push(part("長さ", 4, 5, `やや${n < 20 ? "短" : "長"}めです（${n} 文字）。20〜60文字が目安`, WARNING));
  } else if (n >= 1 && (n < 10 || n > 80)) {
    earned += 2;
    reasons.push(part("長さ", 2, 5, n < 10 ? `${n} 文字と短く、情報が不足する可能性があります` : `${n} 文字と長く、途中で切れる可能性があります`, n > 100 ? CRITICAL : WARNING));
  }

  // Important word placement (5)
  const f = a.frontInfoRatio;
  if (a.tokens.length === 0) {
    reasons.push(part("重要語の配置", 1, 5, "重要語らしき語（数字・カタカナ・漢字など）が検出できませんでした", WARNING));
  } else if (f >= 0.6) {
    earned += 5;
    reasons.push(part("重要語の配置", 5, 5, `重要語が前半（約4割）に集まっています（前方比率: ${(f * 100).toFixed(0)}%）`));
  } else if (f >= 0.4) {
    earned += 4;
    reasons.push(part("重要語の配置", 4, 5, `重要語の配置は良好です（前方比率: ${(f * 100).toFixed(0)}%）`));
  } else if (f >= 0.2) {
    earned += 3;
    reasons.push(part("重要語の配置", 3, 5, `重要語は前半より後半に多いです（前方比率: ${(f * 100).toFixed(0)}%）`, WARNING));
  } else {
    earned += 2;
    reasons.push(part("重要語の配置", 2, 5, `重要語が後半に偏っています。小さい画面で見えにくくなる可能性があります（前方比率: ${(f * 100).toFixed(0)}%）`, WARNING));
  }

  // Specificity (5)
  const contentTokens = a.tokens.filter((t) => t.importance >= 2).length;
  const hasDigit = a.structure.hasDigits;
  if (contentTokens >= 2 && hasDigit) {
    earned += 5;
    reasons.push(part("具体性", 5, 5, `数字と具体的な語（カタカナ語・漢字）が含まれています`));
  } else if (contentTokens >= 2) {
    earned += 4;
    reasons.push(part("具体性", 4, 5, "具体的な語が含まれています（数字を1つ入れるとさらに伝わりやすくなります）", INFO));
  } else if (contentTokens >= 1 || hasDigit) {
    earned += 3;
    reasons.push(part("具体性", 3, 5, "具体的な内容を示す語が少なめです", WARNING));
  } else {
    earned += 1;
    reasons.push(part("具体性", 1, 5, "数字・カタカナ語・固有名詞らしき語が少なく、内容が抽象的な可能性があります", WARNING));
  }

  // Structure (5)
  let s = 3;
  const sReasons: string[] = [];
  if (a.structure.isQuestionForm) { s += 1; sReasons.push("疑問形"); }
  if (a.structure.hasExclamationMark && a.structure.exclamation) { sReasons.push("感嘆表現"); }
  if (a.structure.squareBrackets || a.structure.cornerBrackets || a.structure.parens) { s += 1; sReasons.push("括弧・カッコ"); }
  if (a.structure.colon) { sReasons.push("コロン"); }
  s = Math.min(5, s);
  earned += s;
  if (s >= 5) reasons.push(part("構造", 5, 5, `構造要素が効果的です（${sReasons.join("・")}）`));
  else if (s === 4) reasons.push(part("構造", 4, 5, `構造要素があります（${sReasons.join("・") || "なし"}）`));
  else reasons.push(part("構造", 3, 5, "明確な構造要素（疑問形・括弧・感嘆表現など）がありません。場所・数字・対象を伝えると読み手に届きやすくなります", INFO));

  // Balance / no overuse (5)
  let balance = 5;
  for (const issue of a.overuseIssues) {
    if (issue.key === "too-short") { balance -= 1; continue; }
    if (issue.key === "empty") continue;
    balance -= issue.severity === CRITICAL ? 2 : 1;
    reasons.push({
      type: issue.severity,
      text: `${issue.label}: ${issue.detail}（-${issue.severity === CRITICAL ? 2 : 1}点）`,
    });
  }
  balance = Math.max(0, balance);
  earned += balance;
  if (balance === 5) reasons.push(part("過剰表現なし", 5, 5, "過剰な記号・繰り返し・不自然な空白はありません"));

  return { key: "title", label: "タイトル", max: 25, earned, severity: ratioSeverity(earned, 25), reasons };
}

/* ------------------------------------------------------------------ */
/* Title x Thumbnail (20)                                              */
/* ------------------------------------------------------------------ */

export function scoreTitleThumbnail(r: TitleThumbnailRelation | null): ScoreCategory {
  const reasons: Reason[] = [];
  if (!r) {
    return placeholder(0, 20, CRITICAL, "タイトルとサムネイルの関係を評価できません");
  }
  if (!r.hasTitle) {
    return placeholder(0, 20, CRITICAL, "タイトルが未入力のため評価できません");
  }
  if (!r.hasThumbnailText) {
    const earned = 5;
    return {
      key: "titleThumbnail",
      label: "タイトル×サムネイル",
      max: 20,
      earned,
      severity: INFO,
      reasons: [
        { type: INFO, text: "サムネイル文字が未入力のため「部分評価」となります（5/20点）" },
        { type: INFO, text: "「サムネイル文字」欄に、サムネイル上に書いた文字を入力すると、完全一致語・重複率・数字の一致をチェックできます" },
        { type: GOOD, text: "タイトルは設定されています（+5点 / 5点）" },
      ],
    };
  }

  let earned = 0;
  // 1. Complementary (7)
  const ov = r.overlapRatio;
  if (ov <= 0.3) {
    earned += 7;
    reasons.push(part("補完関係", 7, 7, `タイトルとサムネイル文字の重複が少なく、補完関係にあります（重複率: ${(ov * 100).toFixed(0)}%）`));
  } else if (ov <= 0.5) {
    earned += 5;
    reasons.push(part("補完関係", 5, 7, `重複はありますが過剰ではありません（重複率: ${(ov * 100).toFixed(0)}%）`, WARNING));
  } else if (ov <= 0.7) {
    earned += 2;
    reasons.push(part("補完関係", 2, 7, `タイトルとサムネイル文字が似ています（重複率: ${(ov * 100).toFixed(0)}%）`, WARNING));
  } else {
    earned += 0;
    reasons.push(part("補完関係", 0, 7, `タイトルとサムネイル文字がほぼ同じ情報です。役割が重複している可能性があります（重複率: ${(ov * 100).toFixed(0)}%）`, CRITICAL));
  }

  // 2. Numbers (5)
  const thumbs = r.thumbnailTextWords.join(" ");
  const hasThumbDigits = /\d/.test(thumbs);
  if (!hasThumbDigits) {
    earned += 4;
    reasons.push(part("数字の整合", 4, 5, "サムネイル文字に数字がないため、数字の不一致リスクはありません"));
  } else if (r.digitMatches.length > 0) {
    earned += 5;
    reasons.push(part("数字の整合", 5, 5, `タイトルとサムネイルの数字が一致しています（${r.digitMatches.join(", ")}）`));
  } else {
    earned += 0;
    reasons.push(part("数字の整合", 0, 5, "サムネイル文字の数字がタイトルに含まれていません。数字の取り違えに注意してください", WARNING));
  }

  // 3. Overall duplication (8)
  const ex = r.exactMatches;
  let earned3: number;
  if (ex.length === 0) {
    earned3 = 8;
    reasons.push(part("表現の独立性", 8, 8, "完全に一致する語はありません"));
  } else if (ex.length <= 2) {
    earned3 = 6;
    reasons.push(part("表現の独立性", 6, 8, `一部の語が一致しています（${ex.length} 件: ${ex.join(", ")}）。強調目的なら自然です`, INFO));
  } else if (ex.length <= 4) {
    earned3 = 3;
    reasons.push(part("表現の独立性", 3, 8, `複数の語が一致しています。意図的な強調でなければ見直しを推奨します（${ex.length} 件: ${ex.join(", ")}）`, WARNING));
  } else {
    earned3 = 0;
    reasons.push(part("表現の独立性", 0, 8, `多くの語が一致しています。役割が重複している可能性があります（${ex.length} 件）`, CRITICAL));
  }
  earned += earned3;

  return { key: "titleThumbnail", label: "タイトル×サムネイル", max: 20, earned, severity: ratioSeverity(earned, 20), reasons };
}

/* ------------------------------------------------------------------ */
/* Description (10)                                                    */
/* ------------------------------------------------------------------ */

export function scoreDescription(d: DescriptionAnalysis | null): ScoreCategory {
  const reasons: Reason[] = [];
  if (!d) return placeholder(0, 10, INFO, "概要欄ピアリングが完了していません");
  if (d.length === 0) {
    return { key: "description", label: "概要欄", max: 10, earned: 0, severity: INFO, reasons: [{ type: INFO, text: "概要欄が未入力です（0/10点）。記入を推奨します。" }] };
  }

  let earned = 0;
  // Length (3)
  if (d.length >= 300) { earned += 3; reasons.push(part("長さ", 3, 3, `十分な量です（${d.length} 文字）`)); }
  else if (d.length >= 120) { earned += 2; reasons.push(part("長さ", 2, 3, `普通の長さです（${d.length} 文字）。300文字以上で情報が充実します`, INFO)); }
  else { earned += 1; reasons.push(part("長さ", 1, 3, `短めです（${d.length} 文字）。リンクや目次などを入れると充実します`, WARNING)); }

  // Opening line (2)
  if (d.firstLineLength > 0 && d.firstLineLength <= 80) { earned += 2; reasons.push(part("冒頭文", 2, 2, `冒頭文が簡潔です（${d.firstLineLength} 文字）`)); }
  else if (d.firstLineLength <= 100) { earned += 1; reasons.push(part("冒頭文", 1, 2, `冒頭文がやや長いです（${d.firstLineLength} 文字）`, WARNING)); }
  else { earned += 0; reasons.push(part("冒頭文", 0, 2, `冒頭文が長いです（${d.firstLineLength} 文字）。重要な情報は先頭約100文字に入れましょう`, WARNING)); }

  // URL quality (2)
  if (d.nonHttpsCount > 0) {
    reasons.push(part("URL", 0, 2, `HTTPS ではない URL があります（${d.nonHttpsCount} 件）`, WARNING));
  } else if (d.duplicateUrls.length > 0) {
    earned += 1;
    reasons.push(part("URL", 1, 2, `重複 URL があります（${d.duplicateUrls.length} 件）`, WARNING));
  } else if (d.urlCount > 5) {
    earned += 1;
    reasons.push(part("URL", 1, 2, `URL が ${d.urlCount} 個あります。多すぎると読みづらくなる可能性があります`, WARNING));
  } else {
    earned += 2;
    reasons.push(part("URL", 2, 2, d.urlCount === 0 ? "URL 形式の問題はありません" : `URL はすべて HTTPS です（${d.urlCount} 件）`));
  }

  // Hashtag moderation (2)
  if (d.hashtagCount > 15) {
    reasons.push(part("ハッシュタグ", 0, 2, `概要欄のハッシュタグが ${d.hashtagCount} 個あります。整理を推奨します`, WARNING));
  } else {
    earned += 2;
    reasons.push(part("ハッシュタグ", 2, 2, d.hashtagCount === 0 ? "ハッシュタグの乱用はありません" : `ハッシュタグは ${d.hashtagCount} 個で適量です`));
  }

  // Structure (1)
  const structuralOk = !d.trailingWhitespace && d.maxConsecutiveEmptyLines < 3 && !d.unnaturalWhitespace;
  earned += structuralOk ? 1 : 0;
  reasons.push(structuralOk
    ? part("構造", 1, 1, "改行・空白の構造に問題はありません")
    : part("構造", 0, 1, "末尾の空白・連続空行・タブなどが検出されました", WARNING));

  return { key: "description", label: "概要欄", max: 10, earned, severity: ratioSeverity(earned, 10), reasons };
}

/* ------------------------------------------------------------------ */
/* Chapters (5)                                                        */
/* ------------------------------------------------------------------ */

export function scoreChapters(c: ChapterAnalysis | null): ScoreCategory {
  if (!c) return placeholder(0, 5, INFO, "チャプターが未解析です");
  if (c.chapters.length === 0) {
    return {
      key: "chapters",
      label: "チャプター",
      max: 5,
      earned: 0,
      severity: INFO,
      reasons: [{ type: INFO, text: "チャプターが未設定です（0/5点）。設定すると YouTube のチャプター機能で視聴者が必要な場面に飛びやすくなります。" }],
    };
  }
  let earned = 0;
  const reasons: Reason[] = [];

  // Format (1)
  if (c.invalidLines.length === 0) { earned += 1; reasons.push(part("形式", 1, 1, "すべての行が時刻＋タイトル形式で読み取れました")); }
  else { reasons.push(part("形式", 0, 1, `形式が不正な行があります（${c.invalidLines.length} 行）`, CRITICAL)); }

  // First is 00:00 (1)
  if (c.startsAtZero) { earned += 1; reasons.push(part("先頭", 1, 1, "最初のチャプターが 00:00 です")); }
  else { reasons.push(part("先頭", 0, 1, "最初のチャプターが 00:00 ではありません", WARNING)); }

  // Ascending (1)
  if (c.isAscending) { earned += 1; reasons.push(part("時刻順序", 1, 1, "チャプター時刻が昇順です")); }
  else { reasons.push(part("時刻順序", 0, 1, "チャプター時刻が昇順になっていません", CRITICAL)); }

  // Within duration (1)
  if (!c.exceedsDuration) { earned += 1; reasons.push(part("動画尺内", 1, 1, "全チャプターが動画尺の範囲内です")); }
  else { reasons.push(part("動画尺内", 0, 1, "動画尺を超えるチャプターがあります", CRITICAL)); }

  // Titles present & spacing (1)
  if (c.missingTitles === 0 && !c.tooShortGap) {
    earned += 1;
    reasons.push(part("タイトル・間隔", 1, 1, "全チャプターにタイトルがあり、間隔も 10 秒以上です"));
  } else {
    const parts: string[] = [];
    if (c.missingTitles > 0) parts.push(`タイトルなし ${c.missingTitles} 件`);
    if (c.tooShortGap && c.minGap !== null) parts.push(`最短間隔 ${c.minGap} 秒（10秒未満）`);
    reasons.push(part("タイトル・間隔", 0, 1, parts.join(" / "), WARNING));
  }

  return { key: "chapters", label: "チャプター", max: 5, earned, severity: ratioSeverity(earned, 5), reasons };
}

/* ------------------------------------------------------------------ */
/* Hashtags (5)                                                        */
/* ------------------------------------------------------------------ */

export function scoreHashtags(h: HashtagAnalysis | null): ScoreCategory {
  if (!h) return placeholder(0, 5, INFO, "ハッシュタグが未解析です");
  if (h.count === 0) {
    return {
      key: "hashtags",
      label: "ハッシュタグ",
      max: 5,
      earned: 0,
      severity: INFO,
      reasons: [{ type: INFO, text: "ハッシュタグが未設定です（0/5点）。設定は任意ですが、関連動画からの流入につながることがあります。" }],
    };
  }
  let earned = 0;
  const reasons: Reason[] = [];

  // Count (2)
  if (h.count >= 3 && h.count <= 10) { earned += 2; reasons.push(part("個数", 2, 2, `適量です（${h.count} 個）`)); }
  else if (h.count <= 2) { earned += 1; reasons.push(part("個数", 1, 2, `やや少ないです（${h.count} 個）。3〜10個が推奨`, INFO)); }
  else if (h.count <= 15) { earned += 1; reasons.push(part("個数", 1, 2, `やや多いです（${h.count} 個）`, WARNING)); }
  else { reasons.push(part("個数", 0, 2, `ハッシュタグが ${h.count} 個あります。多すぎます`, CRITICAL)); }

  // No duplicates (1)
  if (h.duplicates.length === 0) { earned += 1; reasons.push(part("重複なし", 1, 1, "重複したハッシュタグはありません")); }
  else { reasons.push(part("重複なし", 0, 1, `重複: ${h.duplicates.join(", ")}`, WARNING)); }

  // Quality (2)
  let qual = 2;
  const qIssues: string[] = [];
  if (h.tags.some((t) => t.hasSpecial)) { qual -= 1; qIssues.push("特殊文字"); }
  if (h.maxLength > 45) { qual -= 1; qIssues.push("長いタグ"); }
  qual = Math.max(0, qual);
  earned += qual;
  if (qual === 2) reasons.push(part("品質", 2, 2, "特殊文字はなく、長さも適切です"));
  else reasons.push(part("品質", qual, 2, qIssues.join(" / ") + " が含まれます", WARNING));

  return { key: "hashtags", label: "ハッシュタグ", max: 5, earned, severity: ratioSeverity(earned, 5), reasons };
}

/* ------------------------------------------------------------------ */
/* Technical (5)                                                       */
/* ------------------------------------------------------------------ */

export interface TechnicalContext {
  thumbnailAnalyzed: boolean;
  duration: DurationAnalysis | null;
  chapters: ChapterAnalysis | null;
  description: DescriptionAnalysis | null;
  titleAnalysis: TitleAnalysis | null;
}

export function scoreTechnical(t: TechnicalContext): ScoreCategory {
  let earned = 0;
  const reasons: Reason[] = [];

  if (t.thumbnailAnalyzed) { earned += 1; reasons.push(part("サムネイル解析", 1, 1, "サムネイルのデコード・解析に成功")); }
  else { reasons.push(part("サムネイル解析", 0, 1, "サムネイルが未設定のため解析できません", CRITICAL)); }

  if (t.duration && t.duration.valid) { earned += 1; reasons.push(part("動画尺形式", 1, 1, `動画尺を正しく認識しました（${secToLabel(t.duration.seconds!)}）`)); }
  else { reasons.push(part("動画尺形式", 0, 1, t.duration && t.duration.errors.length > 0 ? `動画尺: ${t.duration.errors[0]}` : "動画尺が未入力です", WARNING)); }

  if (t.chapters && !t.chapters.exceedsDuration) { earned += 1; reasons.push(part("チャプター整合", 1, 1, "章チャーの時間が動画尺を超えていません")); }
  else if (t.chapters && t.chapters.exceedsDuration) { reasons.push(part("チャプター整合", 0, 1, "章チャーの時間が動画尺を超えています", CRITICAL)); }
  else { earned += 1; reasons.push(part("チャプター整合", 1, 1, "章チャーが未設定のため整合性問題はありません")); }

  const desc = t.description;
  if (desc && desc.nonHttpsCount > 0) { reasons.push(part("URL形式", 0, 1, "HTTPS ではない URL があります", WARNING)); }
  else { earned += 1; reasons.push(part("URL形式", 1, 1, "URL に形式上の問題はありません（HTTP リンクなし）")); }

  const title = t.titleAnalysis;
  const titleShort = title && title.counts.total > 0 && title.counts.total <= 300;
  const descOk = !desc || desc.length <= 50000;
  const chaptersOk = !t.chapters || t.chapters.chapters.length <= 300;
  if (titleShort && descOk && chaptersOk) { earned += 1; reasons.push(part("入力容量", 1, 1, "各入力のサイズは正常範囲です")); }
  else { reasons.push(part("入力容量", 0, 1, "一部の入力が異常に大きいです。減らして再診断してください", CRITICAL)); }

  return { key: "technical", label: "技術チェック", max: 5, earned, severity: ratioSeverity(earned, 5), reasons };
}

function secToLabel(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}

/* ------------------------------------------------------------------ */
/* Overall                                                             */
/* ------------------------------------------------------------------ */

export type { Severity, Reason };

export function gradeLabel(severity: Severity): string {
  switch (severity) {
    case GOOD: return "良好";
    case WARNING: return "注意";
    case CRITICAL: return "要改善";
    case INFO: return "情報";
  }
}