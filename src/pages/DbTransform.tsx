import {
    Paper, Select, MenuItem, FormControl, InputLabel,
    AlertTitle,
    Alert
  } from "@mui/material";
  import { DataGrid, GridColDef } from "@mui/x-data-grid";
  import { CSVLink } from "react-csv";
  import { useEffect, useMemo, useState } from "react";
  
  interface PropertyNote {
    id: number;
    raw_text: string;
    postcode: string | null;
    city: string | null;
    access_instructions: string | null;
    confidence_tip: string | null;
    confidence_score: number | null;
    parking_info: string | null;
    amenities: string | null;
  }
  
  export const DbTransform = () => {
    const [response, setResponse] = useState<PropertyNote[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [error, setError] = useState("");
    const [csvError, setCsvError] = useState("");
    const [csvData, setCsvData] = useState<any[]>([]);
    const [csvReady, setCsvReady] = useState(false);
    const [dbLoading, setDbLoading] = useState(false);
    const [csvLoading, setCsvLoading] = useState(false);
    const [aiModel, setAiModel] = useState({ type: 'openai', model: 'gpt-4o-mini' });
    const [inputText, setInputText] = useState({
        customRules: '',
      });
  
    const columns: GridColDef[] = [
      { field: "id", headerName: "ID", width: 70 },
      {
        field: "raw_text",
        headerName: "Raw Text",
        flex: 2,
        minWidth: 200,
        renderCell: (params) => (
          <div style={{ whiteSpace: "normal", overflowWrap: "anywhere" }}>
            {params.value}
          </div>
        ),
      },
      { field: "postcode", headerName: "Postcode", width: 100 },
      { field: "parking_info", headerName: "Parking Info", width: 150 },
      { field: "city", headerName: "City", width: 100 },
      { field: "access_instructions", headerName: "Access Instructions", width: 180 },
      { field: "amenities", headerName: "Amenities", width: 180 },
      { field: "confidence_score", headerName: "Confidence Score", width: 80 },
      { field: "confidence_tip", headerName: "Confidence Tip", width: 180 },
    ];
  
    const fetchData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/property-notes`);
        const json = await res.json();
        setResponse(json);
      } catch (e) {
        console.error("Failed to fetch property notes:", e);
        setError("Failed to load property notes.");
      }
    };
  
    useEffect(() => {
      fetchData();
    }, []);
  
    const handleSelectionChange = (selectionModel: any) => {
      if (selectionModel?.type === 'include' && selectionModel?.ids instanceof Set) {
        setSelectedIds(Array.from(selectionModel.ids) as number[]);
      } else if (Array.isArray(selectionModel)) {
        setSelectedIds(selectionModel as number[]);
      } else {
        setSelectedIds([]);
      }
    };
  
    const paginationModel = { page: 0, pageSize: 5 };
  
    const handleSubmit = async () => {
      setError("");
      setDbLoading(true);
  
      try {
        await fetch(`${import.meta.env.VITE_API_ENDPOINT}/bulk-property-notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ selectedIds, aiModel, customRules: inputText.customRules, }),
        });
  
        await fetchData();
        setSelectedIds([]);
      } catch (err) {
        console.error("Error sending to /bulk-property-notes:", err);
        setError("Failed to process selected rows.");
      } finally {
        setDbLoading(false);
      }
    };
  
    const handleExtractToCSV = async () => {
      setCsvError("");
      setCsvLoading(true);
  
      const selectedRows = response.filter((row) => selectedIds.includes(row.id));
      const rawTexts = selectedRows.map((row) => row.raw_text);
  
      try {
        const res = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            textField: rawTexts,
            customRules: inputText.customRules,
            aiModel,
          }),
        });
  
        const { results } = await res.json();
  
        if (results) {
          setCsvData(results);
          setCsvReady(true);
        }
      } catch (err) {
        console.error("AI extraction failed", err);
        setCsvError("Failed to extract with AI.");
      } finally {
        setCsvLoading(false);
      }
    };
  
    const csvHeaders = [
      { label: "Access Instructions", key: "access_instructions" },
      { label: "Confidence Tip", key: "confidence_tip" },
      { label: "Confidence Score", key: "confidence_score" },
      { label: "Parking Info", key: "parking_info" },
      { label: "Amenities", key: "amenities" },
      { label: "Postcode", key: "postcode" },
      { label: "City", key: "city" },
    ];
  
    const handleReset = async () => {
      try {
        await fetch(`${import.meta.env.VITE_API_ENDPOINT}/reset`, { method: "DELETE" });
        await fetchData();
      } catch (err) {
        console.error("Failed to reset DB:", err);
      }
    };

    const initialValue = {
        positive: 0,
        warning: 0,
        error: 0,
    };
    
    const resultValues = useMemo(() => {
        return response.reduce((acc, item) => {
            const score = item?.confidence_score ?? null;
    
            if (score === 10) acc.positive += 1;
            else if (score === 8) acc.warning += 1;
            else if (score !== null && score < 8) acc.error += 1;
    
            return acc;
        }, { ...initialValue });
    }, [response]);
  
    return (
      <div>
        <h2>DB Transform</h2>
  
        <FormControl fullWidth style={{ marginBottom: 20 }}>
          <InputLabel id="ai-model-select-label">AI Model</InputLabel>
          <Select
            labelId="ai-model-select-label"
            value={aiModel.model}
            label="AI Model"
            onChange={(e) => setAiModel({ type: 'openai', model: e.target.value })}
          >
            <MenuItem value="gpt-4o-mini">OpenAI - GPT-4o Mini</MenuItem>
          </Select>
        </FormControl>
  
        {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}
        {csvError && <div style={{ color: "red", marginBottom: 10 }}>{csvError}</div>}
        
        {resultValues.warning > 0 && (
            <Alert severity="warning" style={{ marginBottom: 10 }}>
                <AlertTitle>Warning: {resultValues.warning} values that need attention</AlertTitle>
            </Alert>
        )}

        {resultValues.error > 0 && (
            <Alert severity="error" style={{ marginBottom: 10 }}>
                <AlertTitle>Error: {resultValues.error} values that need urgent attention</AlertTitle>
            </Alert>
        )}

        <Paper sx={{ height: 500, width: "100%" }}>
          <DataGrid
            rows={response}
            columns={columns}
            getRowId={(row) => row.id}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[5, 10]}
            checkboxSelection
            onRowSelectionModelChange={handleSelectionChange}
            sx={{
              border: 0,
              "& .MuiDataGrid-cell": {
                whiteSpace: "normal",
                wordBreak: "break-word",
                lineHeight: "1.4rem",
              },
            }}
          />
        </Paper>

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

  
        <div style={{ marginTop: 20, display: 'flex', gap: 20 }}>
          <button
            onClick={handleSubmit}
            disabled={selectedIds.length === 0 || dbLoading}
          >
            {dbLoading ? "Extracting to DB..." : "Extract Free Text to DB"}
          </button>
  
          <button
            onClick={handleExtractToCSV}
            disabled={selectedIds.length === 0 || csvLoading}
          >
            {csvLoading ? "Extracting for CSV..." : "Extract & Prepare CSV"}
          </button>
  
          {csvReady && (
            <CSVLink
              data={csvData}
              headers={csvHeaders}
              filename="ai_extracted_notes.csv"
              onClick={() => setCsvReady(false)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: 4,
                background: '#eee',
                textDecoration: 'none',
                color: '#333'
              }}
            >
              Download CSV
            </CSVLink>
          )}
  
          <button onClick={handleReset}>Reset Database</button>
        </div>
      </div>
    );
  };
  
  export default DbTransform;