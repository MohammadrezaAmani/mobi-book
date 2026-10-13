import { Link } from "react-router-dom";
import {
  ArrowUpLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Feather,
  Sparkles,
  WandSparkles,
  ArrowRight,
  ArrowLeft,
  Quote,
} from "lucide-react";
import {
  assetUrl,
  config,
  chapterNumber,
  getChapters,
  localized,
  isRtl,
  language,
  targetPath,
} from "@/lib/book";
import { useBookPreferences } from "@/hooks/use-book-preferences";
import { copy, formatText, t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ConfigIcon, RichText } from "@/components/ui/config-content";
import { Footer } from "@/components/layout/Footer";

export function Landing() {
  const { prefs } = useBookPreferences(),
    locale = prefs.locale,
    tr = t(locale),
    rtl = isRtl(locale),
    list = getChapters(locale);
  const home = config.pages.home,
    Arrow = rtl ? ArrowUpLeft : ArrowUpRight,
    Next = rtl ? ArrowLeft : ArrowRight;
  const text = (value: Record<string, string>) => copy(value, locale);
  const template = (value: string) =>
    formatText(value, { brand: config.brand, year: config.year });
  const demo =
    list.find((ch) => ch.id === home.reading.previewChapterId) || list[0];
  const sections = {
    hero: (
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              <Sparkles size={config.appearance.iconSizes["15"]} />
              {text(home.hero.eyebrow)}
            </div>
            <h1>
              <RichText parts={localized(home.hero.title, locale)} />
            </h1>
            <p className="hero-description">{text(home.hero.description)}</p>
            <div className="hero-actions">
              <Button size="lg" asChild>
                <Link to={targetPath(home.hero.primaryAction.target, locale)}>
                  <ConfigIcon name={home.hero.primaryAction.icon} />
                  {text(home.hero.primaryAction.label)}
                  <Next size={config.appearance.iconSizes["17"]} />
                </Link>
              </Button>
              {(home.hero.secondaryAction.target !== "studio" ||
                config.features.studio) && (
                <Button variant="outline" size="lg" asChild>
                  <Link
                    to={targetPath(home.hero.secondaryAction.target, locale)}
                  >
                    <ConfigIcon name={home.hero.secondaryAction.icon} />
                    {text(home.hero.secondaryAction.label)}
                  </Link>
                </Button>
              )}
            </div>
            <div className="hero-social-proof">
              <div className="proof-avatars">
                {home.hero.proofMarks.map((mark, index) => (
                  <span key={index}>{mark}</span>
                ))}
              </div>
              <div>
                <strong>{text(home.hero.proofTitle)}</strong>
                <small>{text(home.hero.proofDescription)}</small>
              </div>
            </div>
          </div>
          <div className="hero-art" aria-label={text(home.hero.artLabel)}>
            <div className="hero-orbit hero-orbit-one" />
            <div className="hero-orbit hero-orbit-two" />
            <div className="floating-spark spark-a">✳</div>
            <div className="floating-spark spark-b">✦</div>
            <div className="hero-book">
              <img
                src={assetUrl(config.cover)}
                alt={text(home.hero.coverAlt)}
              />
              <div className="book-spine" />
            </div>
            <div className="floating-note">
              <span className="note-icon">
                <Quote size={config.appearance.iconSizes["18"]} />
              </span>
              <div>
                {text(home.hero.quote)}
                <small>{template(home.hero.quoteAttribution)}</small>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-foot">
          <span>{text(home.hero.footnote)}</span>
          <span className="hero-scroll">
            {text(home.hero.scrollLabel)} <span>↓</span>
          </span>
        </div>
      </section>
    ),
    featured: (
      <section className="featured-strip">
        <div>
          <span className="tiny-kicker">{text(home.featured.eyebrow)}</span>
          <h2>{localized(config.title, locale)}</h2>
          <p>{localized(config.description, locale)}</p>
          <Link to="/library/">
            {tr.browse} <Arrow size={config.appearance.iconSizes["16"]} />
          </Link>
        </div>
        <div className="featured-meta">
          <div>
            <strong>{chapterNumber(list.length)}</strong>
            <small>{text(home.featured.chaptersLabel)}</small>
          </div>
          <div>
            <strong>{config.locales.length.toLocaleString(locale)}</strong>
            <small>{text(home.featured.languagesLabel)}</small>
          </div>
          <div>
            <strong>{home.featured.format}</strong>
            <small>{text(home.featured.formatLabel)}</small>
          </div>
        </div>
      </section>
    ),
    reading: (
      <section className="reading-showcase section-wrap">
        <div className="section-heading">
          <span className="tiny-kicker">{text(home.reading.eyebrow)}</span>
          <h2>
            <RichText parts={localized(home.reading.title, locale)} />
          </h2>
          <p>{text(home.reading.description)}</p>
        </div>
        <div className="feature-layout">
          <div className="feature-preview">
            <div className="preview-top">
              <div className="preview-dots">
                <i />
                <i />
                <i />
              </div>
              <span>{template(home.reading.previewBrand)}</span>
              <span>↗</span>
            </div>
            <div className="preview-content">
              <aside>
                <small>{tr.contents}</small>
                {list.slice(0, home.reading.previewCount).map((ch) => (
                  <p key={ch.id} className={ch.id === demo?.id ? "active" : ""}>
                    {chapterNumber(ch.order)} <span>{ch.title}</span>
                  </p>
                ))}
              </aside>
              <article dir={language(locale).direction}>
                <span className="demo-eyebrow">
                  {text(home.reading.previewEyebrow)}
                </span>
                <h3>{demo?.title}</h3>
                <p>{text(home.reading.previewText)}</p>
                <blockquote>{text(home.reading.previewQuote)}</blockquote>
                <div className="demo-lines">
                  <span />
                  <span />
                  <span />
                </div>
              </article>
            </div>
          </div>
          <div className="feature-stack">
            {home.reading.features.map((feature, index) => (
              <div className="feature-stack-item" key={index}>
                <span className="feature-stack-icon">
                  <ConfigIcon
                    name={feature.icon}
                    size={config.appearance.iconSizes["20"]}
                  />
                </span>
                <div>
                  <h3>{text(feature.title)}</h3>
                  <p>{text(feature.description)}</p>
                </div>
              </div>
            ))}
            <Link className="text-link" to="/library/">
              {tr.readBook}
              <Arrow size={config.appearance.iconSizes["16"]} />
            </Link>
          </div>
        </div>
      </section>
    ),
    studio: config.features.studio ? (
      <section className="dark-showcase">
        <div className="section-wrap dark-showcase-inner">
          <div className="dark-showcase-copy">
            <span className="tiny-kicker">{text(home.studio.eyebrow)}</span>
            <h2>
              <RichText parts={localized(home.studio.title, locale)} />
            </h2>
            <p>{text(home.studio.description)}</p>
            <div className="studio-benefits">
              {home.studio.benefits.map((benefit, index) => (
                <span key={index}>
                  <CheckCircle2 size={config.appearance.iconSizes["17"]} />
                  {text(benefit)}
                </span>
              ))}
            </div>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/studio/">
                <WandSparkles size={config.appearance.iconSizes["18"]} />
                {tr.create}
                <Arrow size={config.appearance.iconSizes["17"]} />
              </Link>
            </Button>
          </div>
          <div className="studio-illustration">
            <div className="studio-illus-header">
              <span className="illus-mark">✺</span>
              {template(home.studio.illustration.brand)}
              <div className="studio-illus-pill">
                {text(home.studio.illustration.saved)}
              </div>
            </div>
            <div className="studio-illus-toolbar">
              {home.studio.illustration.toolbar.map((mark, index) => (
                <span key={index}>{mark}</span>
              ))}
            </div>
            <div
              className="studio-illus-body"
              style={{ direction: language(locale).direction }}
            >
              <small>{text(home.studio.illustration.eyebrow)}</small>
              <h3>{text(home.studio.illustration.title)}</h3>
              <p>{text(home.studio.illustration.text)}</p>
              <div className="illus-equation">
                {home.studio.illustration.equation}
              </div>
              <div className="illus-placeholder">
                {text(home.studio.illustration.placeholder)}
              </div>
            </div>
            <div className="studio-illus-footer">
              <span>{home.studio.illustration.format}</span>
              <span>{home.studio.illustration.encoding}</span>
            </div>
          </div>
        </div>
      </section>
    ) : null,
    features: (
      <section className="features-grid-section section-wrap">
        <div className="section-heading compact">
          <span className="tiny-kicker">{text(home.features.eyebrow)}</span>
          <h2>
            <RichText parts={localized(home.features.title, locale)} />
          </h2>
        </div>
        <div className="feature-cards">
          {home.features.items.map((item, index) => (
            <div key={index} className="feature-card">
              <div className="feature-card-icon">
                <ConfigIcon
                  name={item.icon}
                  size={config.appearance.iconSizes["23"]}
                />
              </div>
              <div className="feature-card-index">
                {chapterNumber(index + 1)}
              </div>
              <h3>{text(item.title)}</h3>
              <p>{text(item.description)}</p>
            </div>
          ))}
        </div>
      </section>
    ),
    cta: (
      <section className="bottom-cta section-wrap">
        <div className="bottom-cta-orbit" />
        <span className="tiny-kicker">{text(home.cta.eyebrow)}</span>
        <h2>{text(home.cta.title)}</h2>
        <p>{text(home.cta.description)}</p>
        <div className="bottom-cta-buttons">
          {config.features.studio && (
            <Button variant="secondary" size="lg" asChild>
              <Link to="/studio/">
                <Feather size={config.appearance.iconSizes["17"]} />
                {tr.create}
              </Link>
            </Button>
          )}
          <Button size="lg" variant="outline" asChild>
            <Link to="/library/">
              <BookOpen size={config.appearance.iconSizes["17"]} />
              {tr.browse}
            </Link>
          </Button>
        </div>
      </section>
    ),
  };
  return (
    <>
      <main>
        {home.sections.map((name, index) => (
          <div key={`${name}-${index}`} data-home-section={name}>
            {sections[name as keyof typeof sections]}
          </div>
        ))}
      </main>
      <Footer />
    </>
  );
}
