#!/usr/bin/env node
const fs = require('fs')
const util = require('util')
const path = require('path')

const pug = require('pug');
const args = require('args')
const objectAssignDeep = require(`object-assign-deep`);
const format = require('date-fns/format')
const puppeteer = require('puppeteer');

const config = require('./config.json')

// Promises
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Main
console.debug('[+] invoice started');
args
  .option('invoice', 'Invoice file')
  .option('layout', 'Layout file', 'layout/base.pug')
  .option('destination', 'Destination folder', 'dist')
  .command('create', 'Create an invoice', createCommand, ['c'])

const flags = args.parse(process.argv)

// Commands
function createCommand (name, sub, options) {
    return create(name, sub, options).catch(console.error);
}

async function create (name, sub, options) {
    console.debug('[+] Creating invoice...');
    if (!options.invoice) {
        throw new Error('missing --invoice option');
    }

    if (!path.isAbsolute(options.invoice)) {
        options.invoice = path.join('.', options.invoice);
    }

    const invoicePath = path.resolve(options.invoice);
    const invoice = await readInvoice(invoicePath);

    if (!path.isAbsolute(options.invoice)) {
        options.layout = path.join('.', options.layout);
    }

    const layoutPath = path.resolve(options.layout);
    const layout = await readLayout(layoutPath);

    if (!path.isAbsolute(options.destination)) {
        options.layout = path.join('.', options.destination);
    }
    destinationPath = path.resolve(options.destination);
    if (!isWriteable(destinationPath)) {
        console.debug('[+] Destination path is not writeable at:', destinationPath)
    }

    let destination = destinationPath;
    if (path.extname(destination) === '') {
        const invoiceBasename = path.basename(invoicePath, '.json')
        const date = format(invoice.issued_date, 'YYYYMMDD');
        const suffix = invoice.client.id ? `${invoice.client.id}-${date}` : date;
        const filename = `invoice-${invoiceBasename}-${suffix}`;
        destination = path.join(destination, `${filename}.html`);
    }

    const data = compute(config, invoice);
    await render(data, layout, destination);
    await renderToPDF(destination);
    console.debug('[+] Congratulations!')
}

// Methods
function compute(config, invoice) {
    const data = objectAssignDeep(
        config,
        invoice,
        {
            computed: {
                subtotal: 0,
                taxValue: 0,
                totalWithVAT: 0,
                toPay: 0,
            }
        }
    );

    data.tasks.map(task => {
        task.amount = task.rate * task.quantity;
        data.computed.subtotal += task.amount;
    })

    if (data.tax.mode !== "reversed") {
        data.computed.taxValue = data.computed.subtotal * data.tax.rate;
        data.computed.totalWithVAT = data.computed.subtotal * (1 + data.tax.rate);
        data.computed.toPay = data.computed.totalWithVAT;
    } else {
        data.computed.toPay = data.computed.subtotal;
    }

    console.debug ('[+] Tasks :', data.tasks.length);
    console.debug ('[+] Subtotal :', data.computed.subtotal);
    console.debug ('[+] VAT :', data.tax.mode, data.tax.rate, data.computed.taxValue);
    console.debug ('[+] Payment due :', data.computed.toPay);

    return data
}

async function render(data, layout, destination) {
    console.debug('[+] Rendering invoice...')
    const output = pug.render(layout, data);

    console.debug('[+] Saving invoice:', path.basename(destination))
    return await writeFile(destination, output)
        .then(error => {
            if (error) {
                throw new Error(error);
            }
            console.debug('[+] Invoice created at', destination);
        })
        .catch(error => console.error);
}


async function renderToPDF(file) {
  const directory = path.dirname(file);
  const filename = path.basename(file, '.html');
  const destination = path.join(directory, `${filename}.pdf`)
  console.debug('[+] Generating PDF...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file:${file}`);
  await page.pdf({
    path: destination,
    format: 'A4',
    margin: {
        top: "60px",
        left: "60px",
        right: "60px",
        bottom: "60px"
    }    
  });   

  await browser.close();
}

async function readInvoice(path) {
    console.debug('[+] Reading invoice:', path)

    if (isReadable(path)) {
        return JSON.parse(await readFile(path));
    }

    throw new Error('Invoice is not readable.');
}

async function readLayout(path) {
    console.debug('[+] Reading Layout:', path)

    if (isReadable(path)) {
        return await readFile(path, 'utf-8');
    }

    throw new Error('Layout is not readable.');
}

// Utilities
async function isReadable(path) {
    return new Promise((resolve, reject) => {
        return fs.access(path, fs.constants.F_OK | fs.constants.R_OK, error => {
            resolve(!error);
        });
    });
}

async function isWriteable(path) {
    return new Promise((resolve, reject) => {
        return fs.access(path, fs.constants.F_OK | fs.constants.W_OK, error => {
            resolve(!error);
        });
    });
}
