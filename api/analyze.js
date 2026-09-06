// Vercel serverless function
// Requires OPENAI_API_KEY set as an environment variable in the Vercel project settings.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'صرف POST درخواست قبول ہے' });
  }

  const { image } = req.body || {};
  if (!image || typeof image !== 'string' || !image.startsWith('data:image')) {
    return res.status(400).json({ error: 'تصویر موصول نہیں ہوئی' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'سرور کنفیگریشن نامکمل ہے (API key موجود نہیں)' });
  }

  const systemPrompt = `آپ ایک محتاط معاون ہیں جو صرف تصویر دیکھ کر پاکستانی کرنسی نوٹ کی نظر آنے والی خصوصیات کا جائزہ لیتے ہیں۔
آپ کبھی بھی حتمی طور پر "اصلی" یا "جعلی" کا فیصلہ نہیں دیتے — کیونکہ تصویر سے UV فیچرز، مقناطیسی سیاہی، اور کاغذ کی ساخت کی تصدیق ممکن نہیں۔
آپ کا کام صرف یہ ہے کہ تصویر میں نظر آنے والی چیزوں کی بنیاد پر مشاہدات دیں اور مجموعی احتیاطی سطح بتائیں۔

نتیجہ سختی سے اس JSON فارمیٹ میں دیں، کوئی اضافی متن، وضاحت یا مارک ڈاؤن بیک ٹکس شامل نہ کریں:

{
  "denomination_guess": "اگر واضح ہو تو نوٹ کی مالیت، ورنہ خالی رکھیں",
  "risk_level": "low" | "medium" | "high",
  "observations": [
    { "title": "خصوصیت کا نام (اردو میں)", "note": "تصویر میں یہ خصوصیت کیسی نظر آئی، ایک سے دو جملوں میں (اردو میں)" }
  ],
  "summary": "دو سے تین جملوں میں مجموعی اردو خلاصہ، جس میں یہ ضرور شامل ہو کہ یہ صرف بصری اندازہ ہے اور حتمی تصدیق کے لیے بینک/اسٹیٹ بینک سے رجوع کریں"
}

risk_level کا تعین یوں کریں:
- "high": تصویر میں واضح مسائل نظر آئیں (دھندلا پرنٹ، غلط رنگ، مسنگ واٹر مارک ایریا، غیر واضح سیریل نمبر وغیرہ)
- "medium": تصویر غیر واضح ہے یا کچھ خصوصیات اچھی طرح نظر نہیں آ رہیں، حتمی رائے نہیں دی جا سکتی
- "low": تصویر میں کوئی واضح خرابی نظر نہیں آئی (لیکن یہ اصلیت کی ضمانت نہیں)

کم از کم 5 مشاہدات (observations) دیں: واٹر مارک، سیکیورٹی تھریڈ، پرنٹ کا معیار، سیریل نمبر، اور مجموعی ڈیزائن/رنگ کی مطابقت۔`;

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
          {
            role: 'user',
            content: [
              { type: 'text', text: 'اس پاکستانی کرنسی نوٹ کی تصویر کا جائزہ لیں اور اوپر دیے گئے JSON فارمیٹ میں جواب دیں۔' },
              { type: 'image_url', image_url: { url: image } }
            ]
          }
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
