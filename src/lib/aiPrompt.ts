export const AI_MODEL_ID = "onnx-community/Qwen2.5-0.5B-Instruct";

export const AI_MODEL_NOTE =
  "この機能は端末内で動作する小規模AIを使います。モデル（初回のみダウンロード）以外は端末から何も送信しません。";

export const AI_MODEL_LIMITATION =
  "小規模AIのため、提案が不正確だったり誤った内容を含むことがあります。あくまで参考として、最終判断はYouTubeのガイドラインとご自身の確認で行ってください。";

export interface AiPromptInput {
  title?: string;
  description?: string;
  durationRaw?: string;
  genre?: string;
  target?: string;
  hashtags?: string[];
  chaptersRaw?: string;
}

export interface AiMessage {
  role: "system" | "user";
  content: string;
}

const MAX_DESCRIPTION_CHARS = 1500;
const MAX_CHAPTER_LINES = 8;

function clamp(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

function present(label: string, value: string): string | null {
  return value.trim() ? `${label}: ${value.trim()}` : null;
}

function buildUserContent(input: AiPromptInput): string {
  const lines: string[] = [];

  const title = present("タイトル", clamp(input.title ?? "", 100));
  if (title) lines.push(title);

  const duration = present("動画尺", input.durationRaw ?? "");
  if (duration) lines.push(duration);

  const genre = present("ジャンル", input.genre ?? "");
  if (genre) lines.push(genre);

  const target = present("ターゲット", input.target ?? "");
  if (target) lines.push(target);

  const hashtags = (input.hashtags ?? [])
    .map((h) => `#${h.replace(/^#/, "")}`)
    .join(" ");
  const tagLine = present("ハッシュタグ", hashtags);
  if (tagLine) lines.push(tagLine);

  const chapters = clamp(input.chaptersRaw ?? "", 2000)
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, MAX_CHAPTER_LINES);
  if (chapters.length > 0) {
    lines.push(`チャプター:\n${chapters.map((c) => `- ${c.trim()}`).join("\n")}`);
  }

  const description = clamp(input.description ?? "", MAX_DESCRIPTION_CHARS);
  if (description) {
    lines.push(`概要欄:\n${description}`);
  }

  if (lines.length === 0) {
    lines.push("（入力された情報はありません）");
  }

  return lines.join("\n\n");
}

export function buildAiMessages(input: AiPromptInput): AiMessage[] {
  return [
    {
      role: "system",
      content:
        "あなたはYouTube動画の投稿前チェックを支援するアシスタントです。次に与える動画情報だけを根拠に、投稿前に直すべき点を指摘してください。ルール:\n- 回答は日本語のみで、箇条書きで3〜5個にすること。各項目は短く簡潔に。\n- 与えられた情報に含まれる事実（タイトルの語、動画尺、ジャンル、ターゲット、チャプター、概要欄の内容）だけを使うこと。\n- 与えられていない情報を勝手に補わないこと。数値・時間・内容の創作はしないこと。\n- 情報が少ない場合は、その少なさを指摘するだけに留めること。\n- 各項目は「課題」を示し、続けて「直す方法」を1つ添えること。\n- 情報の要約はせず、必ず改善点だけを挙げること。\n- 回答の先頭に「改善提案:」のような前置きは不要で、番号付き箇条書きをすぐに書き始めること。\n\n回答例:\n1. タイトルが「…」なのに概要欄のキーワード「…」と重複している。タイトルの語を入れ替えて役割を分けることを提案します。\n2. 動画尺が「…」だがチャプターが未設定。チャプターを設定すると視聴者が目的の場面に直接飛べるようになります。",
    },
    {
      role: "user",
      content:
        `以下は投稿予定の動画情報です。この情報だけをもとに、投稿前の改善提案を箇条書きで提示してください。\n\n${buildUserContent(input)}`,
    },
  ];
}