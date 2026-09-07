const PDFDocument = require("pdfkit");
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

module.exports = {
  generateAgreementPdf
};
