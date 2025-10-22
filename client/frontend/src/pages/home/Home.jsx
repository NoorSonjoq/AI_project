import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import "./home.css";
import { API_URL } from "../../config";

export default function Home() {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleGeneratePDF = async () => {
    try {
      setLoading(true);

      // إنشاء PDF بسيط
      const doc = new jsPDF();
      doc.text("User Report Example", 10, 10);

      // تحويله إلى Blob بصيغة PDF
      const pdfBlob = new Blob([doc.output("arraybuffer")], { type: "application/pdf" });

      // إنشاء اسم للملف
      const pdfName = `report_${Date.now()}.pdf`;

      // تجهيز FormData لإرسال الملف
      const formData = new FormData();
      formData.append("pdf", pdfBlob, pdfName);

      // إرسال الطلب إلى السيرفر
      const response = await axios.post(`${API_URL}/files/save-pdf`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setMessage("✅ تم حفظ التقرير بنجاح!");
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

  return (
    <div className="container text-center mt-5">
      <h3>توليد وحفظ تقرير PDF</h3>
      <button className="btn btn-primary mt-3" onClick={handleGeneratePDF} disabled={loading}>
        {loading ? "جاري الحفظ..." : "توليد وحفظ التقرير"}
      </button>
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}
