const Apify = require('apify');
const typeCheck = require('type-check').typeCheck;

// Definition of the input
const INPUT_TYPE = `{
    url: Maybe String,
}`;

Apify.main(async () => {
    // Fetch the input and check it has a valid format
    // You don't need to check the input, but it's a good practice.
    const input = await Apify.getValue('INPUT');
    if (!typeCheck(INPUT_TYPE, input)) {
        console.log('Expected input:');
        console.log(INPUT_TYPE);
        console.log('Received input:');
        console.dir(input);
        throw new Error('Received invalid input');
    }

    const browser = await Apify.launchPuppeteer(); // ref: https://www.apify.com/docs/sdk/apify-runtime-js/latest
    const page = await browser.newPage();

    console.log(`getting title from: ${input.url}`);
    await page.goto(input.url);
    const pageTitle = await page.title();

    await browser.close();

    // Store the output
    const output = {
        pageTitle
    };

    await Apify.setValue('OUTPUT', output)
});
