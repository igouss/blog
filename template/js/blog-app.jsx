/* eslint-disable */
/* Blog app — top-level shell, screen routing, Tweaks panel. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mastheadDensity": "full",
  "indexLayout": "catalog",
  "articleChrome": "bordered",
  "palette": "single",
  "engravings": "heavy"
}/*EDITMODE-END*/;

const PRESETS = {
  fullBroadside: {
    mastheadDensity: 'full',
    indexLayout: 'broadside',
    articleChrome: 'bordered',
    palette: 'premium',
    engravings: 'heavy',
  },
  restrained: {
    mastheadDensity: 'trim',
    indexLayout: 'list',
    articleChrome: 'clean',
    palette: 'single',
    engravings: 'sparing',
  },
  catalog: {
    mastheadDensity: 'full',
    indexLayout: 'catalog',
    articleChrome: 'bordered',
    palette: 'single',
    engravings: 'heavy',
  },
};

function DemoSwitcher({ screen, onScreen, currentArticle }) {
  const btn = (id, label) => (
    <button
      type="button"
      className={screen === id ? 'on' : ''}
      onClick={() => onScreen(id)}
    >{label}</button>
  );
  return (
    <div className="demo-switcher">
      <span className="label">Demo · view:</span>
      {btn('index', 'Index')}
      {btn('article', 'Article')}
      {btn('about', 'About')}
      {btn('404', '404')}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = React.useState('index');
  const [article, setArticle] = React.useState(FEATURED);

  // navigate to a specific article
  const openArticle = (a) => {
    setArticle(a.slug === FEATURED.slug ? FEATURED : { ...FEATURED, title: a.title, dek: a.dek, dateStamp: a.dateStamp, slug: a.slug, topic: a.topic });
    setScreen('article');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const goTo = (s) => {
    if (s === 'article' && screen !== 'article') {
      setArticle(FEATURED);
    }
    setScreen(s);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // next article for the bottom of an article page
  const nextArticle = (() => {
    const i = ARTICLES.findIndex(a => a.slug === article.slug);
    return i >= 0 && i < ARTICLES.length - 1 ? ARTICLES[i + 1] : null;
  })();

  const applyPreset = (p) => {
    Object.entries(p).forEach(([k, v]) => setTweak(k, v));
  };

  return (
    <>
      {screen === 'index'   && <IndexScreen     tweaks={t} onNavigate={goTo} onArticleClick={openArticle} />}
      {screen === 'article' && <ArticleScreen   tweaks={t} onNavigate={goTo} onArticleClick={openArticle} article={article} nextArticle={nextArticle} />}
      {screen === 'about'   && <AboutScreen     tweaks={t} onNavigate={goTo} />}
      {screen === '404'     && <NotFoundScreen  tweaks={t} onNavigate={goTo} />}

      <DemoSwitcher screen={screen} onScreen={goTo} currentArticle={article} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Preset" />
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 4}}>
          <TweakButton label="Full broadside" onClick={() => applyPreset(PRESETS.fullBroadside)} />
          <TweakButton label="Catalog"        onClick={() => applyPreset(PRESETS.catalog)} secondary />
          <TweakButton label="Restrained"     onClick={() => applyPreset(PRESETS.restrained)} secondary />
        </div>
        <div style={{fontFamily:'ui-sans-serif, system-ui, sans-serif', fontSize: 10, color:'rgba(41,38,27,.55)', fontStyle:'italic', lineHeight: 1.45, marginTop: -2}}>
          Apply a curated combination, or use the individual knobs below.
        </div>

        <TweakSection label="Masthead" />
        <TweakRadio
          label="Density"
          value={t.mastheadDensity}
          options={[
            { value: 'full', label: 'Broadside' },
            { value: 'trim', label: 'Trimmed' },
          ]}
          onChange={(v) => setTweak('mastheadDensity', v)}
        />

        <TweakSection label="Catalogue (index page)" />
        <TweakSelect
          label="Layout"
          value={t.indexLayout}
          options={[
            { value: 'list',      label: 'Letter-list (single column, large titles)' },
            { value: 'catalog',   label: 'Catalog cards (two-column rule frames)' },
            { value: 'broadside', label: 'Broadside (featured + ledger)' },
          ]}
          onChange={(v) => setTweak('indexLayout', v)}
        />

        <TweakSection label="Article page" />
        <TweakRadio
          label="Chrome"
          value={t.articleChrome}
          options={[
            { value: 'bordered', label: 'Bordered' },
            { value: 'clean',    label: 'Clean column' },
          ]}
          onChange={(v) => setTweak('articleChrome', v)}
        />

        <TweakSection label="Ink & engravings" />
        <TweakRadio
          label="Palette"
          value={t.palette}
          options={[
            { value: 'single',  label: 'Single ink' },
            { value: 'premium', label: 'Red + black' },
          ]}
          onChange={(v) => setTweak('palette', v)}
        />
        <TweakRadio
          label="Engraving density"
          value={t.engravings}
          options={[
            { value: 'heavy',   label: 'Heavy' },
            { value: 'sparing', label: 'Sparing' },
          ]}
          onChange={(v) => setTweak('engravings', v)}
        />
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
