# invoice

[![Greenkeeper badge](https://badges.greenkeeper.io/lovethebomb/invoice.svg)](https://greenkeeper.io/)

Simple JSON-based, HTML invoice generator, with optional custom template.

![Screenshot](/../github/.github/screenshot.png?raw=true "Screenshot")

## Requirements

* Node >= 9 (async / await)

## Usage

### Configuration file

First, you need to create a configuration file based on [config.js.dist][config].

It can be overriden by the configuration inside the json invoice.

```bash
{
    "company": {
        "name": "My Company",
        "email": "invoice@my-company.tld",
        "address": {
            "street": "Company Street Name",
            "postcode": "Company Post Code",
            "city": "Company City",
            "country": "Company Country"
        },
        "vat": "123456789",
        "coc": "123456789",
        "iban": "123456789",
        "swift": "CODE42CODE"
    },
    "payment_term": "30 days",
    "tax": {
        "rate": 0.42
    },
    "currency": {
        "code": "EUR",
        "text": "&euro;"
    }
}
```

### Invoice file

Create an invoice file based on [the sample invoice][invoice-sample]

```bash
{
    "id": 10001,
    "issued_date": "2018-07-05",
    "mode": {
        "unit": "Hours",
        "rate": "Hourly Rate"
    },
    "client": {
        "id": "great-client",
        "name": "Great Client Ltd",
        "address": {
            "street": "Client Street",
            "postcode": "Client Post code",
            "city": "Client City",
            "country": "Client Country"
        },
        "vat": "CL123456789",
        "coc": {
            "name": "CoC",
            "value": "123456789"
        }
    },
    "tasks": [
        {
            "description": "A well executed task",
            "rate": 42,
            "quantity": 5
        }
    ]
}
```


### Commands

Create an HTML invoice.

```bash
node index.js create --invoice invoices/sample.json

or


```

## Development

## Testing

```bash
npm run test
```

## TODO

[TODO][todo]

## License

[MIT][license]


[config]: config.json.dist
[invoice-sample]: invoices/10001.json
[todo]: TODO.md
[license]: LICENSE.md

