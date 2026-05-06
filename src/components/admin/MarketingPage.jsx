import React, { useMemo, useState } from 'react';
import { Icons } from '../common/Icons';

const SITE = (typeof window !== 'undefined' && window.location?.origin) || 'https://cravvr.com';

// ---------------------------------------------------------------------------
// UTM Builder
// ---------------------------------------------------------------------------

const SOURCE_PRESETS = [
  'instagram', 'tiktok', 'facebook', 'twitter', 'linkedin', 'youtube',
  'reddit', 'pinterest', 'google', 'email', 'sms', 'discord',
  'flyer', 'event', 'sticker', 'card', 'press', 'podcast', 'influencer',
  'partner', 'referral',
];

const MEDIUM_PRESETS = [
  'bio', 'organic_post', 'story', 'reel', 'paid_social', 'cpc', 'display',
  'video_ad', 'tweet', 'newsletter', 'welcome', 'abandoned_cart', 'win_back',
  'qr', 'show_notes', 'article', 'co_marketing', 'page_link', 'channel',
  'video_desc', 'pin', 'post', 'dm', 'signature', 'text',
];

const Builder = () => {
  const [path, setPath] = useState('/');
  const [source, setSource] = useState('instagram');
  const [medium, setMedium] = useState('bio');
  const [campaign, setCampaign] = useState('may_2026');
  const [content, setContent] = useState('');
  const [term, setTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (source) params.set('utm_source', source.trim().toLowerCase());
    if (medium) params.set('utm_medium', medium.trim().toLowerCase());
    if (campaign) params.set('utm_campaign', campaign.trim().toLowerCase());
    if (content) params.set('utm_content', content.trim().toLowerCase());
    if (term) params.set('utm_term', term.trim().toLowerCase());
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SITE}${cleanPath}?${params.toString()}`;
  }, [path, source, medium, campaign, content, term]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) { console.warn('Copy failed:', e); }
  };

  const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: 6,
    border: '1px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit',
  };
  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  };

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 24 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>UTM Link Builder</h2>
      <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: 14 }}>
        Build a tagged URL for any campaign. Tags are stored on the visitor row forever — every conversion can be traced back to the source.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Path (optional)</label>
          <input style={inputStyle} value={path} onChange={(e) => setPath(e.target.value)} placeholder="/" />
        </div>
        <div>
          <label style={labelStyle}>Source <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inputStyle} list="utm-sources" value={source} onChange={(e) => setSource(e.target.value)} placeholder="instagram" />
          <datalist id="utm-sources">{SOURCE_PRESETS.map((s) => <option key={s} value={s} />)}</datalist>
        </div>
        <div>
          <label style={labelStyle}>Medium <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inputStyle} list="utm-mediums" value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="bio" />
          <datalist id="utm-mediums">{MEDIUM_PRESETS.map((m) => <option key={m} value={m} />)}</datalist>
        </div>
        <div>
          <label style={labelStyle}>Campaign <span style={{ color: '#ef4444' }}>*</span></label>
          <input style={inputStyle} value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="may_2026" />
        </div>
        <div>
          <label style={labelStyle}>Content</label>
          <input style={inputStyle} value={content} onChange={(e) => setContent(e.target.value)} placeholder="video_v1" />
        </div>
        <div>
          <label style={labelStyle}>Term (paid search only)</label>
          <input style={inputStyle} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="food+trucks+near+me" />
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8,
        padding: '10px 12px',
      }}>
        <code style={{
          flex: 1, fontSize: 13, color: '#111827',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {url}
        </code>
        <button
          onClick={copy}
          style={{
            background: copied ? '#16a34a' : '#e11d48', color: 'white',
            border: 'none', borderRadius: 6, padding: '8px 14px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}
        >
          {copied ? '✓ Copied' : 'Copy URL'}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Reference tables — pre-built copy/paste links
// ---------------------------------------------------------------------------

const buildUrl = (source, medium, campaign, extra = '') => {
  const params = new URLSearchParams({ utm_source: source, utm_medium: medium, utm_campaign: campaign });
  if (extra) extra.split('&').forEach((p) => { const [k, v] = p.split('='); if (k && v) params.set(k, v); });
  return `${SITE}/?${params.toString()}`;
};

const SECTIONS = [
  {
    title: 'Social bios — the must-haves',
    rows: [
      ['Instagram',          buildUrl('instagram', 'bio', 'may_2026')],
      ['TikTok',             buildUrl('tiktok', 'bio', 'may_2026')],
      ['Facebook Page',      buildUrl('facebook', 'page_link', 'may_2026')],
      ['Twitter / X',        buildUrl('twitter', 'bio', 'may_2026')],
      ['LinkedIn',           buildUrl('linkedin', 'bio', 'may_2026')],
      ['YouTube channel',    buildUrl('youtube', 'channel', 'may_2026')],
      ['Email signature',    buildUrl('email', 'signature', 'may_2026')],
    ],
  },
  {
    title: 'Organic posts — in caption / description',
    rows: [
      ['Instagram feed post',     buildUrl('instagram', 'organic_post', 'may_2026')],
      ['Instagram story',         buildUrl('instagram', 'story', 'may_2026')],
      ['Instagram Reel',          buildUrl('instagram', 'reel', 'may_2026')],
      ['TikTok video',            buildUrl('tiktok', 'organic_post', 'may_2026')],
      ['Facebook post',           buildUrl('facebook', 'organic_post', 'may_2026')],
      ['Facebook story',          buildUrl('facebook', 'story', 'may_2026')],
      ['Twitter / X tweet',       buildUrl('twitter', 'tweet', 'may_2026')],
      ['LinkedIn post',           buildUrl('linkedin', 'post', 'may_2026')],
      ['YouTube video desc',      buildUrl('youtube', 'video_desc', 'may_2026')],
      ['Reddit post',             buildUrl('reddit', 'post', 'may_2026')],
      ['Pinterest pin',           buildUrl('pinterest', 'pin', 'may_2026')],
    ],
  },
  {
    title: 'Paid ads',
    rows: [
      ['Meta paid ad',           buildUrl('facebook', 'paid_social', 'may_paid_test', 'utm_content=video_v1')],
      ['Instagram paid ad',      buildUrl('instagram', 'paid_social', 'may_paid_test', 'utm_content=video_v1')],
      ['TikTok paid ad',         buildUrl('tiktok', 'paid_social', 'may_paid_test', 'utm_content=video_v1')],
      ['Google search ad',       buildUrl('google', 'cpc', 'may_paid_test', 'utm_term=food+trucks+near+me')],
      ['Google display',         buildUrl('google', 'display', 'may_paid_test')],
      ['YouTube video ad',       buildUrl('youtube', 'video_ad', 'may_paid_test')],
      ['Reddit paid',            buildUrl('reddit', 'paid_social', 'may_paid_test')],
    ],
  },
  {
    title: 'Email & messaging',
    rows: [
      ['Email blast',            buildUrl('email', 'newsletter', 'may_blast')],
      ['Welcome email',          buildUrl('email', 'welcome', 'lifecycle')],
      ['Abandoned cart email',   buildUrl('email', 'abandoned_cart', 'lifecycle')],
      ['Win-back email',         buildUrl('email', 'win_back', 'lifecycle')],
      ['SMS',                    buildUrl('sms', 'text', 'may_2026')],
      ['Discord / community DM', buildUrl('discord', 'dm', 'may_2026')],
    ],
  },
  {
    title: 'Offline & physical',
    rows: [
      ['Printed flyer QR',       buildUrl('flyer', 'qr', 'pdx_pop_up')],
      ['Truck window decal',     buildUrl('decal', 'qr', 'truck_branding')],
      ['Business card',          buildUrl('card', 'qr', 'networking')],
      ['Event booth / popup',    buildUrl('event', 'qr', 'pdx_pop_up')],
      ['Sticker / merch',        buildUrl('sticker', 'qr', 'swag')],
    ],
  },
  {
    title: 'Partnerships & PR',
    rows: [
      ['Press release / article', buildUrl('press', 'article', 'may_2026', 'utm_content=eater_pdx')],
      ['Podcast show notes',      buildUrl('podcast', 'show_notes', 'may_2026', 'utm_content=show_name')],
      ['Influencer collab',       buildUrl('influencer', 'organic_post', 'may_2026', 'utm_content=their_handle')],
      ['Truck owner referral',    buildUrl('referral', 'truck_owner', 'may_2026', 'utm_content=truck_id')],
      ['Partner co-marketing',    buildUrl('partner', 'co_marketing', 'may_2026', 'utm_content=partner_name')],
    ],
  },
];

const CopyButton = ({ value }) => {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) { console.warn('Copy failed:', e); }
  };
  return (
    <button
      onClick={onClick}
      style={{
        background: copied ? '#16a34a' : 'white', color: copied ? 'white' : '#374151',
        border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 10px',
        fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
};

const Section = ({ title, rows }) => (
  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 16 }}>
    <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>{title}</h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map(([label, url]) => (
        <div
          key={label}
          style={{
            display: 'grid', gridTemplateColumns: '180px 1fr auto',
            gap: 12, alignItems: 'center',
            padding: '8px 10px',
            background: '#f9fafb', borderRadius: 6,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</span>
          <code style={{
            fontSize: 12, color: '#6b7280',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {url}
          </code>
          <CopyButton value={url} />
        </div>
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const MarketingPage = () => {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Marketing</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
          UTM links for every channel. Build custom ones, or copy presets — everything tagged here flows into{' '}
          <a href="/admin/growth" style={{ color: '#e11d48' }}>/admin/growth</a> for cohort analysis.
        </p>
      </div>

      <Builder />

      <div style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Quick reference</h2>
        <p style={{ margin: '4px 0 12px', color: '#6b7280', fontSize: 14 }}>
          Pre-built links for every common channel. Click "Copy" and paste anywhere.
        </p>
      </div>

      {SECTIONS.map((s) => <Section key={s.title} {...s} />)}

      <div style={{
        background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12,
        padding: 16, marginTop: 24, fontSize: 14, color: '#78350f',
      }}>
        <strong>Conventions worth keeping:</strong>
        <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
          <li>Lowercase, underscores not hyphens or spaces (<code>pdx_pop_up</code>, not <code>PDX-pop up</code>)</li>
          <li>Reuse the same <code>medium</code> vocabulary — don't switch between <code>paid_social</code> and <code>paid</code></li>
          <li><code>campaign</code> = time-bound or themed push (<code>may_2026</code>, <code>summer_food_truck_week</code>)</li>
          <li><code>content</code> = variants of the same thing (<code>video_v1</code>, <code>static_a</code>)</li>
          <li>Test from your phone — some platforms strip query params; if so, use a Bitly/Linktree wrapper that preserves them</li>
        </ul>
      </div>
    </div>
  );
};

export default MarketingPage;
