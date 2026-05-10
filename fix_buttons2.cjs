const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/sections');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace exact style strings with className
  content = content.replace(/style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}/g, 'className="btn btn-success btn-sm"');
  
  content = content.replace(/style={{ padding: '6px 12px', marginRight: '8px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}/g, 'className="btn btn-success btn-sm"');

  content = content.replace(/style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}/g, 'className="btn btn-danger btn-sm"');
  
  content = content.replace(/style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}/g, 'className="btn btn-ghost btn-sm"');

  // Fix Add buttons that mistakenly got btn-ghost
  content = content.replace(/className="btn btn-ghost btn-sm"([^>]*>\s*(<Plus[^>]*>\s*)?Add)/g, 'className="btn btn-primary btn-sm"$1');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated buttons in ${file}`);
  }
});
