# نوٹ اسکینر — AI بصری جائزہ

پاکستانی کرنسی نوٹ کی تصویر اپلوڈ کر کے OpenAI GPT-4o Vision سے بصری جائزہ لینے والا ٹول۔
یہ حتمی جعلی/اصلی تصدیق نہیں کرتا — صرف نظر آنے والی خصوصیات پر رائے دیتا ہے۔

## فائلیں
- `index.html` — فرنٹ اینڈ (اپلوڈ، پریویو، نتیجہ دکھانا)
- `api/analyze.js` — بیک اینڈ سرورلیس فنکشن جو OpenAI کو کال کرتا ہے
- `package.json` — Vercel کے لیے پراجیکٹ فائل

## GitHub پر اپلوڈ
1. GitHub پر نیا ریپازٹری بنائیں (مثلاً `note-scanner`)
2. اس فولڈر کی تمام فائلیں ریپازٹری میں اپلوڈ کریں (`index.html`, `api/analyze.js`, `package.json`)
3. یقینی بنائیں کہ `analyze.js` بالکل `api/` فولڈر کے اندر ہی ہو (روٹ میں نہیں)

## Vercel پر ڈیپلائے
1. Vercel پر نیا پراجیکٹ بنائیں اور اپنا GitHub ریپازٹری منتخب کریں
2. Project Settings → Environment Variables میں جائیں
3. نیا Environment Variable شامل کریں:
   - Name: `OPENAI_API_KEY`
   - Value: اپنی OpenAI API key (platform.openai.com سے حاصل کریں)
4. Deploy کریں

## اہم نوٹ
- API key کبھی بھی فرنٹ اینڈ کوڈ میں نہ لکھیں — یہ صرف بیک اینڈ (`api/analyze.js`) میں `process.env.OPENAI_API_KEY` کے ذریعے استعمال ہوتی ہے، اس لیے یہ محفوظ ہے
- OpenAI اکاؤنٹ میں billing/credits موجود ہونا ضروری ہے ورنہ API کال ناکام ہو گی
- یہ ٹول تعلیمی رہنمائی کے لیے ہے، حتمی سرٹیفیکیشن کا متبادل نہیں
