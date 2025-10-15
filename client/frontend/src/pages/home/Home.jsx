import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import "./home.css";
import { API_URL } from "../../config";


export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fileUploaded, setFileUploaded] = useState(false);
   const [prompt, setPrompt] = useState("");
   const [result, setResult] = useState("");

  // now each file = { name, url }
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [generatedReportFiles, setGeneratedReportFiles] = useState([]);

  // ==================
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileUploaded(false);
  };

  // ==================
  const handleUpload = async (e) => {
  e.preventDefault();

  if (!file) {
    setErrorMsg("Please choose a file or enter a prompt");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("prompt", prompt);

  try {
    const res = await axios.post(
      `${API_URL}/api/files/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true, // ✅ مهم لإرسال الكوكي للباك
      }
    );

    console.log("RESPONSE", res.data.aiResponse);
    setResult(res.data.aiResponse);

    // إنشاء رابط مؤقت للملف
    const fileUrl = URL.createObjectURL(file);

    setUploadedFiles((prev) => [
      ...prev,
      { name: file.name, url: fileUrl },
    ]);

    setFileUploaded(true);
    setErrorMsg("");
  } catch (err) {
    console.error(err);
    alert("Error processing the file");
  } finally {
    setLoading(false);
  }

  console.log(formData.get("file"));
  console.log(formData.get("prompt"));
  setLoading(true);
};

  // ====================
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("AI Generated Report", 10, 10);
    doc.text("Sample report content goes here...", 10, 20);
    doc.text(result, 10, 30);

    // Convert to Blob
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    // const pdfName = "AI_Report_" + new Date().getTime() + ".pdf";
    const pdfName = "AI_Report_" + ".pdf";

    // Save to list (with URL)
    setGeneratedReportFiles((prev) => [
      ...prev,
      { name: pdfName, url: pdfUrl },
    ]);

    setFileUploaded(false);
  };

  // ==================== UI
  return (
    <div className="wrapper d-flex">
      {/* LEFT SIDEBAR */}
      <div className="left-sidebar shadow p-3">
        <h3 className="text-primary text-center">Uploaded Files</h3>
        {uploadedFiles.length === 0 ? (
          <p className="text-muted text-center">No files uploaded yet</p>
        ) : (
          <ul className="list-group small">
            {uploadedFiles.map((file, i) => (
              <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                <span>{file.name}</span>
                <a
                  href={file.url}
                  download={file.name}
                  className="btn btn-sm btn-outline-primary"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* MIDDLE */}
      <div className="middle-container flex-grow-1 p-4">
        <div className="card p-4">
          <h2 className="text-center text-primary mb-3">AI Report Generator</h2>

          <form onSubmit={handleUpload}>
            <div>
              <label htmlFor="file" className="form-label">
                Choose Excel or CSV file
              </label>
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                className="form-control"
                onChange={handleFileChange}
              />
            </div>

               <div className="mb-3">
          <textarea
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="form-control"
          />
        </div>

            <button type="submit" className="btn btn-primary w-100 mt-3" disabled={loading}>
              {loading ? "⏳ Uploading..." : "Upload"}
            </button>
          </form>

          {errorMsg && <div className="alert alert-danger mt-3">{errorMsg}</div>}

          <button
            className="btn btn-success w-100 mt-4"
            disabled={!fileUploaded}
            onClick={handleDownloadPDF}
          >
            Generate Report as PDF
          </button>


          {
            result && <p>
              {result}
            </p>
          }
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="right-sidebar shadow p-3">
        <h3 className="text-primary text-center">Generated Reports</h3>
        {generatedReportFiles.length === 0 ? (
          <p className="text-muted text-center">No reports yet</p>
        ) : (
          <ul className="list-group small">
            {generatedReportFiles.map((file, i) => (
              <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                <span>{file.name}</span>
                <a
                  href={file.url}
                  download={file.name}
                  className="btn btn-sm btn-outline-success"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}