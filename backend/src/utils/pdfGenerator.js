const PDFDocument = require("pdfkit-table");
const fs = require("fs");
const path = require("path");

/**
 * Generates an agreement PDF document and returns it as a Buffer.
 * @param {Object} data - The data for the agreement.
 * @param {string} data.userName
 * @param {string} data.userEmail
 * @param {string} data.userPhone
 * @param {string} data.propertyTitle
 * @param {number} data.units
 * @param {number} data.totalAmount
 * @param {string} data.placeOfSignature
 * @param {string} data.signatureBase64 - Base64 string of the signature image (without data:image/... prefix or with it, we'll handle both).
 * @returns {Promise<Buffer>}
 */
async function generateAgreementPdf(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on("error", (err) => {
        reject(err);
      });

      // --- PDF CONTENT ---
      
      // Header
      doc.fontSize(20).font("Helvetica-Bold").text("Investment Agreement", { align: "center" });
      doc.moveDown(2);

      // Date
      const currentDate = new Date().toLocaleString();
      doc.fontSize(12).font("Helvetica").text(`Date: ${currentDate}`, { align: "right" });
      doc.moveDown(1);

      // Parties
      doc.fontSize(14).font("Helvetica-Bold").text("1. Parties");
      doc.fontSize(12).font("Helvetica")
         .text(`This Agreement is made between Silver Real Estate (the "Company") and:`)
         .moveDown(0.5)
         .text(`Name: ${data.userName}`)
         .text(`Email: ${data.userEmail}`)
         .text(`Phone: ${data.userPhone}`)
         .moveDown(1);

      // Investment Details
      doc.fontSize(14).font("Helvetica-Bold").text("2. Investment Details");
      doc.fontSize(12).font("Helvetica")
         .text(`Property: ${data.propertyTitle}`)
         .text(`Units Purchased: ${data.units}`)
         .text(`Total Amount: Rs. ${data.totalAmount.toLocaleString('en-IN')}`)
         .moveDown(1);

      // Terms
      doc.fontSize(14).font("Helvetica-Bold").text("3. Terms & Conditions");
      doc.fontSize(10).font("Helvetica")
         .text(`The Investor agrees to purchase the stated units in the aforementioned property subject to the terms outlined in the full Silver Real Estate Terms of Service.`)
         .moveDown(0.5)
         .text(`This document serves as a binding agreement indicating the Investor's intent and commitment to the investment. Final approval is subject to manual verification of payment and KYC documents by the administration.`)
         .moveDown(2);

      // Signatures Section
      doc.fontSize(14).font("Helvetica-Bold").text("4. Signatures");
      doc.moveDown(1);

      doc.fontSize(12).font("Helvetica").text(`Place of Signature: ${data.placeOfSignature}`);
      doc.moveDown(1);

      doc.text("Investor Signature:");
      doc.moveDown(0.5);

      if (data.signatureBase64) {
        // Strip data:image/... base64 prefix if present
        const base64Data = data.signatureBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
        const signatureBuffer = Buffer.from(base64Data, "base64");
        
        // Draw image (x, y, options)
        doc.image(signatureBuffer, {
          fit: [200, 100],
          align: 'left',
          valign: 'center'
        });
      } else {
        doc.text("[ No Signature Provided ]", { color: "red" });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generates an Invoice PDF for an investment payment.
 * data includes:
 * - invoiceNumber, date
 * - userFullName, userEmail
 * - propertyTitle, propertyLocation
 * - units, unitPriceAtTime
 * - previousPaidAmount, currentPaymentAmount, remainingBalance, totalAmount
 */
async function generateInvoicePdf(data) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Add logo or company name top left
      doc.fontSize(16).fillColor("#8e44ad").font("Helvetica-Bold").text("SILVER REAL ESTATE", 50, 50);

      // BILL TO (Left)
      doc.fontSize(10).fillColor("#8e44ad").font("Helvetica-Bold").text("BILL TO", 50, 100);
      doc.fillColor("black").font("Helvetica");
      doc.text(data.userFullName || "", 50, 115);
      if (data.userEmail) doc.text(data.userEmail, 50, 130);
      if (data.userPhone) doc.text(data.userPhone, 50, 145);

      // FROM (Right)
      doc.fillColor("#8e44ad").font("Helvetica-Bold").text("FROM", 350, 100);
      doc.fillColor("black").font("Helvetica");
      doc.text("Silver Real Estate", 350, 115);
      doc.text("123 Business Avenue, Tech Park", 350, 130);
      doc.text("Sector 42, New Delhi, India", 350, 145);
      doc.text("support@silverrealestate.com", 350, 160);

      // Dates (Left)
      doc.font("Helvetica").text(`Invoice Date: ${data.date}`, 50, 190);
      doc.font("Helvetica-Bold").text(`Due Date: ${data.date}`, 50, 205);

      // Bank details (Right)
      doc.font("Helvetica").text("Bank Name: Axis Bank", 350, 190);
      doc.text("IFSC: UTIB000XXXX", 350, 205);
      doc.text("Account: 9283749283749", 350, 220);

      // INVOICE NUMBER (Center)
      doc.moveDown(4);
      const invNum = data.invoiceNumber.split('-').length > 1 ? data.invoiceNumber.split('-')[1] : data.invoiceNumber;
      doc.fontSize(24).font("Helvetica-Bold").text(`Invoice # ${invNum}`, { align: 'center' });
      doc.moveDown(2);

      // Main Table
      const table = {
        title: "",
        headers: [
          { label: "DESCRIPTION", property: "desc", width: 250 },
          { label: "QTY", property: "qty", width: 50 },
          { label: "UNIT PRICE", property: "price", width: 100 },
          { label: "SUBTOTAL", property: "subtotal", width: 100 }
        ],
        datas: [
          {
            desc: `Real estate fractional ownership - ${data.propertyTitle}`,
            qty: data.units.toString(),
            price: data.unitPriceAtTime.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
            subtotal: data.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })
          }
        ],
      };

      await doc.table(table, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
        prepareRow: () => doc.font("Helvetica").fontSize(10)
      });

      // Totals
      const tableY = doc.y;
      doc.font("Helvetica").text("SUBTOTAL", 350, tableY + 10);
      doc.text(data.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 }), 450, tableY + 10, { width: 100, align: 'right' });
      
      doc.text("TAX", 350, tableY + 25);
      doc.text("0.00", 450, tableY + 25, { width: 100, align: 'right' });

      doc.font("Helvetica-Bold").text("Total", 350, tableY + 40);
      doc.text(data.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 }), 450, tableY + 40, { width: 100, align: 'right' });

      doc.moveDown(4);
      
      // Calculate totals from payment history
      let totalPaid = 0;
      if (data.paymentHistory) {
        data.paymentHistory.forEach(p => totalPaid += Number(p.amount));
      } else {
        totalPaid = data.previousPaidAmount + data.currentPaymentAmount;
      }

      // Payment History Table
      if (data.paymentHistory && data.paymentHistory.length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("Payment History", 50, doc.y + 40);
        doc.moveDown(0.5);

        const historyDatas = data.paymentHistory.map((payment, idx) => ({
          date: new Date(payment.date).toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' }),
          desc: `Payment ${idx + 1}`,
          amount: payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })
        }));

        const historyTable = {
          title: "",
          headers: [
            { label: "DATE", property: "date", width: 150 },
            { label: "DESCRIPTION", property: "desc", width: 200 },
            { label: "AMOUNT PAID", property: "amount", width: 150 }
          ],
          datas: historyDatas
        };

        await doc.table(historyTable, {
          prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
          prepareRow: () => doc.font("Helvetica").fontSize(10)
        });

        const historyY = doc.y;
        doc.font("Helvetica-Bold").text("Total Paid", 300, historyY + 10);
        doc.text(totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 }), 400, historyY + 10, { width: 100, align: 'right' });
        
        doc.font("Helvetica-Bold").text("Remaining Balance", 300, historyY + 25);
        const rem = data.totalAmount - totalPaid;
        doc.text(rem.toLocaleString("en-IN", { minimumFractionDigits: 2 }), 400, historyY + 25, { width: 100, align: 'right' });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateAgreementPdf,
  generateInvoicePdf
};
