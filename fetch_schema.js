const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (urlMatch && keyMatch) {
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();

  fetch(`${url}/rest/v1/orders?limit=1`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  }).then(r => r.json()).then(data => {
    console.log(data);
  }).catch(e => console.error(e));
} else {
  console.log("Could not parse env");
}
