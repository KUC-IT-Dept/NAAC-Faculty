import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel } from './sectionUtils';

const EMPTY = { type: 'journal', title: '', authors: '', authorRole: '', journal: '', year: '', volume: '', issue: '', issn: '', isbn: '', pages: '', impactFactor: '', indexedIn: '', peerReviewed: '', doi: '', level: '', presentationType: '', venueDates: '' };

export default function Publications({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };
  return (
    <div>
      {data.map((p, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => onChange(data.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          <div className="form-row form-row-3">
            {fg('Type *', sel(p.type, v => upd(i, 'type', v), ['journal', 'conference', 'book', 'bookChapter']))}
            {fg('Level', sel(p.level, v => upd(i, 'level', v), ['International', 'National']))}
            {fg('Author Role', sel(p.authorRole, v => upd(i, 'authorRole', v), ['Principal Author', 'Co-Author', 'Corresponding Author']))}
          </div>
          {fg('Title *', inp(p.title, v => upd(i, 'title', v)))}
          {fg('All Author(s)', inp(p.authors, v => upd(i, 'authors', v), 'Sharma P., Kumar R., ...'))}
          {fg(p.type === 'conference' ? 'Conference Name' : p.type === 'book' ? 'Publisher' : 'Journal Name *', inp(p.journal, v => upd(i, 'journal', v)))}
          <div className="form-row form-row-4">
            {fg('Year *', inp(p.year, v => upd(i, 'year', v), '2024'))}
            {fg('Volume', inp(p.volume, v => upd(i, 'volume', v)))}
            {fg('Issue', inp(p.issue, v => upd(i, 'issue', v)))}
            {fg('Pages', inp(p.pages, v => upd(i, 'pages', v), '1–10'))}
          </div>
          <div className="form-row form-row-3">
            {fg('ISSN / ISBN', inp(p.issn, v => upd(i, 'issn', v)))}
            {fg('Impact Factor', inp(p.impactFactor, v => upd(i, 'impactFactor', v)))}
            {fg('Indexed In', inp(p.indexedIn, v => upd(i, 'indexedIn', v), 'Scopus, WoS, UGC-CARE'))}
          </div>
          <div className="form-row form-row-2">
            {fg('Peer Reviewed', sel(p.peerReviewed, v => upd(i, 'peerReviewed', v), ['Yes', 'No']))}
            {fg('DOI / URL', inp(p.doi, v => upd(i, 'doi', v), 'https://doi.org/...'))}
          </div>
          {p.type === 'conference' && (
            <div className="form-row form-row-2">
              {fg('Presentation Type', sel(p.presentationType, v => upd(i, 'presentationType', v), ['Oral', 'Poster', 'Invited Talk', 'Keynote']))}
              {fg('Venue & Dates', inp(p.venueDates, v => upd(i, 'venueDates', v), 'City, Country — Jan 2024'))}
            </div>
          )}
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={() => onChange([...data, { ...EMPTY }])}>
        <Plus size={15} /> Add Publication
      </button>
    </div>
  );
}
