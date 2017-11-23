/*
 * scrape by request mocking instead of UI traverse
 *
POST /iframe/Competitions/ HTTP/1.1
Host: dataride.uci.ch
Connection: keep-alive
Content-Length: 375
Origin: https://dataride.uci.ch
X-Requested-With: XMLHttpRequest
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
Referer: https://dataride.uci.ch/iframe/results/10
Accept-Encoding: gzip, deflate, br
Accept-Language: en-US,en;q=0.9
Cookie: __RequestVerificationToken=FlX0JoDlVNARfaTWH7aThC19Obbe7O8P4f-lkGCUioCdGvqd1oPJojPdYdNUkLJb8czNywOcG6W5gBWliKYIHCeBf20mredBAWw8uF3HZWw1; _ga=GA1.2.659703236.1509300671; ASP.NET_SessionId=p1jvfxbbugmhampmvp0jnhz2
Form Data
view parsed
disciplineId=10&take=40&skip=40&page=2&pageSize=40&sort%5B0%5D%5Bfield%5D=StartDate&sort%5B0%5D%5Bdir%5D=desc&filter%5Bfilters%5D%5B0%5D%5Bfield%5D=RaceTypeId&filter%5Bfilters%5D%5B0%5D%5Bvalue%5D=0&filter%5Bfilters%5D%5B1%5D%5Bfield%5D=CategoryId&filter%5Bfilters%5D%5B1%5D%5Bvalue%5D=0&filter%5Bfilters%5D%5B2%5D%5Bfield%5D=SeasonId&filter%5Bfilters%5D%5B2%5D%5Bvalue%5D=19
*/

'use strict'

const axios = require('axios');
const FormData = require('form-data');

main();

// form data axios ref: https://github.com/axios/axios/issues/1006#issuecomment-320165427
async function main() {
    const form = new FormData();

    form.append('disciplineId', 10);
    form.append('take', 40);
    form.append('skip', 40);
    form.append('page', 2);
    form.append('pageSize', 40);
    form.append('sort%5B0%5D%5Bfield%5D', 'StartDate');
    form.append('sort%5B0%5D%5Bdir%5D', 'desc');
    form.append('filter%5Bfilters%5D%5B0%5D%5Bfield%5D', 'RaceTypeId');
    form.append('filter%5Bfilters%5D%5B0%5D%5Bvalue%5D', 0);
    form.append('filter%5Bfilters%5D%5B1%5D%5Bfield%5D', 'CategoryId');
    form.append('filter%5Bfilters%5D%5B1%5D%5Bvalue%5D:', 0);
    form.append('filter%5Bfilters%5D%5B2%5D%5Bfield%5D', 'SeasonId');
    form.append('filter%5Bfilters%5D%5B2%5D%5Bvalue%5D', 0);

    axios.post('https://dataride.uci.ch/iframe/Competitions/', {
            headers: form.getHeaders()
        })
        .then(response => {
            console.log('full response: ', response);
            console.log('data: ', response.data);
        })
        .catch(function (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                console.log(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error', error.message);
            }
            console.log(error.config);
        });
}
