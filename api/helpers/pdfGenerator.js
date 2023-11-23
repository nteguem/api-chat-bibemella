const PDFDocument = require("pdfkit");
const axios = require("axios");
const moment = require("moment");
require("moment/locale/fr"); // Importez la localisation française

async function generatePDFBuffer(
  user,
  phone,
  idTransaction,
  forfait,
  operator,
  amount,
  due,
  nft,
  now = moment()
) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument();
    let nftResponse;
    let nftImage;
    // Load the watermark image
    const watermarkResponse = await axios.get(
      `https://res.cloudinary.com/nwccompany/image/upload/v1699430916/filigramme_fbe.png`,
      {
        responseType: "arraybuffer", // Set response type to 'arraybuffer'
      }
    );
    const watermarkImage = Buffer.from(watermarkResponse.data);

    // Load the logo image
    const logoResponse = await axios.get(
      `https://bibemella.isomora.com/wp-content/uploads/2023/10/logo-fbe.png`,
      {
        responseType: "arraybuffer", // Set response type to 'arraybuffer'
      }
    );
    const logoImage = Buffer.from(logoResponse.data);

    // Load the nft image
    if (nft != "") {
      nftResponse = await axios.get(
        nft,
        {
          responseType: "arraybuffer", // Set response type to 'arraybuffer'
        }
      );
      nftImage = Buffer.from(nftResponse.data);
    }

    // Header (Logo and Watermark)
    doc.image(logoImage, 70, 60, { width: 100 });
    // Définissez la langue locale sur le français
    now.locale("fr");
    // Ajoutez les jours à la date actuelle
    const dueDate = now.clone().add(due, "days");

    // Invoice Information
    doc.fontSize(12).text(`Numéro de facture: ${idTransaction}`, 50, 190);
    doc.fontSize(12).text(`Opérateur: ${operator}`, 50, 210);
    if (nft == "") {
      doc
        .fontSize(12)
        .text(
          `Date d'échéance : ${dueDate.format("dddd D MMMM YYYY [à] HH[h]mm")}`,
          50,
          230
        );
    } else {
      doc
        .fontSize(12)
        .text(
          `Date d'achat : ${dueDate.format("dddd D MMMM YYYY [à] HH[h]mm")}`,
          50,
          230
        );
    }
    if (nftImage && nftImage.length > 0) {
      const imageX = 450;
      const imageY = 120;
      const imageWidth = 100;
      const imageHeight = 150;

      // Appliquer un border radius en utilisant clip
      doc.save();
      doc.roundedRect(imageX, imageY, imageWidth, imageHeight, 10); // Ajustez la valeur de 10 selon la courbure désirée
      doc.clip();
      doc.image(nftImage, imageX, imageY, { width: imageWidth });
      doc.restore();
    }
    // Separator Line
    const separatorY = doc.y + 10;
    doc.moveTo(50, separatorY).lineTo(550, separatorY).stroke();

    // Add watermark as a transparent background behind invoice information
    doc.image(watermarkImage, {
      fit: [500, 150],
      align: "center",
      valign: "center",
      opacity: 0.05,
    });

    // Customer Information
    doc.fontSize(14).text("Client", 50, 260);
    doc.fontSize(12).text(`Utilisateur : ${user}`, 50, 285, { width: 200 });
    doc.fontSize(12).text(`N° transaction : ${phone}`, 50, 305, { width: 200 });

    // Item Details
    const items = [
      { description: forfait, quantity: 1, price: parseInt(amount) },
      // Add more items if needed
    ];

    let startY = 330;
    doc.fontSize(14).text("Description", 50, startY);
    doc
      .fontSize(14)
      .text("Quantité", 300, startY, { width: 100, align: "right" });
    doc
      .fontSize(14)
      .text("Prix Unitaire", 400, startY, { width: 150, align: "right" });
    startY += 30;

    items.forEach((item) => {
      doc.fontSize(12).text(item.description, 50, startY);
      doc
        .fontSize(12)
        .text(item.quantity.toString(), 300, startY, {
          width: 100,
          align: "right",
        });
      doc
        .fontSize(12)
        .text(item.price.toFixed(2), 400, startY, {
          width: 150,
          align: "right",
        });
      startY += 20;
    });

    // Separator Line
    doc.moveTo(50, startY).lineTo(550, startY).stroke();
    startY += 10;

    // Calculate Total Amount
    const totalAmount = items.reduce((total, item) => total + item.price, 0);

    // Total
    doc
      .fontSize(14)
      .text(`Total: ${totalAmount.toFixed(2)}`, 400, startY, {
        width: 150,
        align: "right",
      });

    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.end();
  });
}

module.exports = generatePDFBuffer;
