/* eslint-disable */
/* Goussev & Co. — Letterhead UI Kit — components.jsx
   Load AFTER React + Babel. Components export to window.
*/

const ASSETS = 'assets/engravings';
const V = '?v=6'; // cache-bust harvested PNGs after re-cropping

function Letterhead({ planFor, deskOf, deskOfRole, marquee, tagline, address }) {
  return (
    <>
      <header className="masthead">
        <div className="col-left">
          <div className="plan-for">{planFor}</div>
          <h1>{marquee}</h1>
          <div className="tagline">{tagline}</div>
        </div>

        <div className="col-mid">
          <div className="deskof-label">From the desk of</div>
          <div className="deskof-name">{deskOf}</div>
          <div className="deskof-role">{deskOfRole}</div>
        </div>

        <div className="col-right">
          <div className="postal-corner">
            <img src={`${ASSETS}/postage-cancel.png${V}`}  className="cancel engraving" alt="" />
            <img src={`${ASSETS}/postage-stamp.png${V}`}   className="stamp engraving"  alt="" />
          </div>
          <img src={`${ASSETS}/train.png${V}`}             className="train engraving"  alt="" />
        </div>
      </header>

      <div className="masthead-rule">
        <div className="line" />
        <span className="orn">&#10086;</span>
        <div className="line" />
      </div>
      <div className="address-line">{address}</div>
    </>
  );
}

function Banderole({ variant = 'tuscan', children }) {
  return <span className={`banderole ${variant}`}>{children}</span>;
}

function RuleFrame({ title, subtitle, double, children, style }) {
  return (
    <div className={`frame ${double ? 'double' : ''}`} style={style}>
      {title    && <div className="frame-title">{title}</div>}
      {subtitle && <div className="frame-sub">{subtitle}</div>}
      {children}
    </div>
  );
}

function DateStamp({ city = 'MONTRÉAL · QC', date = 'NOV 22', year = '11 AM 1901' }) {
  return (
    <div className="datestamp-circle">
      <div className="top">{city}</div>
      <div className="date">{date}</div>
      <div className="bottom">{year}</div>
    </div>
  );
}

function Signature({ salutation = 'We remain, yours truly,', name, role }) {
  return (
    <div className="signature">
      <div className="yours">{salutation}</div>
      <div className="name">{name}</div>
      <div className="role">{role}</div>
    </div>
  );
}

function TradeBadge({ topLabel = '— Established —', big, bottomLabel }) {
  return (
    <div className="tradebadge">
      <div className="label">{topLabel}</div>
      <div className="big">{big}</div>
      <div className="label">{bottomLabel}</div>
    </div>
  );
}

function GrandPrizeBadge({ label = 'GRAND PRIZE', where = 'PARIS · 1900' }) {
  return (
    <div className="tradebadge" style={{outline:'none'}}>
      <img src={`${ASSETS}/icon-crown.png${V}`} className="engraving" style={{width:46, marginBottom:-2}} alt="" />
      <div className="big" style={{fontSize:13, lineHeight:1.15, padding:'0 6px'}}>{label}</div>
      <div className="label" style={{letterSpacing:'0.22em', marginTop:3}}>{where}</div>
    </div>
  );
}

function IconRow({ items }) {
  return (
    <div className="iconrow">
      {items.map((it, i) => (
        <div key={i} className="ic">
          <img src={`${ASSETS}/${it.icon}.png${V}`} className="engraving" alt="" />
          <div className="lab">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

function Ledger({ headers, rows, emphasisIdx }) {
  return (
    <table className="ledger">
      <thead>
        <tr>{headers.map((h, i) => <th key={i} className={h.num ? 'num' : ''}>{h.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={i === emphasisIdx ? 'emphasis' : ''}>
            {r.map((c, j) => <td key={j} className={headers[j].num ? 'num' : ''}>{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Telegram({ head, children }) {
  return (
    <div className="telegram">
      <div className="head">{head}</div>
      <div>{children}</div>
    </div>
  );
}

function DecRule({ ornament = '\u2766' }) {
  return (
    <div className="dec-rule">
      <div className="line" />
      <span className="orn">{ornament}</span>
      <div className="line" />
    </div>
  );
}

function SequenceItem({ n, title, subtitle, children, why, whyChildren }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:'40px 1fr 1fr', gap:'10px 14px', alignItems:'start', marginBottom:14}}>
      <span className="seqnum">{n}</span>
      <div>
        <div style={{fontFamily:'var(--face-engraved)', fontWeight:700, fontSize:13, letterSpacing:'0.12em', textTransform:'uppercase'}}>
          {title}{subtitle && <span style={{fontFamily:'var(--face-roman)', fontStyle:'italic', fontSize:12, letterSpacing:0, textTransform:'none', color:'var(--fg-2)', marginLeft:6}}>({subtitle})</span>}
        </div>
        <div style={{fontFamily:'var(--face-roman)', fontStyle:'italic', fontSize:13, lineHeight:1.5, marginTop:4, color:'var(--fg-1)'}}>{children}</div>
      </div>
      <div>
        <div style={{fontFamily:'var(--face-engraved)', fontWeight:700, fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--fg-2)'}}>{why || 'Why?'}</div>
        <div style={{fontFamily:'var(--face-roman)', fontStyle:'italic', fontSize:13, lineHeight:1.5, marginTop:4, color:'var(--fg-1)'}}>{whyChildren}</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  Letterhead, Banderole, RuleFrame, DateStamp, Signature,
  TradeBadge, GrandPrizeBadge, IconRow, Ledger, Telegram,
  DecRule, SequenceItem, ASSETS,
});
