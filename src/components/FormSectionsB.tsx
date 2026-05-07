import { Plus, Trash2 } from 'lucide-react';

const fg = (label: string, children: React.ReactNode) => (
  <div className="form-group"><label className="form-label">{label}</label>{children}</div>
);
const inp = (val: string, onChange: (v: string) => void, placeholder = '') => (
  <input className="form-input" value={val || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
);
const sel = (val: string, onChange: (v: string) => void, opts: string[]) => (
  <select className="form-select" value={val || ''} onChange={e => onChange(e.target.value)}>
    <option value="">Select</option>
    {opts.map(o => <option key={o}>{o}</option>)}
  </select>
);
const ta = (val: string, onChange: (v: string) => void, placeholder = '', rows = 2) => (
  <textarea className="form-textarea" rows={rows} value={val || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
);

// ── Section 6: Publications ────────────────────────────────────
const PB = { type:'journal', title:'', authors:'', authorRole:'', journal:'', year:'', volume:'', issue:'', issn:'', isbn:'', pages:'', impactFactor:'', indexedIn:'', peerReviewed:'', doi:'', level:'', presentationType:'', venueDates:'' };
export function PublicationsForm({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const u = (i: number, k: string, v: string) => { const a=[...data]; a[i]={...a[i],[k]:v}; onChange(a); };
  return (
    <div>
      {data.map((p, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={()=>onChange(data.filter((_,j)=>j!==i))}><Trash2 size={14}/></button>
          <div className="form-row form-row-2">
            {fg('Publication Type', sel(p.type, v=>u(i,'type',v), ['journal','conference','book','bookChapter']))}
            {fg('Level', sel(p.level, v=>u(i,'level',v), ['International','National']))}
          </div>
          {fg('Title of Paper / Book', inp(p.title, v=>u(i,'title',v)))}
          <div className="form-row form-row-2">
            {fg('Author(s)', inp(p.authors, v=>u(i,'authors',v), 'Last F., Co-Author C.'))}
            {fg('Author Role', sel(p.authorRole, v=>u(i,'authorRole',v), ['Principal Author','Co-Author']))}
          </div>
          {fg(p.type==='conference'?'Conference Name / Venue':'Journal / Publisher Name', inp(p.journal, v=>u(i,'journal',v)))}
          <div className="form-row form-row-4">
            {fg('Year', inp(p.year, v=>u(i,'year',v), '2024'))}
            {fg('Volume', inp(p.volume, v=>u(i,'volume',v)))}
            {fg('Issue', inp(p.issue, v=>u(i,'issue',v)))}
            {fg('Pages', inp(p.pages, v=>u(i,'pages',v), '1–10'))}
          </div>
          <div className="form-row form-row-3">
            {fg('ISSN / ISBN', inp(p.issn, v=>u(i,'issn',v)))}
            {fg('Impact Factor', inp(p.impactFactor, v=>u(i,'impactFactor',v)))}
            {fg('Indexed In', inp(p.indexedIn, v=>u(i,'indexedIn',v), 'Scopus, WoS, UGC'))}
          </div>
          <div className="form-row form-row-2">
            {fg('Peer Reviewed', sel(p.peerReviewed, v=>u(i,'peerReviewed',v), ['Yes','No']))}
            {fg('DOI / URL', inp(p.doi, v=>u(i,'doi',v), 'https://doi.org/...'))}
          </div>
          {p.type==='conference' && (
            <div className="form-row form-row-2">
              {fg('Presentation Type', sel(p.presentationType, v=>u(i,'presentationType',v), ['Oral','Poster','Invited Talk']))}
              {fg('Venue & Dates', inp(p.venueDates, v=>u(i,'venueDates',v), 'City, Country — Jan 2024'))}
            </div>
          )}
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={()=>onChange([...data,{...PB}])}><Plus size={15}/>Add Publication</button>
    </div>
  );
}

// ── Section 7: Awards ──────────────────────────────────────────
const AW = { name:'', awardingAgency:'', dateOfAward:'', level:'' };
export function AwardsForm({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const u = (i: number, k: string, v: string) => { const a=[...data]; a[i]={...a[i],[k]:v}; onChange(a); };
  return (
    <div>
      {data.map((a, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={()=>onChange(data.filter((_,j)=>j!==i))}><Trash2 size={14}/></button>
          <div className="form-row form-row-2">
            {fg('Award / Honour Name', inp(a.name, v=>u(i,'name',v)))}
            {fg('Awarding Agency / Body', inp(a.awardingAgency, v=>u(i,'awardingAgency',v)))}
          </div>
          <div className="form-row form-row-2">
            {fg('Date of Award', inp(a.dateOfAward, v=>u(i,'dateOfAward',v), 'DD/MM/YYYY'))}
            {fg('Level', sel(a.level, v=>u(i,'level',v), ['International','National','State','University','Institute']))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={()=>onChange([...data,{...AW}])}><Plus size={15}/>Add Award</button>
    </div>
  );
}

// ── Section 8: Research Projects ──────────────────────────────
const PR = { title:'', fundingAgency:'', amountSanctioned:'', duration:'', status:'', role:'' };
export function ProjectsForm({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const u = (i: number, k: string, v: string) => { const a=[...data]; a[i]={...a[i],[k]:v}; onChange(a); };
  return (
    <div>
      {data.map((p, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={()=>onChange(data.filter((_,j)=>j!==i))}><Trash2 size={14}/></button>
          {fg('Project Title', inp(p.title, v=>u(i,'title',v)))}
          <div className="form-row form-row-2">
            {fg('Funding Agency', inp(p.fundingAgency, v=>u(i,'fundingAgency',v), 'DST-SERB / ICMR / AICTE'))}
            {fg('Amount Sanctioned (₹)', inp(p.amountSanctioned, v=>u(i,'amountSanctioned',v)))}
          </div>
          <div className="form-row form-row-3">
            {fg('Duration', inp(p.duration, v=>u(i,'duration',v), '3 years (2021–2024)'))}
            {fg('Status', sel(p.status, v=>u(i,'status',v), ['Ongoing','Completed']))}
            {fg('Role', sel(p.role, v=>u(i,'role',v), ['PI','Co-PI','Co-Investigator']))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={()=>onChange([...data,{...PR}])}><Plus size={15}/>Add Project</button>
    </div>
  );
}

// ── Section 9: Patents ─────────────────────────────────────────
const PT = { title:'', patentNumber:'', dateOfFiling:'', status:'' };
export function PatentsForm({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const u = (i: number, k: string, v: string) => { const a=[...data]; a[i]={...a[i],[k]:v}; onChange(a); };
  return (
    <div>
      {data.map((p, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={()=>onChange(data.filter((_,j)=>j!==i))}><Trash2 size={14}/></button>
          {fg('Patent Title', inp(p.title, v=>u(i,'title',v)))}
          <div className="form-row form-row-3">
            {fg('Application / Patent No.', inp(p.patentNumber, v=>u(i,'patentNumber',v), 'IN202021012345'))}
            {fg('Date of Filing', inp(p.dateOfFiling, v=>u(i,'dateOfFiling',v), 'DD/MM/YYYY'))}
            {fg('Status', sel(p.status, v=>u(i,'status',v), ['Filed','Published','Granted']))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={()=>onChange([...data,{...PT}])}><Plus size={15}/>Add Patent</button>
    </div>
  );
}

// ── Section 10: Research Guidance ─────────────────────────────
export function ResearchGuidanceForm({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div>
      <div className="form-row form-row-3">
        {fg('Ph.D Scholars — Completed', inp(data.phdCompleted, v=>s('phdCompleted',v), '0'))}
        {fg('Ph.D Scholars — In Progress', inp(data.phdInProgress, v=>s('phdInProgress',v), '0'))}
        {fg('M.Phil — Completed', inp(data.mphilCompleted, v=>s('mphilCompleted',v), '0'))}
        {fg('M.Phil — In Progress', inp(data.mphilInProgress, v=>s('mphilInProgress',v), '0'))}
        {fg('PG Projects Supervised', inp(data.pgProjectsSupervised, v=>s('pgProjectsSupervised',v), '0'))}
      </div>
    </div>
  );
}

// ── Section 11: Admin Responsibilities ────────────────────────
const AR = { committeeName:'', role:'', from:'', to:'' };
export function AdminRespForm({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const u = (i: number, k: string, v: string) => { const a=[...data]; a[i]={...a[i],[k]:v}; onChange(a); };
  return (
    <div>
      {data.map((r, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={()=>onChange(data.filter((_,j)=>j!==i))}><Trash2 size={14}/></button>
          <div className="form-row form-row-2">
            {fg('Committee / Role Name', inp(r.committeeName, v=>u(i,'committeeName',v), 'IQAC / BOS / Warden'))}
            {fg('Role / Designation', sel(r.role, v=>u(i,'role',v), ['Member','Coordinator','Chairperson','Convenor','Secretary']))}
          </div>
          <div className="form-row form-row-2">
            {fg('From', inp(r.from, v=>u(i,'from',v), 'Jun 2020'))}
            {fg('To', inp(r.to, v=>u(i,'to',v), 'Present'))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={()=>onChange([...data,{...AR}])}><Plus size={15}/>Add Responsibility</button>
    </div>
  );
}

// ── Section 12: FDP / Workshops ───────────────────────────────
const FD = { programTitle:'', type:'', duration:'', organizingInstitution:'', role:'' };
export function FdpWorkshopsForm({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const u = (i: number, k: string, v: string) => { const a=[...data]; a[i]={...a[i],[k]:v}; onChange(a); };
  return (
    <div>
      {data.map((f, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={()=>onChange(data.filter((_,j)=>j!==i))}><Trash2 size={14}/></button>
          {fg('Programme Title', inp(f.programTitle, v=>u(i,'programTitle',v)))}
          <div className="form-row form-row-2">
            {fg('Type', sel(f.type, v=>u(i,'type',v), ['FDP','Workshop','Seminar','Conference','STTP','Webinar','Other']))}
            {fg('Duration', inp(f.duration, v=>u(i,'duration',v), '5 days / 2 weeks'))}
          </div>
          <div className="form-row form-row-2">
            {fg('Organizing Institution', inp(f.organizingInstitution, v=>u(i,'organizingInstitution',v)))}
            {fg('Your Role', sel(f.role, v=>u(i,'role',v), ['Attended','Resource Person','Organizer','Coordinator']))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={()=>onChange([...data,{...FD}])}><Plus size={15}/>Add FDP / Workshop</button>
    </div>
  );
}

// ── Section 13: Professional Memberships ──────────────────────
const MB = { professionalBody:'', membershipType:'', membershipId:'' };
export function MembershipsForm({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const u = (i: number, k: string, v: string) => { const a=[...data]; a[i]={...a[i],[k]:v}; onChange(a); };
  return (
    <div>
      {data.map((m, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={()=>onChange(data.filter((_,j)=>j!==i))}><Trash2 size={14}/></button>
          <div className="form-row form-row-3">
            {fg('Professional Body / Society', inp(m.professionalBody, v=>u(i,'professionalBody',v), 'IEEE / CSI / ISTE'))}
            {fg('Membership Type', sel(m.membershipType, v=>u(i,'membershipType',v), ['Life Member','Annual Member','Fellow','Senior Member']))}
            {fg('Membership ID', inp(m.membershipId, v=>u(i,'membershipId',v)))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={()=>onChange([...data,{...MB}])}><Plus size={15}/>Add Membership</button>
    </div>
  );
}

// ── Section 14: International Experience ──────────────────────
const IE = { country:'', purpose:'', institution:'', duration:'', fundingSource:'' };
export function InternationalExpForm({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const u = (i: number, k: string, v: string) => { const a=[...data]; a[i]={...a[i],[k]:v}; onChange(a); };
  return (
    <div>
      {data.map((e, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={()=>onChange(data.filter((_,j)=>j!==i))}><Trash2 size={14}/></button>
          <div className="form-row form-row-2">
            {fg('Country', inp(e.country, v=>u(i,'country',v)))}
            {fg('Purpose', sel(e.purpose, v=>u(i,'purpose',v), ['Research','Teaching','Conference','Collaborative Project','Post-Doc','Other']))}
          </div>
          <div className="form-row form-row-3">
            {fg('Institution / University', inp(e.institution, v=>u(i,'institution',v)))}
            {fg('Duration', inp(e.duration, v=>u(i,'duration',v), '3 months / 1 week'))}
            {fg('Funding Source', inp(e.fundingSource, v=>u(i,'fundingSource',v), 'DST / Self / DAAD'))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={()=>onChange([...data,{...IE}])}><Plus size={15}/>Add International Experience</button>
    </div>
  );
}
