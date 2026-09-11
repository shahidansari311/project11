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

function numberToWords(num) {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty ','Thirty ','Forty ','Fifty ', 'Sixty ','Seventy ','Eighty ','Ninety '];

  if (num === 0) return 'Zero only';
  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  var str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + a[n[5][1]]) : '';
  return str.trim() + ' rupees only';
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
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const primaryColor = "#003946";

      // Top purple bar (ignoring margins)
      doc.rect(0, 0, doc.page.width, 15).fill(primaryColor);

      doc.y = 40;
      doc.x = 40;

      // Logo box
      doc.roundedRect(40, 40, 30, 30, 5).fill(primaryColor);
      doc.fillColor("white").fontSize(20).font("Helvetica-Bold").text("S", 40, 47, { width: 30, align: "center" });

      // Company Name
      doc.fillColor("black").fontSize(18).font("Helvetica-Bold").text("SILVER REAL ESTATE", 80, 45);

      doc.fontSize(10).font("Helvetica");
      doc.text("123 Business Avenue, Tech Park", 80, 65);
      doc.text("Sector 42, New Delhi, India", 80, 80);
      doc.font("Helvetica-Oblique").text("Email: support@silverrealestate.com", 80, 95);

      // Right Header
      const invNum = data.invoiceNumber.split('-').length > 1 ? data.invoiceNumber.split('-')[1] : data.invoiceNumber;
      doc.fillColor("black").fontSize(20).font("Helvetica-Bold").text(`Invoice No.${invNum}`, 300, 45, { align: "right", width: 255 });
      
      // Reset doc.x to 40 so the right-aligned texts (width 515) don't render off the page
      doc.x = 40;
      doc.fontSize(9).font("Helvetica").fillColor("gray").text(`Purchased Date: ${data.date}`, { align: "right", width: 515 });

      // --- Invoice Date shown prominently at the top, under the invoice number ---
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica-Bold").fillColor(primaryColor).text("Invoice Date", { align: "right", width: 515 });
      doc.fontSize(11).font("Helvetica").fillColor("black").text(`${data.date}`, { align: "right", width: 515 });
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica").fillColor("black").text(`S.NO: SRE-${Date.now().toString().slice(-8)}`, { align: "right", width: 515 });

      doc.moveDown(3);

      // --- Bill and Ship To Section ---
      doc.lineWidth(1).strokeColor(primaryColor);
      doc.roundedRect(40, 130, 300, 100, 5).stroke();

      // Label over the border
      doc.rect(45, 122, 100, 16).fill("white");
      doc.fillColor("gray").fontSize(12).font("Helvetica").text("Bill To", 50, 125);

      doc.fillColor("black").fontSize(12).font("Helvetica-Bold").text(data.userFullName || "Customer", 50, 150);
      doc.fontSize(10).font("Helvetica").text(data.userEmail || "", 50, 165);
      if (data.userPhone) doc.text(`Phone: ${data.userPhone}`, 50, 180);

      // --- Top "Total amount" block removed as requested ---
      // amountWords still needed later for the bottom summary
      const amountWords = numberToWords(Math.round(data.totalAmount));

      doc.y = 260;
      doc.x = 40;

      // Calculate totals from payment history
      let totalPaid = 0;
      if (data.paymentHistory) {
        data.paymentHistory.forEach(p => totalPaid += Number(p.amount));
      } else {
        totalPaid = data.previousPaidAmount + data.currentPaymentAmount;
      }

      // Table
      const table = {
        title: "",
        headers: [
          { label: "#", property: "index", width: 30 },
          { label: "Item Details", property: "desc", width: 220 },
          { label: "Price/Unit", property: "price", width: 100 },
          { label: "Qty", property: "qty", width: 50 },
          { label: "Total", property: "total", width: 115, align: "right" } // 30+220+100+50+115 = 515 (595.28 - 80)
        ],
        datas: [
          {
            index: "01",
            desc: `Real estate fractional ownership - ${data.propertyTitle}`,
            price: data.unitPriceAtTime.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
            qty: data.units.toString(),
            total: data.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })
          }
        ],
      };

      await doc.table(table, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor("black"),
        prepareRow: () => doc.font("Helvetica").fontSize(10).fillColor("black"),
        divider: {
          header: { disabled: false, width: 2, opacity: 1, color: "black" },
          horizontal: { disabled: false, width: 1, opacity: 0.2, color: "gray" }
        }
      });

      // Totals / Payment History
      if (data.paymentHistory && data.paymentHistory.length > 0) {
        doc.moveDown(2);
        let cumulativePaid = 0;
        const historyDatas = data.paymentHistory.map((payment, idx) => {
          cumulativePaid += Number(payment.amount);
          const leftAmt = data.totalAmount - cumulativePaid;
          return {
            date: new Date(payment.date).toLocaleDateString("en-IN", { year: 'numeric', month: 'short', day: 'numeric' }),
            desc: `Payment ${idx + 1}`,
            amount: payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
            totalPaidNow: cumulativePaid.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
            leftAmount: leftAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })
          };
        });

        const historyTable = {
          title: "Payment History",
          headers: [
            { label: "Date", property: "date", width: 80 },
            { label: "Description", property: "desc", width: 125 },
            { label: "Amount Paid", property: "amount", width: 100, align: "right" },
            { label: "Total Paid Till Now", property: "totalPaidNow", width: 110, align: "right" },
            { label: "Left Amount", property: "leftAmount", width: 100, align: "right" }
          ],
          datas: historyDatas
        };

        await doc.table(historyTable, {
          prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
          prepareRow: () => doc.font("Helvetica").fontSize(10)
        });
      }

      // Bottom Totals
      doc.moveDown(2);
      const bottomY = doc.y;

      doc.font("Helvetica").fontSize(12).fillColor("black").text("Total amount", 450, bottomY, { align: "right" });
      doc.fontSize(24).font("Helvetica-Bold").text(`${data.totalAmount.toLocaleString("en-IN")}`, 350, bottomY + 15, { align: "right" });

      const rem = data.totalAmount - totalPaid;
      doc.fontSize(10).font("Helvetica").text(`Total Paid: ${totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 350, bottomY + 45, { align: "right" });
      doc.text(`Remaining Balance: ${rem.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 350, bottomY + 60, { align: "right" });

      doc.fontSize(10).font("Helvetica-Oblique").fillColor("gray").text(amountWords, 250, bottomY + 80, { align: "right", width: 305 });

      // Footer
      const footerY = doc.page.height - 120;
      doc.font("Helvetica").fontSize(10).fillColor("black").text("~ THIS IS A DIGITALLY CREATED INVOICE ~", 0, footerY, { align: "center" });
      doc.text("AUTHORISED SIGNATURE", 350, footerY + 30, { align: "right", width: 205 });

      doc.text("Thank you for the business.", 40, footerY + 30);

      // Bottom purple bar
      doc.rect(0, doc.page.height - 15, doc.page.width, 15).fill(primaryColor);

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