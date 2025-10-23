import React, { useState, useEffect } from "react";
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

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [generatedReportFiles, setGeneratedReportFiles] = useState([]);

  const token = localStorage.getItem("token");

  // ================== جلب الملفات المخزنة عند تحميل الصفحة
  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setUploadedFiles(res.data.files);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // ================== تغيير الملف
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setFileUploaded(false);
  };

  // ================== رفع الملف
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
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/files/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("RESPONSE", res.data.aiResponse);
      setResult(res.data.aiResponse);
      setFileUploaded(true);
      setErrorMsg("");

      fetchFiles(); // تحديث قائمة الملفات بعد الرفع
    } catch (err) {
      console.error(err);
      alert("Error processing the file");
    } finally {
      setLoading(false);
    }
  };

  // ================== تحميل ملف
  const handleDownload = async (id, fileName) => {
    try {
      const res = await axios.get(`${API_URL}/api/files/download/${id}`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
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
    }
  };

  // ================== حذف ملف
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      await axios.patch(`${API_URL}/api/files/upload/${id}/delete`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFiles(); // تحديث القائمة بعد الحذف
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ================== توليد تقرير PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("AI Generated Report", 10, 10);
    doc.text(result, 10, 20);
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
            {uploadedFiles.map((file) => (
              <li
                key={file.upload_id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{file.file_name}</span>
                <div>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() =>
                      handleDownload(file.upload_id, file.file_name)
                    }
                  >
                    Download
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(file.upload_id)}
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

            <button
              type="submit"
              className="btn btn-primary w-100 mt-3"
              disabled={loading}
            >
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
              <li
                key={i}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
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
