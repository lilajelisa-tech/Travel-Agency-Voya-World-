const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.post('/kontakt', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ status: 'error', message: 'Të gjitha fushat janë të detyrueshme.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'voyaworld7@gmail.com',         // ← Ndrysho me emailin tënd
        pass: 'vehkbkisdbeyhwla'                // ← Krijo një App Password nga Google
      }
    });

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: 'voyawolrd7@gmail.com',            // ← Vendos emailin ku dëshiron të marrësh mesazhet
      subject: 'Mesazh nga VoyaWorld',
      html: `
        <h3>Mesazh i ri nga forma e kontaktit:</h3>
        <p><strong>Emri:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mesazhi:</strong></p>
        <p>${message}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ status: 'success', message: 'Mesazhi u dërgua me sukses.' });
  } catch (error) {
    console.error('Gabim gjatë dërgimit të mesazhit:', error);
    res.status(500).json({ status: 'error', message: 'Gabim gjatë dërgimit të emailit.' });
  }
});

// Lexon ose krijon skedarin rezervime.json nëse nuk ekziston
const rezervimePath = 'rezervime.json';
if (!fs.existsSync(rezervimePath)) {
    fs.writeFileSync(rezervimePath, '[]');
}

// Endpoint për të ruajtur rezervimin
app.post('/dergo-rezervimin', (req, res) => {
    const rezervim = req.body;

    // Validime bazike
    if (!rezervim.emri || !rezervim.id || !rezervim.telefoni || !rezervim.email || !rezervim.data || !rezervim.paketa || !rezervim.pagesa) {
        return res.status(400).json({ status: 'error', message: 'Të dhënat janë të paplota.' });
    }

    // Lexo të dhënat ekzistuese
    fs.readFile(rezervimePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Gabim gjatë leximit të të dhënave.' });

        let rezervimet = [];
        try {
            rezervimet = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ status: 'error', message: 'Gabim në formatin e të dhënave.' });
        }

        rezervimet.push(rezervim);

        fs.writeFile(rezervimePath, JSON.stringify(rezervimet, null, 2), (err) => {
            if (err) return res.status(500).json({ status: 'error', message: 'Gabim gjatë ruajtjes së të dhënave.' });

            if (rezervim.pagesa === 'email') {
                // Dërgo email
                dergoEmail(rezervim)
                    .then(() => {
                        res.json({ status: 'success', message: 'Rezervimi u ruajt dhe fatura u dërgua me email.' });
                    })
                    .catch(err => {
                        console.error('Gabim në dërgimin e emailit:', err);
                        res.json({ status: 'success', message: 'Rezervimi u ruajt, por nuk u dërgua emaili.' });
                    });
            } else {
                res.json({ status: 'success', message: 'Rezervimi u ruajt me sukses.' });
            }
        });
    });
});

// Endpoint për të kërkuar një rezervim
app.get('/gjej-rezervimin', (req, res) => {
    const { email, id } = req.query;

    if (!email || !id) {
        return res.status(400).json({ status: 'error', message: 'Të dhënat janë të paplota.' });
    }

    fs.readFile(rezervimePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Nuk mund të lexojmë të dhënat.' });

        let rezervimet;
        try {
            rezervimet = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ status: 'error', message: 'Gabim në formatin e të dhënave.' });
        }

        const rezervim = rezervimet.find(r =>
            r.email.toLowerCase() === email.toLowerCase() &&
            r.id === id
        );

        if (rezervim) {
            return res.json({ status: 'success', rezervim });
        } else {
            return res.json({ status: 'not_found', message: 'Nuk u gjet asnjë rezervim me këto të dhëna.' });
        }
    });
});

// Funksioni për të dërguar email me faturën
function dergoEmail(rezervim) {
    // Konfiguro transportuesin
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'voyaworld7@gmail.com',       // Ndrysho me emailin tënd
            pass: 'vehkbkisdbeyhwla'              // Jo fjalëkalimi normal, por "App Password" nga Google
        }
    });

    const mailOptions = {
        from: '"Agjensia Udhëtimesh" <voyaworld7@gmail.com>',
        to: rezervim.email,
        subject: 'Fatura e Rezervimit tuaj',
        html: `
            <h3>Përshëndetje ${rezervim.emri},</h3>
            <p>Faleminderit për rezervimin tuaj!</p>
            <p><strong>Paketa:</strong> ${rezervim.paketa}</p>
            <p><strong>Data:</strong> ${rezervim.data}</p>
            <p><strong>ID:</strong> ${rezervim.id}</p>
            <p><strong>Pagesa:</strong> ${rezervim.pagesa}</p>
            <p><strong>Mesazh:</strong> ${rezervim.mesazh || 'Asnjë'}</p>
            <br/>
            <p>Ju mirëpresim në udhëtimin tuaj!</p>
        `
    };

    return transporter.sendMail(mailOptions);
}

// Starto serverin
app.listen(3000, () => {
    console.log("Serveri po dëgjon në http://localhost:3000");
});
