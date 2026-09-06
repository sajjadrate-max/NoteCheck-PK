// Vercel serverless function
// Requires OPENAI_API_KEY set as an environment variable in the Vercel project settings.

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb'
    }
  }
};

const VALID_DENOMINATIONS = ['5000', '1000', '500', '100', '50', '20', '10'];

const DENOM_HINTS = {
  '5000': 'ارغوانی/جامنی رنگ کا نوٹ، تصویر میں مینار پاکستان کی عکاسی ہوتی ہے۔',
  '1000': 'مٹیالے سنہری/بھورے رنگ کا نوٹ، بادشاہی مسجد کی عکاسی ہوتی ہے۔',
  '500': 'سبز رنگ کا نوٹ، فیصل مسجد کی عکاسی ہوتی ہے۔',
  '100': 'سمندری سبز/فیروزی رنگ کا نوٹ، خیبر پاس کی عکاسی ہوتی ہے۔',
  '50': 'گہرے سبز رنگ کا نوٹ، اسلامیہ کالج پشاور کی عکاسی ہوتی ہے۔',
  '20': 'نارنجی/بھورے رنگ کا نوٹ، گوادر پورٹ یا اسٹیٹ بینک کی عکاسی ہوتی ہے۔',
  '10': 'سبزی مائل بھورے رنگ کا نوٹ (اب اسٹیٹ بینک کی جانب سے بتدریج واپس لیا جا رہا ہے، لیکن قانونی حیثیت رکھتا ہے)۔'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'صرف POST درخواست قبول ہے' });
  }

  const { image, light_image, denomination } = req.body || {};
  if (!image || typeof image !== 'string' || !image.startsWith('data:image')) {
    return res.status(400).json({ error: 'تصویر موصول نہیں ہوئی' });
  }
  const hasLightImage = typeof light_image === 'string' && light_image.startsWith('data:image');
  const denom = VALID_DENOMINATIONS.includes(String(denomination)) ? String(denomination) : null;
  if (!denom) {
    return res.status(400).json({ error: 'نوٹ کی مالیت درست نہیں، پہلے مالیت منتخب کریں' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'سرور کنفیگریشن نامکمل ہے (API key موجود نہیں)' });
  }

  const systemPrompt = `آپ ایک محتاط معاون ہیں جو صرف تصویر دیکھ کر پاکستانی کرنسی نوٹ کی نظر آنے والی خصوصیات کا جائزہ لیتے ہیں۔
صارف نے بتایا ہے کہ یہ ${denom} روپے کا نوٹ ہے۔ اس مالیت کی عمومی شناخت: ${DENOM_HINTS[denom]}
اگر تصویر میں نظر آنے والا نوٹ اس بتائی گئی مالیت سے مطابقت نہ رکھتا ہو (رنگ، ڈیزائن، یا مالیت کے ہندسے مختلف ہوں)، تو یہ بات observations اور summary میں ضرور واضح طور پر بتائیں۔

آپ کبھی بھی حتمی طور پر "اصلی" یا "جعلی" کا فیصلہ نہیں دیتے — کیونکہ تصویر سے UV فیچرز، مقناطیسی سیاہی، اور کاغذ کی ساخت کی تصدیق ممکن نہیں۔
آپ کا کام صرف یہ ہے کہ تصویر میں نظر آنے والی چیزوں کی بنیاد پر مشاہدات دیں اور مجموعی احتیاطی سطح بتائیں۔
${hasLightImage ? 'صارف نے دوسری تصویر بھی بھیجی ہے جو نوٹ کو روشنی کے سامنے (بیک لِٹ) رکھ کر لی گئی ہے۔ اس تصویر کو خاص طور پر واٹر مارک (قائد اعظم کی تصویر) اور سیکیورٹی تھریڈ کی وضاحت جانچنے کے لیے استعمال کریں — اصلی نوٹ میں یہ روشنی میں صاف اور سیدھی نظر آتی ہیں۔' : 'صارف نے صرف عام روشنی میں تصویر بھیجی ہے۔ اگر ممکن ہو تو summary میں یہ مشورہ دیں کہ نوٹ کو روشنی کے سامنے رکھ کر دوسری تصویر بھیجنے سے واٹر مارک اور سیکیورٹی تھریڈ کا بہتر جائزہ لیا جا سکتا ہے۔'}

نتیجہ سختی سے اس JSON فارمیٹ میں دیں، کوئی اضافی متن، وضاحت یا مارک ڈاؤن بیک ٹکس شامل نہ کریں:

{
  "denomination_guess": "تصویر میں نظر آنے والی مالیت (اگر بتائی گئی مالیت سے مختلف لگے تو یہاں وضاحت کریں)",
  "risk_level": "low" | "medium" | "high",
  "observations": [
    { "title": "خصوصیت کا نام (اردو میں)", "note": "تصویر میں یہ خصوصیت کیسی نظر آئی، ایک سے دو جملوں میں (اردو میں)" }
  ],
  "summary": "دو سے تین جملوں میں مجموعی اردو خلاصہ، جس میں یہ ضرور شامل ہو کہ یہ صرف بصری اندازہ ہے اور حتمی تصدیق کے لیے بینک/اسٹیٹ بینک سے رجوع کریں"
}

risk_level کا تعین یوں کریں:
- "high": تصویر میں واضح مسائل نظر آئیں (دھندلا پرنٹ، غلط رنگ، مسنگ واٹر مارک ایریا، غیر واضح سیریل نمبر، یا بتائی گئی مالیت سے مطابقت نہ ہونا)
- "medium": تصویر غیر واضح ہے یا کچھ خصوصیات اچھی طرح نظر نہیں آ رہیں، حتمی رائے نہیں دی جا سکتی
- "low": تصویر میں کوئی واضح خرابی نظر نہیں آئی (لیکن یہ اصلیت کی ضمانت نہیں)

کم از کم 5 مشاہدات (observations) دیں: واٹر مارک (قائد اعظم کی تصویر)، سیکیورٹی تھریڈ، پرنٹ کا معیار، سیریل نمبر، اور مجموعی ڈیزائن/رنگ کی بتائی گئی مالیت سے مطابقت۔`;

  const userContent = [
    { type: 'text', text: `اس پاکستانی کرنسی نوٹ (بتائی گئی مالیت: ${denom} روپے) کی تصویر کا جائزہ لیں اور اوپر دیے گئے JSON فارمیٹ میں جواب دیں۔${hasLightImage ? ' دوسری تصویر روشنی کے سامنے (بیک لِٹ) لی گئی ہے۔' : ''}` },
    { type: 'image_url', image_url: { url: image } }
  ];
  if (hasLightImage) {
    userContent.push({ type: 'image_url', image_url: { url: light_image } });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 900,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ]
      })
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI API error:', errText);
      return res.status(502).json({ error: 'AI سروس سے جواب نہیں ملا' });
    }

    const data = await openaiRes.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse failed:', rawText);
      return res.status(502).json({ error: 'AI جواب کو سمجھا نہیں جا سکا، دوبارہ کوشش کریں' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'کچھ غلط ہو گیا، دوبارہ کوشش کریں' });
  }
}
