import { useState } from "react";

export const TextTransform = () => {
    const [input, setInput] = useState<string>('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<string>('');

    const submit = async () => {
        if (!input.trim()) {
          setError("Input can't be empty");
          return;
        }
      
        setLoading(true);
        setError('');
        try {
          const res = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/suggestions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input }),
          });
      
          const data = await res.json();
          setResponse(data.content || 'No suggestions returned.');
        } catch (err) {
          console.error('Error sending to /suggestions:', err);
          setError('Something went wrong. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      const buttonMap = [
        'Charming cottage with beautiful views. The kitchen is fully equipped and there’s a cozy lounge to relax in. Guests can enjoy the outdoor seating area and the nearby countryside walks.',
        'Modern apartment with WiFi and a large smart TV. Fresh towels are provided. Great for couples or solo travelers looking for a quiet getaway.',
        'Welcome to our lovely home in BN3 2AB. We’re close to local shops and public transport. Great location for exploring the area!',
        'You’ll love staying here — super comfy bed and lots of natural light. It’s our favorite spot to unwind after a long day.', 
      ];

      const mapExamples = (value: string) => {
        setInput(value);
        setResponse('');
      }

    return (
        <div>
            <h1>RAG Text Transform</h1>
            <div style={{ marginBottom: 20 }}>
                {buttonMap.map((value, index) => (
                    <button style={{marginRight: 20}} key={index} onClick={() => mapExamples(value)}>
                        Example {index + 1}
                    </button>
                ))}
            </div>
            <textarea
                rows={6}
                cols={80}
                placeholder="Paste your markdown rules here"
                value={input}
                onChange={(e) =>
                    setInput(e.target.value)
                }
                style={{ fontFamily: 'monospace', width: '100%' }}
            />
            <button onClick={submit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit'}
            </button>
            {loading && <p>Loading</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {response && (
                <div>
                    <h3>Suggestions</h3>
                    <p>{response}</p>
                </div>
            )}
        </div>
    )
}

export default TextTransform;