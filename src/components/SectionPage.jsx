import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionManager from './SectionManager.jsx';
import { getSectionData } from '../api.js';
import '../styles/section-page.css';

const ORDERS = { journey: '01', skills: '02', experiences: '03' };
const TITLES = { journey: '来时路', skills: '习艺录', experiences: '拾光集' };

export default function SectionPage({ section }) {
  const [meta, setMeta] = useState({ title: '', subtitle: '', intro: '' });

  useEffect(() => {
    let active = true;
    getSectionData(section)
      .then((data) => {
        if (active) setMeta(data.meta || {});
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [section]);

  return (
    <main className="section-shell">
      <header className="page-header">
        <span className="kicker">{ORDERS[section]} · {TITLES[section]}</span>
        <h1>{meta.title || TITLES[section]}</h1>
        <p className="page-subtitle">{meta.subtitle}</p>
        <p className="page-intro">{meta.intro}</p>
      </header>

      <SectionManager section={section} />

      <footer className="page-back">
        <Link to="/">← 返回首页</Link>
      </footer>
    </main>
  );
}