async function test() {
  try {
    const res = await fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test1234',
        message: 'Hello, how are you today?',
        userName: 'Nitish',
        aiGender: 'Female',
        aiName: 'ira'
      })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
