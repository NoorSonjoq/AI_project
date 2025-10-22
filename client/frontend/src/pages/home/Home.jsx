import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import "./home.css";
import { API_URL } from "../../config";

export default function Home() {
  const token = localStorage.getItem("token");

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [generatedReports, setGeneratedReports] = useState([]);

  useEffect(() => {
    fetchUploadedFiles();
    fetchGeneratedReports();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      const res = await axios.get(`${API_URL}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUploadedFiles(
        res.data.files.map((f) => ({
          id: f.upload_id,
          name: f.file_name,
          description: f.description_upload_file || "",
        }))
      );
    } catch (err) {
      console.error(err);
      setErrorMsg("Error fetching uploaded files");
    }
  };

  const fetchGeneratedReports = async () => {
    try {
      const res = await axios.get(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGeneratedReports(res.data.reports);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error fetching generated reports");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setErrorMsg("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file && !prompt) {
      setErrorMsg("Please choose a file or enter a prompt");
      return;
    }

    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("prompt", prompt);

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await axios.post(`${API_URL}/files/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchUploadedFiles();
      setResult(res.data.aiResponse || "");
      setFile(null);
      setPrompt("");
    } catch (err) {
      console.error(err);
      setErrorMsg("Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (fileObj) => {
    if (!fileObj.id) return;

    try {
      const res = await axios.get(`${API_URL}/files/download/${fileObj.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileObj.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error downloading file");
    }
  };

  const handleGeneratePDF = async () => {
    if (!result) return;

    setLoading(true);
    const doc = new jsPDF();
    doc.text("AI Generated Report", 10, 10);
    doc.text(result, 10, 20);

    const pdfBlob = new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
    const pdfName = `AI_Report_${Date.now()}.pdf`;

    const formData = new FormData();
    formData.append("pdf", pdfBlob, pdfName);

    try {
      const res = await axios.post(`${API_URL}/files/save-pdf`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.success) {
        fetchGeneratedReports();
        setResult("");
        setErrorMsg("");
      } else {
        setErrorMsg("Error saving PDF to server");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error saving PDF to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrapper d-flex">
      {/* Upload Section */}
      <div className="left-sidebar shadow p-3">
        <h3 className="text-primary text-center">Uploaded Files</h3>
        <form onSubmit={handleUpload}>
          <input type="file" accept=".csv,.xls,.xlsx" onChange={handleFileChange} />
          <textarea
            placeholder="Enter prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Upload"}
          </button>
        </form>

        <ul>
          {uploadedFiles.map((file, i) => (
            <li key={i}>
              {file.name}
              <button onClick={() => handleDownloadFile(file)}>Download</button>
            </li>
          ))}
        </ul>
      </div>

      {/* PDF Section */}
      <div className="middle-container flex-grow-1 p-4">
        <h3>AI Report Generator</h3>
        <button onClick={handleGeneratePDF} disabled={loading || !result}>
          {loading ? "Processing..." : "Generate PDF & Save"}
        </button>
        {errorMsg && <p>{errorMsg}</p>}
      </div>

      {/* Generated Reports Section */}
      <div className="right-sidebar shadow p-3">
        <h3>Generated Reports</h3>
        <ul>
          {generatedReports.map((report, i) => (
            <li key={i}>
              {report.report_title}
              <button onClick={() => handleDownloadFile({ id: report.upload_id, name: `${report.report_title}.zip` })}>
                Download ZIP
              </button>
              <button onClick={() => handleDownloadFile({ id: report.report_id, name: `${report.report_title}.pdf` })}>
                Download PDF
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
