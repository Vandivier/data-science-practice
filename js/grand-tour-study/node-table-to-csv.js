// ref: https://github.com/geoffreyburdett/node-table-to-csv/blob/master/index.js

const cheerio = require('cheerio');
const EOL = require('os').EOL;

module.exports = function (sTableParentHtml, options) {
    const $ = cheerio.load(sTableParentHtml);
    const $table = $('table');

    function createMatrix(_$table) {
        var matrix = [],
            i = 0;

        _$table.find('tr').each(function (index, el) {
            var j = 0,
                $row = $(el);

            matrix[i] = [];

            $row.find('th').each(function (index, el) {
                let $th = $(el);

                matrix[i][j] = $th.text().trim().replace(/(\r\n|\n|\r)/gm, "");
                j++;
                return matrix;
            });

            $row.find('td').each(function (index, el) {
                let $td = $(el);

                matrix[i][j] = '"' + $td.text().trim() + '"';
                j++;
                return matrix;
            });

            i++;
        });

        return matrix;
    }

    function createCsv(data) {
        let csv = '';
        for (var i = 0; i < data.length; i++) {
            csv += data[i].join(',') + EOL;
        }
        return csv;
    }

    return createCsv(createMatrix($table));
}
