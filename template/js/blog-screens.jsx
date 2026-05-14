/* eslint-disable */
/* Blog screens — masthead, index (3 layouts), article, about, 404. */

const ENG = 'assets/engravings';
const EV = '?v=1';

// =======================================================================
// MASTHEAD
// =======================================================================
function PageNav({ current, onNavigate }) {
  const item = (id, label) => (
    <a
      onClick={() => onNavigate(id)}
      className={current === id ? 'cur' : ''}
      role="link"
      tabIndex={0}
    >{label}</a>
  );
  return (
    <nav className="bm-nav">
      {item('index', 'The Catalogue')}
      <span className="sep">·</span>
      {item('article', 'Latest Despatch')}
      <span className="sep">·</span>
      {item('about', 'The Proprietor')}
      <span className="sep">·</span>
      <a onClick={() => onNavigate('404')} role="link" tabIndex={0}>RSS Feed</a>
    </nav>
  );
}

function Wordmark({ small }) {
  if (small) {
    return (
      <span>GOUSSEV <span className="amp">&amp;</span> CO.</span>
    );
  }
  return (
    <span>GOUSSEV <span className="amp">&amp;</span> CO.</span>
  );
}

function BlogMasthead({ tweaks, current, onNavigate, forceTrim }) {
  const trim = forceTrim || tweaks.mastheadDensity === 'trim';
  const heavy = tweaks.engravings === 'heavy';

  if (trim) {
    return (
      <header className="bm-trim">
        <a className="bm-trim-wordmark" onClick={() => onNavigate('index')} tabIndex={0}>
          <Wordmark small />
        </a>
        <div className="bm-trim-tag">Consulting Engineer · Automatic Computation · Montréal</div>
        <PageNav current={current} onNavigate={onNavigate} />
      </header>
    );
  }

  return (
    <header className="bm-full">
      <div className="bm-eyebrow">Of Sundry Engineering Matters</div>
      <h1 className="bm-marquee"><Wordmark /></h1>
      <div className="bm-tagline">Consulting Engineer · Design &amp; Construction of Automatic Computation</div>
      <div className="bm-script-tag"><em>Notes from the workshop.</em></div>

      {heavy && (
        <div className="bm-train-row">
          <div className="train-side-ornament">❦ &nbsp; ✦ &nbsp; ❦</div>
          <img src={`${ENG}/train.png${EV}`} className="bm-train engraving" alt="" />
          <div className="train-side-ornament">❦ &nbsp; ✦ &nbsp; ❦</div>
        </div>
      )}

      <div className="bm-masthead-rule">
        <div className="line" />
        <span className="orn">❦</span>
        <div className="line" />
      </div>

      <div className="bm-address-row">
        <span>MONTRÉAL · QUÉBEC</span>
        <span className="sep">·</span>
        <span>HOMELAB · TAILSCALE · CADDY · CLAUDE CODE</span>
        <span className="sep">·</span>
        <span>ESTD. MMIII</span>
      </div>

      <PageNav current={current} onNavigate={onNavigate} />

      {heavy && !forceTrim && (
        <div className="bm-postal">
          <img src={`${ENG}/postage-cancel.png${EV}`} className="cancel engraving" alt="" />
          <img src={`${ENG}/postage-stamp.png${EV}`} className="stamp engraving" alt="" />
        </div>
      )}
    </header>
  );
}

// =======================================================================
// INDEX SCREEN
// =======================================================================
function DateMini({ stamp }) {
  return (
    <div className="date-mini">
      <div className="mo">{stamp.mo}</div>
      <div className="day">{stamp.day}</div>
      <div className="yr">{stamp.yr}</div>
    </div>
  );
}

function IndexIntro({ tweaks }) {
  return (
    <div className="idx-intro">
      <div>
        <div className="salutation">Dear Sir or Madam,</div>
        <p>
          Herewith a running record of experiments in self-hosted infrastructure,
          agentic workflows, and engineering decisions made in the small hours.
          Each entry runs in production on a tailnet of three machines; what does not
          work is reported as plainly as what does. <em>Read at leisure.</em>
        </p>
      </div>
      <div className="scriptaside">— I.&nbsp;G.</div>
    </div>
  );
}

function IndexLayoutList({ articles, onArticleClick }) {
  return (
    <div className="idx-list">
      {articles.map((a, i) => (
        <div
          key={a.slug}
          className="row"
          onClick={() => onArticleClick(a)}
          tabIndex={0}
          role="link"
        >
          <div className="num">№&nbsp;{String(articles.length - i).padStart(2, '0')}</div>
          <div>
            <h3>{a.title}</h3>
            <p className="row-dek">{a.dek}</p>
            <div className="row-topic">Filed: {a.topic}</div>
          </div>
          <DateMini stamp={a.dateStamp} />
        </div>
      ))}
    </div>
  );
}

function IndexLayoutCatalog({ articles, onArticleClick }) {
  return (
    <div className="idx-catalog">
      {articles.map((a, i) => (
        <div
          key={a.slug}
          className="cat-card"
          onClick={() => onArticleClick(a)}
          tabIndex={0}
          role="link"
        >
          <div className="cat-head">
            <span className="cat-no">№&nbsp;{String(articles.length - i).padStart(2, '0')}</span>
            <span className="cat-topic">{a.topic}</span>
          </div>
          <div className="cat-icon-row">
            <img src={`${ENG}/${a.icon}.png${EV}`} className="engraving" alt="" />
            <h3>{a.title}</h3>
          </div>
          <p className="cat-dek">{a.dek}</p>
          <div className="cat-foot">
            <span className="date">{a.dateStamp.mo} {a.dateStamp.day} &middot; {a.dateStamp.yr}</span>
            <span className="arrow">Read &nbsp;→</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function IndexLayoutBroadside({ articles, onArticleClick }) {
  const feat = articles[0];
  const rest = articles.slice(1);
  return (
    <div className="idx-broadside">
      <div className="feature">
        <div className="feat-left" onClick={() => onArticleClick(feat)} tabIndex={0} role="link">
          <div className="feat-banner">
            <span className="banderole tuscan" style={{fontSize: 18, padding: '7px 30px 9px'}}>★ This Month&rsquo;s Despatch ★</span>
          </div>
          <h2>{feat.title}</h2>
          <p className="feat-dek">{feat.dek}</p>
          <div className="feat-meta">
            <DateMini stamp={feat.dateStamp} />
            <span className="feat-cta">Read in Full &nbsp;→</span>
          </div>
        </div>
        <div className="feat-right">
          <img src={`${ENG}/illustration-landscape.png${EV}`} className="feat-landscape engraving" alt="" />
          <div style={{textAlign:'center', marginTop: 8, fontFamily:'var(--face-script)', fontSize: 22, color:'var(--fg-script)', lineHeight: 1.1}}>
            From the desk of <br/>Iouri Goussev, Esq.
          </div>
        </div>
      </div>

      <div className="ledger-frame">
        <div className="ledger-title">Catalogue of Prior Entries</div>
        <table className="bigledger">
          <thead>
            <tr>
              <th style={{width: 42}}>№</th>
              <th>Title</th>
              <th style={{width: 110}}>Topic</th>
              <th style={{width: 90, textAlign: 'right'}}>Filed</th>
            </tr>
          </thead>
          <tbody>
            {rest.map((a, i) => (
              <tr key={a.slug} onClick={() => onArticleClick(a)} tabIndex={0} style={{cursor: 'default'}}>
                <td className="ent-no">{String(rest.length - i).padStart(2, '0')}</td>
                <td>
                  <div className="ent-title">{a.title}</div>
                  <div className="ent-dek">{a.dek}</div>
                </td>
                <td className="ent-topic">{a.topic}</td>
                <td className="ent-date" style={{textAlign: 'right'}}>{a.dateStamp.mo} {a.dateStamp.day}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IndexScreen({ tweaks, onArticleClick, onNavigate }) {
  const layout = tweaks.indexLayout;
  const [filter, setFilter] = React.useState('All');
  const topics = ['All', 'Networks', 'Agents', 'Security', 'Refactoring', 'Tools'];
  const filtered = filter === 'All' ? ARTICLES : ARTICLES.filter(a => a.topic === filter);
  return (
    <div className={`sheet palette-${tweaks.palette} engravings-${tweaks.engravings}`} data-screen-label="01 Index">
      <BlogMasthead tweaks={tweaks} current="index" onNavigate={onNavigate} />
      <IndexIntro tweaks={tweaks} />

      <div className="idx-section-banderole">
        <span className="banderole tuscan">The Catalogue</span>
      </div>

      <div className="idx-counter-line">
        <span className="count">★ &nbsp; A small private catalogue &nbsp; ★</span>
        <div className="filter" role="tablist">
          {topics.map(t => (
            <button
              key={t}
              type="button"
              className={filter === t ? 'on' : ''}
              onClick={() => setFilter(t)}
              role="tab"
              aria-selected={filter === t}
            >{t}</button>
          ))}
        </div>
      </div>

      {layout === 'list'      && <IndexLayoutList      articles={filtered} onArticleClick={onArticleClick} />}
      {layout === 'catalog'   && <IndexLayoutCatalog   articles={filtered} onArticleClick={onArticleClick} />}
      {layout === 'broadside' && <IndexLayoutBroadside articles={filtered} onArticleClick={onArticleClick} />}

      <FooterColophon onNavigate={onNavigate} />
    </div>
  );
}

// =======================================================================
// ARTICLE SCREEN
// =======================================================================
function DateStampLg({ stamp, city }) {
  return (
    <div className="date-stamp-lg">
      <div className="city">{city}</div>
      <div className="mo">{stamp.mo}</div>
      <div className="day">{stamp.day}</div>
      <div className="yr">{stamp.yr}</div>
    </div>
  );
}

function TermBlock({ host, cwd, lines }) {
  return (
    <div className="term-block">
      <div className="term-tab">
        <span className="name">Operator&rsquo;s Transcript <span className="where">{host} : {cwd}</span></span>
        <span className="tag">Recorded at the wire</span>
      </div>
      <div className="term-body">
        {lines.map((ln, i) => (
          ln.out !== undefined
          ? <div key={i} className="ln out"><span className="cmd">{ln.out}</span></div>
          : <div key={i} className="ln"><span className="prompt">☞</span><span className="cmd">{ln.in}</span></div>
        ))}
      </div>
    </div>
  );
}

function CfgBlock({ lang, text }) {
  return (
    <div className="cfg-block">
      <div className="cfg-banner">
        <span className="name">{lang}</span>
        <span className="tag">Configuration · paper of record</span>
      </div>
      <pre>{text}</pre>
    </div>
  );
}

function ArticleBlock({ block }) {
  switch (block.kind) {
    case 'lede':   return <p className="lede">{block.text}</p>;
    case 'p':      return <p>{block.text}</p>;
    case 'h2':     return <h2 className="flourish">{block.text}</h2>;
    case 'numbered':
      return (
        <ol className="art-numbered">
          {block.items.map((it, i) => (
            <li key={i}>
              <div>
                <div className="num-title">{it.title}</div>
                <div className="num-text">{it.text}</div>
              </div>
            </li>
          ))}
        </ol>
      );
    case 'list':
      return (
        <ul className="plain">
          {block.items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      );
    case 'pull':   return <blockquote className="pull">{block.text}</blockquote>;
    case 'shell':  return <TermBlock host={block.host} cwd={block.cwd} lines={block.lines} />;
    case 'config': return <CfgBlock lang={block.lang} text={block.text} />;
    case 'closer': return <p style={{marginTop: 28, fontStyle:'italic', fontSize: 17, textAlign:'center', textWrap:'balance'}}>{block.text}</p>;
    default: return null;
  }
}

function ArticleScreen({ article, tweaks, onNavigate, onArticleClick, nextArticle }) {
  const bordered = tweaks.articleChrome === 'bordered';
  return (
    <div
      className={`sheet narrow palette-${tweaks.palette} engravings-${tweaks.engravings} ${bordered ? 'art-bordered' : 'art-clean'}`}
      data-screen-label="02 Article"
    >
      <BlogMasthead tweaks={tweaks} current="article" onNavigate={onNavigate} forceTrim />

      <div className="art-wrap">
        <div className="art-frame">
          <div className="art-eyebrow">Filed under {article.topic} · Article No.&nbsp;{ARTICLES.findIndex(a => a.slug === article.slug) + 1} of {ARTICLES.length}</div>
          <h1 className="art-title">{article.title}</h1>

          <div className="art-meta">
            <DateStampLg stamp={article.dateStamp} city={article.city || 'MONTRÉAL · QC'} />
            <p className="art-dek">{article.dek}</p>
          </div>

          <div className="bm-masthead-rule" style={{margin:'8px 0 22px'}}>
            <div className="line" /><span className="orn">✦</span><div className="line" />
          </div>

          <div className="art-body">
            {article.body.map((b, i) => <ArticleBlock key={i} block={b} />)}
          </div>

          <div className="art-closing">
            <div className="bm-masthead-rule"><div className="line" /><span className="orn">❦</span><div className="line" /></div>
            <div className="yours">Yours, in compilation —</div>
            <div className="signature">
              <div className="name">Iouri Goussev</div>
              <div className="role">Goussev &amp; Co. · Montréal · MMIII</div>
            </div>
          </div>
        </div>

        <div className="art-back">
          <a onClick={() => onNavigate('index')} tabIndex={0}>← Return to the Catalogue</a>
          {nextArticle && (
            <a onClick={() => onArticleClick(nextArticle)} tabIndex={0} style={{textAlign: 'right'}}>
              <span className="next">Next entry:</span><br/>
              {nextArticle.title} →
            </a>
          )}
        </div>
      </div>

      <FooterColophon onNavigate={onNavigate} />
    </div>
  );
}

// =======================================================================
// ABOUT SCREEN
// =======================================================================
function AboutScreen({ tweaks, onNavigate }) {
  return (
    <div className={`sheet narrow palette-${tweaks.palette} engravings-${tweaks.engravings}`} data-screen-label="03 About">
      <BlogMasthead tweaks={tweaks} current="about" onNavigate={onNavigate} forceTrim />

      <div style={{textAlign: 'center', margin: '28px 0 8px'}}>
        <span className="banderole tuscan" style={{fontSize: 20, padding: '8px 36px 10px'}}>★ The Proprietor ★</span>
      </div>

      <div className="about-body">
        <div>
          <div className="about-portrait">
            <div className="frame-inner">
              <img src="assets/portrait-engraved.png" alt="Iouri Goussev" className="portrait-img" />
            </div>
            <div className="frame-cap">Iouri Goussev · Drawn from Life</div>
          </div>

          <div style={{textAlign: 'center', marginTop: 20, fontFamily: 'var(--face-engraved)', fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'var(--fg-2)'}}>
            ❦ &nbsp; Member, no clubs &nbsp; ❦
          </div>
        </div>

        <div className="about-letter">
          <h1>Iouri Goussev</h1>
          <div className="about-role">Consulting Engineer · Montréal, QC</div>

          <div className="salutation">Dear Sir,</div>

          <p className="italic">
            Yours of recent date received and noted, in which you enquire after the man behind this small private press of engineering notes. The particulars follow.
          </p>

          <p>
            By trade a <strong>systems engineer</strong>, by compulsion an infrastructure hobbyist. The day occupation involves building things that do not fall over. The off-hours occupation is the same, at a smaller scale, with more interesting problems and considerably less consequence when they do fall over.
          </p>

          <p>
            I write here when something runs reliably for long enough that I can describe how I got it there. The catalogue runs short by design — every entry is a finished thing, not a draft.
          </p>

          <dl className="factoids">
            <dt>Residence</dt>     <dd>Montréal, Québec</dd>
            <dt>Trade</dt>          <dd>Compilers · distributed systems · agentic workflows</dd>
            <dt>Tooling</dt>        <dd><code>caddy</code> · <code>tailscale</code> · <code>podman</code> · <code>claude-code</code></dd>
            <dt>Open Works</dt>     <dd><a href="https://github.com/igouss/pipe-cli" target="_blank" rel="noreferrer">igouss/pipe-cli</a> — Rust workflow engine for AI coding agents</dd>
            <dt>Correspondence</dt> <dd><code>hello@elendal.ca</code> · GPG on request</dd>
            <dt>Established</dt>    <dd>MMIII (Anno Domini)</dd>
          </dl>

          <p className="italic">
            For routine matters please write directly. For agentic matters please write at length and assume nothing about my context window.
          </p>

          <div className="art-closing" style={{marginTop: 18}}>
            <div className="yours">I remain, with regard —</div>
            <div className="signature">
              <div className="name">Iouri Goussev</div>
              <div className="role">Goussev &amp; Co. · Montréal · MMIII</div>
            </div>
          </div>
        </div>
      </div>

      <FooterColophon onNavigate={onNavigate} />
    </div>
  );
}

// =======================================================================
// 404
// =======================================================================
function NotFoundScreen({ tweaks, onNavigate }) {
  return (
    <div className={`sheet palette-${tweaks.palette} engravings-${tweaks.engravings}`} data-screen-label="04 Not Found">
      <BlogMasthead tweaks={tweaks} current="404" onNavigate={onNavigate} forceTrim />

      <div className="rts">
        <div className="envelope">
          {tweaks.engravings === 'heavy' && (
            <div className="postage-corner">
              <img src={`${ENG}/postage-cancel.png${EV}`} className="cancel engraving" alt="" />
              <img src={`${ENG}/postage-stamp.png${EV}`} className="stamp engraving" alt="" />
            </div>
          )}
          <div className="envelope-inside">
            <div className="stamp-rts">Returned to Sender</div>
            <div className="err-num">404</div>
            <div className="err-msg">No Such Despatch on File</div>
            <p className="err-cite">
              The page you sought is not part of the present catalogue. It may have been
              <em> moved</em>, <em>renamed</em>, or — most likely — <em>imagined</em>.
            </p>
            <div className="err-actions">
              <a onClick={() => onNavigate('index')} tabIndex={0}>Return to Catalogue</a>
              <a onClick={() => onNavigate('about')} tabIndex={0}>The Proprietor</a>
            </div>
            <div className="scrawled-name">addressee unknown — I. G.</div>
          </div>
        </div>
      </div>

      <FooterColophon onNavigate={onNavigate} />
    </div>
  );
}

// =======================================================================
// FOOTER COLOPHON — appears on every screen
// =======================================================================
function FooterColophon({ onNavigate }) {
  return (
    <footer style={{marginTop: 56, paddingTop: 20, borderTop: '3px double var(--ink)'}}>
      <div style={{display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 22, alignItems: 'center'}}>
        <div style={{fontFamily:'var(--face-engraved)', fontSize: 10, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--fg-2)'}}>
          ❦ &nbsp; Printed at Montréal &nbsp; ❦
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'var(--face-fat)', fontWeight:900, fontSize:14, letterSpacing:'0.04em', textTransform:'uppercase'}}>Goussev <span style={{fontFamily:'Pinyon Script', fontWeight:400, fontSize:'1.1em', color:'var(--ink-soft)', textTransform:'none'}}>&amp;</span> Co.</div>
          <div style={{fontFamily:'var(--face-engraved)', fontSize:9, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--fg-2)', marginTop: 2}}>Established MMIII</div>
        </div>
        <div style={{textAlign:'right', fontFamily:'var(--face-engraved)', fontSize: 10, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--fg-2)'}}>
          Tailscale Funnel &nbsp; ❦
        </div>
      </div>
      <div style={{marginTop: 16, fontFamily:'var(--face-roman)', fontStyle:'italic', fontSize: 12, textAlign:'center', color:'var(--fg-3)'}}>
          Served by Caddy from a Markdown file. Content negotiable — send <code style={{fontSize: 11}}>Accept: text/markdown</code> for the raw source.
      </div>
    </footer>
  );
}

Object.assign(window, {
  BlogMasthead, IndexScreen, ArticleScreen, AboutScreen, NotFoundScreen,
});
