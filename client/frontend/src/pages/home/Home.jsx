import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import "./home.css";
import { API_URL } from "../../config";

export default function Home() {
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(""); // النص/الملخص الذي تريد وضعه في PDF
  const [generatedReports, setGeneratedReports] = useState([]);

  // 🟢 جلب التقارير المحفوظة عند التحميل
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_URL}/files/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setGeneratedReports(res.data.reports);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  // 🟢 توليد PDF وحفظه في السيرفر
  const handleGeneratePDF = async () => {
    if (!result) {
      setMessage("⚠️ لا يوجد محتوى لإنشاء التقرير!");
      return;
    }

    try {
      setLoading(true);

      // إنشاء PDF
      const doc = new jsPDF();
      doc.text("User Report", 10, 10);
      doc.text(result, 10, 20);

      // تحويله إلى Blob
      const pdfBlob = new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
      const pdfName = `report_${Date.now()}.pdf`;

      // إعداد FormData
      const formData = new FormData();
      formData.append("pdf", pdfBlob, pdfName);
      formData.append("prompt", result); // إذا تريد إرسال النص للباك إند

      const response = await axios.post(`${API_URL}/files/save-pdf`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setMessage("✅ تم حفظ التقرير بنجاح!");
        setGeneratedReports((prev) => [response.data.report, ...prev]);
      } else {
        setMessage("❌ حدث خطأ أثناء حفظ التقرير.");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error uploading PDF:", error);
      setMessage("⚠️ فشل رفع الملف!");
      setLoading(false);
    }
  };

  // 🟢 تحميل التقرير
  const handleDownload = async (report) => {
    try {
      const res = await axios.get(`${API_URL}/files/download/pdf/${report.report_id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const fileUrl = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = fileUrl;
      link.setAttribute("download", report.pdf_path.split("/").pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error("Download error:", err);
      setMessage("⚠️ حدث خطأ أثناء تحميل التقرير!");
    }
  };

  return (
    <div className="container mt-5">
      <h3 className="text-center mb-3">توليد وحفظ تقرير PDF</h3>

      <div className="mb-3">
        <textarea
          className="form-control"
          placeholder="أدخل محتوى التقرير هنا..."
          value={result}
          onChange={(e) => setResult(e.target.value)}
          rows={4}
        />
      </div>

      <button
        className="btn btn-primary w-100 mb-3"
        onClick={handleGeneratePDF}
        disabled={loading}
      >
        {loading ? "⏳ جاري الحفظ..." : "توليد وحفظ التقرير"}
      </button>

      {message && <p className="text-center mt-2">{message}</p>}

      <h5 className="mt-5">التقارير المحفوظة:</h5>
      {generatedReports.length === 0 ? (
        <p className="text-muted">لا يوجد تقارير محفوظة حتى الآن.</p>
      ) : (
        <ul className="list-group">
          {generatedReports.map((report) => (
            <li
              key={report.report_id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              {report.pdf_path.split("/").pop()}
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleDownload(report)}
              >
                تحميل
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
