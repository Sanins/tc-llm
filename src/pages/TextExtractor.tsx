import { useState } from 'react';
import { JsonViewer } from '@textea/json-viewer';
import {
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Box,
} from '@mui/material';

export const TextExtractor = () => {
  const [inputText, setInputText] = useState({
    freeText: '',
    customRules: '',
  });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiModel, setAiModel] = useState({
    type: 'openai',
    model: 'gpt-4o-mini',
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textField: [inputText.freeText],
          customRules: inputText.customRules,
          aiModel,
        }),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('Error sending to /ask:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App" style={{ padding: 20 }}>
      <h1>RAG Text Extractor</h1>

      <FormControl fullWidth style={{ marginBottom: 20 }}>
        <InputLabel id="ai-model-label">AI Model</InputLabel>
        <Select
          labelId="ai-model-label"
          value={aiModel.model}
          onChange={(e) =>
            setAiModel({ type: 'openai', model: e.target.value })
          }
          label="AI Model"
        >
          <MenuItem value="gpt-4o-mini">OpenAI - GPT-4o Mini</MenuItem>
        </Select>
      </FormControl>

      <h3>Property Text (freeText)</h3>
      <textarea
        rows={10}
        cols={80}
        placeholder="Paste HTML or property description here"
        value={inputText.freeText}
        onChange={(e) =>
          setInputText((prev) => ({ ...prev, freeText: e.target.value }))
        }
        style={{ fontFamily: 'monospace', width: '100%' }}
      />

      <h3 style={{ marginTop: 20 }}>Custom Rules (markdown/plain)</h3>
      <textarea
        rows={6}
        cols={80}
        placeholder="Paste your markdown rules here"
        value={inputText.customRules}
        onChange={(e) =>
          setInputText((prev) => ({ ...prev, customRules: e.target.value }))
        }
        style={{ fontFamily: 'monospace', width: '100%' }}
      />

      <button onClick={handleSubmit} style={{ marginTop: 20 }} disabled={loading}>
        {loading ? 'Extracting...' : 'Extract Info'}
      </button>

      {error && (
        <div style={{ marginTop: 20, color: 'red' }}>
          <strong>{error}</strong>
        </div>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {response && (
        <div style={{ marginTop: 20, textAlign: 'left' }}>
          <JsonViewer value={response} />
        </div>
      )}
    </div>
  );
};

export default TextExtractor;