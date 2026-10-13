<div align="center">

# Mobi.

**کتابت را بنویس. زیبا منتشرش کن.**  
_Write once. Publish beautifully._

React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · shadcn/ui-style primitives · MDX 3 · GitHub Pages

**فارسی / RTL** · **English / LTR** · **100% Static** · **No backend** · **Open source**

</div>

---

## این پروژه چیست؟

Mobi یک قالب قابل Fork برای ساخت کتاب از فایل‌های Markdown و MDX است. **نیازی به دیتابیس، API، حساب کاربری یا سرور اپلیکیشن ندارد.** Reader روی GitHub Pages اجرا می‌شود؛ Studio نیز در مرورگر اجرا می‌شود و در پایان فایل `.mdx` یا ZIP شامل فایل فصل و تصاویر تولید می‌کند. انتشار نهایی فقط با قرار دادن فایل‌ها در مخزن و Push انجام می‌شود.

### امکانات پیاده‌شده

- صفحهٔ فرود مدرن با ظاهر کتابی، جلد، معرفی و ورود به مطالعه یا Studio.
- Reader دارای فهرست فصل‌ها، مسیر مستقیم برای هر فصل، تیترهای داخلی، پیشرفت مطالعه، فصل قبل/بعد، تنظیمات فونت و تم، حالت تمرکز، نشان‌گذاری، پنل جست‌وجو و Print/PDF از مرورگر.
- Persian/English، RTL/LTR، چهار تم Paper/Light/Sage/Midnight، دو خانواده فونت Variable و تنظیم اندازه فونت، line-height و عرض مطالعه.
- Markdown استاندارد با GFM، جدول، فهرست، پیوند، پاورقی، کد رنگی، KaTeX و تصاویر.
- MDX با کامپوننت‌های ثبت‌شده `Callout`, `Figure`, `Quote`, `Equation` و `BookRef`.
- Book Studio: CodeMirror، Source / Split / Preview، WYSIWYG محدود به Markdown سازگار، چندین پیش‌نویس مستقل، نگهداری تصاویر در IndexedDB، حفظ Frontmatter سفارشی و خروجی یک فصل یا کل فضای کار در ZIP.
- خروجی Static بدون نیاز به Backend با HTML جداگانه برای صفحهٔ معرفی، کتابخانه، استودیو و تمام فصل‌ها، به همراه لینک مستقیم سازگار با GitHub Pages.
- Workflow آمادهٔ GitHub Actions، اعتبارسنجی Frontmatter، شناسه‌های تکراری، ارجاعات فصل و تصاویر محلی، و جست‌وجوی تمام‌متن داخل مرورگر.

## اجرای محلی

پیش‌نیاز: Node.js **22.12 یا جدیدتر** و npm. پس از استخراج ZIP:

```bash
cd mobi-book-studio
npm install
npm run dev
```

سپس آدرسی را که Vite چاپ می‌کند (معمولاً `http://127.0.0.1:5173`) باز کنید.

```bash
npm test          # Tests for the content processing pipeline
npm run content   # Regenerate and validate chapter/search manifests
npm run check     # Content + TypeScript validation
npm run build     # Create a complete static GitHub Pages site in dist/
npm run preview   # Preview the production output
```

**مهم:** برای بازتولید قابل اتکای نسخه‌های نصب‌شده، فایل `package-lock.json` را که پس از `npm install` ایجاد می‌شود به Git اضافه کنید. بعد از این کار Workflow را به `npm ci` تغییر دهید. به‌دلیل محدودیت اتصال npm در محیط تهیه این پروژه، یک Lockfile ساختگی در فایل تحویلی قرار داده نشده است.

## چگونه کتاب شخصی بسازم؟

### ۱. اطلاعات کتاب را تغییر دهید

فایل `book.config.ts` نقطهٔ ورود تمام تنظیمات کتاب و رابط است. ظاهر، تم‌ها، فونت‌ها، متن‌ها، صفحهٔ اولیه، ترتیب بخش‌ها، ناوبری و تنظیمات استودیو از فایل‌های `config/` خوانده می‌شوند. تصاویر در `public/images/` قرار می‌گیرند. راهنما و مثال‌های کامل در [CONFIGURATION.md](./CONFIGURATION.md) هستند.

نسخهٔ پیش‌فرض برای انتشار خود کتاب تنظیم شده است: `features.studio: false` و `features.landingPage: false`. صفحهٔ ورود عنوان، جلد، نویسنده و فصل‌های کتاب را نمایش می‌دهد. `pages.home.bookMode` را به `reader` تغییر دهید تا مستقیماً اولین فصل باز شود. برای نمایش معرفی Mobi، `features.landingPage` را فعال کنید.

مسیریابی پیش‌فرض `HashRouter` است؛ لینک فصل‌ها به شکل `/REPOSITORY/#/read/fa/01-preface/` ساخته می‌شود و بارگذاری مستقیم و Refresh نیاز به rewrite سرور ندارد.

### ۲. فصل‌ها را جایگزین کنید

```
src/content/
  fa/
    01-preface.md
    02-introduction.mdx
    03-chapter.md
  en/
    01-preface.md
    02-introduction.mdx
```

هر فایل باید یک Frontmatter ساده داشته باشد:

```md
---
id: my-first-chapter
title: عنوان فصل
description: دربارهٔ این فصل
order: 1
category: بخش اول
translationKey: my-first-chapter
---

# عنوان فصل

این **متن کتاب** است.
```

- `id`: شناسه ثابت و منحصربه‌فرد در هر زبان؛ فقط حروف کوچک لاتین، عدد و خط‌تیره.
- `order`: شماره مرتب‌سازی فصل‌ها.
- `title` / `description`: عنوان و شرح برای فهرست، Reader و Search.
- `category`: گروه نمایشی در فهرست و Sidebar.
- `translationKey`: کلید مشترک میان ترجمه‌های یک فصل.
- مسیر فایل، آدرس فصل در سایت را تعیین می‌کند؛ برای نمونه `src/content/fa/01-preface.md` آدرس `/#/read/fa/01-preface/` خواهد داشت (روی GitHub Pages: `/REPOSITORY/#/read/fa/01-preface/`).

فهرست فصل‌ها به‌صورت خودکار از فایل‌های پوشه `src/content` ساخته می‌شود. لازم نیست به فایل جداگانه‌ای برای ناوبری دست بزنید.

**Frontmatter در قالب flat YAML ساده است**: `key: value`، نه YAML تودرتو. برای متادیتای گسترده‌تر لازم است Parser محتوایی پروژه توسعه پیدا کند.

### ۳. محتوای پیشرفته

در فایل `.md` از Markdown و GFM و فرمول‌ها استفاده کنید:

````md
## نتیجه‌گیری

![شرح تصویر](images/diagram.svg)

$$
e^{i\pi} + 1 = 0
$$

```python
print("Hello, Mobi")
```

مطالعهٔ بیشتر در [[chapter:preface]].
````

برای کامپوننت اختصاصی، فایل `.mdx` ایجاد کنید:

```mdx
<Callout type="tip" title="نکته">
  محتوا در Git شما می‌ماند.
</Callout>

<Figure
  id="example"
  src="images/diagram.svg"
  alt="Diagram"
  caption="Figure 1"
/>

<Quote attribution="Author">Write things worth reading.</Quote>

<BookRef to="preface" locale="fa">
  برو به مقدمه
</BookRef>
```

`[[chapter:id]]` فعلاً در Markdown معمولی به لینک تبدیل می‌شود؛ در MDX از `<BookRef>` استفاده کنید. شماره‌گذاری خودکار شکل/معادله و ارجاعات چندنوعیِ استاندارد هنوز به موتور اضافه نشده‌اند.

### ۴. استفاده از Studio

برای فعال‌کردن استودیو، `features.studio` را در `book.config.ts` برابر `true` قرار دهید و به `/#/studio/` بروید. می‌توانید:

1. یک فصل موجود را باز کنید یا فصل جدید بسازید.
2. حالت Source، Split، Preview و Visual را انتخاب کنید.
3. در پنل Metadata عنوان، شناسه، ترتیب، نام فایل و زبان را تغییر دهید.
4. تصویرها را وارد کنید؛ در پیش‌نویس مرورگر باقی می‌مانند.
5. `MDX` را برای فایل متن یا `Export bundle` را برای ZIP شامل `src/content/...` و `public/images/...` دانلود کنید.
6. خروجی را در همان مسیرهای مخزن خود قرار دهید و Commit/Push کنید.

**Studio فایل‌های روی GitHub یا فایل‌سیستم شما را خودکار تغییر نمی‌دهد.** Draft متن فعلی در `localStorage` همان مرورگر نگه‌داری می‌شود. پیش از پاک‌کردن داده‌های مرورگر، فایل خروجی دریافت کنید. Image Assetها فقط در حافظه نشست فعلی هستند؛ پس ZIP را پیش از Refresh صفحه دانلود کنید.

**محدودیت محافظت از محتوا:** MDXEditor برای Markdown معمولی WYSIWYG دارد، اما بازنویسی خودکار MDX دلخواه ممکن است Lossy باشد. اگر متن حاوی کامپوننت اختصاصی یا Import/Export باشد، حالت Visual غیرفعال می‌شود؛ Source همچنان بدون تغییر در اختیار نویسنده است. Preview در Studio نمایندهٔ Markdown/GFM است و نمایش دقیق کامپوننت‌های MDX پیشرفته را Reader پس از Build انجام می‌دهد.

## انتشار روی GitHub Pages

1. مخزن جدید بسازید؛ این پروژه را آپلود یا Fork کنید و شاخه `main` داشته باشید.
2. در **Settings → Pages → Build and deployment** منبع را روی **GitHub Actions** تنظیم کنید.
3. یک Commit روی `main` Push کنید؛ `.github/workflows/pages.yml` اجرا می‌شود.
4. پس از موفقیت، سایت روی `https://USERNAME.github.io/REPOSITORY/` در دسترس خواهد بود.

Workflow خودش `VITE_BASE_PATH=/REPOSITORY/` را تنظیم می‌کند. در مخزن‌های `USERNAME.github.io` مسیر `/` در نظر گرفته می‌شود.

**دامنهٔ اختصاصی:** در Settings → Pages دامنه را تنظیم کنید. سپس در Settings → Secrets and variables → Actions → Variables این دو مقدار را قرار دهید:

```
BOOK_BASE_PATH=/
BOOK_SITE_ORIGIN=https://book.example.com
```

`BOOK_SITE_ORIGIN` فقط Origin و بدون مسیر است؛ مسیر از `BOOK_BASE_PATH` محاسبه می‌شود. این دو برای URLهای Canonical و Sitemap استفاده می‌شوند. اگر سایت در زیرمسیر دامنه اختصاصی قرار می‌گیرد، `BOOK_BASE_PATH` را مطابق آن تنظیم کنید.

بعد از Push هر فصل، Workflow محتوای جدید را می‌خواند، اعتبارسنجی و Build انجام می‌دهد و Artifact نهایی را در GitHub Pages منتشر می‌کند.

## ساختار مخزن

```
mobi-book-studio/
├── .github/workflows/     # Build, validation, deployment
├── book.config.ts          # Public configuration entry point
├── config/                 # Appearance, copy, pages, styles, editor templates
├── CONFIGURATION.md        # Configuration guide and examples
├── src/
│   ├── App.tsx             # Reader / Studio routing
│   ├── components/
│   │   ├── book/           # Landing, Reader, Library, MDX components
│   │   ├── studio/         # Browser-only authoring
│   │   ├── layout/         # Navigation, search, settings
│   │   └── ui/             # Local shadcn-style primitives
│   ├── content/fa/         # Persian books (replace these files)
│   ├── content/en/         # English books (replace these files)
│   ├── generated/          # Generated chapter/search indexes
│   ├── hooks/              # Reader preferences / local bookmarks
│   ├── lib/                # Book loaders, types, helpers
│   └── styles/main.css     # Tailwind imports; book styles come from config/
├── scripts/
│   ├── content-utils.mjs
│   ├── generate-content.mjs
│   └── prerender.mjs
├── public/images/          # Cover and images
└── tests/                  # Node content tests
```

## امنیت و محدودهٔ فعلی

- **محتوای MDX را کد قابل اعتماد بدانید**: MDX می‌تواند کد JavaScript اجرا کند. تنها Pull Requestهای بررسی‌شده را در کتاب منتشر کنید. Preview استودیو محتوای MDX دلخواه را با `eval` اجرا نمی‌کند.
- خواندن، جست‌وجو، نمایش محتوا، تم‌ها و بوکمارک‌ها کاملاً سمت مرورگرند؛ هیچ API اختصاصی وجود ندارد.
- تصاویر محلی باید در `public/images` قرار بگیرند و با مسیر `images/name.svg` ارجاع داده شوند.
- Search Index به‌شکل JSON از متن فایل‌ها تولید می‌شود؛ برای کتاب‌های بسیار بزرگ نیاز به موتور جست‌وجوی Index-on-demand مانند Pagefind است.
- ذخیره‌سازی Draft و Bookmark محلی است و بین دستگاه‌ها Sync نمی‌شود.
- PDF از دستور Print / Save as PDF مرورگر تهیه می‌شود؛ خروجی EPUB حرفه‌ای، ویرایش گروهی آنلاین و نسخه‌سازی پیشرفته در این مخزن هنوز پیاده‌سازی نشده‌اند.
- برای نسخه production باید `npm run build` و آزمون مرورگر پس از نصب وابستگی‌ها موفق باشند؛ Build در محیط ایجاد Artifact به‌دلیل دسترسی نداشتن به Registry npm اجرا نشده است.

## License

MIT برای کد موتور. نویسندگان می‌توانند محتوای کتاب خود را با مجوز دلخواه منتشر کنند. نمونهٔ ارائه‌شده با CC BY 4.0 مشخص شده است. فونت‌های بسته‌های Fontsource مجوز مستقل دارند و از کد پروژه جدا هستند.

## نکات مهم نسخهٔ بازبینی‌شده

- Studio اکنون چند فایل را در فضای کار محلی نگه می‌دارد و ZIP همهٔ فایل‌های آن فضای کار را می‌سازد.
- با Reload صفحه، پیش‌نویس‌های متنی از Local Storage و تصاویر از IndexedDB بازیابی می‌شوند (تا زمانی که داده‌های سایت پاک نشده باشند).
- Frontmatterهای اضافی و ساختارهای تو در تو هنگام Export حفظ می‌شوند. کلیدهای استاندارد id/title/description/order طبق ورودی‌های ویرایشگر تغییر می‌کنند.
- اگر Markdown شامل MDX/JSX/فرمولی باشد که WYSIWYG نمی‌تواند بی‌خطر بازنویسی کند، Source Mode مرجع قطعی است. Preview در Studio همهٔ کامپوننت‌های سفارشی MDX را مانند Reader اجرا نمی‌کند.
- برای استفاده روی دامنه اختصاصی GitHub Pages، متغیر مخزن `BOOK_BASE_PATH` را `/` و `BOOK_SITE_ORIGIN` را به Origin دامنه (مانند `https://books.example.com`) تغییر دهید. دامنه را در Settings → Pages نیز تنظیم کنید.
- برند کوتاه سربرگ از `book.config.ts` و فیلد `brand` قابل تغییر است.
- جزئیات آزمایش‌ها، محدودیت‌های اثبات‌نشده و معیار Release در [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) ثبت شده‌اند. این نسخه بدون Build موفقِ وابستگی‌ها، نباید به‌عنوان نسخهٔ تأییدشدهٔ Production معرفی شود.
