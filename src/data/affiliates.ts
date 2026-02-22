/**
 * アフィリエイトリンク一元管理
 * ASP承認後、各クリニックの href を実際のアフィリエイトリンクに差し替えてください。
 */

export interface Clinic {
  id: string;
  name: string;
  href: string; // ASP承認後にアフィリエイトリンクに差し替え
  asp: 'a8' | 'afb' | 'none';
  cost: string;
  costNote?: string;
  guarantee: string;
  locations: string;
  features: string[];
  recommended?: boolean;
  description: string;
}

export const clinics: Clinic[] = [
  {
    id: 'shinagawa',
    name: '品川近視クリニック',
    href: '#', // TODO: A8 or afb リンクに差し替え
    asp: 'none',
    cost: '42.7万円〜',
    costNote: '-4D以上は+11万円、乱視あり+10万円',
    guarantee: '3年間（再手術・定期検診）',
    locations: '全国5院（東京・梅田・名古屋・福岡・札幌）',
    features: [
      '7年連続国内最多症例数',
      'ICL認定医25名在籍',
      '全国5拠点で通いやすい',
      '適応検査無料',
    ],
    recommended: true,
    description:
      '国内最多の症例実績を持つ大手クリニック。全国5院展開で地方からもアクセスしやすく、3年間の充実した保証制度が特徴。',
  },
  {
    id: 'senshinkai',
    name: '先進会眼科',
    href: '#', // TODO: A8 or afb リンクに差し替え
    asp: 'none',
    cost: '42.7万円〜',
    costNote: '中等度以上は片眼+7.65万円、乱視あり片眼+4.9万円',
    guarantee: '1年間再手術無料、3年間定期検診無料',
    locations: '4院（東京・名古屋・大阪・福岡）',
    features: [
      'ICL症例31,000件超',
      'エキスパートインストラクター在籍',
      'STAARサージカルとパートナーシップ',
      '適応検査無料',
    ],
    description:
      'ICLレンズメーカーSTAAR社とパートナーシップを結ぶ実力派。最高位資格を持つ医師が執刀し、安心感が高い。',
  },
  {
    id: 'eyeclinic-tokyo',
    name: 'アイクリニック東京',
    href: '#', // TODO: A8 or afb リンクに差し替え
    asp: 'none',
    cost: '53万円〜',
    costNote: 'エキスパートプラン73〜78万円、乱視あり+10万円',
    guarantee: '6ヶ月〜1年（プランにより異なる）',
    locations: '3院（東京2院・大阪1院）',
    features: [
      'ICL専門クリニック',
      'エキスパートインストラクター3名在籍',
      '院長が33,000件超の臨床成績を論文発表',
    ],
    description:
      'ICLに特化した専門クリニック。最高位資格のエキスパートインストラクターが3名在籍し、技術力の高さが際立つ。',
  },
  {
    id: 'sbc-shinjuku',
    name: '新宿近視クリニック',
    href: '#', // TODO: A8 or afb リンクに差し替え
    asp: 'none',
    cost: '38.7万円〜',
    costNote: '-4D未満・月〜木曜日の価格。-4D以上は48.7万円〜',
    guarantee: '3年間（レンズ抜去手術費用無料）、検診1年無料',
    locations: '東京・新宿 1院',
    features: [
      'ICL実績34,000件超',
      '最新EVO+レンズ採用',
      '平日割引で業界最安クラス',
    ],
    description:
      'SBCメディカルグループ運営。平日料金は業界最安水準で、コスパ重視の方におすすめ。ICL実績も34,000件超と豊富。',
  },
];

/** 記事末尾CTA用のデフォルトクリニック */
export const defaultClinic = clinics[0];

/** IDからクリニックを取得 */
export function getClinicById(id: string): Clinic | undefined {
  return clinics.find((c) => c.id === id);
}
