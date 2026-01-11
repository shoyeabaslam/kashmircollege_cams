// Quick test to see if cookies work
const testCookies = () => {
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'counselor@cams.com', password: 'password123' }),
    credentials: 'include'
  })
  .then(r => {
    console.log('Status:', r.status)
    console.log('Headers:', Array.from(r.headers.entries()))
    return r.json()
  })
  .then(d => console.log('Response:', d))
}
