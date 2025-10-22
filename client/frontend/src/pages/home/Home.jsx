import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./home.css";
import { API_URL } from "../../config";

export default function Home() {
  const token = localStorage.getItem("token");

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  // 🟢 جلب الملفات مع التاريخ
  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API_URL}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUploadedFiles(res.data.files || []);
    } catch (err) {
      console.error("Error fetching files:", err);
      setErrorMsg("❌ فشل جلب الملفات");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrorMsg("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("⚠️ اختر ملف أولاً");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      await axios.post(`${API_URL}/files/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setFile(null);
      fetchFiles(); // تحديث الملفات بعد الرفع
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg("❌ فشل رفع الملف");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id, name) => {
    try {
      const res = await axios.get(`${API_URL}/files/download/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // تحديث التاريخ بعد التنزيل
      await fetchFiles();
    } catch (err) {
      console.error("Download error:", err);
      setErrorMsg("❌ فشل تنزيل الملف");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.patch(`${API_URL}/files/upload/${id}/delete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFiles(); // تحديث الملفات بعد الحذف
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMsg("❌ فشل حذف الملف");
    }
  };

  return (
    <div className="container mt-5">
      <h3 className="text-center">إدارة الملفات والتاريخ</h3>

      <form onSubmit={handleUpload} className="mb-4">
        <input type="file" onChange={handleFileChange} />
        <button type="submit" className="btn btn-primary ms-2" disabled={loading}>
          {loading ? "⏳ جاري رفع الملف..." : "رفع الملف"}
        </button>
      </form>

      {errorMsg && <p className="text-danger">{errorMsg}</p>}

      <h5>الملفات المرفوعة:</h5>
      <ul className="list-group">
        {uploadedFiles.map((f) => (
          <li key={f.upload_id} className="list-group-item">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{f.file_name}</strong>
                {f.description_upload_file && <p>{f.description_upload_file}</p>}
              </div>
              <div>
                <button className="btn btn-sm btn-success me-2" onClick={() => handleDownload(f.upload_id, f.file_name)}>تنزيل</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(f.upload_id)}>حذف</button>
              </div>
            </div>

            {/* 🟢 عرض التاريخ */}
            {f.history && f.history.length > 0 && (
              <ul className="mt-2 list-group list-group-flush">
                {f.history.map((h, i) => (
                  <li key={i} className="list-group-item small text-muted">
                    {h.action} — {new Date(h.created_at).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
