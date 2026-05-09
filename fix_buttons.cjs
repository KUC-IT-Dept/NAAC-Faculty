const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/sections');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace <button ... style={{...}}>Add</button>
  content = content.replace(/<button([^>]+)style={{[^}]+backgroundColor:\s*'#6c757d'[^}]+}}([^>]*)>\s*(<Plus[^>]*>\s*)?Add([^<]*)<\/button>/g, '<button$1className="btn btn-primary btn-sm"$2>$3Add$4</button>');

  // Replace Save
  content = content.replace(/<button([^>]+)style={{[^}]+backgroundColor:\s*'#007bff'[^}]+}}([^>]*)>\s*Save\s*<\/button>/g, '<button$1className="btn btn-success btn-sm"$2>Save</button>');

  // Replace Edit
  content = content.replace(/<button([^>]+)style={{[^}]+backgroundColor:\s*'#6c757d'[^}]+}}([^>]*)>\s*Edit\s*<\/button>/g, '<button$1className="btn btn-ghost btn-sm"$2>Edit</button>');

  // Replace Cancel
  content = content.replace(/<button([^>]+)style={{[^}]+backgroundColor:\s*'#6c757d'[^}]+}}([^>]*)>\s*Cancel\s*<\/button>/g, '<button$1className="btn btn-ghost btn-sm"$2>Cancel</button>');

  // Replace Delete
  content = content.replace(/<button([^>]+)style={{[^}]+backgroundColor:\s*'#dc3545'[^}]+}}([^>]*)>\s*Delete\s*<\/button>/g, '<button$1className="btn btn-danger btn-sm"$2>Delete</button>');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated buttons in ${file}`);
  }
});
