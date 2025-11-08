// api.js
// IMPORTANT: replace BASE with your backend address later.
// For local testing on laptop with json-server: use 'http://localhost:3000'
// If you test on Android emulator: 'http://10.0.2.2:3000'
// If you use ngrok for a real device: use the https://xxxx.ngrok.io URL

const BASE = 'http://192.168.1.62:3000'; // <-- keep this for now; change later if needed

export async function fetchTasks(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}/tasks${qs ? '?' + qs : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch tasks failed: ' + res.status);
  return res.json();
}

export async function createTask({ title, description }) {
  const res = await fetch(`${BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, status: 'Pending' })
  });
  if (!res.ok) throw new Error('Create task failed: ' + res.status);
  return res.json();
}

export async function updateTask(id, patch) {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  });
  if (!res.ok) throw new Error('Update task failed: ' + res.status);
  return res.json();
}
