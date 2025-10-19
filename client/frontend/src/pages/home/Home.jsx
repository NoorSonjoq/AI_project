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
  const [fileUploaded, setFileUploaded] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [generatedReportFiles, setGeneratedReportFiles] = useState([]);

  // ================== جلب الملفات عند فتح الصفحة
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/files/`, {
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
      console.error("Error fetching files", err);
      setErrorMsg("Error fetching files");
    }
  };

  // ==================== اختيار الملف
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setErrorMsg("");
  };

  // ==================== رفع الملف
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please choose a file or enter a prompt");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("prompt", prompt);

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await axios.post(`${API_URL}/api/files/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchFiles(); // ✅ جلب الملفات بعد الرفع تلقائياً
      setResult(res.data.aiResponse);
      setFile(null);
      setPrompt("");
      setFileUploaded(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  // ==================== تحميل الملف
  const handleDownload = async (id, fileName) => {
    try {
      const res = await axios.get(`${API_URL}/api/files/download/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download error:", err);
      setErrorMsg("Error downloading file");
    }
  };

  // ==================== حذف الملف
  const handleDelete = async (id) => {
    try {
      await axios.patch(`${API_URL}/api/files/upload/${id}/delete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUploadedFiles((prev) => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMsg("Error deleting file");
    }
  };

  // ==================== تحديث اسم الملف أو الوصف
  const handleUpdate = async (id, newName, newDescription) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/files/upload/${id}`,
        { file_name: newName, description_upload_file: newDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUploadedFiles((prev) =>
        prev.map(f => (f.id === id ? { ...f, name: res.data.upload.file_name, description: res.data.upload.description_upload_file } : f))
      );
    } catch (err) {
      console.error("Update error:", err);
      setErrorMsg("Error updating file");
    }
  };

  // ==================== توليد تقرير PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("AI Generated Report", 10, 10);
    doc.text(result || "No content yet", 10, 20);

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const pdfName = "AI_Report.pdf";

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
                <div>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => handleDownload(file.id, file.name)}
                  >
                    Download
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(file.id)}
                  >
                    Delete
                  </button>
                </div>
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

          {result && <p className="mt-3">{result}</p>}
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
